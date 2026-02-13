from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from app import models


def get_dashboard_metrics(db: Session, current_user):

    today = date.today()
    role = current_user.role

    # ----------------------------------
    # ROLE-BASED BASE CONTRACT QUERY
    # ----------------------------------

    contract_query = db.query(models.Contract)

    if role == "project_manager":
        contract_query = contract_query.filter(
            models.Contract.created_by == current_user.id
        )

    elif role == "program_manager":
        contract_query = contract_query.filter(
            models.Contract.created_by == current_user.id
        )

    elif role == "director":
        # Director sees everything
        pass


    # ============================================================
    # 👤 PROJECT MANAGER DASHBOARD (Operational View)
    # ============================================================

    if role == "project_manager":

        # 1️⃣ Drafts
        drafts = contract_query.filter(
            models.Contract.status == "draft"
        ).count()

        # 2️⃣ Overdue Reports
        overdue_reports = db.query(func.count(models.ReportingEvent.id)) \
            .join(models.Contract,
                  models.ReportingEvent.contract_id == models.Contract.id) \
            .filter(
                models.ReportingEvent.due_date < today,
                models.ReportingEvent.status == "pending",
                models.Contract.created_by == current_user.id
            ).scalar()

        grants_requiring_action = drafts + overdue_reports

        # 3️⃣ Funds At Risk
        funds_at_risk = db.query(
            func.coalesce(func.sum(models.Contract.total_amount), 0)
        ).join(
            models.ReportingEvent,
            models.ReportingEvent.contract_id == models.Contract.id
        ).filter(
            models.ReportingEvent.due_date < today,
            models.ReportingEvent.status == "pending",
            models.Contract.created_by == current_user.id
        ).scalar()

        # 4️⃣ Upcoming Submissions
        upcoming_submissions = db.query(
            func.count(models.ReportingEvent.id)
        ).join(
            models.Contract,
            models.ReportingEvent.contract_id == models.Contract.id
        ).filter(
            models.ReportingEvent.due_date >= today,
            models.ReportingEvent.due_date <= today + timedelta(days=30),
            models.ReportingEvent.status == "pending",
            models.Contract.created_by == current_user.id
        ).scalar()

        # 5️⃣ Pending Approvals
        pending_approvals = db.query(
            func.count(models.ReportingEvent.id)
        ).join(
            models.Contract,
            models.ReportingEvent.contract_id == models.Contract.id
        ).filter(
            models.ReportingEvent.status == "submitted",
            models.Contract.created_by == current_user.id
        ).scalar()

        # 6️⃣ Portfolio On Track
        portfolio_on_track = contract_query.filter(
            models.Contract.status == "active"
        ).count()

        return {
            "grants_requiring_action": grants_requiring_action,
            "funds_at_risk": float(funds_at_risk or 0),
            "upcoming_submissions": upcoming_submissions,
            "pending_approvals": pending_approvals,
            "portfolio_on_track": portfolio_on_track
        }


    # ============================================================
    # 👨‍💼 PROGRAM MANAGER DASHBOARD (Oversight View)
    # ============================================================

    elif role == "program_manager":

        total_active_grants = contract_query.filter(
            models.Contract.status == "active"
        ).count()

        pending_pm_submissions = contract_query.filter(
            models.Contract.status == "under_review"
        ).count()

        submitted_to_director = contract_query.filter(
            models.Contract.status == "reviewed"
        ).count()

        total_portfolio_value = contract_query.with_entities(
            func.coalesce(func.sum(models.Contract.total_amount), 0)
        ).scalar()

        at_risk_grants = db.query(func.count(models.Contract.id)) \
            .join(models.ReportingEvent,
                  models.ReportingEvent.contract_id == models.Contract.id) \
            .filter(
                models.ReportingEvent.due_date < today,
                models.ReportingEvent.status == "pending",
                models.Contract.created_by == current_user.id
            ).scalar()

        return {
            "total_active_grants": total_active_grants,
            "pending_pm_submissions": pending_pm_submissions,
            "submitted_to_director": submitted_to_director,
            "total_portfolio_value": float(total_portfolio_value or 0),
            "at_risk_grants": at_risk_grants
        }


    # ============================================================
    # 🏛 DIRECTOR DASHBOARD (Executive View)
    # ============================================================

    elif role == "director":

        total_portfolio = contract_query.count()

        total_portfolio_value = contract_query.with_entities(
            func.coalesce(func.sum(models.Contract.total_amount), 0)
        ).scalar()

        awaiting_director_approval = contract_query.filter(
            models.Contract.status == "reviewed"
        ).count()

        active_contracts = contract_query.filter(
            models.Contract.status == "active"
        ).count()

        portfolio_on_track_percent = 0
        if total_portfolio > 0:
            portfolio_on_track_percent = round(
                (active_contracts / total_portfolio) * 100
            )

        high_risk_grants = db.query(func.count(models.Contract.id)) \
            .join(models.ReportingEvent,
                  models.ReportingEvent.contract_id == models.Contract.id) \
            .filter(
                models.ReportingEvent.due_date < today,
                models.ReportingEvent.status == "pending"
            ).scalar()

        return {
            "total_portfolio": total_portfolio,
            "total_portfolio_value": float(total_portfolio_value or 0),
            "awaiting_director_approval": awaiting_director_approval,
            "portfolio_on_track_percent": portfolio_on_track_percent,
            "high_risk_grants": high_risk_grants
        }
    return {}