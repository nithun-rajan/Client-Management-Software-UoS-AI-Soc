"""
Communication Model - Activity Feed / Communication Log

Tracks all communications and activities linked to Properties, Landlords, and Applicants
As per Blueprint: Activity feed with calls logged, emails sent, SMS messages, tasks created
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models.base import BaseModel


class Communication(BaseModel):
    """
    Communication/Activity Log Model
    
    Polymorphic association to link communications to Properties, Landlords, or Applicants
    Used for compliance tracking and relationship management
    """
    __tablename__ = "communications"
    

    
    
    # Communication Type & Details
    type = Column(String(50), nullable=False, index=True)  # email, call, sms, note, task, meeting, viewing
    subject = Column(String(255), nullable=True)  # Optional subject line
    content = Column(Text, nullable=False)  # Main content/body/notes
    
    # Metadata
    direction = Column(String(20), nullable=True)  # inbound, outbound (null for notes/tasks)
    created_by = Column(String(255), nullable=True)  # User who created this entry

    
    # Flags
    is_important = Column(Boolean, default=False)  # Flag for priority communications
    is_read = Column(Boolean, default=False)  # Track if communication has been reviewed
    
    # Polymorphic Relationships (at least one must be set)
<<<<<<< HEAD
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=True, index=True)
    landlord_id = Column(Integer, ForeignKey("landlords.id"), nullable=True, index=True)
    applicant_id = Column(Integer, ForeignKey("applicants.id"), nullable=True, index=True)
=======
    # Use String to match other models (Property, Landlord, Applicant all use String UUIDs)
    property_id = Column(String, ForeignKey("properties.id"), nullable=True, index=True)
    landlord_id = Column(String, ForeignKey("landlords.id"), nullable=True, index=True)
    applicant_id = Column(String, ForeignKey("applicants.id"), nullable=True, index=True)
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
    
    # Relationships (back-references)
    property = relationship("Property", back_populates="communications")
    landlord = relationship("Landlord", back_populates="communications")
    applicant = relationship("Applicant", back_populates="communications")
    
    def __repr__(self):
        entity = (
            f"Property#{self.property_id}" if self.property_id else
            f"Landlord#{self.landlord_id}" if self.landlord_id else
            f"Applicant#{self.applicant_id}" if self.applicant_id else
            "None"
        )
        return f"<Communication(id={self.id}, type={self.type}, entity={entity})>"

