# backend/app/models/notification.py
from sqlalchemy import Column, String, ForeignKey, Boolean
from app.models.base import BaseModel


class Notification(BaseModel):
    __tablename__ = "notifications"

    # Link to users.id (users use string UUID primary keys via BaseModel)
    # Made nullable for now to allow notifications without users
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    title = Column(String(100), nullable=False)
    body = Column(String(255))
    type = Column(String(50))  # "applicant" | "viewing" | "offer" | ...
    priority = Column(String(20), default="medium")  # "high" | "medium" | "low"
    is_read = Column(Boolean, default=False)