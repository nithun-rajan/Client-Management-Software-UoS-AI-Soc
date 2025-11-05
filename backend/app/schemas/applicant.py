from datetime import date, datetime

<<<<<<< HEAD
from pydantic import BaseModel, ConfigDict, EmailStr, computed_field


class ApplicantBase(BaseModel):
    first_name: str
    last_name: str
=======
from pydantic import BaseModel, ConfigDict, EmailStr

from app.schemas.model_config import AppBaseModel

from app.models.applicant import ApplicantStatus


class ApplicantBase(AppBaseModel):
    full_name: str
>>>>>>> bf7fab4 (fix enum inheritance, add model config to adjust pydantic to used enums)
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

    model_config = ConfigDict(arbitrary_types_allowed=True)

class ApplicantCreate(ApplicantBase):
    pass

<<<<<<< HEAD
class ApplicantUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
=======
class ApplicantUpdate(AppBaseModel):
    full_name: str | None = None
>>>>>>> bf7fab4 (fix enum inheritance, add model config to adjust pydantic to used enums)
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


class ApplicantResponse(ApplicantBase):
    id: str
    status: str

    @computed_field
    @property
    def full_name(self) -> str:
        """Computed field combining first_name and last_name"""
        return f"{self.first_name} {self.last_name}"

<<<<<<< HEAD
    model_config = ConfigDict(from_attributes=True)
=======
>>>>>>> bf7fab4 (fix enum inheritance, add model config to adjust pydantic to used enums)
   
