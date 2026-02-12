from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from app import models


def get_dashboard_metrics(db: Session):
    today = date.today()

    # 1️⃣ Total Active Grants
    total_grants = db.query(func.count(models.Contract.id)) \
        .filter(models.Contract.status != "archived") \
        .scalar()

    # 2️⃣ Grants Requiring Action
    # Draft OR overdue reporting events
    drafts = db.query(func.count(models.Contract.id)) \
        .filter(models.Contract.status == "draft") \
        .scalar()

    overdue_reports = db.query(func.count(models.ReportingEvent.id)) \
        .filter(
            models.ReportingEvent.due_date < today,
            models.ReportingEvent.status == "pending"
        ).scalar()

    grants_requiring_action = drafts + overdue_reports

    # 3️⃣ Funds At Risk
    # Sum of contracts with overdue reporting
    funds_at_risk = db.query(func.coalesce(func.sum(models.Contract.total_amount), 0)) \
        .join(models.ReportingEvent, models.ReportingEvent.contract_id == models.Contract.id) \
        .filter(
            models.ReportingEvent.due_date < today,
            models.ReportingEvent.status == "pending"
        ).scalar()

    # 4️⃣ Upcoming Submissions (next 30 days)
    upcoming_submissions = db.query(func.count(models.ReportingEvent.id)) \
        .filter(
            models.ReportingEvent.due_date >= today,
            models.ReportingEvent.due_date <= today + timedelta(days=30),
            models.ReportingEvent.status == "pending"
        ).scalar()

    # 5️⃣ Pending Approvals
    pending_approvals = db.query(func.count(models.ReportingEvent.id)) \
        .filter(models.ReportingEvent.status == "submitted") \
        .scalar()

    # 6️⃣ Portfolio On Track
    portfolio_on_track = db.query(func.count(models.Contract.id)) \
        .filter(models.Contract.status == "active") \
        .scalar()

    return {
        "total_grants": total_grants,
        "grants_requiring_action": grants_requiring_action,
        "funds_at_risk": float(funds_at_risk or 0),
        "upcoming_submissions": upcoming_submissions,
        "pending_approvals": pending_approvals,
        "portfolio_on_track": portfolio_on_track
    }
