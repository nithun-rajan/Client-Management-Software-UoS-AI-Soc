from sqlalchemy import Column, String, Text, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.models.base import BaseModel



from app.models.enums import TicketStatus, TicketUrgency

class Ticket(BaseModel):
    """
    SQLAlchemy model representing a maintenance or repair ticket.
    All fields marked nullable=False must be present during creation.
    """
    __tablename__ = "tickets"

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Status and Urgency fields use string Enums from app.models.enums
    status = Column(String, nullable=False, default=TicketStatus.NEW)
    
    urgency = Column(String, nullable=False, default=TicketUrgency.ROUTINE)
    
    # Required field for categorization (caused previous IntegrityError)
    ticket_category = Column(String, nullable=False)
    
    priority = Column(String, nullable=False, default="low")
    
    # Required field for the date the issue was reported (caused previous IntegrityError)
    reported_date = Column(Date, nullable=False)

    # --- Relationships (Foreign Keys) --- 
    
    # Links to the Property (Required: Must be a valid property ID)
    property_id = Column(String, ForeignKey('properties.id'), nullable=False)
    property = relationship("Property", back_populates="tickets")

    # Links to the Applicant/Reporter (Nullable: Allows tickets from unassigned sources)
    applicant_id = Column(String, ForeignKey('applicants.id'), nullable=True)
    reporter = relationship("Applicant", back_populates="reported_tickets")
    
    # Field to assign a contractor (Pure data field, no ForeignKey constraint here)
    assigned_contractor_id = Column(String, nullable=True)