# backend/app/schemas/notification.py
from pydantic import BaseModel
from datetime import datetime

class NotificationOut(BaseModel):
    id: int
    title: str
    body: str | None
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True