from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from app.database import get_db
from app.models import Contract, ReportingEvent
from app.dependencies import get_current_user

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    role = current_user.role

    today = date.today()
    next_30 = today + timedelta(days=30)

    # Grants requiring action
    if role == "project_manager":
        requiring_action = db.query(ReportingEvent).filter(
            ReportingEvent.status.in_(["overdue"])
        ).count()

    elif role == "program_manager":
        requiring_action = db.query(ReportingEvent).filter(
            ReportingEvent.status == "submitted"
        ).count()

    elif role == "director":
        requiring_action = db.query(ReportingEvent).filter(
            ReportingEvent.status == "pgm_approved"
        ).count()

    # Funds at risk
    funds_at_risk = db.query(
        func.sum(Contract.total_amount)
    ).join(ReportingEvent).filter(
        ReportingEvent.status == "overdue"
    ).scalar() or 0

    # Upcoming submissions
    upcoming = db.query(ReportingEvent).filter(
        ReportingEvent.due_date.between(today, next_30),
        ReportingEvent.status == "pending"
    ).count()

    # Pending approvals
    if role == "program_manager":
        pending_approvals = db.query(ReportingEvent).filter(
            ReportingEvent.status == "submitted"
        ).count()
    elif role == "director":
        pending_approvals = db.query(ReportingEvent).filter(
            ReportingEvent.status == "pgm_approved"
        ).count()
    else:
        pending_approvals = 0

    total_contracts = db.query(Contract).count()
    contracts_with_overdue = db.query(Contract).join(
        ReportingEvent
    ).filter(
        ReportingEvent.status == "overdue"
    ).distinct().count()

    portfolio_on_track = total_contracts - contracts_with_overdue

    return {
        "grants_requiring_action": requiring_action,
        "funds_at_risk": float(funds_at_risk),
        "upcoming_submissions": upcoming,
        "pending_approvals": pending_approvals,
        "portfolio_on_track": portfolio_on_track
    }
