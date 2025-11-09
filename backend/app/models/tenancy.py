from sqlalchemy import Boolean, Column, Date, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship
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
    end_date = Column(Date, nullable=False)
    
    # Status
    status = Column(String, default=TenancyStatus.PENDING)
    
    # Progression tracking
    agreed_rent = Column(Float)
    tenancy_term = Column(String)
    special_conditions = Column(Text)

    # Holding deposit tracking
    holding_deposit_amount = Column(Float)
    holding_deposit_date = Column(Date)
    holding_deposit_payment_method = Column(String)

    # Reference status
    reference_status = Column(String)

    # Right to Rent check
    right_to_rent_status = Column(String)
    right_to_rent_check_date = Column(Date)

    # Move-in financials
    move_in_monies_received = Column(Boolean, default=False)
    security_deposit_registered = Column(Boolean, default=False)

    # Document tracking
    tenancy_agreement_sent = Column(Boolean, default=False)
    statutory_documents_sent = Column(Boolean, default=False)
    
    # Relationships
    tasks = relationship("Task", back_populates="tenancy")