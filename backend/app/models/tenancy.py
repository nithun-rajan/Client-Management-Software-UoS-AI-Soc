from sqlalchemy import Boolean, Column, Date, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel
from app.models.enums import TenancyStatus


class Tenancy(BaseModel):
    __tablename__ = "tenancies"
    

    # Core tenancy details
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    rent_amount = Column(Float, nullable=False)
    deposit_amount = Column(Float)
    status = Column(String, default=TenancyStatus.PENDING)

    # Progression tracking (from pages 29-31)
    agreed_rent = Column(Float)  # Page 29: "Agreed Rent"
    tenancy_term = Column(String)  # Page 29: "Tenancy Term"
    special_conditions = Column(Text)  # Page 29: "Special Conditions"

    # Holding deposit tracking (Page 29: 1.4)
    holding_deposit_amount = Column(Float)
    holding_deposit_date = Column(Date)
    holding_deposit_payment_method = Column(String)

    # Reference status (Page 30: 2.2)
    reference_status = Column(String)  # pending, pass, fail, pass_with_conditions

    # Right to Rent check (Page 31: 2.3)
    right_to_rent_status = Column(String)
    right_to_rent_check_date = Column(Date)

    # Move-in financials (Page 31: 3.3)
    move_in_monies_received = Column(Boolean, default=False)
    security_deposit_registered = Column(Boolean, default=False)  # Page 32: 3.4

    # Document tracking
    tenancy_agreement_sent = Column(Boolean, default=False)  # Page 31: 3.1
<<<<<<< HEAD
=======
    tenancy_agreement_signed = Column(Boolean, default=False) # Page 32: 3.5
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
    statutory_documents_sent = Column(Boolean, default=False)  # Page 31: 3.2
    
    # Relationships
    property_id = Column(String, ForeignKey('properties.id'), nullable=False)
    property = relationship("Property", back_populates="tenancies")

    # Tenant information
    applicant_id = Column(String, ForeignKey('applicants.id'), nullable=True)  # Link to applicant record
    applicant = relationship("Applicant", back_populates="tenancies")
    
    # Direct tenant information (for quick access, synced from applicant)
    tenant_name = Column(String, nullable=True)  # Primary tenant name
    tenant_email = Column(String, nullable=True)  # Primary tenant email
    tenant_phone = Column(String, nullable=True)  # Primary tenant phone
    tenant_id = Column(String, nullable=True, index=True)  # Tenant ID (can be same as applicant_id or separate)
    
    # Property manager assignment
    managed_by = Column(String, ForeignKey('users.id'), nullable=True)  # Property manager user_id
    
    # Relationships
    tasks = relationship("Task", back_populates="tenancy")
    maintenance_issues = relationship("MaintenanceIssue", back_populates="tenancy", cascade="all, delete-orphan")
