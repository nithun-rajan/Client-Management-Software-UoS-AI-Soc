from sqlalchemy import Column, String, Float, ForeignKey, Text, DateTime, Date, Boolean, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import BaseModel
from app.models.enums import TenancyStatus

class Tenancy(BaseModel):
    __tablename__ = "tenancies"
    
    # Core relationships
    property_id = Column(String, ForeignKey('properties.id'), nullable=False)
    property = relationship("Property", back_populates="tenancies")
    
    # Primary Applicant/Tenant
    primary_applicant_id = Column(String, ForeignKey('applicants.id'))
    applicant = relationship("Applicant", back_populates="tenancies")
    
    # Financial
    rent_amount = Column(Float, nullable=False)
    deposit_amount = Column(Float, nullable=False)
    deposit_scheme = Column(String)  # DPS, MyDeposits, TDS
    deposit_scheme_ref = Column(String)
    
    # Dates
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    notice_period_days = Column(Integer, default=30)
    notice_given_date = Column(Date)
    
    # Status
    status = Column(String, default=TenancyStatus.PENDING)
    
    # Progression tracking
    offer_accepted_date = Column(Date)
    referencing_completed_date = Column(Date)
    contract_sent_date = Column(Date)
    contract_signed_date = Column(Date)
    keys_collected_date = Column(Date)
    
    # Compliance
    right_to_rent_verified = Column(Boolean, default=False)
    right_to_rent_verified_date = Column(Date)
    inventory_completed = Column(Boolean, default=False)
    inventory_completed_date = Column(Date)
    
    # Additional occupants
    additional_occupants = Column(Text)  # JSON: [{name, email, phone}]
    
    # Notes
    notes = Column(Text)
    
    # Tasks
    tasks = relationship("Task", back_populates="tenancy")
