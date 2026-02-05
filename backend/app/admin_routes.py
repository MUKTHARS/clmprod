# C:\saple.ai\POC\backend\app\admin_routes.py
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime

from app.database import get_db
from app.auth_models import User, Module, RolePermission
from app.auth_schemas import (
    UserCreate, UserResponse, UserUpdate, UserListResponse,
    ModuleCreate, ModuleResponse,
    RolePermissionCreate, RolePermissionResponse
)
from app.auth_utils import get_current_user, get_password_hash

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Helper function to check if user is super admin
def check_super_admin(user: User):
    if user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can perform this action"
        )

# User Management Endpoints
@router.get("/users", response_model=UserListResponse)
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    role: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users (Super Admin only)"""
    check_super_admin(current_user)
    
    query = db.query(User)
    
    # Apply filters
    if search:
        search_filter = or_(
            User.username.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%"),
            User.first_name.ilike(f"%{search}%"),
            User.last_name.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    if role:
        query = query.filter(User.role == role)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "users": users,
        "total": total,
        "page": (skip // limit) + 1,
        "per_page": limit
    }

@router.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new user (Super Admin only)"""
    check_super_admin(current_user)
    
    # Check if user exists
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists"
        )
    
    # Create new user
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
    
    return db_user

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user details (Super Admin only)"""
    check_super_admin(current_user)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user (Super Admin only)"""
    check_super_admin(current_user)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent super admin from modifying their own role or deactivating themselves
    if user.id == current_user.id:
        if user_data.role and user_data.role != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change your own role"
            )
        if user_data.is_active is not None and not user_data.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate your own account"
            )
    
    # Update fields
    update_fields = user_data.dict(exclude_unset=True)
    for field, value in update_fields.items():
        if field == "password" and value:  # Only update password if provided
            user.password_hash = get_password_hash(value)
        elif field == "email" and value:
            # Check if email is already taken by another user
            existing = db.query(User).filter(
                User.email == value,
                User.id != user_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already taken by another user"
                )
            user.email = value
        elif field == "username" and value:
            # Check if username is already taken by another user
            existing = db.query(User).filter(
                User.username == value,
                User.id != user_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken by another user"
                )
            user.username = value
        elif field != "password":  # Skip password field if not provided
            setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user (Super Admin only)"""
    check_super_admin(current_user)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-deletion
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

@router.put("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle user active status (Super Admin only)"""
    check_super_admin(current_user)
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deactivating self
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    user.is_active = not user.is_active
    db.commit()
    
    return {
        "message": f"User {'activated' if user.is_active else 'deactivated'}",
        "is_active": user.is_active
    }

# Module Management Endpoints
@router.get("/modules", response_model=List[ModuleResponse])
async def get_modules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all modules (Super Admin only)"""
    check_super_admin(current_user)
    
    modules = db.query(Module).filter(Module.is_active == True).all()
    return modules

@router.post("/modules", response_model=ModuleResponse)
async def create_module(
    module_data: ModuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new module (Super Admin only)"""
    check_super_admin(current_user)
    
    existing_module = db.query(Module).filter(Module.name == module_data.name).first()
    if existing_module:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Module with this name already exists"
        )
    
    db_module = Module(
        name=module_data.name,
        description=module_data.description,
        created_by=current_user.id
    )
    
    db.add(db_module)
    db.commit()
    db.refresh(db_module)
    
    return db_module

# Role Permission Management Endpoints
@router.get("/roles/{role}/permissions", response_model=List[RolePermissionResponse])
async def get_role_permissions(
    role: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get permissions for a specific role (Super Admin only)"""
    check_super_admin(current_user)
    
    permissions = db.query(RolePermission).filter(RolePermission.role == role).all()
    return permissions

@router.post("/roles/permissions", response_model=RolePermissionResponse)
async def create_role_permission(
    permission_data: RolePermissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create role permission (Super Admin only)"""
    check_super_admin(current_user)
    
    # Check if module exists
    module = db.query(Module).filter(Module.id == permission_data.module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Check if permission already exists
    existing = db.query(RolePermission).filter(
        RolePermission.role == permission_data.role,
        RolePermission.module_id == permission_data.module_id,
        RolePermission.permission == permission_data.permission
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permission already exists for this role and module"
        )
    
    db_permission = RolePermission(
        role=permission_data.role,
        module_id=permission_data.module_id,
        permission=permission_data.permission,
        created_by=current_user.id
    )
    
    db.add(db_permission)
    db.commit()
    db.refresh(db_permission)
    
    return db_permission

@router.delete("/roles/permissions/{permission_id}")
async def delete_role_permission(
    permission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete role permission (Super Admin only)"""
    check_super_admin(current_user)
    
    permission = db.query(RolePermission).filter(RolePermission.id == permission_id).first()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    db.delete(permission)
    db.commit()
    
    return {"message": "Permission deleted successfully"}



# # C:\saple.ai\POC\backend\app\admin_routes.py
# from typing import List, Optional
# from fastapi import APIRouter, Depends, HTTPException, status, Query
# from sqlalchemy.orm import Session
# from sqlalchemy import or_
# from datetime import datetime

# from app.database import get_db
# from app.auth_models import User, Module, RolePermission
# from app.auth_schemas import (
#     UserCreate, UserResponse, UserUpdate, UserListResponse,
#     ModuleCreate, ModuleResponse,
#     RolePermissionCreate, RolePermissionResponse
# )
# from app.auth_utils import get_current_user, get_password_hash

# router = APIRouter(prefix="/api/admin", tags=["admin"])

# # Helper function to check if user is super admin
# def check_super_admin(user: User):
#     if user.role != "super_admin":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only super admins can perform this action"
#         )

# # User Management Endpoints
# @router.get("/users", response_model=UserListResponse)
# async def get_all_users(
#     skip: int = Query(0, ge=0),
#     limit: int = Query(100, ge=1, le=1000),
#     search: Optional[str] = None,
#     role: Optional[str] = None,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get all users (Super Admin only)"""
#     check_super_admin(current_user)
    
#     query = db.query(User)
    
#     # Apply filters
#     if search:
#         search_filter = or_(
#             User.username.ilike(f"%{search}%"),
#             User.email.ilike(f"%{search}%"),
#             User.first_name.ilike(f"%{search}%"),
#             User.last_name.ilike(f"%{search}%")
#         )
#         query = query.filter(search_filter)
    
#     if role:
#         query = query.filter(User.role == role)
    
#     # Get total count
#     total = query.count()
    
#     # Apply pagination
#     users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    
#     return {
#         "users": users,
#         "total": total,
#         "page": (skip // limit) + 1,
#         "per_page": limit
#     }

# @router.post("/users", response_model=UserResponse)
# async def create_user(
#     user_data: UserCreate,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Create a new user (Super Admin only)"""
#     check_super_admin(current_user)
    
#     # Check if user exists
#     existing_user = db.query(User).filter(
#         (User.username == user_data.username) | (User.email == user_data.email)
#     ).first()
    
#     if existing_user:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Username or email already exists"
#         )
    
#     # Create new user
#     db_user = User(
#         username=user_data.username,
#         email=user_data.email,
#         password_hash=get_password_hash(user_data.password),
#         first_name=user_data.first_name,
#         last_name=user_data.last_name,
#         company=user_data.company,
#         phone=user_data.phone,
#         department=user_data.department,
#         user_type=user_data.user_type,
#         role=user_data.role,
#         is_active=True
#     )
    
#     db.add(db_user)
#     db.commit()
#     db.refresh(db_user)
    
#     return db_user

# @router.get("/users/{user_id}", response_model=UserResponse)
# async def get_user(
#     user_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get user details (Super Admin only)"""
#     check_super_admin(current_user)
    
#     user = db.query(User).filter(User.id == user_id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
    
#     return user

# @router.put("/users/{user_id}", response_model=UserResponse)
# async def update_user(
#     user_id: int,
#     user_data: UserUpdate,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Update user (Super Admin only)"""
#     check_super_admin(current_user)
    
#     user = db.query(User).filter(User.id == user_id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
    
#     # Prevent super admin from modifying their own role
#     if user.id == current_user.id and user_data.role and user_data.role != "super_admin":
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Cannot change your own role"
#         )
    
#     # Update fields
#     update_fields = user_data.dict(exclude_unset=True)
#     for field, value in update_fields.items():
#         if field == "password":
#             user.password_hash = get_password_hash(value)
#         else:
#             setattr(user, field, value)
    
#     db.commit()
#     db.refresh(user)
    
#     return user

# @router.delete("/users/{user_id}")
# async def delete_user(
#     user_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Delete user (Super Admin only)"""
#     check_super_admin(current_user)
    
#     user = db.query(User).filter(User.id == user_id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
    
#     # Prevent self-deletion
#     if user.id == current_user.id:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Cannot delete your own account"
#         )
    
#     db.delete(user)
#     db.commit()
    
#     return {"message": "User deleted successfully"}

# @router.put("/users/{user_id}/toggle-active")
# async def toggle_user_active(
#     user_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Toggle user active status (Super Admin only)"""
#     check_super_admin(current_user)
    
#     user = db.query(User).filter(User.id == user_id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
    
#     # Prevent deactivating self
#     if user.id == current_user.id:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Cannot deactivate your own account"
#         )
    
#     user.is_active = not user.is_active
#     db.commit()
    
#     return {
#         "message": f"User {'activated' if user.is_active else 'deactivated'}",
#         "is_active": user.is_active
#     }

# # Module Management Endpoints
# @router.get("/modules", response_model=List[ModuleResponse])
# async def get_modules(
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get all modules (Super Admin only)"""
#     check_super_admin(current_user)
    
#     modules = db.query(Module).filter(Module.is_active == True).all()
#     return modules

# @router.post("/modules", response_model=ModuleResponse)
# async def create_module(
#     module_data: ModuleCreate,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Create a new module (Super Admin only)"""
#     check_super_admin(current_user)
    
#     existing_module = db.query(Module).filter(Module.name == module_data.name).first()
#     if existing_module:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Module with this name already exists"
#         )
    
#     db_module = Module(
#         name=module_data.name,
#         description=module_data.description,
#         created_by=current_user.id
#     )
    
#     db.add(db_module)
#     db.commit()
#     db.refresh(db_module)
    
#     return db_module

# # Role Permission Management Endpoints
# @router.get("/roles/{role}/permissions", response_model=List[RolePermissionResponse])
# async def get_role_permissions(
#     role: str,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get permissions for a specific role (Super Admin only)"""
#     check_super_admin(current_user)
    
#     permissions = db.query(RolePermission).filter(RolePermission.role == role).all()
#     return permissions

# @router.post("/roles/permissions", response_model=RolePermissionResponse)
# async def create_role_permission(
#     permission_data: RolePermissionCreate,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Create role permission (Super Admin only)"""
#     check_super_admin(current_user)
    
#     # Check if module exists
#     module = db.query(Module).filter(Module.id == permission_data.module_id).first()
#     if not module:
#         raise HTTPException(status_code=404, detail="Module not found")
    
#     # Check if permission already exists
#     existing = db.query(RolePermission).filter(
#         RolePermission.role == permission_data.role,
#         RolePermission.module_id == permission_data.module_id,
#         RolePermission.permission == permission_data.permission
#     ).first()
    
#     if existing:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Permission already exists for this role and module"
#         )
    
#     db_permission = RolePermission(
#         role=permission_data.role,
#         module_id=permission_data.module_id,
#         permission=permission_data.permission,
#         created_by=current_user.id
#     )
    
#     db.add(db_permission)
#     db.commit()
#     db.refresh(db_permission)
    
#     return db_permission

# @router.delete("/roles/permissions/{permission_id}")
# async def delete_role_permission(
#     permission_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Delete role permission (Super Admin only)"""
#     check_super_admin(current_user)
    
#     permission = db.query(RolePermission).filter(RolePermission.id == permission_id).first()
#     if not permission:
#         raise HTTPException(status_code=404, detail="Permission not found")
    
#     db.delete(permission)
#     db.commit()
    
#     return {"message": "Permission deleted successfully"}