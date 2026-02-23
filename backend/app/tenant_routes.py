from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from uuid import uuid4
from datetime import datetime
from typing import Any, Dict

from app.database import get_db
from app.models import Tenant
from app.auth_models import User
from app.auth_utils import get_current_user, get_password_hash, create_access_token
from app.schemas import CreateTenantRequest, InviteUserRequest
import secrets

router = APIRouter(prefix="/api/tenants", tags=["tenants"])

@router.post("/create")
def create_tenant(
    payload: CreateTenantRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "platform_admin":
        raise HTTPException(status_code=403, detail="Platform admins only")

    name = payload.organization_name
    domain = payload.domain
    admin_name = payload.admin_name
    admin_email = payload.admin_email
    password = payload.password
    hashed_password = get_password_hash(password)
    if not name or not admin_email:
        raise HTTPException(status_code=400, detail="Missing required fields")

    existing_tenant = db.query(Tenant).filter(
        Tenant.domain == domain
    ).first()

    if existing_tenant:
        raise HTTPException(
            status_code=400,
            detail="Workspace domain already exists"
        )

    # Create tenant
    tenant = Tenant(
        id=uuid4(),
        name=name,
        domain=domain,
        created_at=datetime.utcnow()
    )

    db.add(tenant)
    db.flush()

    # Create admin user for tenant
    admin_user = User(
        username=admin_email,
        email=admin_email,
        password_hash=hashed_password,
        full_name=admin_name,
        role="super_admin",
        tenant_id=tenant.id,
        is_active=True
    )

    db.add(admin_user)
    db.commit()

    # Generate JWT for newly created admin
    access_token = create_access_token(
        data={
            "sub": admin_email,
            "tenant_id": str(tenant.id),
            "role": "super_admin"
        }
    )

    return {
        "message": "Tenant created successfully",
        "tenant_id": str(tenant.id),
        "access_token": access_token,
        "user": {
            "email": admin_email,
            "role": "super_admin",
            "tenant_id": str(tenant.id),
            "full_name": admin_name
        }
    }

@router.post("/setup-complete")
def complete_setup(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admins can complete setup")

    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    tenant.setup_completed = True
    db.commit()

    return {"message": "Setup completed successfully"}

# GET all tenants - platform admin only
@router.get("")
def get_all_tenants(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "platform_admin":
        raise HTTPException(status_code=403, detail="Platform admins only")

    tenants = db.query(Tenant).all()
    result = []
    for tenant in tenants:
        # Get admin user for this tenant
        admin = db.query(User).filter(
            User.tenant_id == tenant.id,
            User.role == "super_admin"
        ).first()

        result.append({
            "id": str(tenant.id),
            "name": tenant.name,
            "domain": tenant.domain,
            "admin_email": admin.email if admin else None,
            "setup_completed": tenant.setup_completed or False,
            "is_active": tenant.is_active if hasattr(tenant, 'is_active') else True,
            "created_at": tenant.created_at.isoformat() if tenant.created_at else None,
        })

    return {"tenants": result}


# Toggle tenant active status
@router.post("/{tenant_id}/toggle")
def toggle_tenant(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "platform_admin":
        raise HTTPException(status_code=403, detail="Platform admins only")

    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    tenant.is_active = not getattr(tenant, 'is_active', True)
    db.commit()

    return {"message": "Tenant status updated", "is_active": tenant.is_active}


# ── SETUP WIZARD ENDPOINTS ────────────────────────────────────────────────────

@router.post("/invite")
def invite_user(
    payload: InviteUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admins only")

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    temp_password = secrets.token_urlsafe(10)
    new_user = User(
        username=payload.email,
        email=payload.email,
        password_hash=get_password_hash(temp_password),
        full_name=payload.full_name or payload.email.split("@")[0],
        role=payload.role,
        tenant_id=current_user.tenant_id,
        is_active=True,
        invitation_status="pending",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User invited successfully",
        "user_id": new_user.id,
        "email": payload.email,
        "role": payload.role,
        "temp_password": temp_password,
    }


@router.get("/users")
def get_tenant_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admins only")

    users = db.query(User).filter(
        User.tenant_id == current_user.tenant_id,
        User.role != "super_admin",
    ).all()

    def fmt(u):
        return {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name or u.email.split("@")[0],
            "role": u.role,
            "last_login": u.last_login.isoformat() if u.last_login else None,
            "invitation_status": u.invitation_status or "active",
        }

    pending = [fmt(u) for u in users if not u.last_login]
    active  = [fmt(u) for u in users if u.last_login]
    return {"pending": pending, "active": active}


@router.delete("/users/{user_id}")
def delete_tenant_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admins only")

    user = db.query(User).filter(
        User.id == user_id,
        User.tenant_id == current_user.tenant_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": "User removed"}


@router.post("/workflow-config")
def save_workflow_config(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admins only")

    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    tenant.workflow_config = payload
    db.commit()
    return {"message": "Workflow config saved"}


@router.post("/ai-config")
def save_ai_config(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admins only")

    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    tenant.ai_config = payload
    db.commit()
    return {"message": "AI config saved"}