"""
Shared dependencies and utility functions for the application
"""
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status, Request
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta, date
import json

from app.database import get_db
from app.config import settings
from app.auth_models import User, ActivityLog, ContractPermission, ReviewComment, UserNotification
from app import models

# Authentication dependencies
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password with bcrypt compatibility (max 72 chars)"""
    if len(password) > 72:
        password = password[:72]
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

def get_user_ids_from_field(user_field):
    """Safely extract user IDs from a field that could be list, string, or other format"""
    if not user_field:
        return []
    
    if isinstance(user_field, list):
        return user_field
    
    if isinstance(user_field, str):
        try:
            parsed = json.loads(user_field)
            if isinstance(parsed, list):
                return parsed
        except:
            try:
                ids = [int(id_str.strip()) for id_str in user_field.split(',') if id_str.strip().isdigit()]
                return ids
            except:
                return []
    
    try:
        return [int(user_field)]
    except:
        return []

def is_user_assigned_to_contract(user_id: int, contract, db: Session) -> bool:
    """Check if a user is assigned to a contract"""
    if not contract:
        return False
    
    # Check PM assignments
    if contract.assigned_pm_users:
        if isinstance(contract.assigned_pm_users, list):
            if user_id in contract.assigned_pm_users:
                return True
        elif isinstance(contract.assigned_pm_users, str):
            import json
            try:
                pm_list = json.loads(contract.assigned_pm_users)
                if isinstance(pm_list, list) and user_id in pm_list:
                    return True
            except:
                try:
                    pm_ids = [int(id_str.strip()) for id_str in contract.assigned_pm_users.split(',') if id_str.strip().isdigit()]
                    if user_id in pm_ids:
                        return True
                except:
                    pass
    
    # Check PGM assignments
    if contract.assigned_pgm_users:
        if isinstance(contract.assigned_pgm_users, list):
            if user_id in contract.assigned_pgm_users:
                return True
        elif isinstance(contract.assigned_pgm_users, str):
            import json
            try:
                pgm_list = json.loads(contract.assigned_pgm_users)
                if isinstance(pgm_list, list) and user_id in pgm_list:
                    return True
            except:
                try:
                    pgm_ids = [int(id_str.strip()) for id_str in contract.assigned_pgm_users.split(',') if id_str.strip().isdigit()]
                    if user_id in pgm_ids:
                        return True
                except:
                    pass
    
    # Check Director assignments
    if contract.assigned_director_users:
        if isinstance(contract.assigned_director_users, list):
            if user_id in contract.assigned_director_users:
                return True
        elif isinstance(contract.assigned_director_users, str):
            import json
            try:
                dir_list = json.loads(contract.assigned_director_users)
                if isinstance(dir_list, list) and user_id in dir_list:
                    return True
            except:
                try:
                    dir_ids = [int(id_str.strip()) for id_str in contract.assigned_director_users.split(',') if id_str.strip().isdigit()]
                    if user_id in dir_ids:
                        return True
                except:
                    pass
    
    return False

def check_permission(user: User, contract_id: int, required_permission: str, db: Session) -> bool:
    """Check if user has required permission for a contract - ONLY if assigned or creator"""
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        return False
    
    is_creator = contract.created_by == user.id
    is_assigned = is_user_assigned_to_contract(user.id, contract, db)
    
    if not is_creator and not is_assigned:
        return False
    
    if user.role == "director" and is_assigned:
        return True
    
    if user.role == "program_manager" and is_assigned:
        if required_permission == "view":
            return contract.status in ["under_review", "reviewed", "approved", "draft"]
        elif required_permission == "review":
            return contract.status == "under_review"
        else:
            return False
    
    if user.role == "project_manager":
        if required_permission in ["view", "upload"]:
            return True
        
        if contract.status == "draft":
            if required_permission in ["edit", "fix_metadata", "submit_review"]:
                return is_creator
        
        elif contract.status == "rejected":
            if required_permission in ["edit", "fix_metadata", "respond_to_comments", "submit_review"]:
                return is_creator
        
        elif contract.status == "under_review":
            if required_permission in ["respond_to_comments"]:
                return is_creator
        
        elif contract.status in ["reviewed", "approved"]:
            if required_permission == "view":
                return True
        
        permission = db.query(ContractPermission).filter(
            ContractPermission.contract_id == contract_id,
            ContractPermission.user_id == user.id,
            ContractPermission.permission_type == required_permission
        ).first()
        
        return permission is not None
    
    permission = db.query(ContractPermission).filter(
        ContractPermission.contract_id == contract_id,
        ContractPermission.user_id == user.id,
        ContractPermission.permission_type == required_permission
    ).first()
    
    return permission is not None

def get_user_permissions_dict(user: User) -> Dict[str, bool]:
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
            "can_view_organizations": False,
            "can_view_grants": True,
            "can_view_approvals": False,
            "can_view_knowledge": True,
            "can_view_help": True,
            "can_submit_for_review": True,
            "can_resubmit_after_changes": True,
            "can_fix_metadata": True,
            "can_respond_to_comments": True,
            "can_view_all_versions": True,
            "can_lock_contract": True,
            "can_view_final_version": True,
            "can_view_reviewer_comments": True,
            "can_view_risk_acceptance": True,
            "can_view_business_sign_off": True,
            "can_view_contract_metadata": True,
            "can_view_complete_history": True
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
            "can_view_help": True,
            "can_submit_for_review": False,
            "can_resubmit_after_changes": False,
            "can_fix_metadata": False,
            "can_respond_to_comments": False,
            "can_view_all_versions": False
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
            "can_view_help": True,
            "can_submit_for_review": True,
            "can_resubmit_after_changes": True,
            "can_fix_metadata": True,
            "can_respond_to_comments": True,
            "can_view_all_versions": True
        }

def log_activity(
    db: Session,
    user_id: int,
    activity_type: str,
    contract_id: Optional[int] = None,
    details: Optional[dict] = None,
    request: Optional[Request] = None
):
    """Log user activity"""
    activity = ActivityLog(
        user_id=user_id,
        activity_type=activity_type,
        contract_id=contract_id,
        details=details or {},
        ip_address=request.client.host if request and request.client else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    
    db.add(activity)
    db.commit()
    return activity

def get_assignment_info(contract_id: int, user_id: int, db: Session) -> Dict[str, Any]:
    """Get assignment information for a user on a contract"""
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        return {}
    
    assignment_info = {
        "role": None,
        "assigned_at": None,
        "assigned_by": None
    }
    
    # Check which role they are assigned to
    if contract.assigned_pm_users and user_id in (contract.assigned_pm_users if isinstance(contract.assigned_pm_users, list) else get_user_ids_from_field(contract.assigned_pm_users)):
        assignment_info["role"] = "project_manager"
    
    if contract.assigned_pgm_users and user_id in (contract.assigned_pgm_users if isinstance(contract.assigned_pgm_users, list) else get_user_ids_from_field(contract.assigned_pgm_users)):
        assignment_info["role"] = "program_manager"
    
    if contract.assigned_director_users and user_id in (contract.assigned_director_users if isinstance(contract.assigned_director_users, list) else get_user_ids_from_field(contract.assigned_director_users)):
        assignment_info["role"] = "director"
    
    return assignment_info
