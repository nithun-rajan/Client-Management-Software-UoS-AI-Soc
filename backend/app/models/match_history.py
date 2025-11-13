from sqlalchemy import Column, String, Integer, Float, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import BaseModel

class MatchHistory(BaseModel):
    """
    Track when matches are sent to applicants with enhanced booking capabilities
    Blueprint page 779: Track match send history + pages 28-29: Booking integration
    """
    __tablename__ = "match_history"
    
    # Relationships
    applicant_id = Column(String, ForeignKey('applicants.id'), nullable=False)
    property_id = Column(String, ForeignKey('properties.id'), nullable=False)
    
    # Match details
    match_score = Column(Float)
    personalized_message = Column(Text)
    
    # NEW: Enhanced match analytics
    match_reason = Column(Text, nullable=True)  # AI-generated reasoning
    personalization_data = Column(JSON, nullable=True)  # Structured match factors
    
    # Sending details
    sent_at = Column(DateTime, default=datetime.date(timezone.utc))
    send_method = Column(String)  # email, sms, whatsapp
    recipient = Column(String)  # email address or phone number
    sent_by_agent = Column(String, ForeignKey('users.id'), nullable=True)  # NEW
    
    # NEW: Engagement tracking
    opened_at = Column(DateTime, nullable=True)
    clicked_at = Column(DateTime, nullable=True)
    booking_link_clicked_at = Column(DateTime, nullable=True)  # NEW
    
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
    viewing_id = Column(String, ForeignKey('viewings.id'), nullable=True)  # NEW: Link to actual viewing
    
    # NEW: Booking integration fields
    booking_token = Column(String, nullable=True, unique=True)  # Secure token for public booking
    booking_url = Column(String, nullable=True)  # Public booking link
    
    # Relationships
    applicant = relationship("Applicant", backref="match_history")
    property = relationship("Property", backref="match_history")
    agent = relationship("User", backref="sent_matches")  # NEW
    viewing = relationship("Viewing", backref="triggering_match")  # NEW