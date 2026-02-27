from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class SharePointConnection(Base):
    __tablename__ = "sharepoint_connections"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=True)
    
    # User's SharePoint context
    site_url = Column(String, nullable=False)
    site_name = Column(String, nullable=True)
    
    # OAuth tokens (encrypted)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expiry = Column(DateTime(timezone=True), nullable=True)
    
    # User's info from Microsoft
    microsoft_user_id = Column(String, nullable=True)
    microsoft_email = Column(String, nullable=True)
    microsoft_name = Column(String, nullable=True)
    
    # Connection status
    is_active = Column(Boolean, default=True)
    last_connected_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class SharePointFile(Base):
    __tablename__ = "sharepoint_files"
    
    id = Column(Integer, primary_key=True, index=True)
    connection_id = Column(Integer, ForeignKey("sharepoint_connections.id"), nullable=False)
    
    # File metadata
    file_id = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_url = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    file_type = Column(String, nullable=True)
    
    # Import status
    import_status = Column(String, default="pending")  # pending, imported, failed
    import_error = Column(Text, nullable=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=True)
    
    # Tracking
    imported_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    

# from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON
# from sqlalchemy.sql import func
# from sqlalchemy.dialects.postgresql import JSONB, UUID
# from app.database import Base

# class SharePointConnection(Base):
#     __tablename__ = "sharepoint_connections"
    
#     id = Column(Integer, primary_key=True, index=True)
#     tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
#     user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
#     # Connection details (encrypted in production)
#     site_url = Column(String, nullable=False)
#     document_library = Column(String, nullable=False)
#     client_id = Column(String, nullable=False)
#     client_secret = Column(String, nullable=False)  # Encrypt in production
#     tenant_name = Column(String, nullable=False)
    
#     # Metadata
#     connection_name = Column(String, nullable=True)
#     description = Column(Text, nullable=True)
#     is_active = Column(Boolean, default=True)
    
#     # Sync settings
#     sync_enabled = Column(Boolean, default=True)
#     sync_interval_minutes = Column(Integer, default=60)
#     last_sync_at = Column(DateTime(timezone=True), nullable=True)
    
#     # Auto-upload settings
#     auto_upload = Column(Boolean, default=False)
#     folder_path = Column(String, default="/")  # Path to monitor
    
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     updated_at = Column(DateTime(timezone=True), onupdate=func.now())
#     created_by = Column(Integer, ForeignKey("users.id"))

# class SharePointFile(Base):
#     __tablename__ = "sharepoint_files"
    
#     id = Column(Integer, primary_key=True, index=True)
#     connection_id = Column(Integer, ForeignKey("sharepoint_connections.id"), nullable=False)
    
#     # File metadata from SharePoint
#     file_id = Column(String, nullable=False, unique=True)  # SharePoint's unique ID
#     file_name = Column(String, nullable=False)
#     file_path = Column(String, nullable=False)
#     file_url = Column(String, nullable=False)
#     file_size = Column(Integer, nullable=True)
#     file_type = Column(String, nullable=True)
    
#     # Version info
#     version = Column(String, nullable=True)
#     modified_by = Column(String, nullable=True)
#     modified_at = Column(DateTime(timezone=True), nullable=True)
#     created_by = Column(String, nullable=True)
#     created_at = Column(DateTime(timezone=True), nullable=True)
    
#     # Sync status
#     is_synced = Column(Boolean, default=False)
#     synced_at = Column(DateTime(timezone=True), nullable=True)
    
#     # Import status
#     import_status = Column(String, default="pending")  # pending, importing, imported, failed
#     import_error = Column(Text, nullable=True)
#     contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=True)
    
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# class SharePointSyncLog(Base):
#     __tablename__ = "sharepoint_sync_logs"
    
#     id = Column(Integer, primary_key=True, index=True)
#     connection_id = Column(Integer, ForeignKey("sharepoint_connections.id"), nullable=False)
#     sync_type = Column(String, nullable=False)  # manual, scheduled, auto
#     status = Column(String, nullable=False)  # started, completed, failed
#     files_found = Column(Integer, default=0)
#     files_processed = Column(Integer, default=0)
#     files_imported = Column(Integer, default=0)
#     files_failed = Column(Integer, default=0)
#     error_message = Column(Text, nullable=True)
#     started_at = Column(DateTime(timezone=True), server_default=func.now())
#     completed_at = Column(DateTime(timezone=True), nullable=True)