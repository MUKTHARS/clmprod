import requests
import msal
import base64
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.sharepoint.config import sharepoint_settings
from app.sharepoint.models import SharePointConnection, SharePointFile
from app.models import Contract
from app.s3_service import s3_service
from app.pdf_processor import PDFProcessor
from app.ai_extractor import AIExtractor

class SharePointService:
    def __init__(self):
        self.pdf_processor = PDFProcessor()
        self.ai_extractor = AIExtractor()
        
        # MSAL app with client_credential=None (for delegated auth)
        # offline_access is handled automatically by MSAL, don't include it in scopes list
        self.msal_app = msal.ConfidentialClientApplication(
            client_id=sharepoint_settings.CLIENT_ID,
            client_credential=None,  # No client secret needed for delegated auth
            authority=sharepoint_settings.AUTHORITY
        )
    
    def get_auth_url(self, state: str) -> str:
        """Generate Microsoft login URL for user to authorize"""
        # MSAL automatically includes offline_access when needed
        auth_url = self.msal_app.get_authorization_request_url(
            scopes=sharepoint_settings.SCOPES,  # Don't include offline_access here
            state=state,
            redirect_uri=sharepoint_settings.REDIRECT_URI,
            prompt="select_account"
        )
        return auth_url
    
    def get_token_from_code(self, code: str) -> dict:
        """Exchange authorization code for tokens"""
        # MSAL automatically requests refresh_token when offline_access is needed
        result = self.msal_app.acquire_token_by_authorization_code(
            code=code,
            scopes=sharepoint_settings.SCOPES,  # Don't include offline_access here
            redirect_uri=sharepoint_settings.REDIRECT_URI
        )
        
        if "error" in result:
            error_msg = result.get("error_description", result.get("error", "Unknown error"))
            raise Exception(f"Failed to acquire token: {error_msg}")
        
        return result
    
    def get_user_info(self, access_token: str) -> dict:
        """Get user info from Microsoft Graph"""
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get("https://graph.microsoft.com/v1.0/me", headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            return {}
    
    def get_sites(self, access_token: str) -> list:
        """Get SharePoint sites user has access to"""
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(
            "https://graph.microsoft.com/v1.0/sites?search=*", 
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get("value", [])
        return []
    
    def get_drives(self, access_token: str, site_id: str) -> list:
        """Get document libraries for a site"""
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(
            f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get("value", [])
        return []
    
    def browse_folder(self, access_token: str, site_id: str, drive_id: str, folder_path: str = "/") -> dict:
        """Browse SharePoint folder contents"""
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Build the API endpoint
        if folder_path == "/":
            url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/root/children"
        else:
            # Path-based navigation
            encoded_path = folder_path.replace("/", ":").lstrip(":")
            url = f"https://graph.microsoft.com/v1.0/sites/{site_id}/drives/{drive_id}/root:/{encoded_path}:/children"
        
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            return {"folders": [], "files": []}
        
        data = response.json()
        items = data.get("value", [])
        
        folders = []
        files = []
        
        for item in items:
            if "folder" in item:
                # It's a folder
                folders.append({
                    "id": item["id"],
                    "name": item["name"],
                    "path": f"{folder_path}/{item['name']}".replace("//", "/")
                })
            else:
                # It's a file - only show PDFs
                if item["name"].lower().endswith(".pdf"):
                    files.append({
                        "id": item["id"],
                        "name": item["name"],
                        "size": item.get("size", 0),
                        "path": f"{folder_path}/{item['name']}".replace("//", "/"),
                        "download_url": item.get("@microsoft.graph.downloadUrl"),
                        "web_url": item.get("webUrl"),
                        "modified_at": item.get("lastModifiedDateTime")
                    })
        
        return {
            "folders": folders,
            "files": files,
            "current_path": folder_path
        }
    
    def download_file(self, download_url: str) -> Optional[bytes]:
        """Download file from SharePoint using download URL"""
        try:
            response = requests.get(download_url)
            if response.status_code == 200:
                return response.content
            return None
        except Exception:
            return None
    
    def import_file_as_contract(self, db: Session, user_id: int, 
                               file_name: str, file_content: bytes) -> Optional[int]:
        """Import file as contract (same as upload endpoint logic)"""
        try:
            # Process PDF (same as upload endpoint)
            extraction_result = self.pdf_processor.extract_text(file_content)
            cleaned_text = self.pdf_processor.clean_text(extraction_result["text"])
            
            # Extract data using AI
            comprehensive_data = self.ai_extractor.extract_contract_data(cleaned_text)
            reference_ids = comprehensive_data.get("reference_ids", {})
            
            # Get embedding
            embedding = self.ai_extractor.get_embedding(cleaned_text)
            
            # Extract basic fields
            contract_details = comprehensive_data.get("contract_details", {})
            parties = comprehensive_data.get("parties", {})
            financial_details = comprehensive_data.get("financial_details", {})
            terms_conditions_data = comprehensive_data.get("terms_conditions", {})
            
            basic_data = {
                "contract_number": contract_details.get("contract_number"),
                "grant_name": contract_details.get("grant_name"),
                "grantor": parties.get("grantor", {}).get("organization_name"),
                "grantee": parties.get("grantee", {}).get("organization_name"),
                "total_amount": financial_details.get("total_grant_amount"),
                "start_date": contract_details.get("start_date"),
                "end_date": contract_details.get("end_date"),
                "purpose": contract_details.get("purpose"),
                "payment_schedule": financial_details.get("payment_schedule", {}),
                "terms_conditions": terms_conditions_data
            }
            
            # Create contract
            db_contract = Contract(
                filename=file_name,
                full_text=cleaned_text[:5000] if cleaned_text else "",
                comprehensive_data=comprehensive_data,
                investment_id=reference_ids.get("investment_id"),
                project_id=reference_ids.get("project_id"),
                grant_id=reference_ids.get("grant_id"),
                extracted_reference_ids=reference_ids.get("extracted_reference_ids", []),
                contract_number=basic_data["contract_number"],
                grant_name=basic_data["grant_name"],
                grantor=basic_data["grantor"],
                grantee=basic_data["grantee"],
                total_amount=basic_data["total_amount"],
                start_date=basic_data["start_date"],
                end_date=basic_data["end_date"],
                purpose=basic_data["purpose"],
                payment_schedule=basic_data["payment_schedule"],
                terms_conditions=basic_data["terms_conditions"],
                created_by=user_id,
                status="draft",
                version=1,
                sharepoint_source=True
            )
            
            db.add(db_contract)
            db.flush()
            
            # Store PDF in S3
            try:
                pdf_key = s3_service.store_original_pdf(
                    contract_id=db_contract.id,
                    filename=file_name,
                    file_content=file_content
                )
                
                if pdf_key:
                    if not db_contract.comprehensive_data:
                        db_contract.comprehensive_data = {}
                    
                    db_contract.comprehensive_data["s3_pdf"] = {
                        "key": pdf_key,
                        "uploaded_at": datetime.utcnow().isoformat(),
                        "original_filename": file_name,
                        "source": "sharepoint"
                    }
            except Exception as s3_error:
                print(f"Warning: S3 storage failed: {s3_error}")
            
            db.commit()
            return db_contract.id
            
        except Exception as e:
            print(f"Error importing file {file_name}: {str(e)}")
            return None

sharepoint_service = SharePointService()

# import requests
# from msal import ConfidentialClientApplication
# from typing import List, Dict, Optional, Any
# import os
# import base64
# from datetime import datetime
# import json
# from sqlalchemy.orm import Session

# from app.sharepoint.config import sharepoint_settings
# from app.sharepoint.models import SharePointConnection, SharePointFile, SharePointSyncLog
# from app.models import Contract
# from app.s3_service import s3_service
# from app.pdf_processor import PDFProcessor
# from app.ai_extractor import AIExtractor
# from app.auth_models import User

# class SharePointService:
#     def __init__(self):
#         self.pdf_processor = PDFProcessor()
#         self.ai_extractor = AIExtractor()
    
#     def get_access_token(self, client_id: str, client_secret: str, tenant_name: str) -> Optional[str]:
#         """Get access token for SharePoint Graph API"""
#         authority = f"{sharepoint_settings.SHAREPOINT_AUTHORITY}/{tenant_name}"
        
#         app = ConfidentialClientApplication(
#             client_id=client_id,
#             client_credential=client_secret,
#             authority=authority
#         )
        
#         result = app.acquire_token_silent(sharepoint_settings.SHAREPOINT_SCOPES, account=None)
        
#         if not result:
#             result = app.acquire_token_for_client(scopes=sharepoint_settings.SHAREPOINT_SCOPES)
        
#         if "access_token" in result:
#             return result["access_token"]
#         else:
#             error = result.get("error_description", "Unknown error")
#             raise Exception(f"Failed to acquire token: {error}")
    
#     def test_connection(self, client_id: str, client_secret: str, tenant_name: str, 
#                         site_url: str, document_library: str) -> Dict[str, Any]:
#         """Test SharePoint connection by listing files"""
#         try:
#             token = self.get_access_token(client_id, client_secret, tenant_name)
            
#             # Extract site path from URL
#             # Example: https://contoso.sharepoint.com/sites/MySite
#             site_path = site_url.replace(f"https://{tenant_name}.sharepoint.com", "")
            
#             # Graph API endpoint for drive
#             drive_url = f"https://graph.microsoft.com/v1.0/sites/{tenant_name}.sharepoint.com:{site_path}:/drive/root:/{document_library}:/children"
            
#             headers = {
#                 "Authorization": f"Bearer {token}",
#                 "Content-Type": "application/json"
#             }
            
#             response = requests.get(drive_url, headers=headers)
            
#             if response.status_code == 200:
#                 data = response.json()
#                 files = data.get("value", [])
#                 pdf_files = [f for f in files if f.get("name", "").lower().endswith(".pdf")]
                
#                 return {
#                     "success": True,
#                     "message": f"Connected successfully. Found {len(files)} files, {len(pdf_files)} PDFs.",
#                     "files_count": len(files),
#                     "pdf_count": len(pdf_files)
#                 }
#             else:
#                 return {
#                     "success": False,
#                     "message": f"Failed to connect: {response.status_code} - {response.text}"
#                 }
                
#         except Exception as e:
#             return {
#                 "success": False,
#                 "message": f"Connection failed: {str(e)}"
#             }
    
#     def list_files(self, connection: SharePointConnection, folder_path: str = "/") -> List[Dict]:
#         """List files in SharePoint document library"""
#         token = self.get_access_token(
#             connection.client_id,
#             connection.client_secret,
#             connection.tenant_name
#         )
        
#         # Extract site path
#         site_path = connection.site_url.replace(f"https://{connection.tenant_name}.sharepoint.com", "")
        
#         # Build path
#         if folder_path and folder_path != "/":
#             full_path = f"{connection.document_library}/{folder_path}".replace("//", "/")
#         else:
#             full_path = connection.document_library
        
#         # Graph API endpoint
#         drive_url = f"https://graph.microsoft.com/v1.0/sites/{connection.tenant_name}.sharepoint.com:{site_path}:/drive/root:/{full_path}:/children"
        
#         headers = {
#             "Authorization": f"Bearer {token}",
#             "Content-Type": "application/json"
#         }
        
#         all_items = []
        
#         while drive_url:
#             response = requests.get(drive_url, headers=headers)
            
#             if response.status_code == 200:
#                 data = response.json()
#                 items = data.get("value", [])
                
#                 for item in items:
#                     if "folder" in item:
#                         # It's a folder
#                         all_items.append({
#                             "id": item["id"],
#                             "name": item["name"],
#                             "type": "folder",
#                             "path": f"{folder_path}/{item['name']}".replace("//", "/"),
#                             "created_at": item.get("createdDateTime"),
#                             "modified_at": item.get("lastModifiedDateTime")
#                         })
#                     else:
#                         # It's a file
#                         file_ext = os.path.splitext(item["name"])[1].lower()
#                         all_items.append({
#                             "id": item["id"],
#                             "name": item["name"],
#                             "type": "file",
#                             "path": f"{folder_path}/{item['name']}".replace("//", "/"),
#                             "size": item.get("size", 0),
#                             "file_type": file_ext,
#                             "download_url": item.get("@microsoft.graph.downloadUrl"),
#                             "web_url": item.get("webUrl"),
#                             "created_at": item.get("createdDateTime"),
#                             "modified_at": item.get("lastModifiedDateTime"),
#                             "created_by": item.get("createdBy", {}).get("user", {}).get("displayName"),
#                             "modified_by": item.get("lastModifiedBy", {}).get("user", {}).get("displayName")
#                         })
                
#                 # Check for next page
#                 drive_url = data.get("@odata.nextLink")
#             else:
#                 raise Exception(f"Failed to list files: {response.status_code} - {response.text}")
        
#         return all_items
    
#     def download_file(self, connection: SharePointConnection, file_id: str) -> Optional[bytes]:
#         """Download file content from SharePoint"""
#         token = self.get_access_token(
#             connection.client_id,
#             connection.client_secret,
#             connection.tenant_name
#         )
        
#         # First get file metadata to get download URL
#         site_path = connection.site_url.replace(f"https://{connection.tenant_name}.sharepoint.com", "")
        
#         file_url = f"https://graph.microsoft.com/v1.0/sites/{connection.tenant_name}.sharepoint.com:{site_path}:/drive/items/{file_id}"
        
#         headers = {
#             "Authorization": f"Bearer {token}",
#             "Content-Type": "application/json"
#         }
        
#         response = requests.get(file_url, headers=headers)
        
#         if response.status_code != 200:
#             raise Exception(f"Failed to get file metadata: {response.status_code}")
        
#         file_data = response.json()
#         download_url = file_data.get("@microsoft.graph.downloadUrl")
        
#         if not download_url:
#             raise Exception("No download URL found")
        
#         # Download file content
#         file_response = requests.get(download_url)
        
#         if file_response.status_code == 200:
#             return file_response.content
#         else:
#             raise Exception(f"Failed to download file: {file_response.status_code}")
    
#     def import_file_as_contract(self, db: Session, connection: SharePointConnection, 
#                                  file_data: Dict, user_id: int) -> Optional[int]:
#         """Import SharePoint file as a contract in GrantOS"""
#         try:
#             # Check if file is PDF
#             if not file_data["name"].lower().endswith(".pdf"):
#                 return None
            
#             # Check if already imported
#             existing = db.query(SharePointFile).filter(
#                 SharePointFile.file_id == file_data["id"],
#                 SharePointFile.import_status == "imported"
#             ).first()
            
#             if existing:
#                 return existing.contract_id
            
#             # Download file
#             file_content = self.download_file(connection, file_data["id"])
            
#             if not file_content:
#                 raise Exception("Failed to download file")
            
#             # Process PDF (same as upload endpoint)
#             extraction_result = self.pdf_processor.extract_text(file_content)
#             cleaned_text = self.pdf_processor.clean_text(extraction_result["text"])
            
#             # Extract data using AI
#             comprehensive_data = self.ai_extractor.extract_contract_data(cleaned_text)
#             reference_ids = comprehensive_data.get("reference_ids", {})
            
#             # Get embedding
#             embedding = self.ai_extractor.get_embedding(cleaned_text)
            
#             # Extract basic fields
#             contract_details = comprehensive_data.get("contract_details", {})
#             parties = comprehensive_data.get("parties", {})
#             financial_details = comprehensive_data.get("financial_details", {})
#             terms_conditions_data = comprehensive_data.get("terms_conditions", {})
            
#             basic_data = {
#                 "contract_number": contract_details.get("contract_number"),
#                 "grant_name": contract_details.get("grant_name"),
#                 "grantor": parties.get("grantor", {}).get("organization_name"),
#                 "grantee": parties.get("grantee", {}).get("organization_name"),
#                 "total_amount": financial_details.get("total_grant_amount"),
#                 "start_date": contract_details.get("start_date"),
#                 "end_date": contract_details.get("end_date"),
#                 "purpose": contract_details.get("purpose"),
#                 "payment_schedule": financial_details.get("payment_schedule", {}),
#                 "terms_conditions": terms_conditions_data
#             }
            
#             # Create contract
#             db_contract = Contract(
#                 filename=file_data["name"],
#                 full_text=cleaned_text[:5000] if cleaned_text else "",
#                 comprehensive_data=comprehensive_data,
#                 investment_id=reference_ids.get("investment_id"),
#                 project_id=reference_ids.get("project_id"),
#                 grant_id=reference_ids.get("grant_id"),
#                 extracted_reference_ids=reference_ids.get("extracted_reference_ids", []),
#                 contract_number=basic_data["contract_number"],
#                 grant_name=basic_data["grant_name"],
#                 grantor=basic_data["grantor"],
#                 grantee=basic_data["grantee"],
#                 total_amount=basic_data["total_amount"],
#                 start_date=basic_data["start_date"],
#                 end_date=basic_data["end_date"],
#                 purpose=basic_data["purpose"],
#                 payment_schedule=basic_data["payment_schedule"],
#                 terms_conditions=basic_data["terms_conditions"],
#                 created_by=user_id,
#                 status="draft",
#                 version=1
#             )
            
#             db.add(db_contract)
#             db.flush()  # Get ID without committing
            
#             # Store PDF in S3
#             try:
#                 pdf_key = s3_service.store_original_pdf(
#                     contract_id=db_contract.id,
#                     filename=file_data["name"],
#                     file_content=file_content
#                 )
                
#                 if pdf_key:
#                     if not db_contract.comprehensive_data:
#                         db_contract.comprehensive_data = {}
                    
#                     db_contract.comprehensive_data["s3_pdf"] = {
#                         "key": pdf_key,
#                         "uploaded_at": datetime.utcnow().isoformat(),
#                         "original_filename": file_data["name"],
#                         "source": "sharepoint",
#                         "sharepoint_file_id": file_data["id"],
#                         "sharepoint_connection_id": connection.id
#                     }
#             except Exception as s3_error:
#                 print(f"Warning: S3 storage failed: {s3_error}")
            
#             # Store embedding if available
#             if embedding and len(embedding) > 0:
#                 # Would need to store in ChromaDB - integrate with your vector_store
#                 pass
            
#             # Create SharePoint file record
#             sp_file = SharePointFile(
#                 connection_id=connection.id,
#                 file_id=file_data["id"],
#                 file_name=file_data["name"],
#                 file_path=file_data.get("path", f"/{file_data['name']}"),
#                 file_url=file_data.get("web_url", ""),
#                 file_size=file_data.get("size"),
#                 file_type=os.path.splitext(file_data["name"])[1].lower(),
#                 version=file_data.get("version", "1.0"),
#                 modified_by=file_data.get("modified_by"),
#                 modified_at=self._parse_datetime(file_data.get("modified_at")),
#                 created_by=file_data.get("created_by"),
#                 created_at=self._parse_datetime(file_data.get("created_at")),
#                 is_synced=True,
#                 synced_at=datetime.utcnow(),
#                 import_status="imported",
#                 contract_id=db_contract.id
#             )
            
#             db.add(sp_file)
#             db.commit()
            
#             return db_contract.id
            
#         except Exception as e:
#             print(f"Error importing file {file_data.get('name')}: {str(e)}")
            
#             # Create failed record
#             sp_file = SharePointFile(
#                 connection_id=connection.id,
#                 file_id=file_data["id"],
#                 file_name=file_data["name"],
#                 file_path=file_data.get("path", f"/{file_data['name']}"),
#                 file_url=file_data.get("web_url", ""),
#                 import_status="failed",
#                 import_error=str(e)[:500]
#             )
#             db.add(sp_file)
#             db.commit()
            
#             return None
    
#     def _parse_datetime(self, dt_str):
#         """Parse datetime string from SharePoint"""
#         if not dt_str:
#             return None
#         try:
#             return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
#         except:
#             return None
    
#     def sync_connection(self, db: Session, connection_id: int, user_id: int, 
#                         import_files: bool = True) -> Dict[str, Any]:
#         """Sync a SharePoint connection - list files and optionally import"""
#         connection = db.query(SharePointConnection).filter(
#             SharePointConnection.id == connection_id,
#             SharePointConnection.is_active == True
#         ).first()
        
#         if not connection:
#             raise Exception("Connection not found or inactive")
        
#         # Create sync log
#         sync_log = SharePointSyncLog(
#             connection_id=connection_id,
#             sync_type="manual",
#             status="started",
#             started_at=datetime.utcnow()
#         )
#         db.add(sync_log)
#         db.flush()
        
#         try:
#             # List files from SharePoint
#             files = self.list_files(connection)
            
#             # Update sync log
#             sync_log.files_found = len(files)
            
#             # Filter for PDFs
#             pdf_files = [f for f in files if f.get("file_type") == ".pdf"]
            
#             imported_count = 0
#             failed_count = 0
#             imported_ids = []
            
#             if import_files:
#                 for file_data in pdf_files:
#                     # Check if already processed
#                     existing = db.query(SharePointFile).filter(
#                         SharePointFile.file_id == file_data["id"]
#                     ).first()
                    
#                     if existing and existing.import_status == "imported":
#                         # Already imported, skip
#                         continue
                    
#                     # Import file
#                     contract_id = self.import_file_as_contract(
#                         db, connection, file_data, user_id
#                     )
                    
#                     if contract_id:
#                         imported_count += 1
#                         imported_ids.append(contract_id)
#                     else:
#                         failed_count += 1
            
#             # Update sync log
#             sync_log.status = "completed"
#             sync_log.files_processed = len(pdf_files)
#             sync_log.files_imported = imported_count
#             sync_log.files_failed = failed_count
#             sync_log.completed_at = datetime.utcnow()
            
#             # Update connection last sync
#             connection.last_sync_at = datetime.utcnow()
            
#             db.commit()
            
#             return {
#                 "connection_id": connection_id,
#                 "sync_id": sync_log.id,
#                 "status": "completed",
#                 "files_found": sync_log.files_found,
#                 "files_processed": sync_log.files_processed,
#                 "files_imported": imported_count,
#                 "files_failed": failed_count,
#                 "imported_contracts": imported_ids
#             }
            
#         except Exception as e:
#             sync_log.status = "failed"
#             sync_log.error_message = str(e)
#             sync_log.completed_at = datetime.utcnow()
#             db.commit()
            
#             raise Exception(f"Sync failed: {str(e)}")

# sharepoint_service = SharePointService()