from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import secrets
import uuid

from app.config import settings
from app.database import get_db
from app.auth_models import User, UserSession

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def authenticate_user(db: Session, username: str, password: str):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
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

def check_permission(user: User, contract_id: int, required_permission: str, db: Session):
    """Check if user has required permission for a contract"""
    from app.auth_models import ContractPermission
    
    # Admin/Director has all permissions
    if user.role == "director":
        return True
    
    # Program Manager can review and view
    if user.role == "program_manager" and required_permission in ["view", "review"]:
        return True
    
    # Project Manager specific permissions
    if user.role == "project_manager":
        # Check if this user created the contract
        from app.models import Contract
        contract = db.query(Contract).filter(Contract.id == contract_id).first()
        if contract and hasattr(contract, 'created_by') and contract.created_by == user.id:
            if required_permission in ["view", "edit", "upload"]:
                return True
        
        # Check explicit permissions
        permission = db.query(ContractPermission).filter(
            ContractPermission.contract_id == contract_id,
            ContractPermission.user_id == user.id,
            ContractPermission.permission_type == required_permission
        ).first()
        
        return permission is not None
    
    # Check explicit permissions for other users
    permission = db.query(ContractPermission).filter(
        ContractPermission.contract_id == contract_id,
        ContractPermission.user_id == user.id,
        ContractPermission.permission_type == required_permission
    ).first()
    
    return permission is not None

def get_user_permissions(user: User) -> Dict[str, bool]:
    """Get all permissions for a user based on their role"""
    if user.role == "director":
        return {
            "can_upload": True,
            "can_view_all": True,
            "can_edit_all": True,
            "can_delete_all": True,
            "can_review": True,
            "can_approve": True,
            "can_manage_users": True,
            "can_view_activity_logs": True,
            "can_export": True,
            "can_manage_settings": True,
            "can_view_dashboard": True,
            "can_view_contracts": True,
            "can_view_analytics": True,
            "can_view_reports": True,
            "can_view_risk": True,
            "can_view_organizations": True,
            "can_view_grants": True,
            "can_view_approvals": True,
            "can_view_knowledge": True,
            "can_view_help": True
        }
    elif user.role == "program_manager":
        return {
            "can_upload": False,
            "can_view_all": True,
            "can_edit_all": False,
            "can_delete_all": False,
            "can_review": True,
            "can_approve": False,
            "can_manage_users": False,
            "can_view_activity_logs": False,
            "can_export": True,
            "can_manage_settings": False,
            "can_view_dashboard": False,
            "can_view_contracts": True,
            "can_view_analytics": True,
            "can_view_reports": True,
            "can_view_risk": True,
            "can_view_organizations": False,
            "can_view_grants": True,
            "can_view_approvals": False,
            "can_view_knowledge": True,
            "can_view_help": True
        }
    else:  # project_manager
        return {
            "can_upload": True,
            "can_view_all": False,
            "can_edit_all": False,
            "can_delete_all": False,
            "can_review": False,
            "can_approve": False,
            "can_manage_users": False,
            "can_view_activity_logs": False,
            "can_export": True,
            "can_manage_settings": False,
            "can_view_dashboard": True,
            "can_view_contracts": True,
            "can_view_analytics": False,
            "can_view_reports": False,
            "can_view_risk": False,
            "can_view_organizations": False,
            "can_view_grants": False,
            "can_view_approvals": False,
            "can_view_knowledge": True,
            "can_view_help": True
        }

def log_activity(db: Session, user_id: int, activity_type: str, contract_id: Optional[int] = None, details: Optional[dict] = None, request: Optional[Request] = None):
    """Log user activity"""
    from app.auth_models import ActivityLog
    
    activity = ActivityLog(
        user_id=user_id,
        activity_type=activity_type,
        contract_id=contract_id,
        details=details or {},
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    
    db.add(activity)
    db.commit()
    return activity

def generate_session_token() -> str:
    """Generate a secure random session token"""
    return secrets.token_urlsafe(32)

def create_user_session(db: Session, user_id: int, request: Request) -> str:
    """Create a new user session"""
    session_token = generate_session_token()
    
    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=datetime.utcnow() + timedelta(days=7),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    db.add(session)
    db.commit()
    return session_token

def get_current_user_from_session(db: Session, session_token: str) -> Optional[User]:
    """Get user from session token"""
    session = db.query(UserSession).filter(
        UserSession.session_token == session_token,
        UserSession.expires_at > datetime.utcnow()
    ).first()
    
    if session:
        return session.user
    return None