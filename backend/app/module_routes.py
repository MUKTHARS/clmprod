from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth_utils import get_current_user
from app.models import TenantModule
from pydantic import BaseModel

router = APIRouter(prefix="/api/modules", tags=["Modules"])

class ModuleUpdateRequest(BaseModel):
    modules: dict  # { "grant_tracking": true, ... }

@router.get("/my")
def get_my_modules(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    modules = db.query(TenantModule).filter(
        TenantModule.tenant_id == current_user.tenant_id,
        TenantModule.is_enabled == True
    ).all()

    return {"modules": [m.module_key for m in modules]}

@router.post("/configure")
def configure_modules(
    payload: ModuleUpdateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    tenant_id = current_user.tenant_id

    for key, value in payload.modules.items():
        existing = db.query(TenantModule).filter(
            TenantModule.tenant_id == tenant_id,
            TenantModule.module_key == key
        ).first()

        if existing:
            existing.is_enabled = value
        else:
            db.add(TenantModule(
                tenant_id=tenant_id,
                module_key=key,
                is_enabled=value
            ))

    db.commit()

    return {"message": "Modules configured successfully"}