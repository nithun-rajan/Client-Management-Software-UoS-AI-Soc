from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, computed_field

from app.schemas.model_config import AppBaseModel

from app.models.applicant import ApplicantStatus


class ApplicantBase(AppBaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    date_of_birth: date | None = None
    desired_bedrooms: str | None = None
    desired_property_type: str | None = None
    rent_budget_min: float | None = None
    rent_budget_max: float | None = None
    preferred_locations: str | None = None
    move_in_date: date | None = None
    has_pets: bool = False
    pet_details: str | None = None
    special_requirements: str | None = None
    willing_to_rent: bool = True
    willing_to_buy: bool = False
    buyer_questions_answered: bool = False
    tenant_questions_answered: bool = False
    # --- ADD NEW COMPLIANCE FIELDS HERE ---
    # We add them here so they are part of Create and Response
    aml_check_status: str | None = "not_started" # Match model default
    aml_check_date: date | None = None
    is_guardianship_required: bool = False # Match model default
    guardianship_details: str | None = None
    # --- END OF ADDITION ---

    model_config = ConfigDict(arbitrary_types_allowed=True)

    # Sales buyer specific fields
    buyer_type: str | None = None
    mortgage_status: str | None = None
    has_property_to_sell: bool = False
    is_chain_free: bool = False
    
    # Financial & Affordability
    budget_min: float | None = None
    budget_max: float | None = None
    maximum_spend: float | None = None
    budget_flexible: bool = False
    deposit_source: str | None = None
    monthly_household_income: float | None = None
    employment_status: str | None = None
    
    # Mortgage & Finance Details
    mortgage_lender: str | None = None
    mortgage_broker_name: str | None = None
    mortgage_broker_contact: str | None = None
    agreement_in_principle_amount: float | None = None
    agreement_in_principle_date: date | None = None
    agreement_in_principle_expiry: date | None = None
    
    # Buyer Status & Readiness
    buying_timeline: str | None = None
    readiness_level: str | None = None
    current_property_status: str | None = None
    solicitor_name: str | None = None
    solicitor_firm: str | None = None
    solicitor_contact: str | None = None
    decision_makers: str | None = None
    
    # Search Criteria
    primary_locations: str | None = None
    secondary_areas: str | None = None
    property_types: str | None = None
    min_bedrooms: int | None = None
    max_bedrooms: int | None = None
    min_bathrooms: int | None = None
    outdoor_space_required: bool = False
    parking_required: bool = False
    accessibility_requirements: str | None = None
    tenure_preference: str | None = None
    condition_preference: str | None = None
    key_features_required: str | None = None
    school_catchment_important: bool = False
    preferred_schools: str | None = None
    max_commute_time: int | None = None
    min_property_size: float | None = None
    
    # AML/KYC Compliance
    aml_status: str | None = None
    proof_of_funds_uploaded: bool = False
    id_document_uploaded: bool = False
    proof_of_address_uploaded: bool = False
    
    # Marketing & Communications
    marketing_consent: bool = False
    alert_preferences: str | None = None
    preferred_contact_times: str | None = None
    viewing_availability: str | None = None
    
    # Source & Analytics
    source_of_lead: str | None = None
    tags: str | None = None

class ApplicantCreate(ApplicantBase):
    pass

class ApplicantUpdate(AppBaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    date_of_birth: date | None = None
    status: str | None = None
    desired_bedrooms: str | None = None
    desired_property_type: str | None = None
    rent_budget_min: float | None = None
    rent_budget_max: float | None = None
    preferred_locations: str | None = None
    move_in_date: date | None = None
    has_pets: bool | None = None
    pet_details: str | None = None
    special_requirements: str | None = None
    willing_to_rent: bool | None = None
    willing_to_buy: bool | None = None
    buyer_questions_answered: bool | None = None
    tenant_questions_answered: bool | None = None
    assigned_agent_id: str | None = None
    last_contacted_at: datetime | None = None
    notes: str | None = None
    # --- ADD NEW COMPLIANCE FIELDS HERE ---
    # We add them here as Optional so they can be updated
    aml_check_status: str | None = None
    aml_check_date: date | None = None
    is_guardianship_required: bool | None = None
    guardianship_details: str | None = None
    # --- END OF ADDITION --


    # Sales buyer specific fields
    buyer_type: str | None = None
    mortgage_status: str | None = None
    has_property_to_sell: bool | None = None
    is_chain_free: bool | None = None
    
    # Financial & Affordability
    budget_min: float | None = None
    budget_max: float | None = None
    maximum_spend: float | None = None
    budget_flexible: bool | None = None
    deposit_source: str | None = None
    monthly_household_income: float | None = None
    employment_status: str | None = None
    
    # Mortgage & Finance Details
    mortgage_lender: str | None = None
    mortgage_broker_name: str | None = None
    mortgage_broker_contact: str | None = None
    agreement_in_principle_amount: float | None = None
    agreement_in_principle_date: date | None = None
    agreement_in_principle_expiry: date | None = None
    
    # Buyer Status & Readiness
    buying_timeline: str | None = None
    readiness_level: str | None = None
    current_property_status: str | None = None
    solicitor_name: str | None = None
    solicitor_firm: str | None = None
    solicitor_contact: str | None = None
    decision_makers: str | None = None
    
    # Search Criteria
    primary_locations: str | None = None
    secondary_areas: str | None = None
    property_types: str | None = None
    min_bedrooms: int | None = None
    max_bedrooms: int | None = None
    min_bathrooms: int | None = None
    outdoor_space_required: bool | None = None
    parking_required: bool | None = None
    accessibility_requirements: str | None = None
    tenure_preference: str | None = None
    condition_preference: str | None = None
    key_features_required: str | None = None
    school_catchment_important: bool | None = None
    preferred_schools: str | None = None
    max_commute_time: int | None = None
    min_property_size: float | None = None
    
    # AML/KYC Compliance
    aml_status: str | None = None
    proof_of_funds_uploaded: bool | None = None
    id_document_uploaded: bool | None = None
    proof_of_address_uploaded: bool | None = None
    
    # Marketing & Communications
    marketing_consent: bool | None = None
    alert_preferences: str | None = None
    preferred_contact_times: str | None = None
    viewing_availability: str | None = None
    
    # Source & Analytics
    source_of_lead: str | None = None
    tags: str | None = None


class ApplicantResponse(ApplicantBase):
    id: str
    status: str
    assigned_agent_id: str | None = None
    managed_by_name: str | None = None  # Full name of managing agent (uses assigned_agent_id)
    last_contacted_at: datetime | None = None
    notes: str | None = None

    @computed_field
    @property
    def full_name(self) -> str:
        """Computed field combining first_name and last_name"""
        return f"{self.first_name} {self.last_name}"
   
