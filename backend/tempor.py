from app.database import get_db
from app.models import Contract          # 👈 import Contract FIRST
from app.auth_models import User, ActivityLog
from app.auth_utils import get_password_hash

db = next(get_db())
admin = User(
    username="platformadmin",
    email="admin@saple.ai",
    password_hash=get_password_hash("Admin@123"),
    role="platform_admin",
    tenant_id=None,
    is_active=True
)
db.add(admin)
db.commit()
print("Platform admin created!")