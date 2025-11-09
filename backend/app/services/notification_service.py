# app/services/notification_service.py
from app.models.notification import Notification

def notify(db, user_id, title, body=None, type="info", priority="medium"):
    """
    Create a notification
    
    Args:
        db: Database session
        user_id: User ID (can be None)
        title: Notification title
        body: Notification body (usually entity ID for navigation)
        type: Notification type (applicant, property, landlord, etc.)
        priority: Priority level - "high", "medium", or "low" (default: "medium")
    """
    n = Notification(
        user_id=user_id,
        title=title,
        body=body,
        type=type,
        priority=priority
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return n
