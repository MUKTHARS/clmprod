"""
Contract CRUD endpoints - list, get, delete, basic operations
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.auth_models import User
from app import models
from app.dependencies import (
    check_permission, is_user_assigned_to_contract, log_activity,
    get_assignment_info
)

router = APIRouter(prefix="/api/contracts", tags=["contracts"])

@router.get("/")
async def get_all_contracts(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(lambda db: None),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Get all contracts with pagination (with strict role-based filtering)"""
    print(f"=== get_all_contracts called ===")
    print(f"Current user: {current_user.username}, Role: {current_user.role}, ID: {current_user.id}")
    
    try:
        query = db.query(models.Contract)
        assigned_contract_ids = []
        all_contracts = db.query(models.Contract).all()
        
        for contract in all_contracts:
            is_assigned = is_user_assigned_to_contract(current_user.id, contract, db)
            is_creator = contract.created_by == current_user.id
            
            if is_assigned or is_creator:
                assigned_contract_ids.append(contract.id)
        
        if assigned_contract_ids:
            query = query.filter(models.Contract.id.in_(assigned_contract_ids))
        else:
            print(f"User {current_user.id} has no assigned/created contracts")
            return []
        
        contracts = query.order_by(models.Contract.uploaded_at.desc()).offset(skip).limit(limit).all()
        
        print(f"Found {len(contracts)} contracts for user {current_user.role} (assigned/created only)")
        
        def format_date(date_value):
            if date_value and hasattr(date_value, 'isoformat'):
                return date_value.isoformat()
            return date_value
        
        contracts_dict = []
        for contract in contracts:
            contract_dict = {
                "id": contract.id,
                "filename": contract.filename or "Unknown",
                "uploaded_at": format_date(contract.uploaded_at),
                "status": contract.status or "draft",
                "investment_id": contract.investment_id,
                "project_id": contract.project_id,
                "grant_id": contract.grant_id,
                "extracted_reference_ids": contract.extracted_reference_ids or [],
                "comprehensive_data": contract.comprehensive_data or {},
                "contract_number": contract.contract_number,
                "grant_name": contract.grant_name or "Unnamed Contract",
                "grantor": contract.grantor or "Unknown Grantor",
                "grantee": contract.grantee or "Unknown Grantee",
                "total_amount": float(contract.total_amount) if contract.total_amount else 0.0,
                "start_date": format_date(contract.start_date),
                "end_date": format_date(contract.end_date),
                "purpose": contract.purpose,
                "payment_schedule": contract.payment_schedule,
                "terms_conditions": contract.terms_conditions,
                "chroma_id": contract.chroma_id,
                "created_by": contract.created_by,
                "version": contract.version or 1,
                "basic_data": {
                    "id": contract.id,
                    "contract_number": contract.contract_number,
                    "grant_name": contract.grant_name or "Unnamed Contract",
                    "grantor": contract.grantor or "Unknown Grantor",
                    "grantee": contract.grantee or "Unknown Grantee",
                    "total_amount": float(contract.total_amount) if contract.total_amount else 0.0,
                    "start_date": format_date(contract.start_date),
                    "end_date": format_date(contract.end_date),
                    "purpose": contract.purpose,
                    "status": contract.status or "draft",
                    "version": contract.version or 1,
                    "created_by": contract.created_by
                }
            }
            
            contracts_dict.append(contract_dict)
        
        log_activity(
            db, 
            current_user.id, 
            "view_all_contracts", 
            details={"skip": skip, "limit": limit, "count": len(contracts_dict)}, 
            request=request
        )
        
        print(f"Returning {len(contracts_dict)} contracts")
        return contracts_dict
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in get_all_contracts: {str(e)}")
        print(f"Error details: {error_details}")
        return []

@router.get("/{contract_id}")
async def get_contract(
    contract_id: int, 
    current_user: User = Depends(lambda db: None),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Get a single contract by ID - ONLY if assigned or created"""
    print(f"=== get_contract called for ID: {contract_id} ===")
    
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        print(f"Contract {contract_id} not found")
        raise HTTPException(status_code=404, detail="Contract not found")
    
    print(f"Found contract: {contract.id}, created_by: {contract.created_by}, status: {contract.status}")
    print(f"Current user: {current_user.id}, role: {current_user.role}")
    
    is_creator = contract.created_by == current_user.id
    is_assigned = is_user_assigned_to_contract(current_user.id, contract, db)
    
    if not is_creator and not is_assigned:
        print(f"Permission denied: User {current_user.id} not assigned or creator")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this contract"
        )
    
    def format_date(date_value):
        if date_value and hasattr(date_value, 'isoformat'):
            return date_value.isoformat()
        return date_value
    
    contract_dict = {
        "id": contract.id,
        "filename": contract.filename or "Unknown",
        "uploaded_at": format_date(contract.uploaded_at),
        "status": contract.status or "draft",
        "investment_id": contract.investment_id,
        "project_id": contract.project_id,
        "grant_id": contract.grant_id,
        "extracted_reference_ids": contract.extracted_reference_ids or [],
        "comprehensive_data": contract.comprehensive_data or {},
        "contract_number": contract.contract_number,
        "grant_name": contract.grant_name or "Unnamed Contract",
        "grantor": contract.grantor or "Unknown Grantor",
        "grantee": contract.grantee or "Unknown Grantee",
        "total_amount": float(contract.total_amount) if contract.total_amount else 0.0,
        "start_date": format_date(contract.start_date),
        "end_date": format_date(contract.end_date),
        "purpose": contract.purpose,
        "payment_schedule": contract.payment_schedule,
        "terms_conditions": contract.terms_conditions,
        "chroma_id": contract.chroma_id,
        "created_by": contract.created_by,
        "version": contract.version or 1,
        "basic_data": {
            "id": contract.id,
            "contract_number": contract.contract_number,
            "grant_name": contract.grant_name or "Unnamed Contract",
            "grantor": contract.grantor or "Unknown Grantor",
            "grantee": contract.grantee or "Unknown Grantee",
            "total_amount": float(contract.total_amount) if contract.total_amount else 0.0,
            "start_date": format_date(contract.start_date),
            "end_date": format_date(contract.end_date),
            "purpose": contract.purpose,
            "status": contract.status or "draft",
            "version": contract.version or 1,
            "created_by": contract.created_by
        }
    }
    
    log_activity(
        db, 
        current_user.id, 
        "view_contract", 
        contract_id=contract_id, 
        details={"contract_id": contract_id}, 
        request=request
    )
    
    print(f"Returning contract {contract_id}")
    return contract_dict

@router.delete("/{contract_id}")
async def delete_contract(
    contract_id: int, 
    current_user: User = Depends(lambda db: None),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Delete a contract"""
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract.created_by != current_user.id and current_user.role != "director":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this contract"
        )
    
    from app.vector_store import vector_store
    from app.s3_service import s3_service
    
    if contract.chroma_id:
        vector_store.delete_by_contract_id(contract.id)
    
    try:
        s3_service.delete_contract_files(contract.id)
        print(f"✅ Deleted PDF from S3 for contract {contract.id}")
    except Exception as s3_error:
        print(f"⚠️ Warning: Failed to delete PDF from S3: {s3_error}")
    
    db.delete(contract)
    db.commit()
    
    log_activity(
        db, 
        current_user.id, 
        "delete_contract", 
        contract_id=contract_id, 
        details={"contract_id": contract_id}, 
        request=request
    )
    
    return {"message": "Contract deleted successfully"}

@router.get("/{contract_id}/pdf-url")
async def get_contract_pdf_url(
    contract_id: int,
    current_user: User = Depends(lambda db: None),
    db: Session = Depends(get_db)
):
    """Get S3 URL for contract PDF"""
    if not check_permission(current_user, contract_id, "view", db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this contract"
        )
    
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    from app.s3_service import s3_service
    
    s3_key = None
    if contract.comprehensive_data and "s3_pdf" in contract.comprehensive_data:
        s3_key = contract.comprehensive_data["s3_pdf"]["key"]
    
    if not s3_key:
        raise HTTPException(status_code=404, detail="PDF not found in S3 storage")
    
    pdf_url = s3_service.get_pdf_url(s3_key)
    
    if not pdf_url:
        raise HTTPException(status_code=500, detail="Failed to generate PDF URL")
    
    return {
        "contract_id": contract_id,
        "pdf_url": pdf_url,
        "expires_in": "1 hour",
        "original_filename": contract.filename
    }

@router.get("/{contract_id}/comprehensive")
async def get_comprehensive_data(
    contract_id: int, 
    current_user: User = Depends(lambda db: None),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Get comprehensive data for a specific contract - ONLY if assigned or created"""
    print(f"=== get_comprehensive_data called for ID: {contract_id} ===")
    
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        print(f"Contract {contract_id} not found")
        raise HTTPException(status_code=404, detail="Contract not found")
    
    print(f"Found contract: {contract.id}, created_by: {contract.created_by}, status: {contract.status}")
    print(f"Current user: {current_user.id}, role: {current_user.role}")
    
    is_creator = contract.created_by == current_user.id
    is_assigned = is_user_assigned_to_contract(current_user.id, contract, db)
    
    if not is_creator and not is_assigned:
        print(f"Permission denied: Contract created by {contract.created_by}, user is {current_user.id}, assigned: {is_assigned}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this contract"
        )
    
    def format_date(date_value):
        if date_value and hasattr(date_value, 'isoformat'):
            return date_value.isoformat()
        return date_value
    
    comp_data = contract.comprehensive_data or {}
    
    log_activity(
        db, 
        current_user.id, 
        "view_comprehensive", 
        contract_id=contract_id, 
        details={"contract_id": contract_id}, 
        request=request
    )
    
    return {
        "contract_id": contract.id,
        "filename": contract.filename or "Unknown",
        "basic_data": {
            "id": contract.id,
            "contract_number": contract.contract_number,
            "grant_name": contract.grant_name or "Unnamed Contract",
            "grantor": contract.grantor or "Unknown Grantor",
            "grantee": contract.grantee or "Unknown Grantee",
            "total_amount": float(contract.total_amount) if contract.total_amount else 0.0,
            "start_date": format_date(contract.start_date),
            "end_date": format_date(contract.end_date),
            "purpose": contract.purpose,
            "status": contract.status or "draft",
            "version": contract.version or 1,
            "created_by": contract.created_by
        },
        "comprehensive_data": comp_data
    }

@router.get("/{contract_id}/assignment-details")
async def get_assignment_details(
    contract_id: int,
    current_user: User = Depends(lambda db: None),
    db: Session = Depends(get_db)
):
    """Get detailed assignment information for a contract"""
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if not is_user_assigned_to_contract(current_user.id, contract, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this contract"
        )
    
    assignment_info = get_assignment_info(contract_id, current_user.id, db)
    
    def get_user_details(user_ids):
        if not user_ids:
            return []
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        return [
            {
                "id": u.id,
                "username": u.username,
                "full_name": u.full_name or u.username,
                "email": u.email,
                "role": u.role,
                "company": u.company,
                "department": u.department
            }
            for u in users
        ]
    
    all_assigned_ids = []
    if contract.assigned_pm_users and isinstance(contract.assigned_pm_users, list):
        all_assigned_ids.extend(contract.assigned_pm_users)
    if contract.assigned_pgm_users and isinstance(contract.assigned_pgm_users, list):
        all_assigned_ids.extend(contract.assigned_pgm_users)
    if contract.assigned_director_users and isinstance(contract.assigned_director_users, list):
        all_assigned_ids.extend(contract.assigned_director_users)
    
    all_assigned_ids = list(set(all_assigned_ids))
    if current_user.id in all_assigned_ids:
        all_assigned_ids.remove(current_user.id)
    
    assigned_users = get_user_details(all_assigned_ids)
    
    return {
        "contract_id": contract_id,
        "contract_name": contract.grant_name or contract.filename,
        "assignment_info": assignment_info,
        "assigned_with": assigned_users,
        "total_assigned": len(all_assigned_ids) + 1,
        "contract_creator": contract.created_by,
        "created_at": contract.uploaded_at.isoformat() if contract.uploaded_at else None,
        "comprehensive_data_has_history": "assignment_history" in (contract.comprehensive_data or {})
    }
