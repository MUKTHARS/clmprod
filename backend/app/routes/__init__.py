"""
API Routes package
Organizes all API endpoints into modular route files
"""

# Import all route modules
from app.routes.health_routes import router as health_router
from app.routes.auth_routes import router as auth_router
from app.routes.contract_crud_routes import router as contract_crud_router
from app.routes.upload_routes import router as upload_router
from app.routes.utility_routes import router as utility_router

__all__ = [
    "health_router",
    "auth_router",
    "contract_crud_router",
    "upload_router",
    "utility_router",
]
