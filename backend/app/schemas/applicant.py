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


class ApplicantResponse(ApplicantBase):
    id: str
    status: str
    assigned_agent_id: str | None = None
    last_contacted_at: datetime | None = None
    notes: str | None = None

    @computed_field
    @property
    def full_name(self) -> str:
        """Computed field combining first_name and last_name"""
        return f"{self.first_name} {self.last_name}"
   
