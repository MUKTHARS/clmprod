from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
import secrets
from datetime import datetime, timedelta

from app.database import get_db
from app.auth_models import User
from app.auth_utils import get_current_user

from app.sharepoint.models import SharePointConnection, SharePointFile
from app.sharepoint.schemas import (
    SharePointAuthUrlResponse, SharePointConnectionResponse,
    SharePointBrowseRequest, SharePointBrowseResponse,
    SharePointFileImportRequest, SharePointFileImportResponse
)
from app.sharepoint.service import sharepoint_service
from app.sharepoint.config import sharepoint_settings

router = APIRouter(prefix="/api/sharepoint", tags=["sharepoint"])

# Store states temporarily (in production, use Redis)
_temp_states = {}

@router.get("/auth/url", response_model=SharePointAuthUrlResponse)
async def get_auth_url(
    current_user: User = Depends(get_current_user)
):
    """Get Microsoft login URL for SharePoint access"""
    # Generate a random state for CSRF protection
    state = secrets.token_urlsafe(16)
    _temp_states[state] = {
        "user_id": current_user.id,
        "expires": datetime.utcnow() + timedelta(minutes=10)
    }
    
    auth_url = sharepoint_service.get_auth_url(state)
    
    return SharePointAuthUrlResponse(
        auth_url=auth_url,
        state=state
    )

@router.get("/auth/callback")
async def auth_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db)
):
    """Handle OAuth callback from Microsoft"""
    # Verify state
    state_data = _temp_states.get(state)
    if not state_data or state_data["expires"] < datetime.utcnow():
        return RedirectResponse(url="/app/sharepoint?error=invalid_state")
    
    user_id = state_data["user_id"]
    
    try:
        # Get tokens
        token_result = sharepoint_service.get_token_from_code(code)
        
        # Get user info
        user_info = sharepoint_service.get_user_info(token_result["access_token"])
        
        # Get SharePoint sites
        sites = sharepoint_service.get_sites(token_result["access_token"])
        
        # For simplicity, use the first site (user can select later)
        default_site = sites[0] if sites else None
        
        if not default_site:
            return RedirectResponse(url="/app/sharepoint?error=no_sites")
        
        # Get drives for the site
        drives = sharepoint_service.get_drives(
            token_result["access_token"], 
            default_site["id"]
        )
        
        default_drive = drives[0] if drives else None
        
        if not default_drive:
            return RedirectResponse(url="/app/sharepoint?error=no_drives")
        
        # Calculate expiry
        expires_in = token_result.get("expires_in", 3600)
        token_expiry = datetime.utcnow() + timedelta(seconds=expires_in)
        
        # Save connection
        connection = SharePointConnection(
            user_id=user_id,
            site_url=default_site.get("webUrl", ""),
            site_name=default_site.get("displayName", default_site.get("name", "SharePoint Site")),
            access_token=token_result["access_token"],
            refresh_token=token_result.get("refresh_token"),
            token_expiry=token_expiry,
            microsoft_user_id=user_info.get("id"),
            microsoft_email=user_info.get("userPrincipalName") or user_info.get("mail"),
            microsoft_name=user_info.get("displayName"),
            is_active=True,
            last_connected_at=datetime.utcnow()
        )
        
        db.add(connection)
        db.commit()
        
        # Clean up state
        _temp_states.pop(state, None)
        
        return RedirectResponse(url=f"/app/sharepoint?connection_id={connection.id}&success=true")
        
    except Exception as e:
        return RedirectResponse(url=f"/app/sharepoint?error={str(e)}")

@router.get("/connections", response_model=list[SharePointConnectionResponse])
async def get_connections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's SharePoint connections"""
    connections = db.query(SharePointConnection).filter(
        SharePointConnection.user_id == current_user.id,
        SharePointConnection.is_active == True
    ).order_by(SharePointConnection.created_at.desc()).all()
    
    return connections

@router.post("/browse", response_model=SharePointBrowseResponse)
async def browse_sharepoint(
    browse_data: SharePointBrowseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Browse SharePoint folder"""
    # Get connection
    connection = db.query(SharePointConnection).filter(
        SharePointConnection.id == browse_data.connection_id,
        SharePointConnection.user_id == current_user.id,
        SharePointConnection.is_active == True
    ).first()
    
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SharePoint connection not found"
        )
    
    # Check if token expired
    if connection.token_expiry and connection.token_expiry < datetime.utcnow():
        # In production, implement refresh token flow
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired. Please reconnect."
        )
    
    # Parse site ID from URL (simplified - in production you'd store site_id)
    site_id = self._extract_site_id(connection.site_url)
    
    # For demo, we'll use a hardcoded approach
    # In production, you'd store the site_id and drive_id in the connection
    access_token = connection.access_token
    
    # Get sites to find the right one
    sites = sharepoint_service.get_sites(access_token)
    site = next((s for s in sites if s.get("webUrl") == connection.site_url), sites[0] if sites else None)
    
    if not site:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not find SharePoint site"
        )
    
    # Get drives
    drives = sharepoint_service.get_drives(access_token, site["id"])
    drive = drives[0] if drives else None
    
    if not drive:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No document libraries found"
        )
    
    # Browse folder
    result = sharepoint_service.browse_folder(
        access_token=access_token,
        site_id=site["id"],
        drive_id=drive["id"],
        folder_path=browse_data.folder_path
    )
    
    # Check which files are already imported
    for file in result["files"]:
        existing = db.query(SharePointFile).filter(
            SharePointFile.file_id == file["id"],
            SharePointFile.import_status == "imported"
        ).first()
        
        if existing:
            file["import_status"] = "imported"
            file["contract_id"] = existing.contract_id
        else:
            file["import_status"] = "available"
            file["contract_id"] = None
    
    return SharePointBrowseResponse(
        folders=result["folders"],
        files=result["files"],
        current_path=result["current_path"]
    )

@router.post("/import", response_model=SharePointFileImportResponse)
async def import_file(
    import_data: SharePointFileImportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Import a file from SharePoint as a contract"""
    # Get connection
    connection = db.query(SharePointConnection).filter(
        SharePointConnection.id == import_data.connection_id,
        SharePointConnection.user_id == current_user.id,
        SharePointConnection.is_active == True
    ).first()
    
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SharePoint connection not found"
        )
    
    # Check if already imported
    existing = db.query(SharePointFile).filter(
        SharePointFile.file_id == import_data.file_id,
        SharePointFile.import_status == "imported"
    ).first()
    
    if existing:
        return SharePointFileImportResponse(
            success=True,
            message="File already imported",
            contract_id=existing.contract_id,
            file_name=import_data.file_name
        )
    
    # Download file
    file_content = sharepoint_service.download_file(import_data.download_url)
    
    if not file_content:
        return SharePointFileImportResponse(
            success=False,
            message="Failed to download file",
            file_name=import_data.file_name
        )
    
    # Import as contract
    contract_id = sharepoint_service.import_file_as_contract(
        db=db,
        user_id=current_user.id,
        file_name=import_data.file_name,
        file_content=file_content
    )
    
    if contract_id:
        # Save file record
        sp_file = SharePointFile(
            connection_id=connection.id,
            file_id=import_data.file_id,
            file_name=import_data.file_name,
            file_path=f"/{import_data.file_name}",
            file_url=import_data.download_url,
            file_size=len(file_content),
            file_type=".pdf",
            import_status="imported",
            contract_id=contract_id,
            imported_at=datetime.utcnow()
        )
        db.add(sp_file)
        db.commit()
        
        return SharePointFileImportResponse(
            success=True,
            message="File imported successfully",
            contract_id=contract_id,
            file_name=import_data.file_name
        )
    else:
        # Save failed record
        sp_file = SharePointFile(
            connection_id=connection.id,
            file_id=import_data.file_id,
            file_name=import_data.file_name,
            file_path=f"/{import_data.file_name}",
            file_url=import_data.download_url,
            file_size=len(file_content) if file_content else 0,
            file_type=".pdf",
            import_status="failed",
            import_error="Failed to process PDF",
            imported_at=datetime.utcnow()
        )
        db.add(sp_file)
        db.commit()
        
        return SharePointFileImportResponse(
            success=False,
            message="Failed to import file (PDF processing error)",
            file_name=import_data.file_name
        )

@router.delete("/connections/{connection_id}")
async def delete_connection(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a SharePoint connection"""
    connection = db.query(SharePointConnection).filter(
        SharePointConnection.id == connection_id,
        SharePointConnection.user_id == current_user.id
    ).first()
    
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection not found"
        )
    
    # Delete related files
    db.query(SharePointFile).filter(
        SharePointFile.connection_id == connection_id
    ).delete()
    
    # Delete connection
    db.delete(connection)
    db.commit()
    
    return {"message": "Connection deleted successfully"}

def _extract_site_id(site_url):
    """Extract site ID from URL (simplified)"""
    # In production, you'd store the site_id in the database
    return "placeholder"


# from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
# from sqlalchemy.orm import Session
# from typing import List, Optional
# from datetime import datetime

# from app.database import get_db
# from app.auth_models import User
# from app.auth_utils import get_current_user
# from app.models import Tenant

# from app.sharepoint.models import SharePointConnection, SharePointFile, SharePointSyncLog
# from app.sharepoint.schemas import (
#     SharePointConnectionCreate, SharePointConnectionResponse, SharePointConnectionUpdate,
#     SharePointFileResponse, SharePointSyncRequest, SharePointSyncResponse,
#     SharePointTestConnectionRequest, SharePointTestConnectionResponse,
#     SharePointFileImportRequest, SharePointBrowseRequest, SharePointBrowseResponse
# )
# from app.sharepoint.service import sharepoint_service
# from app.sharepoint.config import sharepoint_settings

# router = APIRouter(prefix="/api/sharepoint", tags=["sharepoint"])

# @router.post("/connections/test", response_model=SharePointTestConnectionResponse)
# async def test_sharepoint_connection(
#     test_data: SharePointTestConnectionRequest,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Test SharePoint connection before saving"""
#     try:
#         result = sharepoint_service.test_connection(
#             client_id=test_data.client_id,
#             client_secret=test_data.client_secret,
#             tenant_name=test_data.tenant_name,
#             site_url=test_data.site_url,
#             document_library=test_data.document_library
#         )
        
#         return SharePointTestConnectionResponse(
#             success=result["success"],
#             message=result["message"],
#             files_count=result.get("files_count")
#         )
#     except Exception as e:
#         return SharePointTestConnectionResponse(
#             success=False,
#             message=f"Connection test failed: {str(e)}"
#         )

# @router.post("/connections", response_model=SharePointConnectionResponse)
# async def create_sharepoint_connection(
#     connection_data: SharePointConnectionCreate,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Create a new SharePoint connection"""
    
#     # Check if user has a tenant
#     if not current_user.tenant_id:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="User must belong to a tenant to create SharePoint connections"
#         )
    
#     # Test connection before saving
#     test_result = sharepoint_service.test_connection(
#         client_id=connection_data.client_id,
#         client_secret=connection_data.client_secret,
#         tenant_name=connection_data.tenant_name,
#         site_url=connection_data.site_url,
#         document_library=connection_data.document_library
#     )
    
#     if not test_result["success"]:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=f"Connection test failed: {test_result['message']}"
#         )
    
#     # Create connection
#     db_connection = SharePointConnection(
#         tenant_id=current_user.tenant_id,
#         user_id=current_user.id,
#         site_url=connection_data.site_url,
#         document_library=connection_data.document_library,
#         client_id=connection_data.client_id,
#         client_secret=connection_data.client_secret,  # In production, encrypt this!
#         tenant_name=connection_data.tenant_name,
#         connection_name=connection_data.connection_name or connection_data.document_library,
#         description=connection_data.description,
#         sync_enabled=connection_data.sync_enabled,
#         sync_interval_minutes=connection_data.sync_interval_minutes,
#         auto_upload=connection_data.auto_upload,
#         folder_path=connection_data.folder_path,
#         created_by=current_user.id
#     )
    
#     db.add(db_connection)
#     db.commit()
#     db.refresh(db_connection)
    
#     return db_connection

# @router.get("/connections", response_model=List[SharePointConnectionResponse])
# async def get_sharepoint_connections(
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get all SharePoint connections for current user's tenant"""
    
#     connections = db.query(SharePointConnection).filter(
#         SharePointConnection.tenant_id == current_user.tenant_id
#     ).order_by(SharePointConnection.created_at.desc()).all()
    
#     return connections

# @router.get("/connections/{connection_id}", response_model=SharePointConnectionResponse)
# async def get_sharepoint_connection(
#     connection_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get a specific SharePoint connection"""
    
#     connection = db.query(SharePointConnection).filter(
#         SharePointConnection.id == connection_id,
#         SharePointConnection.tenant_id == current_user.tenant_id
#     ).first()
    
#     if not connection:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="SharePoint connection not found"
#         )
    
#     return connection

# @router.put("/connections/{connection_id}", response_model=SharePointConnectionResponse)
# async def update_sharepoint_connection(
#     connection_id: int,
#     update_data: SharePointConnectionUpdate,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Update a SharePoint connection"""
    
#     connection = db.query(SharePointConnection).filter(
#         SharePointConnection.id == connection_id,
#         SharePointConnection.tenant_id == current_user.tenant_id
#     ).first()
    
#     if not connection:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="SharePoint connection not found"
#         )
    
#     # Update fields
#     for key, value in update_data.dict(exclude_unset=True).items():
#         setattr(connection, key, value)
    
#     connection.updated_at = datetime.utcnow()
    
#     db.commit()
#     db.refresh(connection)
    
#     return connection

# @router.delete("/connections/{connection_id}")
# async def delete_sharepoint_connection(
#     connection_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Delete a SharePoint connection"""
    
#     connection = db.query(SharePointConnection).filter(
#         SharePointConnection.id == connection_id,
#         SharePointConnection.tenant_id == current_user.tenant_id
#     ).first()
    
#     if not connection:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="SharePoint connection not found"
#         )
    
#     # Delete related files first (optional - you might want to keep them)
#     db.query(SharePointFile).filter(
#         SharePointFile.connection_id == connection_id
#     ).delete()
    
#     # Delete sync logs
#     db.query(SharePointSyncLog).filter(
#         SharePointSyncLog.connection_id == connection_id
#     ).delete()
    
#     # Delete connection
#     db.delete(connection)
#     db.commit()
    
#     return {"message": "SharePoint connection deleted successfully"}

# @router.post("/connections/{connection_id}/browse", response_model=SharePointBrowseResponse)
# async def browse_sharepoint_folder(
#     connection_id: int,
#     browse_data: SharePointBrowseRequest,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Browse SharePoint folder structure"""
    
#     connection = db.query(SharePointConnection).filter(
#         SharePointConnection.id == connection_id,
#         SharePointConnection.tenant_id == current_user.tenant_id
#     ).first()
    
#     if not connection:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="SharePoint connection not found"
#         )
    
#     try:
#         # Get files from SharePoint
#         items = sharepoint_service.list_files(connection, browse_data.folder_path)
        
#         # Separate folders and files
#         folders = [item for item in items if item["type"] == "folder"]
#         files = [item for item in items if item["type"] == "file"]
        
#         # Check which files are already in our database
#         for file in files:
#             existing = db.query(SharePointFile).filter(
#                 SharePointFile.file_id == file["id"]
#             ).first()
            
#             if existing:
#                 file["import_status"] = existing.import_status
#                 file["contract_id"] = existing.contract_id
#             else:
#                 file["import_status"] = "not_imported"
#                 file["contract_id"] = None
        
#         return SharePointBrowseResponse(
#             folders=folders,
#             files=[SharePointFileResponse.from_orm(f) for f in files],
#             current_path=browse_data.folder_path
#         )
        
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to browse SharePoint: {str(e)}"
#         )

# @router.post("/sync", response_model=SharePointSyncResponse)
# async def sync_sharepoint_connection(
#     sync_data: SharePointSyncRequest,
#     background_tasks: BackgroundTasks,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Sync a SharePoint connection (can be run in background)"""
    
#     connection = db.query(SharePointConnection).filter(
#         SharePointConnection.id == sync_data.connection_id,
#         SharePointConnection.tenant_id == current_user.tenant_id,
#         SharePointConnection.is_active == True
#     ).first()
    
#     if not connection:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="SharePoint connection not found or inactive"
#         )
    
#     # If sync should run in background
#     if background_tasks:
#         background_tasks.add_task(
#             sharepoint_service.sync_connection,
#             db=db,
#             connection_id=sync_data.connection_id,
#             user_id=current_user.id,
#             import_files=sync_data.import_files
#         )
        
#         return SharePointSyncResponse(
#             connection_id=connection_id,
#             sync_id=0,
#             status="started",
#             files_found=0,
#             files_processed=0,
#             files_imported=0,
#             files_failed=0,
#             imported_contracts=[]
#         )
#     else:
#         # Run synchronously
#         try:
#             result = sharepoint_service.sync_connection(
#                 db=db,
#                 connection_id=sync_data.connection_id,
#                 user_id=current_user.id,
#                 import_files=sync_data.import_files
#             )
            
#             return SharePointSyncResponse(
#                 connection_id=result["connection_id"],
#                 sync_id=result["sync_id"],
#                 status=result["status"],
#                 files_found=result["files_found"],
#                 files_processed=result["files_processed"],
#                 files_imported=result["files_imported"],
#                 files_failed=result["files_failed"],
#                 imported_contracts=result["imported_contracts"]
#             )
            
#         except Exception as e:
#             raise HTTPException(
#                 status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#                 detail=f"Sync failed: {str(e)}"
#             )

# @router.post("/files/import", response_model=dict)
# async def import_sharepoint_file(
#     import_data: SharePointFileImportRequest,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Import a specific SharePoint file as a contract"""
    
#     connection = db.query(SharePointConnection).filter(
#         SharePointConnection.id == import_data.connection_id,
#         SharePointConnection.tenant_id == current_user.tenant_id,
#         SharePointConnection.is_active == True
#     ).first()
    
#     if not connection:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="SharePoint connection not found or inactive"
#         )
    
#     try:
#         # Get file details from SharePoint
#         items = sharepoint_service.list_files(connection)
#         file_data = next((f for f in items if f["id"] == import_data.file_id), None)
        
#         if not file_data:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="File not found in SharePoint"
#             )
        
#         # Import file
#         contract_id = sharepoint_service.import_file_as_contract(
#             db=db,
#             connection=connection,
#             file_data=file_data,
#             user_id=current_user.id
#         )
        
#         if contract_id:
#             return {
#                 "success": True,
#                 "message": "File imported successfully",
#                 "contract_id": contract_id,
#                 "file_name": file_data["name"]
#             }
#         else:
#             return {
#                 "success": False,
#                 "message": "Failed to import file (not a PDF or processing error)"
#             }
            
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Import failed: {str(e)}"
#         )

# @router.get("/files", response_model=List[SharePointFileResponse])
# async def get_sharepoint_files(
#     connection_id: Optional[int] = None,
#     import_status: Optional[str] = None,
#     skip: int = 0,
#     limit: int = 100,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get SharePoint files from database"""
    
#     query = db.query(SharePointFile).join(
#         SharePointConnection,
#         SharePointConnection.id == SharePointFile.connection_id
#     ).filter(
#         SharePointConnection.tenant_id == current_user.tenant_id
#     )
    
#     if connection_id:
#         query = query.filter(SharePointFile.connection_id == connection_id)
    
#     if import_status:
#         query = query.filter(SharePointFile.import_status == import_status)
    
#     files = query.order_by(SharePointFile.created_at.desc()).offset(skip).limit(limit).all()
    
#     return files

# @router.get("/sync-logs/{connection_id}")
# async def get_sync_logs(
#     connection_id: int,
#     skip: int = 0,
#     limit: int = 20,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get sync logs for a connection"""
    
#     connection = db.query(SharePointConnection).filter(
#         SharePointConnection.id == connection_id,
#         SharePointConnection.tenant_id == current_user.tenant_id
#     ).first()
    
#     if not connection:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="SharePoint connection not found"
#         )
    
#     logs = db.query(SharePointSyncLog).filter(
#         SharePointSyncLog.connection_id == connection_id
#     ).order_by(SharePointSyncLog.started_at.desc()).offset(skip).limit(limit).all()
    
#     return [
#         {
#             "id": log.id,
#             "sync_type": log.sync_type,
#             "status": log.status,
#             "files_found": log.files_found,
#             "files_processed": log.files_processed,
#             "files_imported": log.files_imported,
#             "files_failed": log.files_failed,
#             "error_message": log.error_message,
#             "started_at": log.started_at.isoformat(),
#             "completed_at": log.completed_at.isoformat() if log.completed_at else None
#         }
#         for log in logs
#     ]