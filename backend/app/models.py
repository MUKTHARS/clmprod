from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database import Base

class Contract(Base):
    __tablename__ = "contracts"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Reference IDs
    investment_id = Column(String, nullable=True)
    project_id = Column(String, nullable=True)
    grant_id = Column(String, nullable=True)
    extracted_reference_ids = Column(JSONB, nullable=True, default=list)
    
    # Basic extracted data
    contract_number = Column(String, nullable=True)
    grant_name = Column(String, nullable=True)
    grantor = Column(String, nullable=True)
    grantee = Column(String, nullable=True)
    total_amount = Column(Float, nullable=True)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    purpose = Column(Text, nullable=True)
    payment_schedule = Column(JSONB, nullable=True)
    terms_conditions = Column(JSONB, nullable=True)
    
    # Comprehensive data
    comprehensive_data = Column(JSONB, nullable=True)
    
    # Raw text
    full_text = Column(Text, nullable=True)
    
    # Metadata
    status = Column(String, default="draft")
    processing_time = Column(Float, nullable=True)
    
    # ChromaDB reference
    chroma_id = Column(String, nullable=True)
    
    # Workflow fields - ADD THIS LINE
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # <-- ADD THIS
    
    review_comments = Column(Text)


class ExtractionLog(Base):
    __tablename__ = "extraction_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, index=True)
    extraction_type = Column(String)
    field_name = Column(String)
    extracted_value = Column(Text)
    confidence_score = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())