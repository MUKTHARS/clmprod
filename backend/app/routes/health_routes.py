"""
Health check and status endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.auth_models import User
from app.dashboard_services import get_dashboard_metrics
from app.s3_service import s3_service
from app.config import settings
from app.dependencies import get_user_permissions_dict

router = APIRouter(tags=["health"])

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@router.get("/api/health/s3")
async def check_s3_health(
    current_user: User = Depends(lambda db: None)
):
    """Check S3 health status"""
    if current_user.role != "director":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Directors can check system health"
        )
    
    status_info = {
        "aws_configured": bool(settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY),
        "aws_region": settings.AWS_REGION,
        "s3_bucket": settings.S3_BUCKET_NAME,
        "s3_client_ready": s3_service.s3_client is not None,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if s3_service.s3_client:
        try:
            s3_service.s3_client.head_bucket(Bucket=settings.S3_BUCKET_NAME)
            status_info["bucket_accessible"] = True
            status_info["bucket_status"] = "accessible"
        except Exception as e:
            status_info["bucket_accessible"] = False
            status_info["bucket_status"] = f"error: {str(e)}"
    else:
        status_info["bucket_accessible"] = False
        status_info["bucket_status"] = "s3_client_not_ready"
    
    return status_info

@router.get("/")
def read_root():
    """Root endpoint"""
    return {"message": "GrantOS API", "version": "1.0.0"}

@router.get("/api/dashboard/metrics")
async def get_dashboard_metrics_endpoint(
    current_user: User = Depends(lambda db: None),
    db: Session = Depends(get_db)
):
    """Get dashboard metrics"""
    return get_dashboard_metrics(current_user, db)

@router.get("/api/user/permissions")
async def get_user_permissions(
    current_user: User = Depends(lambda db: None),
    db: Session = Depends(get_db)
):
    """Get all permissions for current user"""
    permissions = get_user_permissions_dict(current_user)
    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "role": current_user.role,
            "full_name": current_user.full_name
        },
        "permissions": permissions
    }
