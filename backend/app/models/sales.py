from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean, Numeric, JSON
from sqlalchemy.orm import relationship

from app.models.base import Base
from app.models.enums_sales import *


class SalesProgression(Base):
    __tablename__ = "sales_progression"

    # Foreign Keys
    property_id = Column(String, ForeignKey("properties.id"), nullable=False, index=True)
    vendor_id = Column(String, ForeignKey("vendors.id"), nullable=False, index=True)
    buyer_id = Column(String, ForeignKey("applicants.id"), nullable=False, index=True)
    assigned_progressor_id = Column(String, ForeignKey("users.id"), index=True)
    
    # Core Progression Tracking
    current_stage = Column(String, default=SalesStage.OFFER_ACCEPTED, index=True)
    sales_status = Column(String, default=SalesStatus.UNDER_OFFER, index=True)
    
    # Key Dates
    offer_date = Column(DateTime(timezone=True))
    offer_accepted_date = Column(DateTime(timezone=True))
    sstc_date = Column(DateTime(timezone=True))
    solicitor_instructed_date = Column(DateTime(timezone=True))
    mortgage_applied_date = Column(DateTime(timezone=True))
    survey_ordered_date = Column(DateTime(timezone=True))
    searches_ordered_date = Column(DateTime(timezone=True))
    exchange_date = Column(DateTime(timezone=True))
    completion_date = Column(DateTime(timezone=True))
    
    # Offer Details
    offer_amount = Column(Numeric(12, 2))
    agreed_price = Column(Numeric(12, 2))
    offer_status = Column(String, default=OfferStatus.PENDING)
    offer_conditions = Column(Text)
    
    # Chain Information
    chain_id = Column(String, index=True)
    chain_position = Column(String, default=ChainPosition.CHAIN_UNKNOWN)
    is_chain_break = Column(Boolean, default=False)
    chain_notes = Column(Text)
    
    # Solicitor/Conveyancer Details
    buyer_solicitor_name = Column(String)
    buyer_solicitor_contact = Column(String)
    buyer_solicitor_email = Column(String)
    vendor_solicitor_name = Column(String)
    vendor_solicitor_contact = Column(String)
    vendor_solicitor_email = Column(String)
    
    # Mortgage & Finance
    mortgage_status = Column(String, default=MortgageStatus.NOT_APPLIED)
    mortgage_lender = Column(String)
    mortgage_offer_expiry = Column(DateTime(timezone=True))
    mortgage_notes = Column(Text)
    
    # Survey Details
    survey_type = Column(String, default=SurveyType.NONE)
    surveyor_name = Column(String)
    survey_issues_identified = Column(Boolean, default=False)
    survey_issues_notes = Column(Text)
    
    # Document Status Tracking
    memorandum_status = Column(String, default=SalesDocumentStatus.NOT_REQUESTED)
    title_deeds_status = Column(String, default=SalesDocumentStatus.NOT_REQUESTED)
    management_pack_status = Column(String, default=SalesDocumentStatus.NOT_REQUESTED)
    ta6_form_status = Column(String, default=SalesDocumentStatus.NOT_REQUESTED)
    ta7_form_status = Column(String, default=SalesDocumentStatus.NOT_REQUESTED)
    ta10_form_status = Column(String, default=SalesDocumentStatus.NOT_REQUESTED)
    searches_status = Column(String, default=SalesDocumentStatus.NOT_REQUESTED)
    
    # Leasehold Specific
    is_leasehold = Column(Boolean, default=False)
    service_charge = Column(Numeric(10, 2))
    ground_rent = Column(Numeric(10, 2))
    lease_length_years = Column(Numeric(5, 0))
    major_works_planned = Column(Boolean, default=False)
    major_works_details = Column(Text)
    
    # Progression Checklist
    checklist_completed = Column(JSON, default=dict)
    
    # Status and Notes
    is_fall_through = Column(Boolean, default=False)
    fall_through_reason = Column(Text)
    delay_reason = Column(Text)
    internal_notes = Column(Text)
    
    # KPI Tracking
    days_from_offer_to_sstc = Column(Numeric(5, 0))
    days_from_sstc_to_exchange = Column(Numeric(5, 0))
    days_from_exchange_to_completion = Column(Numeric(5, 0))
    total_days_to_complete = Column(Numeric(5, 0))

    def __repr__(self):
        return f"<SalesProgression(property_id={self.property_id}, stage={self.current_stage}, status={self.sales_status})>"


class Offer(Base):
    __tablename__ = "offers"

    # Foreign Keys
    property_id = Column(String, ForeignKey("properties.id"), nullable=False, index=True)
    buyer_id = Column(String, ForeignKey("applicants.id"), nullable=False, index=True)
    sales_progression_id = Column(String, ForeignKey("sales_progression.id"), index=True)
    
    # Offer Details
    offer_amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String, default=OfferStatus.PENDING, index=True)
    
    # Offer Conditions
    is_subject_to_survey = Column(Boolean, default=True)
    is_subject_to_contract = Column(Boolean, default=True)
    is_subject_to_mortgage = Column(Boolean, default=True)
    is_cash_buyer = Column(Boolean, default=False)
    has_chain = Column(Boolean, default=False)
    
    # Timeline
    offer_made_date = Column(DateTime(timezone=True))
    offer_expiry_date = Column(DateTime(timezone=True))
    decision_date = Column(DateTime(timezone=True))
    
    # Additional Details
    special_conditions = Column(Text)
    notes = Column(Text)

    def __repr__(self):
        return f"<Offer(property_id={self.property_id}, amount={self.offer_amount}, status={self.status})>"