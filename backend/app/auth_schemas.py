from pydantic import BaseModel, EmailStr
from typing import Optional
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