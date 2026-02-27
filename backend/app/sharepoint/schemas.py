from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class SharePointAuthUrlResponse(BaseModel):
    auth_url: str
    state: str

class SharePointCallbackRequest(BaseModel):
    code: str
    state: str

class SharePointConnectionResponse(BaseModel):
    id: int
    site_url: str
    site_name: Optional[str] = None
    microsoft_email: Optional[str] = None
    microsoft_name: Optional[str] = None
    is_active: bool
    last_connected_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class SharePointBrowseRequest(BaseModel):
    connection_id: int
    folder_path: str = "/"

class SharePointBrowseResponse(BaseModel):
    folders: List[dict]
    files: List[dict]
    current_path: str

class SharePointFileImportRequest(BaseModel):
    connection_id: int
    file_id: str
    file_name: str
    download_url: str

class SharePointFileImportResponse(BaseModel):
    success: bool
    message: str
    contract_id: Optional[int] = None
    file_name: Optional[str] = None


# from pydantic import BaseModel, Field, HttpUrl
# from typing import Optional, List
# from datetime import datetime
# from uuid import UUID

# class SharePointConnectionBase(BaseModel):
#     site_url: str
#     document_library: str
#     client_id: str
#     client_secret: str
#     tenant_name: str
#     connection_name: Optional[str] = None
#     description: Optional[str] = None
#     sync_enabled: bool = True
#     sync_interval_minutes: int = 60
#     auto_upload: bool = False
#     folder_path: str = "/"

# class SharePointConnectionCreate(SharePointConnectionBase):
#     pass

# class SharePointConnectionUpdate(BaseModel):
#     connection_name: Optional[str] = None
#     description: Optional[str] = None
#     sync_enabled: Optional[bool] = None
#     sync_interval_minutes: Optional[int] = None
#     auto_upload: Optional[bool] = None
#     folder_path: Optional[str] = None
#     is_active: Optional[bool] = None

# class SharePointConnectionResponse(SharePointConnectionBase):
#     id: int
#     tenant_id: UUID
#     user_id: int
#     is_active: bool
#     last_sync_at: Optional[datetime] = None
#     created_at: datetime
#     updated_at: Optional[datetime] = None
    
#     class Config:
#         from_attributes = True

# class SharePointFileBase(BaseModel):
#     file_name: str
#     file_path: str
#     file_url: str
#     file_size: Optional[int] = None
#     file_type: Optional[str] = None

# class SharePointFileResponse(SharePointFileBase):
#     id: int
#     connection_id: int
#     file_id: str
#     version: Optional[str] = None
#     modified_by: Optional[str] = None
#     modified_at: Optional[datetime] = None
#     created_by: Optional[str] = None
#     created_at: Optional[datetime] = None
#     is_synced: bool
#     synced_at: Optional[datetime] = None
#     import_status: str
#     contract_id: Optional[int] = None
    
#     class Config:
#         from_attributes = True

# class SharePointSyncRequest(BaseModel):
#     connection_id: int
#     import_files: bool = True
#     folder_path: Optional[str] = None
#     file_filter: Optional[str] = None  # e.g., "*.pdf"

# class SharePointSyncResponse(BaseModel):
#     connection_id: int
#     sync_id: int
#     status: str
#     files_found: int
#     files_processed: int
#     files_imported: int
#     files_failed: int
#     imported_contracts: List[int] = []

# class SharePointTestConnectionRequest(BaseModel):
#     site_url: str
#     document_library: str
#     client_id: str
#     client_secret: str
#     tenant_name: str

# class SharePointTestConnectionResponse(BaseModel):
#     success: bool
#     message: str
#     files_count: Optional[int] = None

# class SharePointFileImportRequest(BaseModel):
#     file_id: str
#     connection_id: int
#     auto_process: bool = True

# class SharePointBrowseRequest(BaseModel):
#     connection_id: int
#     folder_path: str = "/"

# class SharePointBrowseResponse(BaseModel):
#     folders: List[dict]
#     files: List[SharePointFileResponse]
#     current_path: str