from sqlalchemy import Column, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import BaseModel

class Viewing(BaseModel):
    """
    Property viewing appointments
    Blueprint page 779: "Viewing scheduling from applicant record"
    """
    __tablename__ = "viewings"
    
    # Relationships
    property_id = Column(String, ForeignKey('properties.id'), nullable=False)
    applicant_id = Column(String, ForeignKey('applicants.id'), nullable=False)
    
    # Viewing details
    scheduled_date = Column(DateTime, nullable=False)
    duration_minutes = Column(String, default="30")
    
    # Status
    status = Column(String, default="scheduled")  # scheduled, confirmed, completed, cancelled, no_show
    
    # Agent details
    assigned_agent = Column(String, nullable=True)
    agent_notes = Column(Text, nullable=True)
    
    # Notifications
    reminder_sent = Column(Boolean, default=False)
    confirmation_sent = Column(Boolean, default=False)
    
    # Feedback
    applicant_attended = Column(Boolean, nullable=True)
    feedback_rating = Column(String, nullable=True)  # interested, very_interested, not_interested
    feedback_notes = Column(Text, nullable=True)
    feedback_submitted_at = Column(DateTime, nullable=True)
    
    # Follow-up
    follow_up_required = Column(Boolean, default=False)
    follow_up_notes = Column(Text, nullable=True)
    
    # Relationships
    property = relationship("Property", backref="viewings")
    applicant = relationship("Applicant", backref="viewings")

