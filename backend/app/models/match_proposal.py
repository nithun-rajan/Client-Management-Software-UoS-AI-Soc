from sqlalchemy import Column, String, Float, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import BaseModel

class MatchProposal(BaseModel):
    """
    Store property match proposals that haven't been sent yet
    Allows agents to find matches, review them, and send them later
    """
    __tablename__ = "match_proposals"
    
    # Relationships
    applicant_id = Column(String, ForeignKey('applicants.id'), nullable=False)
    property_id = Column(String, ForeignKey('properties.id'), nullable=False)
    created_by_agent = Column(String, ForeignKey('users.id'), nullable=True)
    
    # Match details
    match_score = Column(Float, nullable=False)
    personalized_message = Column(Text, nullable=True)
    match_reason = Column(Text, nullable=True)  # AI-generated reasoning
    personalization_data = Column(JSON, nullable=True)  # Structured match factors
    match_reasons = Column(JSON, nullable=True)  # List of match reasons (stored as JSON)
    
    # Status
    is_sent = Column(Boolean, default=False)  # True when converted to MatchHistory
    sent_at = Column(DateTime, nullable=True)  # When it was sent
    match_history_id = Column(String, ForeignKey('match_history.id'), nullable=True)  # Link to sent match
    
    # Metadata
    notes = Column(Text, nullable=True)  # Agent notes about this proposal
    
    # Relationships
    applicant = relationship("Applicant", backref="match_proposals")
    property = relationship("Property", backref="match_proposals")
    agent = relationship("User", backref="created_match_proposals")
    match_history = relationship("MatchHistory", foreign_keys=[match_history_id])

