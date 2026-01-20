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