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
    processing_time: Optional[float] = None
    comprehensive_data: Optional[Dict[str, Any]] = None  # Add this line
    chroma_id: Optional[str] = None  # Add this line
    investment_id: Optional[str] = None
    project_id: Optional[str] = None
    grant_id: Optional[str] = None
    extracted_reference_ids: Optional[List[Dict[str, Any]]] = None
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