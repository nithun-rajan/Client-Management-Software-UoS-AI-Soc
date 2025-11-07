from sqlalchemy import Column, String, Text, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

from app.models.enums import TicketStatus, TicketUrgency

class Ticket(BaseModel):
    """
    Used to track a maintenance issue from report to completion.
    Based on Blueprint Page 36: "II. [cite_start]Maintenance & Repairs". [cite: 722-724]
    """
    __tablename__ = "tickets"

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Status tracking from enums.py
    status = Column(String, nullable=False, default=TicketStatus.NEW)
    
    # Urgency tracking from enums.py
    urgency = Column(String, nullable=False, default=TicketUrgency.ROUTINE)
    ticket_category = Column(String, nullable=False)
    priority = Column(String, nullable=False, default="low")
    reported_date = Column(Date, nullable=False)

    # Required Relationships 
    
    # 1. Link to the Property
    property_id = Column(String, ForeignKey('properties.id'), nullable=False)
    property = relationship("Property", back_populates="tickets")

    # 2. Link to the Applicant 
    applicant_id = Column(String, ForeignKey('applicants.id'), nullable=True)
    reporter = relationship("Applicant", back_populates="reported_tickets")
    
    # 3. Link to the Contractor (Not built yet)
    # We still need the column for the schema, but not the ForeignKey.
    assigned_contractor_id = Column(String, nullable=True)