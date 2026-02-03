import boto3
from botocore.exceptions import ClientError
import os
from datetime import datetime
from typing import Optional
from app.config import settings
import uuid

class S3Service:
    def __init__(self):
        """Initialize S3 client with credentials from settings"""
        self.aws_access_key_id = settings.AWS_ACCESS_KEY_ID
        self.aws_secret_access_key = settings.AWS_SECRET_ACCESS_KEY
        self.aws_region = settings.AWS_REGION
        self.bucket_name = settings.S3_BUCKET_NAME
        
        # Initialize S3 client
        self.s3_client = self._create_s3_client()
    
    def _create_s3_client(self):
        """Create and return S3 client"""
        try:
            return boto3.client(
                's3',
                aws_access_key_id=self.aws_access_key_id,
                aws_secret_access_key=self.aws_secret_access_key,
                region_name=self.aws_region
            )
        except Exception as e:
            print(f"Warning: Failed to create S3 client: {e}")
            return None
    
    def store_original_pdf(self, contract_id: int, filename: str, file_content: bytes) -> Optional[str]:
        """
        Store original PDF in S3 bucket (PDF alone, no subfolders)
        
        Args:
            contract_id: The contract ID from PostgreSQL
            filename: Original filename
            file_content: PDF file content as bytes
            
        Returns:
            S3 key if successful, None otherwise
        """
        if not self.s3_client:
            print("⚠️ S3 client not initialized. Check AWS credentials.")
            return None
        
        try:
            # Generate clean filename - just PDF alone, no folders
            # Keep original filename but make it unique with contract_id
            original_name = os.path.splitext(filename)[0]
            original_ext = os.path.splitext(filename)[1] or '.pdf'
            
            # Create simple S3 key: contract_{id}_{original_name}.pdf
            s3_key = f"contract_{contract_id}_{original_name}{original_ext}"
            
            # Remove any special characters and spaces
            s3_key = s3_key.replace(' ', '_').replace('(', '').replace(')', '')
            
            print(f"📤 Uploading PDF to S3: {s3_key}")
            
            # Upload to S3 - just the PDF file, no folders
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_content,
                ContentType='application/pdf',
                Metadata={
                    'contract_id': str(contract_id),
                    'original_filename': filename,
                    'upload_timestamp': datetime.now().isoformat(),
                    'upload_type': 'original_pdf'
                }
            )
            
            print(f"✅ PDF stored in S3 bucket root: {s3_key}")
            return s3_key
            
        except ClientError as e:
            print(f"⚠️ AWS S3 Error: {e}")
            return None
        except Exception as e:
            print(f"⚠️ Error storing PDF in S3: {e}")
            return None
    
    def get_pdf_url(self, s3_key: str, expires_in: int = 3600) -> Optional[str]:
        """
        Generate a pre-signed URL for accessing the PDF
        
        Args:
            s3_key: The S3 object key (PDF filename)
            expires_in: URL expiry time in seconds (default: 1 hour)
            
        Returns:
            Pre-signed URL if successful, None otherwise
        """
        if not self.s3_client:
            return None
        
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': s3_key
                },
                ExpiresIn=expires_in
            )
            return url
        except Exception as e:
            print(f"Error generating pre-signed URL: {e}")
            return None
    
    def delete_contract_files(self, contract_id: int) -> bool:
        """
        Delete contract PDF from S3 bucket
        
        Args:
            contract_id: The contract ID
            
        Returns:
            True if successful, False otherwise
        """
        if not self.s3_client:
            return False
        
        try:
            # Since we store PDFs with contract_id in filename, we can find them
            # List all objects and find ones matching our contract
            files_deleted = 0
            
            # List all objects in bucket
            response = self.s3_client.list_objects_v2(Bucket=self.bucket_name)
            
            if 'Contents' in response:
                for obj in response['Contents']:
                    key = obj['Key']
                    # Check if this file belongs to our contract
                    if f'contract_{contract_id}_' in key:
                        # Delete this PDF
                        self.s3_client.delete_object(
                            Bucket=self.bucket_name,
                            Key=key
                        )
                        files_deleted += 1
                        print(f"🗑️ Deleted PDF from S3: {key}")
            
            print(f"✅ Deleted {files_deleted} PDFs from S3 for contract {contract_id}")
            return True
            
        except Exception as e:
            print(f"⚠️ Error deleting PDF from S3: {e}")
            return False
    
    def list_all_pdfs(self) -> list:
        """
        List all PDFs in S3 bucket (for debugging/monitoring)
        
        Returns:
            List of PDF files
        """
        if not self.s3_client:
            return []
        
        try:
            pdfs = []
            
            response = self.s3_client.list_objects_v2(Bucket=self.bucket_name)
            
            if 'Contents' in response:
                for obj in response['Contents']:
                    key = obj['Key']
                    if key.lower().endswith('.pdf'):
                        pdfs.append({
                            'filename': key,
                            'size': obj['Size'],
                            'last_modified': obj['LastModified'].isoformat()
                        })
            
            return pdfs
        except Exception as e:
            print(f"Error listing S3 PDFs: {e}")
            return []

# Create a global instance
s3_service = S3Service()


# import boto3
# from botocore.exceptions import ClientError
# import os
# from datetime import datetime
# from typing import Optional
# from app.config import settings
# import uuid

# class S3Service:
#     def __init__(self):
#         """Initialize S3 client with credentials from settings"""
#         self.aws_access_key_id = settings.AWS_ACCESS_KEY_ID
#         self.aws_secret_access_key = settings.AWS_SECRET_ACCESS_KEY
#         self.aws_region = settings.AWS_REGION
#         self.bucket_name = settings.S3_BUCKET_NAME
        
#         # Initialize S3 client
#         self.s3_client = self._create_s3_client()
    
#     def _create_s3_client(self):
#         """Create and return S3 client"""
#         try:
#             return boto3.client(
#                 's3',
#                 aws_access_key_id=self.aws_access_key_id,
#                 aws_secret_access_key=self.aws_secret_access_key,
#                 region_name=self.aws_region
#             )
#         except Exception as e:
#             print(f"Warning: Failed to create S3 client: {e}")
#             return None
    
#     def store_original_pdf(self, contract_id: int, filename: str, file_content: bytes) -> Optional[str]:
#         """
#         Store original PDF in S3 bucket
        
#         Args:
#             contract_id: The contract ID from PostgreSQL
#             filename: Original filename
#             file_content: PDF file content as bytes
            
#         Returns:
#             S3 key if successful, None otherwise
#         """
#         if not self.s3_client:
#             print("⚠️ S3 client not initialized. Check AWS credentials.")
#             return None
        
#         try:
#             # Generate unique S3 key
#             timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
#             unique_id = str(uuid.uuid4())[:8]
            
#             # Create S3 key with folder structure
#             s3_key = f"contracts/{contract_id}/original_pdf/{timestamp}_{unique_id}_{filename}"
            
#             # Upload to S3
#             self.s3_client.put_object(
#                 Bucket=self.bucket_name,
#                 Key=s3_key,
#                 Body=file_content,
#                 ContentType='application/pdf',
#                 Metadata={
#                     'contract_id': str(contract_id),
#                     'original_filename': filename,
#                     'upload_timestamp': timestamp,
#                     'upload_type': 'original_pdf'
#                 }
#             )
            
#             print(f"✅ PDF stored in S3: {s3_key}")
#             return s3_key
            
#         except ClientError as e:
#             print(f"⚠️ AWS S3 Error: {e}")
#             return None
#         except Exception as e:
#             print(f"⚠️ Error storing PDF in S3: {e}")
#             return None
    
#     def get_pdf_url(self, s3_key: str, expires_in: int = 3600) -> Optional[str]:
#         """
#         Generate a pre-signed URL for accessing the PDF
        
#         Args:
#             s3_key: The S3 object key
#             expires_in: URL expiry time in seconds (default: 1 hour)
            
#         Returns:
#             Pre-signed URL if successful, None otherwise
#         """
#         if not self.s3_client:
#             return None
        
#         try:
#             url = self.s3_client.generate_presigned_url(
#                 'get_object',
#                 Params={
#                     'Bucket': self.bucket_name,
#                     'Key': s3_key
#                 },
#                 ExpiresIn=expires_in
#             )
#             return url
#         except Exception as e:
#             print(f"Error generating pre-signed URL: {e}")
#             return None
    
#     def delete_contract_files(self, contract_id: int) -> bool:
#         """
#         Delete all files for a contract from S3
        
#         Args:
#             contract_id: The contract ID
            
#         Returns:
#             True if successful, False otherwise
#         """
#         if not self.s3_client:
#             return False
        
#         try:
#             # List all objects with the contract_id prefix
#             prefix = f"contracts/{contract_id}/"
#             objects_to_delete = []
            
#             # List objects
#             paginator = self.s3_client.get_paginator('list_objects_v2')
#             for page in paginator.paginate(Bucket=self.bucket_name, Prefix=prefix):
#                 if 'Contents' in page:
#                     for obj in page['Contents']:
#                         objects_to_delete.append({'Key': obj['Key']})
            
#             # Delete objects
#             if objects_to_delete:
#                 self.s3_client.delete_objects(
#                     Bucket=self.bucket_name,
#                     Delete={'Objects': objects_to_delete}
#                 )
#                 print(f"✅ Deleted {len(objects_to_delete)} files from S3 for contract {contract_id}")
            
#             return True
            
#         except Exception as e:
#             print(f"⚠️ Error deleting files from S3: {e}")
#             return False
    
#     def list_contract_files(self, contract_id: int) -> list:
#         """
#         List all files for a contract in S3
        
#         Args:
#             contract_id: The contract ID
            
#         Returns:
#             List of file objects
#         """
#         if not self.s3_client:
#             return []
        
#         try:
#             prefix = f"contracts/{contract_id}/"
#             files = []
            
#             paginator = self.s3_client.get_paginator('list_objects_v2')
#             for page in paginator.paginate(Bucket=self.bucket_name, Prefix=prefix):
#                 if 'Contents' in page:
#                     for obj in page['Contents']:
#                         files.append({
#                             'key': obj['Key'],
#                             'size': obj['Size'],
#                             'last_modified': obj['LastModified'].isoformat()
#                         })
            
#             return files
#         except Exception as e:
#             print(f"Error listing S3 files: {e}")
#             return []

# # Create a global instance
# s3_service = S3Service()