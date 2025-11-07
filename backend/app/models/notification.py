# backend/app/models/notification.py
from sqlalchemy import Column, String, ForeignKey, Boolean
from app.models.base import BaseModel


class Notification(BaseModel):
    __tablename__ = "notifications"

    # Link to users.id (users use string UUID primary keys via BaseModel)
    user_id = Column(String, ForeignKey("users.id"))
    title = Column(String(100), nullable=False)
    body = Column(String(255))
    type = Column(String(50))  # "applicant" | "viewing" | "offer" | ...
    is_read = Column(Boolean, default=False)