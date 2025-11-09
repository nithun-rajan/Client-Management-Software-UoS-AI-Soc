from sqlalchemy import Column, String, Float, DateTime, Text, Boolean, ForeignKey, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import BaseModel

class Offer(BaseModel):
    """
    Property offers from applicants
    Blueprint page 779: "Offers & tenancy progress"
    """
    __tablename__ = "offers"
    
    # Relationships
    property_id = Column(String, ForeignKey('properties.id'), nullable=False)
    applicant_id = Column(String, ForeignKey('applicants.id'), nullable=False)
    
    # Offer details
    offered_rent = Column(Float, nullable=False)
    proposed_start_date = Column(DateTime, nullable=True)
    proposed_term_months = Column(Integer, nullable=True)  # 6, 12, 18, 24
    
    # Status
    status = Column(String, default="submitted")  # submitted, accepted, rejected, countered, withdrawn
    
    # Negotiation
    counter_offer_rent = Column(Float, nullable=True)
    negotiation_notes = Column(Text, nullable=True)
    
    # Conditions
    special_conditions = Column(Text, nullable=True)  # e.g., "Pet clause", "Early move-in"
    
    # Timing
    submitted_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)
    accepted_at = Column(DateTime, nullable=True)
    
    # Additional details
    applicant_notes = Column(Text, nullable=True)  # Why they want this property
    agent_notes = Column(Text, nullable=True)  # Internal notes
    
    # Financial
    deposit_amount = Column(Float, nullable=True)
    holding_deposit_paid = Column(Boolean, default=False)
    holding_deposit_amount = Column(Float, nullable=True)
    holding_deposit_date = Column(DateTime, nullable=True)
    
    # Relationships
    property = relationship("Property", backref="offers")
    applicant = relationship("Applicant", backref="offers")