from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.schemas.model_config import AppBaseModel

from app.models.applicant import ApplicantStatus


class ApplicantBase(AppBaseModel):
    first_name : str
    last_name: str
    email: EmailStr
    phone: str | None = None
    date_of_birth: date | None = None

    # Property requirements (Blueprint page 23-24)
    desired_bedrooms: str | None = None           # "Number of bedrooms wanted"
    desired_property_type: str | None = None      # "Type of property wanted"
    rent_budget_min: float | None = None          # "Desired rent budget"
    rent_budget_max: float | None = None
    preferred_locations: str | None = None        # "Preferred locations/postcodes"
    move_in_date: date | None = None              # "Move-in date"

    # Additional criteria (Blueprint page 21)
    has_pets: bool = False
    pet_details: str | None = None                # "Do you have any pets?"
    special_requirements: str | None = None       # "Any other key criteria or must haves"


class ApplicantCreate(ApplicantBase):
    pass

class ApplicantUpdate(AppBaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    status: ApplicantStatus | None = None
    desired_bedrooms: str | None = None
    desired_property_type: str | None = None
    rent_budget_min: float | None = None
    rent_budget_max: float | None = None
    preferred_locations: str | None = None
    move_in_date: date | None = None
    has_pets: bool | None = None
    pet_details: str | None = None
    special_requirements: str | None = None

class ApplicantResponse(ApplicantBase):
    id: int
    status: ApplicantStatus
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
   
