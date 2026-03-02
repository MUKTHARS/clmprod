"""
Authentication endpoints - login, register, logout, password change
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt

from app.database import get_db
from app.auth_models import User, UserNotification
from app.auth_schemas import UserCreate, UserResponse, LoginRequest, Token, ChangePasswordRequest
from app.models import Tenant
from app.config import settings
from app.dependencies import (
    verify_password, get_password_hash, create_access_token, authenticate_user,
    log_activity
)

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest, 
    request: Request, 
    db: Session = Depends(get_db)
):
    """Login user and return JWT token"""
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated"
        )
    
    user.last_login = datetime.utcnow()
    db.commit()
    
    log_activity(
        db, 
        user.id, 
        "login", 
        details={"method": "password"}, 
        request=request
    )
    
    setup_completed = False
    if user.tenant_id:
        tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
        if tenant:
            setup_completed = tenant.setup_completed or False
               
    access_token = create_access_token(data={
        "sub": user.username,
        "role": user.role,
        "user_id": user.id
    })
    
    user_response = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        company=user.company,
        phone=user.phone,
        department=user.department,
        user_type=user.user_type,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login=user.last_login
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "tenant_id": str(user.tenant_id) if user.tenant_id else None,
            "is_active": user.is_active,
            "setup_completed": setup_completed,
            "created_at": user.created_at,
            "last_login": user.last_login
        }
    }

def get_current_user_from_request(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """Extract current user from JWT token in request"""
    from fastapi.security import HTTPAuthorizationCredentials
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Extract token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise credentials_exception
    
    try:
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            raise credentials_exception
            
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except (ValueError, JWTError):
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    
    user.last_login = datetime.utcnow()
    db.commit()
    
    return user

@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user_from_request),
    db: Session = Depends(get_db)
):
    """Logout user"""
    log_activity(
        db, 
        current_user.id, 
        "logout", 
        request=request
    )
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    request: Request,
    current_user: User = Depends(get_current_user_from_request)
):
    """Get current user information"""
    return current_user

@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user_from_request),
    db: Session = Depends(get_db)
):
    """Change user password"""
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}

@router.post("/register", response_model=UserResponse)
async def register_user(
    user_data: UserCreate,
    request: Request,
    current_user: User = Depends(get_current_user_from_request),
    db: Session = Depends(get_db)
):
    """Register a new user (super_admin and director only)"""
    if current_user.role not in ["super_admin", "director"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins and directors can register new users"
        )
    
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        company=user_data.company,
        phone=user_data.phone,
        department=user_data.department,
        user_type=user_data.user_type,
        role=user_data.role,
        is_active=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    log_activity(
        db, 
        current_user.id, 
        "register_user", 
        details={"new_user_id": db_user.id, "new_user_role": db_user.role}, 
        request=request
    )
    
    return db_user
