"""
Archive routes for managing completed/expired contracts
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth_models import User
from app.auth_utils import get_current_user, log_activity
from app.models import Contract
from app.schemas import ArchiveRequest, ArchiveResponse

router = APIRouter(prefix="/api/archive", tags=["archive"])

def is_contract_eligible_for_archive(contract) -> bool:
    """Check if contract is eligible for archiving based on end date"""
    if not contract.end_date:
        return False
    
    try:
        end_date = contract.end_date
        if isinstance(end_date, str):
            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        now = datetime.utcnow()
        return end_date < now
    except:
        return False

@router.get("/eligible")
async def get_eligible_for_archive(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get contracts eligible for archiving (past end date)"""
    if current_user.role not in ["project_manager", "program_manager", "director"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view archive"
        )
    
    try:
        # Get all contracts
        all_contracts = db.query(Contract).all()
        
        eligible_contracts = []
        for contract in all_contracts:
            # Check if contract is past end date OR already terminated
            is_past_due = is_contract_eligible_for_archive(contract)
            is_terminated = contract.status == "terminated"
            
            if is_past_due or is_terminated:
                # Calculate days past due
                days_past_due = None
                if contract.end_date and is_past_due:
                    try:
                        end_date = contract.end_date
                        if isinstance(end_date, str):
                            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                        now = datetime.utcnow()
                        days_past_due = (now - end_date).days
                    except:
                        days_past_due = None
                
                eligible_contracts.append({
                    "id": contract.id,
                    "grant_name": contract.grant_name,
                    "filename": contract.filename,
                    "contract_number": contract.contract_number,
                    "grantor": contract.grantor,
                    "grantee": contract.grantee,
                    "total_amount": contract.total_amount,
                    "start_date": contract.start_date,
                    "end_date": contract.end_date,
                    "status": contract.status,
                    "uploaded_at": contract.uploaded_at,
                    "created_by": contract.created_by,
                    "days_past_due": days_past_due,
                    "is_terminated": is_terminated,
                    "is_past_due": is_past_due,
                    "eligible_for_archive": True
                })
        
        # Apply pagination
        paginated = eligible_contracts[skip:skip + limit]
        
        return {
            "contracts": paginated,
            "total": len(eligible_contracts),
            "skip": skip,
            "limit": limit,
            "stats": {
                "total_eligible": len(eligible_contracts),
                "past_due": len([c for c in eligible_contracts if c["is_past_due"]]),
                "terminated": len([c for c in eligible_contracts if c["is_terminated"]]),
                "total_value": sum(c["total_amount"] or 0 for c in eligible_contracts)
            }
        }
        
    except Exception as e:
        print(f"ERROR in get_eligible_for_archive: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch eligible contracts: {str(e)}"
        )

@router.post("/{contract_id}/archive")
async def archive_contract(
    contract_id: int,
    archive_data: ArchiveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Archive a single contract"""
    if current_user.role not in ["project_manager", "program_manager", "director"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to archive contracts"
        )
    
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check if contract is eligible for archiving
    if not is_contract_eligible_for_archive(contract) and contract.status != "terminated":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract is not eligible for archiving. End date has not passed."
        )
    
    try:
        # Store old status
        old_status = contract.status
        
        # Update contract status to archived
        contract.status = "archived"
        contract.archived_at = datetime.utcnow()
        contract.archived_by = current_user.id
        
        # Add archive reason to comprehensive data
        if not contract.comprehensive_data:
            contract.comprehensive_data = {}
        
        archive_history = contract.comprehensive_data.get("archive_history", [])
        archive_history.append({
            "archived_at": datetime.utcnow().isoformat(),
            "archived_by": current_user.id,
            "archived_by_name": current_user.full_name or current_user.username,
            "old_status": old_status,
            "new_status": "archived",
            "reason": archive_data.reason,
            "notes": archive_data.notes
        })
        
        contract.comprehensive_data["archive_history"] = archive_history
        
        # Mark as finalized
        contract.comprehensive_data["finalization"] = {
            "finalized_at": datetime.utcnow().isoformat(),
            "finalized_by": current_user.id,
            "finalized_by_name": current_user.full_name or current_user.username,
            "finalized_reason": "Archived - End date passed",
            "archived": True
        }
        
        # Create version snapshot
        from app.models import ContractVersion
        
        last_version = db.query(ContractVersion).filter(
            ContractVersion.contract_id == contract_id
        ).order_by(ContractVersion.version_number.desc()).first()
        
        version_number = (last_version.version_number + 1) if last_version else 1
        
        version_data = {
            "archive_data": {
                "archived_at": datetime.utcnow().isoformat(),
                "archived_by": current_user.id,
                "archived_by_name": current_user.full_name or current_user.username,
                "reason": archive_data.reason,
                "notes": archive_data.notes,
                "old_status": old_status,
                "end_date": contract.end_date
            },
            "contract_data": contract.comprehensive_data or {}
        }
        
        version = ContractVersion(
            contract_id=contract_id,
            version_number=version_number,
            created_by=current_user.id,
            contract_data=version_data,
            changes_description=f"Archived contract: {archive_data.reason}",
            version_type="archive"
        )
        
        db.add(version)
        contract.version = version_number
        
        db.commit()
        
        # Log activity
        log_activity(
            db,
            current_user.id,
            "archive_contract",
            contract_id=contract_id,
            details={
                "contract_id": contract_id,
                "old_status": old_status,
                "new_status": "archived",
                "reason": archive_data.reason,
                "end_date": contract.end_date
            }
        )
        
        return {
            "message": "Contract archived successfully",
            "contract_id": contract_id,
            "status": "archived",
            "archived_at": contract.archived_at.isoformat() if contract.archived_at else None,
            "version_number": version_number
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to archive contract: {str(e)}"
        )

@router.post("/batch-archive")
async def batch_archive_contracts(
    contract_ids: List[int] = Query([]),
    archive_data: ArchiveRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Archive multiple contracts in batch"""
    if current_user.role not in ["project_manager", "program_manager", "director"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to archive contracts"
        )
    
    try:
        results = []
        successful = 0
        failed = 0
        
        for contract_id in contract_ids:
            try:
                contract = db.query(Contract).filter(Contract.id == contract_id).first()
                if not contract:
                    results.append({
                        "contract_id": contract_id,
                        "success": False,
                        "error": "Contract not found"
                    })
                    failed += 1
                    continue
                
                # Check eligibility
                if not is_contract_eligible_for_archive(contract) and contract.status != "terminated":
                    results.append({
                        "contract_id": contract_id,
                        "success": False,
                        "error": "Contract not eligible for archiving"
                    })
                    failed += 1
                    continue
                
                # Archive the contract
                old_status = contract.status
                contract.status = "archived"
                contract.archived_at = datetime.utcnow()
                contract.archived_by = current_user.id
                
                # Add to comprehensive data
                if not contract.comprehensive_data:
                    contract.comprehensive_data = {}
                
                archive_history = contract.comprehensive_data.get("archive_history", [])
                archive_history.append({
                    "archived_at": datetime.utcnow().isoformat(),
                    "archived_by": current_user.id,
                    "archived_by_name": current_user.full_name or current_user.username,
                    "old_status": old_status,
                    "new_status": "archived",
                    "reason": archive_data.reason if archive_data else "Batch archive",
                    "notes": archive_data.notes if archive_data else None,
                    "batch_archive": True
                })
                
                contract.comprehensive_data["archive_history"] = archive_history
                
                # Create version
                from app.models import ContractVersion
                
                last_version = db.query(ContractVersion).filter(
                    ContractVersion.contract_id == contract_id
                ).order_by(ContractVersion.version_number.desc()).first()
                
                version_number = (last_version.version_number + 1) if last_version else 1
                
                version_data = {
                    "batch_archive_data": {
                        "archived_at": datetime.utcnow().isoformat(),
                        "archived_by": current_user.id,
                        "archived_by_name": current_user.full_name or current_user.username,
                        "reason": archive_data.reason if archive_data else "Batch archive",
                        "old_status": old_status
                    }
                }
                
                version = ContractVersion(
                    contract_id=contract_id,
                    version_number=version_number,
                    created_by=current_user.id,
                    contract_data=version_data,
                    changes_description="Batch archived",
                    version_type="batch_archive"
                )
                
                db.add(version)
                contract.version = version_number
                
                results.append({
                    "contract_id": contract_id,
                    "success": True,
                    "old_status": old_status,
                    "new_status": "archived",
                    "grant_name": contract.grant_name
                })
                successful += 1
                
            except Exception as e:
                results.append({
                    "contract_id": contract_id,
                    "success": False,
                    "error": str(e)
                })
                failed += 1
        
        db.commit()
        
        # Log activity
        log_activity(
            db,
            current_user.id,
            "batch_archive",
            details={
                "total_contracts": len(contract_ids),
                "successful": successful,
                "failed": failed,
                "reason": archive_data.reason if archive_data else "Batch archive"
            }
        )
        
        return {
            "message": f"Batch archive completed: {successful} successful, {failed} failed",
            "total": len(contract_ids),
            "successful": successful,
            "failed": failed,
            "results": results
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to batch archive contracts: {str(e)}"
        )

@router.get("/archived")
async def get_archived_contracts(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    year: Optional[int] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all archived contracts"""
    if current_user.role not in ["project_manager", "program_manager", "director"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view archive"
        )
    
    try:
        query = db.query(Contract).filter(Contract.status == "archived")
        
        # Apply filters
        if year:
            query = query.filter(db.extract('year', Contract.archived_at) == year)
        
        if search:
            query = query.filter(
                (Contract.grant_name.ilike(f"%{search}%")) |
                (Contract.contract_number.ilike(f"%{search}%")) |
                (Contract.grantor.ilike(f"%{search}%"))
            )
        
        # Count total
        total_count = query.count()
        
        # Get contracts with pagination
        contracts = query.order_by(
            Contract.archived_at.desc()
        ).offset(skip).limit(limit).all()
        
        # Format response
        formatted_contracts = []
        for contract in contracts:
            # Calculate days past due
            days_past_due = None
            if contract.end_date:
                try:
                    end_date = contract.end_date
                    if isinstance(end_date, str):
                        end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                    archived_at = contract.archived_at or datetime.utcnow()
                    days_past_due = (archived_at - end_date).days
                except:
                    days_past_due = None
            
            formatted_contracts.append({
                "id": contract.id,
                "grant_name": contract.grant_name,
                "filename": contract.filename,
                "contract_number": contract.contract_number,
                "grantor": contract.grantor,
                "grantee": contract.grantee,
                "total_amount": contract.total_amount,
                "start_date": contract.start_date,
                "end_date": contract.end_date,
                "status": contract.status,
                "uploaded_at": contract.uploaded_at,
                "created_by": contract.created_by,
                "archived_at": contract.archived_at.isoformat() if contract.archived_at else None,
                "archived_by": contract.archived_by,
                "days_past_due": days_past_due,
                "comprehensive_data": contract.comprehensive_data
            })
        
        return {
            "contracts": formatted_contracts,
            "total": total_count,
            "skip": skip,
            "limit": limit,
            "stats": {
                "total_archived": total_count,
                "total_value": sum(c.total_amount or 0 for c in contracts),
                "by_year": get_archive_stats_by_year(db)
            }
        }
        
    except Exception as e:
        print(f"ERROR in get_archived_contracts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch archived contracts: {str(e)}"
        )

def get_archive_stats_by_year(db: Session):
    """Get archive statistics grouped by year"""
    try:
        from sqlalchemy import extract
        
        # Query archived contracts grouped by year
        archived_by_year = db.query(
            extract('year', Contract.archived_at).label('year'),
            db.func.count().label('count'),
            db.func.sum(Contract.total_amount).label('total_amount')
        ).filter(
            Contract.status == "archived",
            Contract.archived_at.isnot(None)
        ).group_by(
            extract('year', Contract.archived_at)
        ).order_by(
            extract('year', Contract.archived_at).desc()
        ).all()
        
        return [
            {
                "year": int(row.year) if row.year else None,
                "count": row.count,
                "total_amount": float(row.total_amount) if row.total_amount else 0
            }
            for row in archived_by_year
        ]
    except Exception as e:
        print(f"Error getting archive stats by year: {e}")
        return []