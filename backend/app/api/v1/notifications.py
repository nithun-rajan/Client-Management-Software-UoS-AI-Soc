# backend/app/api/v1/notifications.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=list[NotificationOut])
@router.get("/", response_model=list[NotificationOut])
def get_my_notifications(db: Session = Depends(get_db)):
    """Get all notifications (simplified for now - no auth required)"""
    return db.query(Notification)\
        .order_by(Notification.created_at.desc())\
        .all()

@router.put("/mark-all-read", status_code=status.HTTP_200_OK)
def mark_all_notifications_read(db: Session = Depends(get_db)):
    """Mark all notifications as read"""
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}

@router.put("/{notification_id}/mark-read", status_code=status.HTTP_200_OK)
def mark_notification_read(notification_id: str, db: Session = Depends(get_db)):
    """Mark a single notification as read"""
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

@router.delete("/", status_code=status.HTTP_200_OK)
def delete_all_notifications(db: Session = Depends(get_db)):
    """Delete all notifications"""
    db.query(Notification).delete()
    db.commit()
    return {"message": "All notifications deleted"}