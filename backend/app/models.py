from sqlalchemy import Column, Integer, String, DateTime, Text, Float
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base

class Contract(Base):
    __tablename__ = "contracts"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Extracted data
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
    
    # Raw text (No embedding column - stored separately in ChromaDB)
    full_text = Column(Text, nullable=True)
    
    # Metadata
    status = Column(String, default="processed")
    processing_time = Column(Float, nullable=True)
    
    # ChromaDB reference (optional)
    chroma_id = Column(String, nullable=True)

class ExtractionLog(Base):
    __tablename__ = "extraction_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, index=True)
    extraction_type = Column(String)
    field_name = Column(String)
    extracted_value = Column(Text)
    confidence_score = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())