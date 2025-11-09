from sqlalchemy import Column, String, Integer, Float, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import BaseModel

class MatchHistory(BaseModel):
    """
    Track when matches are sent to applicants
    Blueprint page 779: Track match send history
    """
    __tablename__ = "match_history"
    
    # Relationships
    applicant_id = Column(String, ForeignKey('applicants.id'), nullable=False)
    property_id = Column(String, ForeignKey('properties.id'), nullable=False)
    
    # Match details
    match_score = Column(Float)
    personalized_message = Column(Text)
    
    # Sending details
    sent_at = Column(DateTime, default=datetime.utcnow)
    send_method = Column(String)  # email, sms, whatsapp
    recipient = Column(String)  # email address or phone number
    
    # Response tracking
    viewed = Column(Boolean, default=False)
    viewed_at = Column(DateTime, nullable=True)
    
    responded = Column(Boolean, default=False)
    response_type = Column(String, nullable=True)  # interested, not_interested, booked_viewing
    response_at = Column(DateTime, nullable=True)
    response_notes = Column(Text, nullable=True)
    
    # Viewing outcome
    viewing_booked = Column(Boolean, default=False)
    viewing_date = Column(DateTime, nullable=True)
    
    # Relationships
    applicant = relationship("Applicant", backref="match_history")
    property = relationship("Property", backref="match_history")