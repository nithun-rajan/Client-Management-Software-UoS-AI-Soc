# backend/app/api/v1/notifications.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core import security
from app.core.database import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationOut
from app.schemas.user import Role

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/", response_model=list[NotificationOut])
def get_my_notifications(
    db: Session = Depends(get_db),
    user = Depends(security.require_role([Role.AGENT]))
):
    return db.query(Notification)\
        .filter(Notification.user_id == user.id)\
        .order_by(Notification.created_at.desc())\
        .all()