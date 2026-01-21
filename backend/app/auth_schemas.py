from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "project_manager"
    department: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

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