import boto3
import os
from botocore.exceptions import ClientError
from datetime import datetime
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        self.bucket_name = settings.S3_BUCKET_NAME
        
    def store_original_pdf(self, contract_id: int, filename: str, file_content: bytes) -> str:
        """Store original PDF in S3 and return the S3 key"""
        try:
            # Create a unique key for the PDF - store directly in bucket root
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            original_filename = os.path.basename(filename)
            file_extension = os.path.splitext(original_filename)[1] or '.pdf'
            
            # Remove the folder structure - store directly in bucket
            s3_key = f"contract_{contract_id}_{timestamp}{file_extension}"
            
            # Upload to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_content,
                ContentType='application/pdf',
                Metadata={
                    'contract_id': str(contract_id),
                    'original_filename': original_filename,
                    'uploaded_at': datetime.now().isoformat()
                }
            )
            
            logger.info(f"PDF stored in S3: {s3_key}")
            return s3_key
            
        except ClientError as e:
            logger.error(f"Failed to store PDF in S3: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error storing PDF in S3: {e}")
            raise
    
    def get_pdf_url(self, contract_id: int) -> str:
        """Get the PDF URL for a contract"""
        try:
            # List objects in bucket and find the one with this contract_id in metadata
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name
            )
            
            if 'Contents' in response:
                # Find PDFs that have this contract_id in their metadata
                pdfs = []
                for obj in response['Contents']:
                    if obj['Key'].endswith('.pdf'):
                        # Get metadata to check contract_id
                        try:
                            metadata_response = self.s3_client.head_object(
                                Bucket=self.bucket_name,
                                Key=obj['Key']
                            )
                            
                            metadata = metadata_response.get('Metadata', {})
                            if str(contract_id) == metadata.get('contract_id'):
                                pdfs.append(obj)
                        except ClientError:
                            continue
                
                if pdfs:
                    # Get the most recent PDF for this contract
                    latest_pdf = max(pdfs, key=lambda x: x['LastModified'])
                    s3_key = latest_pdf['Key']
                    
                    # Generate a presigned URL that expires in 1 hour
                    url = self.s3_client.generate_presigned_url(
                        'get_object',
                        Params={
                            'Bucket': self.bucket_name,
                            'Key': s3_key
                        },
                        ExpiresIn=3600
                    )
                    return url
                    
        except ClientError as e:
            logger.error(f"Error getting PDF URL: {e}")
        
        return None
    
    def get_pdf_content(self, contract_id: int) -> bytes:
        """Get the PDF content from S3"""
        try:
            # List objects and find the one with this contract_id
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name
            )
            
            if 'Contents' in response:
                # Find PDFs that have this contract_id in their metadata
                for obj in response['Contents']:
                    if obj['Key'].endswith('.pdf'):
                        try:
                            # Get metadata to check contract_id
                            metadata_response = self.s3_client.head_object(
                                Bucket=self.bucket_name,
                                Key=obj['Key']
                            )
                            
                            metadata = metadata_response.get('Metadata', {})
                            if str(contract_id) == metadata.get('contract_id'):
                                s3_key = obj['Key']
                                
                                # Get the PDF content
                                response = self.s3_client.get_object(
                                    Bucket=self.bucket_name,
                                    Key=s3_key
                                )
                                
                                return response['Body'].read()
                        except ClientError:
                            continue
                    
        except ClientError as e:
            logger.error(f"Error getting PDF content: {e}")
        
        return None
    
    def delete_contract_files(self, contract_id: int) -> bool:
        """Delete all files for a contract from S3"""
        try:
            # List all objects in the bucket
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name
            )
            
            if 'Contents' in response:
                # Find objects that have this contract_id in their metadata
                objects_to_delete = []
                
                for obj in response['Contents']:
                    try:
                        # Get metadata to check contract_id
                        metadata_response = self.s3_client.head_object(
                            Bucket=self.bucket_name,
                            Key=obj['Key']
                        )
                        
                        metadata = metadata_response.get('Metadata', {})
                        if str(contract_id) == metadata.get('contract_id'):
                            objects_to_delete.append({'Key': obj['Key']})
                    except ClientError:
                        continue
                
                if objects_to_delete:
                    # Delete all matching objects
                    self.s3_client.delete_objects(
                        Bucket=self.bucket_name,
                        Delete={'Objects': objects_to_delete}
                    )
                    
                    logger.info(f"Deleted {len(objects_to_delete)} files for contract {contract_id} from S3")
                    return True
                
        except ClientError as e:
            logger.error(f"Error deleting contract files from S3: {e}")
        
        return False

# Create a singleton instance
s3_service = S3Service()