# C:\saple.ai\POC\backend\app\auth_models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    
    # New fields for super admin functionality
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    company = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    department = Column(String, nullable=True)
    user_type = Column(String, default="internal")  # internal, external
    
    # Backward compatible fields - keep existing
    full_name = Column(String, nullable=True)  # Keep for backward compatibility
    role = Column(String, nullable=False, default="project_manager")  # super_admin, director, program_manager, project_manager
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)

class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_token = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    ip_address = Column(String)
    user_agent = Column(Text)
    
    user = relationship("User")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    activity_type = Column(String, nullable=False)
    contract_id = Column(Integer, ForeignKey("contracts.id"))
    details = Column(JSONB)
    ip_address = Column(String)
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")
    contract = relationship("Contract")

class ContractPermission(Base):
    __tablename__ = "contract_permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    permission_type = Column(String, nullable=False)
    granted_at = Column(DateTime(timezone=True), server_default=func.now())
    granted_by = Column(Integer, ForeignKey("users.id"))
    
    contract = relationship("Contract")
    user = relationship("User", foreign_keys=[user_id])
    granter = relationship("User", foreign_keys=[granted_by])

class ReviewComment(Base):
    __tablename__ = "review_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    comment_type = Column(String, nullable=False)  # 'review', 'risk', 'issue', 'change_request'
    comment = Column(Text, nullable=False)
    status = Column(String, default="open")  # 'open', 'resolved', 'closed'
    flagged_risk = Column(Boolean, default=False)
    flagged_issue = Column(Boolean, default=False)
    change_request = Column(JSONB, nullable=True)
    recommendation = Column(String)  # 'approve', 'reject', 'modify'
    resolution_response = Column(Text)
    resolved_by = Column(Integer, ForeignKey("users.id"))
    resolved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    contract = relationship("Contract")
    user = relationship("User", foreign_keys=[user_id])
    resolver = relationship("User", foreign_keys=[resolved_by])

# New tables for super admin functionality
class Module(Base):
    __tablename__ = "modules"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))
    
    creator = relationship("User", foreign_keys=[created_by])

class RolePermission(Base):
    __tablename__ = "role_permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, nullable=False)  # super_admin, director, program_manager, project_manager
    module_id = Column(Integer, ForeignKey("modules.id"))
    permission = Column(String, nullable=False)  # create, read, update, delete, all
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))
    
    module = relationship("Module")
    creator = relationship("User", foreign_keys=[created_by])
    
    __table_args__ = (UniqueConstraint('role', 'module_id', 'permission', name='uq_role_module_permission'),)

# from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
# from sqlalchemy.sql import func
# from sqlalchemy.orm import relationship
# from sqlalchemy.dialects.postgresql import JSONB
# from app.database import Base

# class User(Base):
#     __tablename__ = "users"
    
#     id = Column(Integer, primary_key=True, index=True)
#     username = Column(String, unique=True, nullable=False)
#     email = Column(String, unique=True, nullable=False)
#     password_hash = Column(String, nullable=False)
#     full_name = Column(String)
#     role = Column(String, nullable=False, default="project_manager")
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     last_login = Column(DateTime(timezone=True))
#     is_active = Column(Boolean, default=True)
#     department = Column(String)
#     phone = Column(String)

# class UserSession(Base):
#     __tablename__ = "user_sessions"
    
#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
#     session_token = Column(String, unique=True, nullable=False)
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     expires_at = Column(DateTime(timezone=True), nullable=False)
#     ip_address = Column(String)
#     user_agent = Column(Text)
    
#     user = relationship("User")

# class ActivityLog(Base):
#     __tablename__ = "activity_logs"
    
#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id"))
#     activity_type = Column(String, nullable=False)
#     contract_id = Column(Integer, ForeignKey("contracts.id"))
#     details = Column(JSONB)
#     ip_address = Column(String)
#     user_agent = Column(Text)
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
    
#     user = relationship("User")
#     contract = relationship("Contract")

# class ContractPermission(Base):
#     __tablename__ = "contract_permissions"
    
#     id = Column(Integer, primary_key=True, index=True)
#     contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
#     user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
#     permission_type = Column(String, nullable=False)
#     granted_at = Column(DateTime(timezone=True), server_default=func.now())
#     granted_by = Column(Integer, ForeignKey("users.id"))
    
#     contract = relationship("Contract")
#     user = relationship("User", foreign_keys=[user_id])
#     granter = relationship("User", foreign_keys=[granted_by])


# class ReviewComment(Base):
#     __tablename__ = "review_comments"
    
#     id = Column(Integer, primary_key=True, index=True)
#     contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
#     user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
#     comment_type = Column(String, nullable=False)  # 'review', 'risk', 'issue', 'change_request'
#     comment = Column(Text, nullable=False)
#     status = Column(String, default="open")  # 'open', 'resolved', 'closed'
#     flagged_risk = Column(Boolean, default=False)
#     flagged_issue = Column(Boolean, default=False)
#     change_request = Column(JSONB, nullable=True)
#     recommendation = Column(String)  # 'approve', 'reject', 'modify'
#     resolution_response = Column(Text)
#     resolved_by = Column(Integer, ForeignKey("users.id"))
#     resolved_at = Column(DateTime(timezone=True))
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
    
#     contract = relationship("Contract")
#     user = relationship("User", foreign_keys=[user_id])
#     resolver = relationship("User", foreign_keys=[resolved_by])    