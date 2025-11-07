from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
# Assuming these enums are correctly imported and defined elsewhere
from app.models.enums import TicketStatus, TicketUrgency


class TicketBase(BaseModel):
    title: str
    description: Optional[str] = None
    
    property_id: str 
    applicant_id: Optional[int] = None 
    
    # Set default values for creation/base schema
    status: TicketStatus = TicketStatus.NEW 
    urgency: TicketUrgency = TicketUrgency.ROUTINE
    ticket_category: str 
    priority: str = "low"
    reported_date: date = date.today()
    
    model_config = {
        "arbitrary_types_allowed": True
    } 

class TicketCreate(TicketBase):
    """Schema for creating a new ticket. Inherits all fields from TicketBase."""
    pass

class TicketUpdate(BaseModel):
    """Schema for updating an existing ticket. All fields are optional."""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TicketStatus] = None
    urgency: Optional[TicketUrgency] = None
    
    assigned_contractor_id: Optional[int] = None 
    
    model_config = {
        "arbitrary_types_allowed": True
    }

# What the API sends back 
class TicketResponse(TicketBase):
    id: int 
    created_at: datetime
    updated_at: datetime
    
    assigned_contractor_id: Optional[int] = None 
    
   
    property_id: str
    applicant_id: Optional[int] = None
    
    model_config = {
        "from_attributes": True
    }