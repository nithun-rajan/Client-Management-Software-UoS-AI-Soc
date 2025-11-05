from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.models.enums import TicketStatus, TicketUrgency


class TicketBase(BaseModel):
    title: str
    description: Optional[str] = None
    property_id: str 
    reported_by_id: Optional[str] = None  
    
    # These fields use enumss.py to allow only specific values.
    status: TicketStatus = TicketStatus.NEW
    urgency: TicketUrgency = TicketUrgency.ROUTINE

class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TicketStatus] = None
    urgency: Optional[TicketUrgency] = None
    assigned_contractor_id: Optional[str] = None 


# What the API sends back 
class TicketResponse(TicketBase):
    id: str
    created_at: datetime
    updated_at: datetime
    assigned_contractor_id: Optional[str] = None 
    

    class Config:
        from_attributes = True