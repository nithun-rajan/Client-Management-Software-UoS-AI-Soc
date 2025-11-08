# backend/app/schemas/notification.py
from pydantic import BaseModel, field_validator, model_validator
from datetime import datetime
from typing import Optional

class NotificationOut(BaseModel):
    id: str  # Changed from int to str - BaseModel uses UUID strings
    title: str
    body: str | None
    type: str
    priority: Optional[str] = "medium"  # "high" | "medium" | "low" - default to medium if not set
    is_read: bool
    created_at: datetime

    @field_validator('priority', mode='before')
    @classmethod
    def set_priority_default(cls, v):
        """If priority is None or empty, default to 'medium'"""
        if v is None or v == "":
            return "medium"
        return v
    
    @model_validator(mode='after')
    def ensure_priority(self):
        """Ensure priority is always set after model creation"""
        if not self.priority or self.priority == "":
            self.priority = "medium"
        return self

    class Config:
        from_attributes = True