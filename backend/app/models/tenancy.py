from sqlalchemy import Boolean, Column, Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel
from app.models.enums import TenancyStatus


class Tenancy(BaseModel):
    __tablename__ = "tenancies"

    # Core relationships
    property_id = Column(String, ForeignKey("properties.id"), nullable=False)
    property = relationship("Property", back_populates="tenancies")

    # Primary Applicant/Tenant
    applicant_id = Column(String, ForeignKey("applicants.id"))
    applicant = relationship("Applicant", back_populates="tenancies")

    # Financial
    rent_amount = Column(Float, nullable=False)
    deposit_amount = Column(Float, nullable=False)
    deposit_scheme = Column(String)  # DPS, MyDeposits, TDS
    deposit_scheme_ref = Column(String)

    # Holding deposit tracking (Page 29: 1.4)
    holding_deposit_amount = Column(Float)
    holding_deposit_date = Column(Date)
    holding_deposit_payment_method = Column(String)

    # Dates
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    notice_period_days = Column(Integer, default=30)
    notice_given_date = Column(Date)

    # Status
    status = Column(String, default=TenancyStatus.DRAFT)

    # Progression tracking (from pages 29-31)
    agreed_rent = Column(Float)  # Page 29: "Agreed Rent"
    tenancy_term = Column(String)  # Page 29: "Tenancy Term"
    special_conditions = Column(Text)  # Page 29: "Special Conditions"
    offer_accepted_date = Column(Date)
    referencing_completed_date = Column(Date)
    contract_sent_date = Column(Date)
    contract_signed_date = Column(Date)
    keys_collected_date = Column(Date)

    # Reference status (Page 30: 2.2)
    reference_status = Column(String)  # pending, pass, fail, pass_with_conditions

    # Compliance
    right_to_rent_verified = Column(Boolean, default=False)
    right_to_rent_verified_date = Column(Date)
    inventory_completed = Column(Boolean, default=False)
    inventory_completed_date = Column(Date)

    # Move-in financials (Page 31: 3.3)
    move_in_monies_received = Column(Boolean, default=False)
    security_deposit_registered = Column(Boolean, default=False)  # Page 32: 3.4

    # Document tracking
    tenancy_agreement_sent = Column(Boolean, default=False)  # Page 31: 3.1
    statutory_documents_sent = Column(Boolean, default=False)  # Page 31: 3.2

    # Additional occupants
    additional_occupants = Column(Text)  # JSON: [{name, email, phone}]

    # Notes
    notes = Column(Text)

    # Tasks
    tasks = relationship("Task", back_populates="tenancy")
