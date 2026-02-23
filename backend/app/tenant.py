from fastapi import Depends
from uuid import UUID
from app.auth_utils import get_current_user
from app.auth_models import User

def get_current_tenant_id(
    current_user: User = Depends(get_current_user)
) -> UUID:
    if not current_user.tenant_id:
        raise Exception("User does not belong to a tenant")
    return current_user.tenant_id