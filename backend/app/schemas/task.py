from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"  # low/medium/high/urgent
    due_date: Optional[datetime] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    tenancy_id: Optional[str] = None
    vendor_id: Optional[str] = None
    assigned_to: Optional[str] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    assigned_to: Optional[str] = None


class TaskResponse(TaskBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True