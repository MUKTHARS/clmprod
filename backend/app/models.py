# app/models.py - Update with ContractVersion model
from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, UniqueConstraint
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
    
    # Workflow fields - FIXED: Ensure ForeignKey is correct
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Version control
    version = Column(Integer, default=1)
    
    review_comments = Column(Text)

    assigned_pm_users = Column(JSONB, default=list)  # List of project manager IDs
    assigned_pgm_users = Column(JSONB, default=list)  # List of program manager IDs
    assigned_director_users = Column(JSONB, default=list)  # List of director IDs
    
    # Additional documents storage
    additional_documents = Column(JSONB, default=list)  # List of document metadata
    notes = Column(Text, nullable=True)  # General notes for the agreement
    
    # Agreement metadata
    agreement_type = Column(String, nullable=True)  # Type of agreement
    effective_date = Column(String, nullable=True)
    renewal_date = Column(String, nullable=True)
    termination_date = Column(String, nullable=True)
    jurisdiction = Column(String, nullable=True)
    governing_law = Column(String, nullable=True)
    special_conditions = Column(JSONB, nullable=True)
    
    # Audit fields
    last_edited_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    last_edited_at = Column(DateTime(timezone=True), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    published_by = Column(Integer, ForeignKey("users.id"), nullable=True)

class ContractVersion(Base):
    __tablename__ = "contract_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Store the entire contract state at this version
    contract_data = Column(JSONB, nullable=False)
    changes_description = Column(Text)
    version_type = Column(String, default="metadata_update")
    
    # Relationships
    contract = relationship("Contract", foreign_keys=[contract_id])
    creator = relationship("User", foreign_keys=[created_by])
    
    # Unique constraint for contract and version
    __table_args__ = (UniqueConstraint('contract_id', 'version_number', name='uq_contract_version'),)

class ExtractionLog(Base):
    __tablename__ = "extraction_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, index=True)
    extraction_type = Column(String)
    field_name = Column(String)
    extracted_value = Column(Text)
    confidence_score = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())