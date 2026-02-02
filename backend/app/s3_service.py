import boto3
import json
from datetime import datetime
import uuid
from typing import Dict, Any, Optional, Union
import os
from botocore.exceptions import ClientError
from app.config import settings
import hashlib

class S3Service:
    def __init__(self):
        # Load AWS credentials from environment variables
        self.aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID", "")
        self.aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY", "")
        self.aws_region = os.getenv("AWS_REGION", "us-east-1")
        self.s3_bucket_name = os.getenv("S3_BUCKET_NAME", "grant-contracts-saple")
        
        # Initialize S3 client
        self.s3_client = self._create_s3_client()
        
    def _create_s3_client(self):
        """Create S3 client with credentials"""
        try:
            return boto3.client(
                's3',
                aws_access_key_id=self.aws_access_key_id,
                aws_secret_access_key=self.aws_secret_access_key,
                region_name=self.aws_region
            )
        except Exception as e:
            print(f"Warning: Could not create S3 client: {e}")
            return None
    
    def store_original_pdf(self, contract_id: int, filename: str, file_content: bytes) -> Optional[str]:
        """
        Store original PDF file directly in S3 bucket
        Returns S3 object key if successful
        """
        try:
            if not self.s3_client:
                print("S3 client not initialized")
                return None
            
            # Generate unique filename with contract ID
            name, ext = os.path.splitext(filename)
            safe_name = name.replace(" ", "_").replace("(", "").replace(")", "")
            s3_key = f"contract_{contract_id}_{safe_name}{ext}"
            
            # Upload PDF directly to S3
            self.s3_client.put_object(
                Bucket=self.s3_bucket_name,
                Key=s3_key,
                Body=file_content,
                ContentType='application/pdf',
                Metadata={
                    'contract-id': str(contract_id),
                    'original-filename': filename,
                    'uploaded-at': datetime.utcnow().isoformat(),
                    'file-type': 'original-pdf'
                }
            )
            
            print(f"✅ Original PDF stored in S3: {s3_key}")
            return s3_key
            
        except ClientError as e:
            print(f"❌ Error storing original PDF in S3: {e}")
            return None
        except Exception as e:
            print(f"❌ Unexpected error storing PDF in S3: {e}")
            return None
    
    def get_original_pdf(self, contract_id: int) -> Optional[bytes]:
        """Retrieve original PDF from S3"""
        try:
            if not self.s3_client:
                return None
            
            # List objects to find the PDF
            response = self.s3_client.list_objects_v2(
                Bucket=self.s3_bucket_name,
                Prefix=f"contract_{contract_id}_"
            )
            
            if 'Contents' not in response:
                return None
            
            # Find the PDF file
            pdf_key = None
            for obj in response['Contents']:
                key = obj['Key']
                # Look for PDF files
                if key.lower().endswith('.pdf') and f"contract_{contract_id}" in key:
                    pdf_key = key
                    break
            
            if not pdf_key:
                return None
            
            # Download the PDF
            response = self.s3_client.get_object(
                Bucket=self.s3_bucket_name,
                Key=pdf_key
            )
            
            pdf_data = response['Body'].read()
            return pdf_data
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                print(f"❌ No PDF found for contract {contract_id} in S3")
            else:
                print(f"❌ Error retrieving PDF from S3: {e}")
            return None
        except Exception as e:
            print(f"❌ Unexpected error retrieving PDF from S3: {e}")
            return None
    
    def delete_contract_files(self, contract_id: int) -> bool:
        """Delete all S3 objects for a contract"""
        try:
            if not self.s3_client:
                return False
            
            # List all objects for this contract
            response = self.s3_client.list_objects_v2(
                Bucket=self.s3_bucket_name,
                Prefix=f"contract_{contract_id}_"
            )
            
            if 'Contents' not in response:
                return True
            
            # Prepare objects for deletion
            objects_to_delete = []
            for obj in response['Contents']:
                objects_to_delete.append({'Key': obj['Key']})
            
            # Delete all objects
            if objects_to_delete:
                self.s3_client.delete_objects(
                    Bucket=self.s3_bucket_name,
                    Delete={'Objects': objects_to_delete}
                )
                
                print(f"✅ Deleted {len(objects_to_delete)} S3 files for contract {contract_id}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error deleting contract files from S3: {e}")
            return False
    
    def get_all_contracts_in_s3(self) -> list:
        """Get information about all PDF contracts in S3"""
        try:
            if not self.s3_client:
                return []
            
            contracts_info = []
            
            # List all objects in bucket
            response = self.s3_client.list_objects_v2(
                Bucket=self.s3_bucket_name
            )
            
            if 'Contents' not in response:
                return []
            
            # Find all PDF files
            for obj in response['Contents']:
                key = obj['Key']
                
                # Only process PDF files
                if key.lower().endswith('.pdf') and key.startswith('contract_'):
                    try:
                        # Extract contract ID from filename
                        parts = key.split('_')
                        if len(parts) >= 2:
                            contract_id = int(parts[1])
                            
                            contracts_info.append({
                                'contract_id': contract_id,
                                's3_key': key,
                                'size_mb': round(obj['Size'] / (1024 * 1024), 2),
                                'last_modified': obj['LastModified'].isoformat(),
                                'file_type': 'pdf'
                            })
                    except (IndexError, ValueError):
                        continue
            
            return contracts_info
            
        except Exception as e:
            print(f"❌ Error getting all contracts from S3: {e}")
            return []
    
    def get_presigned_url(self, contract_id: int, expires_in: int = 3600) -> Optional[str]:
        """Generate presigned URL for downloading PDF"""
        try:
            if not self.s3_client:
                return None
            
            # Find the PDF key
            response = self.s3_client.list_objects_v2(
                Bucket=self.s3_bucket_name,
                Prefix=f"contract_{contract_id}_"
            )
            
            if 'Contents' not in response:
                return None
            
            pdf_key = None
            for obj in response['Contents']:
                if obj['Key'].lower().endswith('.pdf'):
                    pdf_key = obj['Key']
                    break
            
            if not pdf_key:
                return None
            
            # Generate presigned URL
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.s3_bucket_name,
                    'Key': pdf_key
                },
                ExpiresIn=expires_in
            )
            
            return url
            
        except Exception as e:
            print(f"❌ Error generating presigned URL: {e}")
            return None
    
    def check_s3_connection(self) -> bool:
        """Check if S3 connection is working"""
        try:
            if not self.s3_client:
                return False
            
            # Simple check by listing buckets
            self.s3_client.list_buckets()
            return True
            
        except Exception as e:
            print(f"❌ S3 connection check failed: {e}")
            return False

# Global S3 service instance
s3_service = S3Service()