"""
Main application entry point
Handles FastAPI initialization, middleware setup, and route registration
All business logic and endpoints are in separate route modules
"""
import os
import sys
from asyncio import events
from datetime import datetime, date

# Remove proxy environment variables and patch OpenAI
proxy_vars = [
    'HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy',
    'ALL_PROXY', 'all_proxy', 'NO_PROXY', 'no_proxy',
    'REQUESTS_CA_BUNDLE', 'CURL_CA_BUNDLE'
]

for var in proxy_vars:
    os.environ.pop(var, None)

try:
    import openai._base_client
    
    original_init = openai._base_client.SyncHttpxClientWrapper.__init__
    def patched_init(self, **kwargs):
        kwargs.pop('proxies', None)
        kwargs.pop('proxy', None)
        return original_init(self, **kwargs)
    
    openai._base_client.SyncHttpxClientWrapper.__init__ = patched_init
    
    original_async_init = openai._base_client.AsyncHttpxClientWrapper.__init__
    def patched_async_init(self, **kwargs):
        kwargs.pop('proxies', None)
        kwargs.pop('proxy', None)
        return original_async_init(self, **kwargs)
    
    openai._base_client.AsyncHttpxClientWrapper.__init__ = patched_async_init
    
    print("✓ OpenAI proxy patches applied at startup")
except Exception as e:
    print(f"Note: Could not apply OpenAI patches: {e}")

# FastAPI and dependencies
from fastapi import FastAPI, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt

# Application modules
from app.database import get_db, engine, setup_database
from app.pdf_processor import PDFProcessor
from app.ai_extractor import AIExtractor
from app.config import settings
from app.auth_models import User, UserSession

# Import external routers (already existing)
from app.admin_routes import router as admin_router
from app.agreement_workflow import router as agreement_router
from app.tenant_routes import router as tenant_router
from app.module_routes import router as module_router
from app.sharepoint.routes import router as sharepoint_router

# Import route modules from routes directory
from app.routes.health_routes import router as health_router
from app.routes.auth_routes import router as auth_router
from app.routes.contract_crud_routes import router as contract_crud_router
from app.routes.upload_routes import router as upload_router
from app.routes.utility_routes import router as utility_router

# Import dependencies
from app.dependencies import (
    verify_password, get_password_hash, create_access_token, authenticate_user
)

# Create tables and setup relationships
setup_database()

# Initialize FastAPI app
app = FastAPI(title=settings.APP_NAME)

# Add external routers
app.include_router(admin_router)
app.include_router(agreement_router)
app.include_router(tenant_router)
app.include_router(module_router)
app.include_router(sharepoint_router)

# Add new route modules
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(contract_crud_router)
app.include_router(upload_router)
app.include_router(utility_router)

# ============================================================================
# CORS Middleware
# ============================================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4001", "http://localhost:4000", 
                   "https://grantapi.saple.ai", "https://demo.saple.ai", "https://bot.saple.ai"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Global Dependencies
# ============================================================================
pwd_context_app = __import__('passlib.context', fromlist=['CryptContext']).CryptContext(
    schemes=["bcrypt"], deprecated="auto"
)
security = HTTPBearer()

# Initialize processors
pdf_processor = PDFProcessor()
ai_extractor = AIExtractor()

# ============================================================================
# Authentication/Authorization Dependency
# ============================================================================
def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    credentials: HTTPBearer = Depends(security if security else lambda: None)
) -> User:
    """Get current authenticated user from JWT token"""
    from fastapi import HTTPException, status
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials if credentials else None
        if not token:
            raise credentials_exception
            
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    return user

# ============================================================================
# CORS Preflight Handler
# ============================================================================
@app.options("/{rest_of_path:path}")
async def preflight_handler(request: Request, rest_of_path: str):
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
            "Access-Control-Allow-Credentials": "true",
        }
    )

# ============================================================================
# Endpoint Imports
# ============================================================================
# NOTE: All major endpoints are now in separate route modules.
# If you need to add more endpoints, create/modify files in app/routes/
#
# Current route modules:
# - app/routes/auth_routes.py          - Authentication endpoints
# - app/routes/contract_crud_routes.py - Contract CRUD operations
# - app/routes/upload_routes.py        - Contract upload & processing
# - app/routes/utility_routes.py       - Search, extract, activity logs
# - app/routes/health_routes.py        - Health checks & status
#
# External routers (already included):
# - app/admin_routes.py                - Admin endpoints
# - app/agreement_workflow.py          - Agreement workflow
# - app/tenant_routes.py               - Tenant management
# - app/module_routes.py               - Module routes
# - app/sharepoint/routes.py           - SharePoint integration

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True
    )
