from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class DeliverableResponse(BaseModel):
    id: int
    contract_id: int
    deliverable_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: str = "pending"
    
    uploaded_file_path: Optional[str] = None
    uploaded_file_name: Optional[str] = None
    uploaded_at: Optional[datetime] = None
    uploaded_by: Optional[int] = None
    upload_notes: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True