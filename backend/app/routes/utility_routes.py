"""
Utility routes - search, extract, activity logs
"""
from fastapi import APIRouter, Query, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.auth_models import User, ActivityLog
from app.ai_extractor import AIExtractor
from app.vector_store import vector_store
from app import models, schemas
from app.dependencies import check_permission, log_activity

router = APIRouter(prefix="/api", tags=["utilities"])
ai_extractor = AIExtractor()

@router.post("/extract/")
async def extract_from_text(
    request_data: schemas.ExtractionRequest,
    current_user: User = Depends(lambda db: None)
):
    """Extract data from raw text (for testing) - Requires authentication"""
    extracted_data = ai_extractor.extract_contract_data(request_data.text)
    return {"extracted_data": extracted_data}

@router.get("/search/")
async def semantic_search(
    query: str, 
    n_results: int = 5,
    current_user: User = Depends(lambda db: None)
):
    """Semantic search using ChromaDB - Requires authentication"""
    query_embedding = ai_extractor.get_embedding(query)
    search_results = vector_store.search_similar(
        query_embedding=query_embedding,
        n_results=n_results
    )
    
    return {
        "query": query,
        "results": search_results
    }

@router.get("/activity-logs")
async def get_activity_logs(
    contract_id: Optional[int] = None,
    user_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(lambda db: None),
    db: Session = Depends(get_db)
):
    """Get activity logs - Director only"""
    if current_user.role != "director":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Directors can view activity logs"
        )
    
    query = db.query(ActivityLog)
    
    if contract_id:
        query = query.filter(ActivityLog.contract_id == contract_id)
    
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    
    logs = query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    
    return logs

@router.get("/contracts/{contract_id}/similar")
async def get_similar_contracts(
    contract_id: int, 
    n_results: int = 3,
    current_user: User = Depends(lambda db: None),
    db: Session = Depends(get_db)
):
    """Find similar contracts"""
    if not check_permission(current_user, contract_id, "view", db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this contract"
        )
    
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract.chroma_id:
        vector_data = vector_store.get_by_contract_id(contract.id)
        if vector_data and vector_data.get("embedding"):
            similar = vector_store.search_similar(vector_data["embedding"], n_results + 1)
            similar = [s for s in similar if s["contract_id"] != contract.id]
            
            similar_contracts = []
            for item in similar[:n_results]:
                if check_permission(current_user, item["contract_id"], "view", db):
                    similar_contract = db.query(models.Contract).filter(
                        models.Contract.id == item["contract_id"]
                    ).first()
                    if similar_contract:
                        similar_contracts.append({
                            "contract": similar_contract,
                            "similarity_score": item["similarity_score"]
                        })
            
            return {"similar_contracts": similar_contracts}
    
    return {"similar_contracts": []}

@router.get("/contracts/filtered")
async def get_filtered_contracts(
    status: Optional[str] = None,
    grantor: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(lambda db: None),
    db: Session = Depends(get_db)
):
    """Get filtered contracts with advanced search"""
    query = db.query(models.Contract)
    
    if current_user.role == "project_manager":
        query = query.filter(models.Contract.created_by == current_user.id)
    elif current_user.role == "program_manager":
        query = query.filter(
            (models.Contract.status == "under_review") | 
            (models.Contract.status == "reviewed")
        )
    
    if status:
        query = query.filter(models.Contract.status == status)
    
    if grantor:
        query = query.filter(models.Contract.grantor.ilike(f"%{grantor}%"))
    
    if start_date:
        try:
            from datetime import datetime
            start_date_obj = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(models.Contract.uploaded_at >= start_date_obj)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    
    if end_date:
        try:
            from datetime import datetime
            end_date_obj = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(models.Contract.uploaded_at <= end_date_obj)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")
    
    if search:
        query = query.filter(
            (models.Contract.grant_name.ilike(f"%{search}%")) |
            (models.Contract.contract_number.ilike(f"%{search}%")) |
            (models.Contract.filename.ilike(f"%{search}%"))
        )
    
    total_count = query.count()
    contracts = query.order_by(models.Contract.uploaded_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total_count,
        "skip": skip,
        "limit": limit,
        "contracts": contracts
    }

@router.get("/contracts/status/{status}")
async def get_contracts_by_status(
    status: str,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(lambda db: None),
    db: Session = Depends(get_db)
):
    """Get contracts by status with role-based filtering"""
    query = db.query(models.Contract).filter(models.Contract.status == status)
    
    if current_user.role == "project_manager":
        query = query.filter(models.Contract.created_by == current_user.id)
    elif current_user.role == "program_manager":
        query = query.filter(
            (models.Contract.status == "under_review") | 
            (models.Contract.status == "reviewed")
        )
    
    contracts = query.order_by(models.Contract.uploaded_at.desc()).offset(skip).limit(limit).all()
    
    return contracts
