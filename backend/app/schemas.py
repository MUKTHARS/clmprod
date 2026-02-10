# app/schemas.py - Add new schemas for project manager actions
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class ContractBase(BaseModel):
    filename: str
    contract_number: Optional[str] = None
    grant_name: Optional[str] = None
    grantor: Optional[str] = None
    grantee: Optional[str] = None
    total_amount: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    purpose: Optional[str] = None
    payment_schedule: Optional[Dict[str, Any]] = None
    terms_conditions: Optional[Dict[str, Any]] = None

class ContractCreate(ContractBase):
    pass

class ContractResponse(ContractBase):
    id: int
    uploaded_at: datetime
    status: str
    version: Optional[int] = 1
    processing_time: Optional[float] = None
    comprehensive_data: Optional[Dict[str, Any]] = None
    chroma_id: Optional[str] = None
    investment_id: Optional[str] = None
    project_id: Optional[str] = None
    grant_id: Optional[str] = None
    extracted_reference_ids: Optional[List[Dict[str, Any]]] = None
    created_by: Optional[int] = None
    
    @property
    def display_id(self) -> str:
        """Get the most relevant display ID"""
        if self.investment_id:
            return f"INV-{self.investment_id}"
        elif self.project_id:
            return f"PRJ-{self.project_id}"
        elif self.grant_id:
            return f"GRANT-{self.grant_id}"
        else:
            return f"CONT-{self.id}"
    
    class Config:
        from_attributes = True

class ExtractionRequest(BaseModel):
    text: str

class ExtractionResponse(BaseModel):
    extracted_data: Dict[str, Any]
    confidence_scores: Dict[str, float]

class ComprehensiveDataResponse(BaseModel):
    contract_id: int
    filename: str
    comprehensive_data: Dict[str, Any]
    basic_data: Dict[str, Any]

# New schemas for project manager actions
class ContractVersionResponse(BaseModel):
    id: int
    contract_id: int
    version_number: int
    created_by: int
    created_at: datetime
    changes_description: Optional[str] = None
    version_type: str
    contract_data: Dict[str, Any]
    creator_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class MetadataUpdateRequest(BaseModel):
    grant_name: Optional[str] = None
    contract_number: Optional[str] = None
    grantor: Optional[str] = None
    grantee: Optional[str] = None
    total_amount: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    purpose: Optional[str] = None
    notes: Optional[str] = None

class RespondToCommentsRequest(BaseModel):
    response: str
    review_comment_id: Optional[int] = None

class SubmitForReviewRequest(BaseModel):
    notes: Optional[str] = None


class ReviewCommentSchema(BaseModel):
    id: int
    contract_id: int
    comment: str
    comment_type: str
    flagged_risk: bool
    flagged_issue: bool
    change_request: Optional[dict] = None
    recommendation: Optional[str] = None
    status: str
    created_at: datetime
    user_name: str
    user_role: str
    
    class Config:
        from_attributes = True


# Add these schemas after existing ones

class AdditionalDocument(BaseModel):
    filename: str
    file_type: str
    description: Optional[str] = None
    uploaded_at: Optional[datetime] = None
    uploaded_by: Optional[int] = None

class AgreementMetadata(BaseModel):
    agreement_type: Optional[str] = None
    effective_date: Optional[str] = None
    renewal_date: Optional[str] = None
    termination_date: Optional[str] = None
    jurisdiction: Optional[str] = None
    governing_law: Optional[str] = None
    special_conditions: Optional[Dict[str, Any]] = None

class AssignUsersRequest(BaseModel):
    pm_users: Optional[List[int]] = []  # Project Manager IDs
    pgm_users: Optional[List[int]] = []  # Program Manager IDs
    director_users: Optional[List[int]] = []  # Director IDs

class UpdateDraftRequest(BaseModel):
    grant_name: Optional[str] = None
    contract_number: Optional[str] = None
    grantor: Optional[str] = None
    grantee: Optional[str] = None
    total_amount: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    purpose: Optional[str] = None
    notes: Optional[str] = None
    agreement_metadata: Optional[AgreementMetadata] = None
    assigned_users: Optional[AssignUsersRequest] = None

    
class PublishAgreementRequest(BaseModel):
    notes: Optional[str] = None
    publish_to_review: bool = True
    publish_directly: bool = False  
    direct_publish_status: Optional[str] = "published" 
    class Config:
        from_attributes = True

class ContractResponseEnhanced(ContractResponse):
    # Add new fields to response
    assigned_pm_users: Optional[List[int]] = []
    assigned_pgm_users: Optional[List[int]] = []
    assigned_director_users: Optional[List[int]] = []
    additional_documents: Optional[List[Dict[str, Any]]] = []
    notes: Optional[str] = None
    agreement_type: Optional[str] = None
    effective_date: Optional[str] = None
    renewal_date: Optional[str] = None
    jurisdiction: Optional[str] = None
    governing_law: Optional[str] = None
    special_conditions: Optional[Dict[str, Any]] = None
    last_edited_by: Optional[int] = None
    last_edited_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    published_by: Optional[int] = None
    
    class Config:
        from_attributes = True

class ArchiveRequest(BaseModel):
    reason: str
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True

class ArchiveResponse(BaseModel):
    message: str
    contract_id: int
    status: str
    archived_at: Optional[str] = None
    version_number: Optional[int] = None
    
    class Config:
        from_attributes = True