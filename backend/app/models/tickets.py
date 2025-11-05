from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.models.enums import TicketStatus, TicketUrgency

class Ticket(BaseModel):
    
    #Used to track a maintenance issue from report to completion.

    __tablename__ = "tickets"

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Status tracking from enums.py
    status = Column(String, nullable=False, default=TicketStatus.NEW)
    
    # Urgency tracking from enums.py
    urgency = Column(String, nullable=False, default=TicketUrgency.ROUTINE)

    # Required Relationships
    
    # 1. Link to the Property
    property_id = Column(String, ForeignKey('properties.id'), nullable=False)
    property = relationship("Property", back_populates="tickets")

    # 2. Link to the Applicant 
    reported_by_id = Column(String, ForeignKey('applicants.id'), nullable=True)
    reporter = relationship("Applicant", back_populates="reported_tickets")
    
    # 3. Link to the Contractor (Not built yet)
    assigned_contractor_id = Column(String, ForeignKey('contractors.id'), nullable=True)
    contractor = relationship("Contractor", back_populates="assigned_tickets")
    
    # 4. Link to Comments (Not built yet)
    comments = relationship("Comment", back_populates="ticket", cascade="all, delete-orphan")
    
    # 5. Link to Attachments (Not built yet)
    attachments = relationship("Attachment", back_populates="ticket", cascade="all, delete-orphan")