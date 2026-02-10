# C:\saple.ai\POC\backend\app\auth_schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    user_type: str = "internal"
    role: str = "project_manager"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    user_type: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class PermissionRequest(BaseModel):
    contract_id: int
    user_id: int
    permission_type: str

class ActivityLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    activity_type: str
    contract_id: Optional[int]
    details: Optional[dict]
    created_at: datetime
    user_name: Optional[str]
    
    class Config:
        from_attributes = True

class ReviewCommentBase(BaseModel):
    contract_id: int
    comment: str
    comment_type: str
    flagged_risk: Optional[bool] = False
    flagged_issue: Optional[bool] = False
    change_request: Optional[dict] = None
    recommendation: Optional[str] = None

class ReviewCommentCreate(ReviewCommentBase):
    pass

class ReviewCommentResponse(ReviewCommentBase):
    id: int
    user_id: int
    user_name: Optional[str] = None
    status: str
    created_at: datetime
    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    resolution_response: Optional[str] = None
    
    class Config:
        from_attributes = True

class ReviewSummaryRequest(BaseModel):
    contract_id: int
    review_summary: str
    overall_recommendation: str  # 'approve', 'reject', 'modify'
    change_requests: Optional[list] = []
    key_issues: Optional[list] = []
    risk_assessment: Optional[dict] = {}

class ContractReviewRequest(BaseModel):
    contract_id: int
    review_summary: str
    overall_recommendation: str
    comments: Optional[List[ReviewCommentCreate]] = []
    change_requests: Optional[List[dict]] = []
    key_issues: Optional[List[str]] = []
    risk_assessment: Optional[dict] = {}

# Module schemas
class ModuleBase(BaseModel):
    name: str
    description: Optional[str] = None

class ModuleCreate(ModuleBase):
    pass

class ModuleResponse(ModuleBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Role permission schemas
class RolePermissionBase(BaseModel):
    role: str
    module_id: int
    permission: str

class RolePermissionCreate(RolePermissionBase):
    pass

class RolePermissionResponse(RolePermissionBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    per_page: int


