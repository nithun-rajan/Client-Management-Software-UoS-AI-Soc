
from sqlalchemy import Column, String, Date, Text, Float, Boolean, ForeignKey, DateTime, Integer
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import BaseModel
from app.models.enums import ApplicantStatus
from app.models.enums_sales import MortgageStatus, BuyerType


class Applicant(BaseModel):
    __tablename__ = "applicants"

    # Basic identity (from page 22-23)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    date_of_birth = Column(Date)
    
    # Applicant status (page 23)
    status = Column(String, default=ApplicantStatus.NEW)
    
    # Property requirements (page 23-24)
    desired_bedrooms = Column(String)
    desired_property_type = Column(String)
    rent_budget_min = Column(Float)
    rent_budget_max = Column(Float)
    preferred_locations = Column(Text)
    move_in_date = Column(Date)
    
    # Additional criteria
    has_pets = Column(Boolean, default=False)
    pet_details = Column(Text)
    special_requirements = Column(Text)
    
    # CRM fields - Agent assignment and contact tracking
    assigned_agent_id = Column(String, ForeignKey('users.id'), nullable=True, index=True)  # Which agent owns this applicant
    last_contacted_at = Column(DateTime, nullable=True, index=True)  # When last contacted (updated on communication)
    notes = Column(Text, nullable=True)  # General notes about the applicant
    
    # Relationships
    tenancies = relationship("Tenancy", back_populates="applicant")
    communications = relationship("Communication", back_populates="applicant")
    assigned_agent = relationship("User", foreign_keys=[assigned_agent_id])
    letting_offers = relationship("Offer", back_populates="applicant")  # Lettings offers
    sales_progression = relationship("SalesProgression", back_populates="buyer")
    sales_offers = relationship("SalesOffer", back_populates="buyer")  # Sales offers
    reported_tickets = relationship("Ticket", back_populates="reporter")

    # Sales buyer specific fields
    buyer_type = Column(String)
    mortgage_status = Column(String, default=MortgageStatus.NOT_APPLIED)
    has_property_to_sell = Column(Boolean, default=False)
    is_chain_free = Column(Boolean, default=False)

    # Financial & Affordability (Page 56-57)
    budget_min = Column(Float)  # Minimum budget
    budget_max = Column(Float)  # Maximum budget
    maximum_spend = Column(Float)  # Absolute maximum they can spend
    budget_flexible = Column(Boolean, default=False)  # If budget is negotiable
    deposit_source = Column(String)  # savings / sale_of_property / equity_release / gift
    monthly_household_income = Column(Float)
    employment_status = Column(String)
    
    # Mortgage & Finance Details (Page 57)
    mortgage_lender = Column(String)  # If they have a preferred lender
    mortgage_broker_name = Column(String)
    mortgage_broker_contact = Column(String)
    agreement_in_principle_amount = Column(Float)  # AIP amount
    agreement_in_principle_date = Column(Date)  # When AIP was obtained
    agreement_in_principle_expiry = Column(Date)  # When AIP expires
    
    # Buyer Status & Readiness (Page 57-58)
    buying_timeline = Column(String)  # ASAP / 1-3 months / 3-6 months / 6+ months
    readiness_level = Column(String)  # Hot / Warm / Cold
    current_property_status = Column(String)  # Renting / Owner / Living with family / Vacant
    solicitor_name = Column(String)
    solicitor_firm = Column(String)
    solicitor_contact = Column(String)
    decision_makers = Column(Text)  # Who needs to approve purchases
    
    # Search Criteria (Page 58-59)
    primary_locations = Column(Text)  # JSON or comma-separated preferred areas
    secondary_areas = Column(Text)  # Backup areas
    property_types = Column(Text)  # Flat / Terraced / Semi / Detached / Bungalow
    min_bedrooms = Column(Integer)
    max_bedrooms = Column(Integer)
    min_bathrooms = Column(Integer)
    outdoor_space_required = Column(Boolean, default=False)  # Garden/balcony
    parking_required = Column(Boolean, default=False)
    accessibility_requirements = Column(Text)  # Step-free access, wheelchair, etc.
    tenure_preference = Column(String)  # Freehold / Leasehold / No preference
    condition_preference = Column(String)  # New build / Modern / Period / Renovation
    key_features_required = Column(Text)  # Ensuite, home office, etc.
    school_catchment_important = Column(Boolean, default=False)
    preferred_schools = Column(Text)
    max_commute_time = Column(Integer)  # Maximum commute in minutes
    min_property_size = Column(Float)  # Minimum sqft or sqm
    
    # AML/KYC Compliance (Page 57)
    aml_status = Column(String, default="not_checked")  # not_checked / in_progress / verified / failed
    proof_of_funds_uploaded = Column(Boolean, default=False)
    id_document_uploaded = Column(Boolean, default=False)
    proof_of_address_uploaded = Column(Boolean, default=False)
    
    # Marketing & Communications (Page 61)
    marketing_consent = Column(Boolean, default=False)  # GDPR consent for marketing
    alert_preferences = Column(String, default="instant")  # instant / daily / weekly
    preferred_contact_times = Column(Text)  # When they prefer to be contacted
    viewing_availability = Column(Text)  # JSON or text of available times
    
    # Source & Analytics (Page 56)
    source_of_lead = Column(String)  # portal / referral / branch_walk_in / social / advertising
    tags = Column(Text)  # JSON or comma-separated tags for segmentation

    # Relationships
    tenancies = relationship("Tenancy", back_populates="applicant")
    communications = relationship("Communication", back_populates="applicant")
    sales_progression = relationship("SalesProgression", back_populates="buyer")


    # Willingness flags
    willing_to_rent = Column(Boolean, default=True)
    willing_to_buy = Column(Boolean, default=False)
    
    # Buyer registration questions
    buyer_questions_answered = Column(Boolean, default=False)  # Flag indicating if buyer answered registration questions

    # --- ADD THESE NEW COMPLIANCE COLUMNS ---
    
    # Anti-Money Laundering (AML) Tracking
    aml_check_status = Column(String, default='not_started') # e.g., not_started, pending, pass, fail
    aml_check_date = Column(Date, nullable=True)
    
    # Guardianship Tracking
    is_guardianship_required = Column(Boolean, default=False)
    guardianship_details = Column(Text, nullable=True)
    
    # --- END OF ADDITION ---
    
    # Tenant registration questions
    tenant_questions_answered = Column(Boolean, default=False)  # Flag indicating if tenant answered registration questions