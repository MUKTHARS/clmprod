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

        
# import os
# from datetime import datetime
# from typing import List, Optional
# from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
# from sqlalchemy.orm import Session
# import shutil
# import uuid

# from app.database import get_db
# from app.auth_models import User
# from app.auth_utils import get_current_user
# from app.deliverable_models import ContractDeliverable
# from app.deliverable_schemas import (
#     DeliverableCreate, 
#     DeliverableUpdate, 
#     DeliverableResponse,
#     DeliverableUploadRequest,
#     DeliverableStatus
# )
# from app.models import Contract
# from app.s3_service import s3_service
# from app.config import settings

# router = APIRouter(prefix="/api/deliverables", tags=["deliverables"])

# # Local file storage configuration
# UPLOAD_DIR = "uploads/deliverables"
# os.makedirs(UPLOAD_DIR, exist_ok=True)

# @router.get("/contract/{contract_id}", response_model=List[DeliverableResponse])
# async def get_contract_deliverables(
#     contract_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Get all deliverables for a specific contract
#     """
#     # Check if user has permission to view this contract
#     from app.main import check_permission
#     if not check_permission(current_user, contract_id, "view", db):
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="You don't have permission to view this contract's deliverables"
#         )
    
#     deliverables = db.query(ContractDeliverable).filter(
#         ContractDeliverable.contract_id == contract_id
#     ).order_by(ContractDeliverable.due_date).all()
    
#     return deliverables

# @router.post("/", response_model=DeliverableResponse)
# async def create_deliverable(
#     deliverable_data: DeliverableCreate,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Create a new deliverable for a contract
#     """
#     # Check if user has permission to manage deliverables for this contract
#     from app.main import check_permission
#     if not check_permission(current_user, deliverable_data.contract_id, "edit", db):
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="You don't have permission to create deliverables for this contract"
#         )
    
#     # Verify contract exists
#     contract = db.query(Contract).filter(Contract.id == deliverable_data.contract_id).first()
#     if not contract:
#         raise HTTPException(status_code=404, detail="Contract not found")
    
#     # Check if deliverable with same name already exists for this contract
#     existing = db.query(ContractDeliverable).filter(
#         ContractDeliverable.contract_id == deliverable_data.contract_id,
#         ContractDeliverable.deliverable_name == deliverable_data.deliverable_name
#     ).first()
    
#     if existing:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Deliverable with this name already exists for this contract"
#         )
    
#     # Create deliverable
#     deliverable = ContractDeliverable(
#         contract_id=deliverable_data.contract_id,
#         deliverable_name=deliverable_data.deliverable_name,
#         description=deliverable_data.description,
#         due_date=deliverable_data.due_date,
#         status=deliverable_data.status.value
#     )
    
#     db.add(deliverable)
#     db.commit()
#     db.refresh(deliverable)
    
#     return deliverable

# @router.put("/{deliverable_id}", response_model=DeliverableResponse)
# async def update_deliverable(
#     deliverable_id: int,
#     deliverable_data: DeliverableUpdate,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Update deliverable information
#     """
#     deliverable = db.query(ContractDeliverable).filter(
#         ContractDeliverable.id == deliverable_id
#     ).first()
    
#     if not deliverable:
#         raise HTTPException(status_code=404, detail="Deliverable not found")
    
#     # Check if user has permission
#     from app.main import check_permission
#     if not check_permission(current_user, deliverable.contract_id, "edit", db):
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="You don't have permission to update this deliverable"
#         )
    
#     # Update fields
#     if deliverable_data.deliverable_name is not None:
#         deliverable.deliverable_name = deliverable_data.deliverable_name
    
#     if deliverable_data.description is not None:
#         deliverable.description = deliverable_data.description
    
#     if deliverable_data.due_date is not None:
#         deliverable.due_date = deliverable_data.due_date
    
#     if deliverable_data.status is not None:
#         deliverable.status = deliverable_data.status.value
    
#     deliverable.updated_at = datetime.utcnow()
    
#     db.commit()
#     db.refresh(deliverable)
    
#     return deliverable

# @router.post("/{deliverable_id}/upload", response_model=DeliverableResponse)
# async def upload_deliverable_file(
#     deliverable_id: int,
#     file: UploadFile = File(...),
#     upload_date: str = Form(...),
#     upload_notes: Optional[str] = Form(None),
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Upload a file for a deliverable
#     """
#     deliverable = db.query(ContractDeliverable).filter(
#         ContractDeliverable.id == deliverable_id
#     ).first()
    
#     if not deliverable:
#         raise HTTPException(status_code=404, detail="Deliverable not found")
    
#     # Check if user has permission (Project Manager who created the contract)
#     contract = db.query(Contract).filter(Contract.id == deliverable.contract_id).first()
#     if not contract:
#         raise HTTPException(status_code=404, detail="Contract not found")
    
#     if contract.created_by != current_user.id and current_user.role != "director":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only the contract creator can upload deliverable files"
#         )
    
#     # Validate file
#     if not file or not file.filename:
#         raise HTTPException(status_code=400, detail="No file provided")
    
#     # Check file extension
#     allowed_extensions = {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.png', '.jpg', '.jpeg'}
#     file_ext = os.path.splitext(file.filename)[1].lower()
#     if file_ext not in allowed_extensions:
#         raise HTTPException(
#             status_code=400, 
#             detail=f"File type '{file_ext}' not allowed. Allowed types: {', '.join(allowed_extensions)}"
#         )
    
#     # Check file size (10MB limit)
#     MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
#     file.file.seek(0, 2)  # Seek to end
#     file_size = file.file.tell()
#     file.file.seek(0)  # Seek back to start
    
#     if file_size > MAX_FILE_SIZE:
#         raise HTTPException(
#             status_code=400,
#             detail=f"File too large. Maximum size is 10MB. Your file is {file_size / 1024 / 1024:.1f}MB"
#         )
    
#     try:
#         # Parse upload date
#         upload_date_obj = datetime.strptime(upload_date, "%Y-%m-%d")
        
#         # Read file content
#         file_content = await file.read()
        
#         # Generate unique filename
#         unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        
#         # Store file in S3 (if configured) or locally
#         file_path = None
#         if settings.S3_BUCKET_NAME and s3_service.s3_client:
#             try:
#                 # Store in S3 under deliverables folder
#                 s3_key = f"deliverables/contract_{deliverable.contract_id}/{unique_filename}"
#                 s3_service.s3_client.put_object(
#                     Bucket=settings.S3_BUCKET_NAME,
#                     Key=s3_key,
#                     Body=file_content,
#                     ContentType=file.content_type or 'application/octet-stream',
#                     Metadata={
#                         'contract_id': str(deliverable.contract_id),
#                         'deliverable_id': str(deliverable_id),
#                         'deliverable_name': deliverable.deliverable_name,
#                         'uploaded_by': str(current_user.id),
#                         'original_filename': file.filename
#                     }
#                 )
#                 file_path = s3_key
#                 print(f"✅ Deliverable file stored in S3: {s3_key}")
#             except Exception as s3_error:
#                 print(f"⚠️ S3 storage failed, falling back to local: {s3_error}")
#                 file_path = None
        
#         # Fallback to local storage if S3 fails or not configured
#         if not file_path:
#             # Create contract-specific directory
#             contract_dir = os.path.join(UPLOAD_DIR, f"contract_{deliverable.contract_id}")
#             os.makedirs(contract_dir, exist_ok=True)
            
#             # Save locally
#             local_path = os.path.join(contract_dir, unique_filename)
#             with open(local_path, "wb") as buffer:
#                 buffer.write(file_content)
#             file_path = local_path
#             print(f"✅ Deliverable file stored locally: {local_path}")
        
#         # Update deliverable record
#         deliverable.uploaded_file_path = file_path
#         deliverable.uploaded_file_name = file.filename
#         deliverable.uploaded_at = datetime.utcnow()
#         deliverable.uploaded_by = current_user.id
#         deliverable.upload_notes = upload_notes
#         deliverable.status = "submitted"
#         deliverable.updated_at = datetime.utcnow()
        
#         db.commit()
#         db.refresh(deliverable)
        
#         # Log activity
#         from app.auth_utils import log_activity
#         log_activity(
#             db, 
#             current_user.id, 
#             "upload_deliverable", 
#             contract_id=deliverable.contract_id, 
#             details={
#                 "deliverable_id": deliverable_id,
#                 "deliverable_name": deliverable.deliverable_name,
#                 "filename": file.filename,
#                 "upload_date": upload_date,
#                 "file_size": len(file_content),
#                 "file_type": file_ext
#             }
#         )
        
#         return deliverable
        
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
#     except Exception as e:
#         db.rollback()
#         import traceback
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

        
# @router.get("/{deliverable_id}/download-url")
# async def get_deliverable_download_url(
#     deliverable_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Get download URL for a deliverable file
#     """
#     deliverable = db.query(ContractDeliverable).filter(
#         ContractDeliverable.id == deliverable_id
#     ).first()
    
#     if not deliverable:
#         raise HTTPException(status_code=404, detail="Deliverable not found")
    
#     if not deliverable.uploaded_file_path:
#         raise HTTPException(status_code=404, detail="No file uploaded for this deliverable")
    
#     # Check permission
#     from app.main import check_permission
#     if not check_permission(current_user, deliverable.contract_id, "view", db):
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="You don't have permission to download this file"
#         )
    
#     # Generate download URL
#     if deliverable.uploaded_file_path.startswith("deliverables/"):  # S3 path
#         if not s3_service.s3_client:
#             raise HTTPException(status_code=500, detail="S3 storage not configured")
        
#         try:
#             download_url = s3_service.get_pdf_url(deliverable.uploaded_file_path)
#             if not download_url:
#                 raise HTTPException(status_code=404, detail="File not found in S3")
            
#             return {
#                 "deliverable_id": deliverable_id,
#                 "contract_id": deliverable.contract_id,
#                 "download_url": download_url,
#                 "filename": deliverable.uploaded_file_name,
#                 "expires_in": "1 hour"
#             }
#         except Exception as e:
#             raise HTTPException(status_code=500, detail=f"Failed to generate download URL: {str(e)}")
#     else:
#         # Local file - serve directly (in production, you might want to use a different approach)
#         return {
#             "deliverable_id": deliverable_id,
#             "contract_id": deliverable.contract_id,
#             "download_url": f"/api/deliverables/{deliverable_id}/file",
#             "filename": deliverable.uploaded_file_name,
#             "direct_download": True
#         }

# @router.get("/{deliverable_id}/file")
# async def download_deliverable_file(
#     deliverable_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Direct file download endpoint for locally stored files
#     """
#     from fastapi.responses import FileResponse
    
#     deliverable = db.query(ContractDeliverable).filter(
#         ContractDeliverable.id == deliverable_id
#     ).first()
    
#     if not deliverable:
#         raise HTTPException(status_code=404, detail="Deliverable not found")
    
#     if not deliverable.uploaded_file_path:
#         raise HTTPException(status_code=404, detail="No file uploaded")
    
#     # Check permission
#     from app.main import check_permission
#     if not check_permission(current_user, deliverable.contract_id, "view", db):
#         raise HTTPException(status_code=403, detail="No permission")
    
#     # For local files
#     if os.path.exists(deliverable.uploaded_file_path):
#         return FileResponse(
#             deliverable.uploaded_file_path,
#             filename=deliverable.uploaded_file_name or "deliverable_file",
#             media_type='application/octet-stream'
#         )
#     else:
#         raise HTTPException(status_code=404, detail="File not found on server")

# @router.delete("/{deliverable_id}")
# async def delete_deliverable(
#     deliverable_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Delete a deliverable
#     """
#     deliverable = db.query(ContractDeliverable).filter(
#         ContractDeliverable.id == deliverable_id
#     ).first()
    
#     if not deliverable:
#         raise HTTPException(status_code=404, detail="Deliverable not found")
    
#     # Check permission - only director or contract creator
#     contract = db.query(Contract).filter(Contract.id == deliverable.contract_id).first()
#     if not contract:
#         raise HTTPException(status_code=404, detail="Contract not found")
    
#     if contract.created_by != current_user.id and current_user.role != "director":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only the contract creator or director can delete deliverables"
#         )
    
#     # Delete file if exists
#     if deliverable.uploaded_file_path:
#         try:
#             if deliverable.uploaded_file_path.startswith("deliverables/"):  # S3
#                 if s3_service.s3_client:
#                     s3_service.s3_client.delete_object(
#                         Bucket=settings.S3_BUCKET_NAME,
#                         Key=deliverable.uploaded_file_path
#                     )
#             else:  # Local file
#                 if os.path.exists(deliverable.uploaded_file_path):
#                     os.remove(deliverable.uploaded_file_path)
#         except Exception as e:
#             print(f"⚠️ Failed to delete file: {e}")
#             # Continue with deletion of record
    
#     # Delete record
#     db.delete(deliverable)
#     db.commit()
    
#     return {"message": "Deliverable deleted successfully"}