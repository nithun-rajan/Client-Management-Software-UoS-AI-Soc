from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.enums import ApplicantStatus


class ApplicantBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str | None = None
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
    notes: str | None = None

class ApplicantCreate(ApplicantBase):
    pass

class ApplicantUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    date_of_birth: date | None = None
    desired_bedrooms: str | None = None
    desired_property_type: str | None = None
    rent_budget_min: float | None = None
    rent_budget_max: float | None = None
    preferred_locations: str | None = None
    move_in_date: date | None = None
    status: ApplicantStatus | None = None
    references_passed: bool | None = None
    right_to_rent_checked: bool | None = None
    has_pets: bool | None = None
    pet_details: str | None = None
    special_requirements: str | None = None
    notes: str | None = None

class ApplicantResponse(ApplicantBase):
    id: str  # Changed to str to match BaseModel UUID
    status: ApplicantStatus
    references_passed: bool
    right_to_rent_checked: bool

    model_config = ConfigDict(from_attributes=True)
