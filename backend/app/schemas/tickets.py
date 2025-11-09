from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime 
from app.models.enums import TicketStatus, TicketUrgency


class TicketBase(BaseModel):
    # Core schema for a ticket. Defines required data for ticket creation.
    
    title: str
    description: Optional[str] = None
    
    # Foreign keys (IDs); property_id must be a string (e.g., UUID)
    property_id: str 
    applicant_id: Optional[int] = None 
    
    # Default status values for a new ticket
    status: TicketStatus = TicketStatus.NEW 
    urgency: TicketUrgency = TicketUrgency.ROUTINE
    
    # Required fields needed by the database (resolved a 500 IntegrityError)
    ticket_category: str 
    priority: str 
    reported_date: date

    
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


class TicketResponse(TicketBase):
    # Schema for what the API sends back (includes database-generated fields)
    
    id: str # The unique ID assigned by the database (a string/UUID)
    created_at: datetime
    updated_at: Optional[datetime] # Allows null value from the database
    
    assigned_contractor_id: Optional[int] = None 
    
    
    property_id: str
    applicant_id: Optional[int] = None
    
    model_config = {
        "from_attributes": True
    }