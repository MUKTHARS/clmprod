from pydantic_settings import BaseSettings

class SharePointSettings(BaseSettings):
    # Microsoft identity platform settings
    CLIENT_ID: str = ""  # This is the application ID, not user's secret
    REDIRECT_URI: str = "http://localhost:4001/api/sharepoint/auth/callback"
    AUTHORITY: str = "https://login.microsoftonline.com/common"  # 'common' for multi-tenant
    
    # Scopes - offline_access is reserved, handled separately by MSAL
    SCOPES: list = ["Files.Read", "Sites.Read.All"]
    
    class Config:
        env_prefix = "SHAREPOINT_"

sharepoint_settings = SharePointSettings()

# from pydantic_settings import BaseSettings
# import os

# class SharePointSettings(BaseSettings):
#     # Default scopes for SharePoint
#     SHAREPOINT_SCOPES: list = ["https://graph.microsoft.com/.default"]
#     SHAREPOINT_AUTHORITY: str = "https://login.microsoftonline.com"
    
#     # File processing settings
#     MAX_FILE_SIZE_MB: int = 50
#     ALLOWED_FILE_TYPES: list = [".pdf", ".docx", ".xlsx", ".pptx"]
    
#     # Sync settings
#     DEFAULT_SYNC_INTERVAL: int = 60  # minutes
#     MAX_SYNC_INTERVAL: int = 1440  # 24 hours
    
#     class Config:
#         env_prefix = "SHAREPOINT_"

# sharepoint_settings = SharePointSettings()