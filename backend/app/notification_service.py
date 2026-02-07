# app/notification_service.py
from datetime import datetime
from sqlalchemy.orm import Session
from app.auth_models import UserNotification, User

class NotificationService:
    @staticmethod
    def create_assignment_notification(
        db: Session,
        contract_id: int,
        contract_name: str,
        assigned_users: list,
        assigned_by_user: User,
        user_type: str  # 'project_manager', 'program_manager', 'director'
    ):
        """Create notifications for assigned users"""
        notifications = []
        
        for user_id in assigned_users:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                continue
                
            notification = UserNotification(
                user_id=user_id,
                notification_type="agreement_assigned",
                title="New Agreement Assignment",
                message=f"You have been assigned to '{contract_name}' as a {user_type.replace('_', ' ').title()} by {assigned_by_user.full_name or assigned_by_user.username}",
                contract_id=contract_id,
                is_read=False,
                created_at=datetime.utcnow()
            )
            
            notifications.append(notification)
            db.add(notification)
        
        db.commit()
        return notifications
    
    @staticmethod
    def create_publish_notification(
        db: Session,
        contract_id: int,
        contract_name: str,
        published_by_user: User,
        assigned_users: list
    ):
        """Create notifications when agreement is published"""
        notifications = []
        
        for user_id in assigned_users:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                continue
                
            notification = UserNotification(
                user_id=user_id,
                notification_type="agreement_published",
                title="Agreement Published for Review",
                message=f"Agreement '{contract_name}' has been published and submitted for review by {published_by_user.full_name or published_by_user.username}",
                contract_id=contract_id,
                is_read=False,
                created_at=datetime.utcnow()
            )
            
            notifications.append(notification)
            db.add(notification)
        
        db.commit()
        return notifications
    
    @staticmethod
    def get_user_notifications(db: Session, user_id: int, unread_only: bool = False):
        """Get notifications for a user"""
        query = db.query(UserNotification).filter(
            UserNotification.user_id == user_id
        )
        
        if unread_only:
            query = query.filter(UserNotification.is_read == False)
        
        return query.order_by(UserNotification.created_at.desc()).all()
    
    @staticmethod
    def mark_as_read(db: Session, notification_id: int, user_id: int):
        """Mark a notification as read"""
        notification = db.query(UserNotification).filter(
            UserNotification.id == notification_id,
            UserNotification.user_id == user_id
        ).first()
        
        if notification:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            db.commit()
        
        return notification