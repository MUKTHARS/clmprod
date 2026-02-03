import os
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
import uuid

from app.database import get_db
from app.auth_models import User
from app.auth_utils import get_current_user
from app.models import Contract

router = APIRouter(prefix="/api/deliverables", tags=["deliverables"])

# Simple file upload endpoint without database dependencies
@router.post("/upload")
async def upload_deliverable_file(
    contract_id: int = Form(...),
    deliverable_name: str = Form(...),
    file: UploadFile = File(...),
    upload_date: str = Form(...),
    upload_notes: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Simple file upload for deliverables
    """
    try:
        # Validate contract exists
        contract = db.query(Contract).filter(Contract.id == contract_id).first()
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        # Check permission
        if contract.created_by != current_user.id and current_user.role != "director":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the contract creator can upload deliverable files"
            )
        
        # Validate file
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Read file content
        file_content = await file.read()
        
        # Create uploads directory if it doesn't exist
        upload_dir = "uploads/deliverables"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        filename = f"{uuid.uuid4().hex}_{file.filename}"
        file_path = os.path.join(upload_dir, filename)
        
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        return {
            "success": True,
            "message": "File uploaded successfully",
            "contract_id": contract_id,
            "deliverable_name": deliverable_name,
            "filename": file.filename,
            "upload_date": upload_date,
            "file_path": file_path,
            "file_size": len(file_content)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")