from sqlalchemy import Column, String, Boolean, Date, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import BaseModel



class Landlord(BaseModel):
    __tablename__ = "landlords"
    
    # Core fields (keeping your existing structure)
    full_name = Column(String, nullable=False, index=True)
    email = Column(String, nullable=False, index=True)
    phone = Column(String)
    address = Column(Text)
    
    # Compliance fields
    aml_verified = Column(Boolean, default=False)
    aml_verification_date = Column(Date, nullable=True)
    
    # Banking
    bank_account_name = Column(String)
    sort_code = Column(String)
    account_number = Column(String)
    
    # Notes
    notes = Column(Text)
    
    # Contact tracking
    last_contacted_at = Column(DateTime, nullable=True, index=True)  # When last contacted (updated on communication)
    
    # Complete info flag (similar to vendor_complete_info)
    landlord_complete_info = Column(Boolean, default=False)
    
    # Agent assignment
    managed_by = Column(String, ForeignKey('users.id'), nullable=True, index=True)  # Which agent manages this landlord
    
    # Relationships
    properties = relationship("Property", back_populates="landlord")
    communications = relationship("Communication", back_populates="landlord")
    maintenance_issues = relationship("MaintenanceIssue", back_populates="landlord", cascade="all, delete-orphan")
    managing_agent = relationship("User", foreign_keys=[managed_by])