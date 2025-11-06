from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr, computed_field


class ApplicantBase(BaseModel):
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

class ApplicantCreate(ApplicantBase):
    pass

class ApplicantUpdate(BaseModel):
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

class ApplicantResponse(ApplicantBase):
    id: str
    status: str

    @computed_field
    @property
    def full_name(self) -> str:
        """Computed field combining first_name and last_name"""
        return f"{self.first_name} {self.last_name}"

    model_config = ConfigDict(from_attributes=True)
