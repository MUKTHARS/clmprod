# C:\saple.ai\POC\backend\app\deliverable_models.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Date, LargeBinary
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class ContractDeliverable(Base):
    __tablename__ = "contract_deliverables"
    
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    deliverable_name = Column(String(255), nullable=False)
    description = Column(Text)
    due_date = Column(Date)
    status = Column(String(50), default="pending")
    
    # File storage - store S3 URL or file data
    uploaded_file_path = Column(Text)  # S3 URL or 'database_stored:{id}'
    uploaded_file_name = Column(String(500))
    uploaded_at = Column(DateTime(timezone=True))
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    upload_notes = Column(Text)
    
    # Store file data directly in database (as fallback)
    file_data = Column(JSONB, nullable=True)  # For base64 encoded files when S3 fails
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    contract = relationship("Contract", backref="deliverables")
    uploader = relationship("User", foreign_keys=[uploaded_by])
    
    def to_dict(self):
        return {
            "id": self.id,
            "contract_id": self.contract_id,
            "deliverable_name": self.deliverable_name,
            "description": self.description,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "status": self.status,
            "uploaded_file_path": self.uploaded_file_path,
            "uploaded_file_name": self.uploaded_file_name,
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None,
            "uploaded_by": self.uploaded_by,
            "upload_notes": self.upload_notes,
            "has_file_data": self.file_data is not None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
