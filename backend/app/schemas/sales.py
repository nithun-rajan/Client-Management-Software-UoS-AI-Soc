from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.model_config import CustomModelConfig


class SalesProgressionBase(BaseModel):
    property_id: str = Field(..., description="Linked property ID")
    vendor_id: str = Field(..., description="Linked vendor ID")
    buyer_id: str = Field(..., description="Linked buyer applicant ID")
    assigned_progressor_id: Optional[str] = Field(None, description="Assigned sales progressor user ID")
    
    # Core progression tracking
    current_stage: str = Field(..., description="Current sales stage")
    sales_status: str = Field(..., description="Current sales status")
    
    # Key dates
    offer_date: Optional[datetime] = None
    offer_accepted_date: Optional[datetime] = None
    sstc_date: Optional[datetime] = None
    solicitor_instructed_date: Optional[datetime] = None
    mortgage_applied_date: Optional[datetime] = None
    survey_ordered_date: Optional[datetime] = None
    searches_ordered_date: Optional[datetime] = None
    exchange_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    
    # Offer details
    offer_amount: Optional[float] = None
    agreed_price: Optional[float] = None
    offer_status: Optional[str] = None
    offer_conditions: Optional[str] = None
    
    # Chain information
    chain_id: Optional[str] = None
    chain_position: Optional[str] = None
    is_chain_break: bool = False
    chain_notes: Optional[str] = None
    
    # Solicitor details
    buyer_solicitor_name: Optional[str] = None
    buyer_solicitor_contact: Optional[str] = None
    buyer_solicitor_email: Optional[str] = None
    vendor_solicitor_name: Optional[str] = None
    vendor_solicitor_contact: Optional[str] = None
    vendor_solicitor_email: Optional[str] = None
    
    # Mortgage & finance
    mortgage_status: Optional[str] = None
    mortgage_lender: Optional[str] = None
    mortgage_offer_expiry: Optional[datetime] = None
    mortgage_notes: Optional[str] = None
    
    # Survey details
    survey_type: Optional[str] = None
    surveyor_name: Optional[str] = None
    survey_issues_identified: bool = False
    survey_issues_notes: Optional[str] = None
    
    # Document status
    memorandum_status: Optional[str] = None
    title_deeds_status: Optional[str] = None
    management_pack_status: Optional[str] = None
    ta6_form_status: Optional[str] = None
    ta7_form_status: Optional[str] = None
    ta10_form_status: Optional[str] = None
    searches_status: Optional[str] = None
    
    # Leasehold specific
    is_leasehold: bool = False
    service_charge: Optional[float] = None
    ground_rent: Optional[float] = None
    lease_length_years: Optional[int] = None
    major_works_planned: bool = False
    major_works_details: Optional[str] = None
    
    # Checklist
    checklist_completed: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    # Status and notes
    is_fall_through: bool = False
    fall_through_reason: Optional[str] = None
    delay_reason: Optional[str] = None
    internal_notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
    
class SalesProgressionCreate(SalesProgressionBase):
    pass


class SalesProgressionUpdate(BaseModel):
    current_stage: Optional[str] = None
    sales_status: Optional[str] = None
    offer_amount: Optional[float] = None
    agreed_price: Optional[float] = None
    offer_status: Optional[str] = None
    chain_position: Optional[str] = None
    is_chain_break: Optional[bool] = None
    mortgage_status: Optional[str] = None
    survey_type: Optional[str] = None
    survey_issues_identified: Optional[bool] = None
    is_fall_through: Optional[bool] = None
    fall_through_reason: Optional[str] = None
    delay_reason: Optional[str] = None
    internal_notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SalesProgressionInDB(SalesProgressionBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    days_from_offer_to_sstc: Optional[int] = None
    days_from_sstc_to_exchange: Optional[int] = None
    days_from_exchange_to_completion: Optional[int] = None
    total_days_to_complete: Optional[int] = None


class SalesProgressionResponse(SalesProgressionInDB):
    pass


# Offer Schemas
class OfferBase(BaseModel):
    property_id: str = Field(..., description="Linked property ID")
    buyer_id: str = Field(..., description="Linked buyer applicant ID")
    sales_progression_id: Optional[str] = Field(None, description="Linked sales progression ID")
    
    offer_amount: float = Field(..., description="Offer amount")
    status: str = Field(..., description="Offer status")
    
    # Offer conditions
    is_subject_to_survey: bool = True
    is_subject_to_contract: bool = True
    is_subject_to_mortgage: bool = True
    is_cash_buyer: bool = False
    has_chain: bool = False
    
    # Timeline
    offer_made_date: Optional[datetime] = None
    offer_expiry_date: Optional[datetime] = None
    decision_date: Optional[datetime] = None
    
    # Additional details
    special_conditions: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class OfferCreate(OfferBase):
    pass


class OfferUpdate(BaseModel):    
    status: Optional[str] = None
    offer_amount: Optional[float] = None
    decision_date: Optional[datetime] = None
    special_conditions: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class OfferInDB(OfferBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class OfferResponse(OfferInDB):
    pass