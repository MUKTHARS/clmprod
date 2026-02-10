"""
Agreement Workflow Module for Project Managers
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth_models import User
from app.auth_utils import get_current_user, log_activity
from app.models import Contract
from app.schemas import (
    UpdateDraftRequest, 
    PublishAgreementRequest,
    AdditionalDocument,
    AgreementMetadata,
    AssignUsersRequest
)
from app.s3_service import s3_service
import uuid
import os

router = APIRouter(prefix="/api/agreements", tags=["agreement-workflow"])


@router.get("/drafts")
async def get_draft_agreements(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all draft agreements created by the current Project Manager
    Show drafts until they're approved (draft, under_review, reviewed, rejected)
    """
    if current_user.role != "project_manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Project Managers can access draft agreements"
        )
    
    try:
        print(f"DEBUG: Fetching drafts for user {current_user.id}")
        
        # ✅ FIX: Show drafts until approved (exclude "approved" and "published")
        drafts = db.query(Contract).filter(
            Contract.created_by == current_user.id,
            Contract.status.in_(["draft", "under_review", "reviewed", "rejected"])  # ✅ Changed this line
        ).order_by(Contract.uploaded_at.desc()).offset(skip).limit(limit).all()
        
        print(f"DEBUG: Found {len(drafts)} drafts for user")
        
        return drafts
        
    except Exception as e:
        print(f"ERROR in get_draft_agreements: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch draft agreements: {str(e)}"
        )

@router.get("/drafts/{contract_id}")
async def get_draft_details(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a draft agreement
    """
    if current_user.role != "project_manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Project Managers can view draft agreements"
        )
    
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.created_by == current_user.id,
        Contract.status == "draft"
    ).first()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Draft agreement not found")
    
    # Get assigned users details
    from app.auth_models import User as AuthUser
    
    assigned_pm_users = []
    assigned_pgm_users = []
    assigned_director_users = []
    
    if contract.assigned_pm_users:
        pm_users = db.query(AuthUser).filter(
            AuthUser.id.in_(contract.assigned_pm_users),
            AuthUser.role == "project_manager"
        ).all()
        assigned_pm_users = [{"id": u.id, "name": u.full_name or u.username} for u in pm_users]
    
    if contract.assigned_pgm_users:
        pgm_users = db.query(AuthUser).filter(
            AuthUser.id.in_(contract.assigned_pgm_users),
            AuthUser.role == "program_manager"
        ).all()
        assigned_pgm_users = [{"id": u.id, "name": u.full_name or u.username} for u in pgm_users]
    
    if contract.assigned_director_users:
        director_users = db.query(AuthUser).filter(
            AuthUser.id.in_(contract.assigned_director_users),
            AuthUser.role == "director"
        ).all()
        assigned_director_users = [{"id": u.id, "name": u.full_name or u.username} for u in director_users]
    
    # Extract agreement metadata from comprehensive data
    agreement_metadata = {}
    if contract.comprehensive_data and "agreement_metadata" in contract.comprehensive_data:
        agreement_metadata = contract.comprehensive_data["agreement_metadata"]
    
    # Get additional documents
    additional_documents = contract.additional_documents or []
    
    # Helper function to safely format dates
    def safe_date_format(date_value):
        if date_value:
            if hasattr(date_value, 'isoformat'):
                return date_value.isoformat()
            elif isinstance(date_value, str):
                return date_value  # Already a string
        return None
    
    return {
        "contract": {
            "id": contract.id,
            "filename": contract.filename,
            "grant_name": contract.grant_name,
            "contract_number": contract.contract_number,
            "grantor": contract.grantor,
            "grantee": contract.grantee,
            "total_amount": contract.total_amount,
            "start_date": safe_date_format(contract.start_date),
            "end_date": safe_date_format(contract.end_date),
            "purpose": contract.purpose,
            "notes": contract.notes,
            "agreement_type": contract.agreement_type,
            "effective_date": safe_date_format(contract.effective_date),
            "renewal_date": safe_date_format(contract.renewal_date),
            "termination_date": safe_date_format(contract.termination_date),
            "jurisdiction": contract.jurisdiction,
            "governing_law": contract.governing_law,
            "special_conditions": contract.special_conditions,
            "assigned_pm_users": contract.assigned_pm_users or [],
            "assigned_pgm_users": contract.assigned_pgm_users or [],
            "assigned_director_users": contract.assigned_director_users or [],
            "additional_documents": additional_documents,
            "comprehensive_data": contract.comprehensive_data,
            "status": contract.status,
            "created_by": contract.created_by
        },
        "assigned_users": {
            "pm_users": assigned_pm_users,
            "pgm_users": assigned_pgm_users,
            "director_users": assigned_director_users
        },
        "agreement_metadata": agreement_metadata
    }

@router.put("/drafts/{contract_id}/update")
async def update_draft_agreement(
    contract_id: int,
    update_data: UpdateDraftRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update draft agreement metadata, assigned users, and other details
    """
    if current_user.role != "project_manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Project Managers can update draft agreements"
        )
    
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.created_by == current_user.id,
        Contract.status == "draft"
    ).first()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Draft agreement not found")
    
    try:
        # Update basic metadata
        if update_data.grant_name is not None:
            contract.grant_name = update_data.grant_name
        if update_data.contract_number is not None:
            contract.contract_number = update_data.contract_number
        if update_data.grantor is not None:
            contract.grantor = update_data.grantor
        if update_data.grantee is not None:
            contract.grantee = update_data.grantee
        if update_data.total_amount is not None:
            contract.total_amount = update_data.total_amount
        if update_data.start_date is not None:
            contract.start_date = update_data.start_date
        if update_data.end_date is not None:
            contract.end_date = update_data.end_date
        if update_data.purpose is not None:
            contract.purpose = update_data.purpose
        if update_data.notes is not None:
            contract.notes = update_data.notes
        
        # Update agreement metadata
        if update_data.agreement_metadata:
            if not contract.comprehensive_data:
                contract.comprehensive_data = {}
            
            comp_data = contract.comprehensive_data
            if "agreement_metadata" not in comp_data:
                comp_data["agreement_metadata"] = {}
            
            metadata = comp_data["agreement_metadata"]
            
            if update_data.agreement_metadata.agreement_type:
                contract.agreement_type = update_data.agreement_metadata.agreement_type
                metadata["agreement_type"] = update_data.agreement_metadata.agreement_type
            
            if update_data.agreement_metadata.effective_date:
                contract.effective_date = update_data.agreement_metadata.effective_date
                metadata["effective_date"] = update_data.agreement_metadata.effective_date
            
            if update_data.agreement_metadata.renewal_date:
                contract.renewal_date = update_data.agreement_metadata.renewal_date
                metadata["renewal_date"] = update_data.agreement_metadata.renewal_date
            
            if update_data.agreement_metadata.termination_date:
                contract.termination_date = update_data.agreement_metadata.termination_date
                metadata["termination_date"] = update_data.agreement_metadata.termination_date
            
            if update_data.agreement_metadata.jurisdiction:
                contract.jurisdiction = update_data.agreement_metadata.jurisdiction
                metadata["jurisdiction"] = update_data.agreement_metadata.jurisdiction
            
            if update_data.agreement_metadata.governing_law:
                contract.governing_law = update_data.agreement_metadata.governing_law
                metadata["governing_law"] = update_data.agreement_metadata.governing_law
            
            if update_data.agreement_metadata.special_conditions:
                contract.special_conditions = update_data.agreement_metadata.special_conditions
                metadata["special_conditions"] = update_data.agreement_metadata.special_conditions
            
            comp_data["agreement_metadata"] = metadata
            contract.comprehensive_data = comp_data
        
        # Update the notification section to handle multiple users
        if update_data.assigned_users:
            # Validate users exist and have correct roles
            from app.auth_models import User as AuthUser
            from app.notification_service import NotificationService
            
            # Track which users need notifications
            notification_messages = []
            
            # Get current assignments for comparison
            current_pm_users = set(contract.assigned_pm_users or [])
            current_pgm_users = set(contract.assigned_pgm_users or [])
            current_director_users = set(contract.assigned_director_users or [])
            
            # PM Users
            if update_data.assigned_users.pm_users:
                pm_users = db.query(AuthUser).filter(
                    AuthUser.id.in_(update_data.assigned_users.pm_users),
                    AuthUser.role == "project_manager",
                    AuthUser.is_active == True
                ).all()
                valid_pm_ids = [user.id for user in pm_users]
                new_pm_users = set(valid_pm_ids)
                
                # Find users who are newly assigned
                newly_assigned_pms = new_pm_users - current_pm_users
                
                if newly_assigned_pms:
                    # Create notifications for newly assigned users
                    NotificationService.create_assignment_notification(
                        db=db,
                        contract_id=contract_id,
                        contract_name=contract.grant_name or contract.filename,
                        assigned_users=list(newly_assigned_pms),
                        assigned_by_user=current_user,
                        user_type="project_manager"
                    )
                    notification_messages.append(f"{len(newly_assigned_pms)} project manager(s) notified")
                
                contract.assigned_pm_users = valid_pm_ids
            else:
                contract.assigned_pm_users = []
            
            # PGM Users
            if update_data.assigned_users.pgm_users:
                pgm_users = db.query(AuthUser).filter(
                    AuthUser.id.in_(update_data.assigned_users.pgm_users),
                    AuthUser.role == "program_manager",
                    AuthUser.is_active == True
                ).all()
                valid_pgm_ids = [user.id for user in pgm_users]
                new_pgm_users = set(valid_pgm_ids)
                
                # Find users who are newly assigned
                newly_assigned_pgms = new_pgm_users - current_pgm_users
                
                if newly_assigned_pgms:
                    # Create notifications for newly assigned users
                    NotificationService.create_assignment_notification(
                        db=db,
                        contract_id=contract_id,
                        contract_name=contract.grant_name or contract.filename,
                        assigned_users=list(newly_assigned_pgms),
                        assigned_by_user=current_user,
                        user_type="program_manager"
                    )
                    notification_messages.append(f"{len(newly_assigned_pgms)} program manager(s) notified")
                
                contract.assigned_pgm_users = valid_pgm_ids
            else:
                contract.assigned_pgm_users = []
            
            # Director Users
            if update_data.assigned_users.director_users:
                director_users = db.query(AuthUser).filter(
                    AuthUser.id.in_(update_data.assigned_users.director_users),
                    AuthUser.role == "director",
                    AuthUser.is_active == True
                ).all()
                valid_director_ids = [user.id for user in director_users]
                new_director_users = set(valid_director_ids)
                
                # Find users who are newly assigned
                newly_assigned_directors = new_director_users - current_director_users
                
                if newly_assigned_directors:
                    # Create notifications for newly assigned users
                    NotificationService.create_assignment_notification(
                        db=db,
                        contract_id=contract_id,
                        contract_name=contract.grant_name or contract.filename,
                        assigned_users=list(newly_assigned_directors),
                        assigned_by_user=current_user,
                        user_type="director"
                    )
                    notification_messages.append(f"{len(newly_assigned_directors)} director(s) notified")
                
                contract.assigned_director_users = valid_director_ids
            else:
                contract.assigned_director_users = []
            # Director Users
            if update_data.assigned_users.director_users:
                contract.assigned_director_users = valid_director_ids
                # Create notifications
                NotificationService.create_assignment_notification(
                    db=db,
                    contract_id=contract_id,
                    contract_name=contract.grant_name or contract.filename,
                    assigned_users=valid_director_ids,
                    assigned_by_user=current_user,
                    user_type="director"
                )
                notification_messages.append(f"{len(valid_director_ids)} director(s) notified")


        # Update audit fields
        contract.last_edited_by = current_user.id
        contract.last_edited_at = datetime.utcnow()
        

        if update_data.assigned_users:
            if not contract.comprehensive_data:
                contract.comprehensive_data = {}
            
            # Initialize assignment history
            if "assignment_history" not in contract.comprehensive_data:
                contract.comprehensive_data["assignment_history"] = []
            
            # Create assignment tracking entry
            assignment_entry = {
                "assigned_by": current_user.id,
                "assigned_by_name": current_user.full_name or current_user.username,
                "assigned_by_role": current_user.role,
                "assigned_at": datetime.utcnow().isoformat(),
                "assigned_users": {
                    "pm_users": valid_pm_ids if update_data.assigned_users.pm_users else [],
                    "pgm_users": valid_pgm_ids if update_data.assigned_users.pgm_users else [],
                    "director_users": valid_director_ids if update_data.assigned_users.director_users else []
                },
                "notes": f"Assigned via draft update"
            }
            
            contract.comprehensive_data["assignment_history"].append(assignment_entry)
            
            # Also store current assignment tracking
            contract.comprehensive_data["assignment_tracking"] = {
                "last_assigned_by": current_user.id,
                "last_assigned_by_name": current_user.full_name or current_user.username,
                "last_assigned_by_role": current_user.role,
                "last_assigned_at": datetime.utcnow().isoformat(),
                "current_pm_users": valid_pm_ids if update_data.assigned_users.pm_users else [],
                "current_pgm_users": valid_pgm_ids if update_data.assigned_users.pgm_users else [],
                "current_director_users": valid_director_ids if update_data.assigned_users.director_users else []
            }


        db.commit()
        
        # Refresh to get updated data
        db.refresh(contract)
        
        # Log activity
        log_activity(
            db,
            current_user.id,
            "update_draft",
            contract_id=contract_id,
            details={
                "contract_id": contract_id,
                "updated_fields": list(update_data.dict(exclude_unset=True).keys())
            }
        )
        
        # Helper function to safely format dates
        def safe_date_format(date_value):
            if date_value:
                if hasattr(date_value, 'isoformat'):
                    return date_value.isoformat()
                elif isinstance(date_value, str):
                    return date_value  # Already a string
            return None
        
        # Format the response with all contract data
        return {
            "message": "Draft agreement updated successfully",
            "contract_id": contract_id,
            "contract": {
                "id": contract.id,
                "filename": contract.filename,
                "grant_name": contract.grant_name,
                "contract_number": contract.contract_number,
                "grantor": contract.grantor,
                "grantee": contract.grantee,
                "total_amount": contract.total_amount,
                "start_date": safe_date_format(contract.start_date),
                "end_date": safe_date_format(contract.end_date),
                "purpose": contract.purpose,
                "notes": contract.notes,
                "agreement_type": contract.agreement_type,
                "effective_date": safe_date_format(contract.effective_date),
                "renewal_date": safe_date_format(contract.renewal_date),
                "termination_date": safe_date_format(contract.termination_date),
                "jurisdiction": contract.jurisdiction,
                "governing_law": contract.governing_law,
                "special_conditions": contract.special_conditions,
                "assigned_pm_users": contract.assigned_pm_users or [],
                "assigned_pgm_users": contract.assigned_pgm_users or [],
                "assigned_director_users": contract.assigned_director_users or [],
                "additional_documents": contract.additional_documents or [],
                "comprehensive_data": contract.comprehensive_data,
                "status": contract.status,
                "created_by": contract.created_by
            },
            "notifications_sent": notification_messages
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update draft: {str(e)}"
        )


@router.post("/drafts/{contract_id}/add-document")
async def add_additional_document(
    contract_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add additional document to a draft agreement
    """
    if current_user.role != "project_manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Project Managers can add documents to draft agreements"
        )
    
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.created_by == current_user.id,
        Contract.status == "draft"
    ).first()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Draft agreement not found")
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Create document metadata WITHOUT S3 upload
        document_metadata = {
            "id": str(uuid.uuid4()),
            "filename": file.filename,
            "original_filename": file.filename,
            "file_type": file.content_type,
            "description": description,
            "size": len(file_content),
            "uploaded_by": current_user.id,
            "uploaded_by_name": current_user.full_name or current_user.username,
            "uploaded_at": datetime.utcnow().isoformat(),
            "content_base64": file_content.hex()  # Store content as hex string in database
        }
        
        # Add to contract's additional documents
        if contract.additional_documents is None:
            contract.additional_documents = []
        
        contract.additional_documents.append(document_metadata)
        
        # Update audit fields
        contract.last_edited_by = current_user.id
        contract.last_edited_at = datetime.utcnow()
        
        db.commit()
        
        # Log activity
        log_activity(
            db,
            current_user.id,
            "add_document",
            contract_id=contract_id,
            details={
                "contract_id": contract_id,
                "filename": file.filename,
                "file_size": len(file_content)
            }
        )
        
        return {
            "message": "Document added successfully",
            "document": document_metadata,
            "contract_id": contract_id
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add document: {str(e)}"
        )

@router.get("/drafts/{contract_id}/documents/{document_id}")
async def get_document(
    contract_id: int,
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get additional document from a draft agreement
    """
    if current_user.role != "project_manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Project Managers can access draft agreement documents"
        )
    
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.created_by == current_user.id,
        Contract.status == "draft"
    ).first()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Draft agreement not found")
    
    # Find the document in additional_documents
    if not contract.additional_documents:
        raise HTTPException(status_code=404, detail="No additional documents found")
    
    document = None
    for doc in contract.additional_documents:
        if doc.get("id") == document_id:
            document = doc
            break
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Convert hex string back to bytes
    try:
        content_bytes = bytes.fromhex(document["content_base64"])
    except:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to decode document content"
        )
    
    # Return the file
    from fastapi.responses import Response
    
    return Response(
        content=content_bytes,
        media_type=document.get("file_type", "application/octet-stream"),
        headers={
            "Content-Disposition": f"attachment; filename={document['filename']}",
            "Content-Length": str(len(content_bytes))
        }
    )        



@router.post("/drafts/{contract_id}/publish")
async def publish_agreement(
    contract_id: int,
    publish_data: PublishAgreementRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Publish a draft agreement (optionally submit for review)
    """
    if current_user.role != "project_manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Project Managers can publish agreements"
        )
    
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.created_by == current_user.id,
        Contract.status == "draft"
    ).first()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Draft agreement not found")
    
    try:
        # Update audit fields
        contract.published_at = datetime.utcnow()
        contract.published_by = current_user.id
        
        if publish_data.notes:
            contract.notes = publish_data.notes
        
        # If publishing to review, update status
        if publish_data.publish_to_review:
            contract.status = "under_review"
            
            from app.notification_service import NotificationService
            from app.auth_models import User as AuthUser
            
            all_assigned_users = []

            # Get assigned Program Managers from database columns
            if contract.assigned_pgm_users:
                if isinstance(contract.assigned_pgm_users, list):
                    all_assigned_users.extend(contract.assigned_pgm_users)
                elif isinstance(contract.assigned_pgm_users, str):
                    try:
                        import json
                        pgm_list = json.loads(contract.assigned_pgm_users)
                        if isinstance(pgm_list, list):
                            all_assigned_users.extend(pgm_list)
                    except:
                        pgm_ids = [int(id_str.strip()) for id_str in contract.assigned_pgm_users.split(',') if id_str.strip().isdigit()]
                        all_assigned_users.extend(pgm_ids)

            # Also check comprehensive_data for assignments
            if contract.comprehensive_data:
                if "assigned_users" in contract.comprehensive_data:
                    assigned_users = contract.comprehensive_data["assigned_users"]
                    if assigned_users and "pgm_users" in assigned_users:
                        all_assigned_users.extend(assigned_users["pgm_users"])
                elif "agreement_metadata" in contract.comprehensive_data:
                    metadata = contract.comprehensive_data["agreement_metadata"]
                    if metadata and "assigned_pgm_users" in metadata:
                        all_assigned_users.extend(metadata["assigned_pgm_users"])

            # Remove duplicates
            all_assigned_users = list(set(all_assigned_users))

            print(f"DEBUG: Publishing contract {contract_id} - All assigned Program Managers: {all_assigned_users}")

            # Filter to only include active Program Managers
            valid_program_managers = []
            for user_id in all_assigned_users:
                user = db.query(AuthUser).filter(
                    AuthUser.id == user_id,
                    AuthUser.role == "program_manager",
                    AuthUser.is_active == True
                ).first()
                if user:
                    valid_program_managers.append(user_id)

            # Send notifications to ALL assigned Program Managers
            if valid_program_managers:
                # Create individual notifications for each Program Manager
                for pgm_user_id in valid_program_managers:
                    NotificationService.create_publish_notification(
                        db=db,
                        contract_id=contract_id,
                        contract_name=contract.grant_name or contract.filename,
                        published_by_user=current_user,
                        assigned_users=[pgm_user_id]  # Send to individual user
                    )
                print(f"DEBUG: Notifications sent to {len(valid_program_managers)} Program Managers")

            # Create a version snapshot
            from app.models import ContractVersion
            
            last_version = db.query(ContractVersion).filter(
                ContractVersion.contract_id == contract_id
            ).order_by(ContractVersion.version_number.desc()).first()
            
            version_number = (last_version.version_number + 1) if last_version else 1
            
            version_data = {
                "contract_data": contract.comprehensive_data or {},
                "basic_data": {
                    "grant_name": contract.grant_name,
                    "contract_number": contract.contract_number,
                    "grantor": contract.grantor,
                    "grantee": contract.grantee,
                    "total_amount": contract.total_amount,
                    "start_date": contract.start_date,
                    "end_date": contract.end_date,
                    "purpose": contract.purpose,
                    "status": contract.status,
                    "assigned_pm_users": contract.assigned_pm_users,
                    "assigned_pgm_users": contract.assigned_pgm_users,
                    "assigned_director_users": contract.assigned_director_users,
                    "additional_documents": contract.additional_documents,
                    "notes": contract.notes
                },
                "publish_notes": publish_data.notes
            }
            
            version = ContractVersion(
                contract_id=contract_id,
                version_number=version_number,
                created_by=current_user.id,
                contract_data=version_data,
                changes_description=f"Published agreement: {publish_data.notes}" if publish_data.notes else "Published agreement",
                version_type="publish"
            )
            
            db.add(version)
            
            # Update contract version
            contract.version = version_number
            
            # Add to comprehensive data history
            if not contract.comprehensive_data:
                contract.comprehensive_data = {}
            
            publish_history = contract.comprehensive_data.get("publish_history", [])
            publish_history.append({
                "action": "published",
                "by_user_id": current_user.id,
                "by_user_name": current_user.full_name or current_user.username,
                "timestamp": datetime.utcnow().isoformat(),
                "notes": publish_data.notes,
                "published_to_review": publish_data.publish_to_review,
                "version_number": version_number,
                "notified_program_managers": valid_program_managers
            })
            
            contract.comprehensive_data["publish_history"] = publish_history
        
        db.commit()
        
        # Log activity
        action_type = "publish_for_review" if publish_data.publish_to_review else "publish_draft"
        log_activity(
            db,
            current_user.id,
            action_type,
            contract_id=contract_id,
            details={
                "contract_id": contract_id,
                "publish_to_review": publish_data.publish_to_review,
                "notes": publish_data.notes,
                "notified_program_managers_count": len(valid_program_managers) if publish_data.publish_to_review else 0
            }
        )
        
        message = "Agreement published and submitted for review" if publish_data.publish_to_review else "Agreement published"
        
        return {
            "message": message,
            "contract_id": contract_id,
            "status": contract.status,
            "published_at": contract.published_at.isoformat() if contract.published_at else None,
            "program_managers_notified": len(valid_program_managers) if publish_data.publish_to_review else 0
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to publish agreement: {str(e)}"
        )


@router.get("/users/available")
async def get_available_users(
    role: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get available users for assignment (filtered by role)
    """
    if current_user.role != "project_manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Project Managers can view available users"
        )
    
    from app.auth_models import User as AuthUser
    
    query = db.query(AuthUser).filter(AuthUser.is_active == True)
    
    if role:
        query = query.filter(AuthUser.role == role)
    
    users = query.order_by(AuthUser.full_name).all()
    
    return [
        {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name or user.username,
            "email": user.email,
            "role": user.role,
            "company": user.company,
            "department": user.department
        }
        for user in users
    ]

    
    
@router.post("/approved/{contract_id}/final-publish")
async def final_publish_approved_agreement(
    contract_id: int,
    publish_data: PublishAgreementRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Final publish for approved agreements - Project Manager only
    This is different from the draft publish endpoint
    """
    if current_user.role != "project_manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Project Managers can publish agreements"
        )
    
    # Get the contract - specifically look for approved status
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.status == "approved"  # Changed from "draft" to "approved"
    ).first()
    
    if not contract:
        # Provide more specific error message
        contract_exists = db.query(Contract).filter(Contract.id == contract_id).first()
        if contract_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot publish contract with status '{contract_exists.status}'. Only approved contracts can be finalized."
            )
        else:
            raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check if user has permission (contract creator)
    if contract.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the contract creator can publish approved agreements"
        )
    
    try:
        # Update audit fields
        contract.published_at = datetime.utcnow()
        contract.published_by = current_user.id
        
        if publish_data.notes:
            contract.notes = publish_data.notes
        
        # For approved contracts, we don't send to review - just mark as finalized
        # You could create a new status like "finalized" or "published"
        contract.status = "published"  # Or keep as "approved" if you prefer
        
        # Create a version snapshot
        from app.models import ContractVersion
        
        last_version = db.query(ContractVersion).filter(
            ContractVersion.contract_id == contract_id
        ).order_by(ContractVersion.version_number.desc()).first()
        
        version_number = (last_version.version_number + 1) if last_version else 1
        
        version_data = {
            "final_publish_data": {
                "published_at": datetime.utcnow().isoformat(),
                "published_by": current_user.id,
                "published_by_name": current_user.full_name or current_user.username,
                "notes": publish_data.notes
            },
            "contract_data": contract.comprehensive_data or {},
            "basic_data": {
                "grant_name": contract.grant_name,
                "contract_number": contract.contract_number,
                "grantor": contract.grantor,
                "grantee": contract.grantee,
                "total_amount": contract.total_amount,
                "start_date": contract.start_date,
                "end_date": contract.end_date,
                "purpose": contract.purpose,
                "status": contract.status
            }
        }
        
        version = ContractVersion(
            contract_id=contract_id,
            version_number=version_number,
            created_by=current_user.id,
            contract_data=version_data,
            changes_description=f"Final publication: {publish_data.notes}" if publish_data.notes else "Final publication of approved agreement",
            version_type="final_publish"
        )
        
        db.add(version)
        
        # Update contract version
        contract.version = version_number
        
        # Add to comprehensive data history
        if not contract.comprehensive_data:
            contract.comprehensive_data = {}
        
        publish_history = contract.comprehensive_data.get("publish_history", [])
        publish_history.append({
            "action": "final_published",
            "by_user_id": current_user.id,
            "by_user_name": current_user.full_name or current_user.username,
            "timestamp": datetime.utcnow().isoformat(),
            "notes": publish_data.notes,
            "version_number": version_number,
            "final_status": contract.status
        })
        
        contract.comprehensive_data["publish_history"] = publish_history
        
        # Lock the contract after final publication
        if not contract.comprehensive_data.get("finalization"):
            contract.comprehensive_data["finalization"] = {}
        
        contract.comprehensive_data["finalization"].update({
            "finalized_at": datetime.utcnow().isoformat(),
            "finalized_by": current_user.id,
            "finalized_by_name": current_user.full_name or current_user.username,
            "locked": True
        })
        
        db.commit()
        
        # Log activity
        log_activity(
            db,
            current_user.id,
            "final_publish",
            contract_id=contract_id,
            details={
                "contract_id": contract_id,
                "notes": publish_data.notes,
                "version_number": version_number,
                "final_status": contract.status
            }
        )
        
        return {
            "message": "Agreement published and finalized successfully",
            "contract_id": contract_id,
            "status": contract.status,
            "published_at": contract.published_at.isoformat() if contract.published_at else None,
            "version_number": version_number,
            "locked": True
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to finalize and publish agreement: {str(e)}"
        )


