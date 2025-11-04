from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.applicant import ApplicantStatus


class ApplicantBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str | None = None
    bedrooms_min: int | None = None
    bedrooms_max: int | None = None
    rent_budget_min: float | None = None
    rent_budget_max: float | None = None
    desired_locations: str | None = None
    move_in_date: date | None = None
    notes: str | None = None

class ApplicantCreate(ApplicantBase):
    pass

class ApplicantUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    bedrooms_min: int | None = None
    bedrooms_max: int | None = None
    rent_budget_min: float | None = None
    rent_budget_max: float | None = None
    desired_locations: str | None = None
    move_in_date: date | None = None
    status: ApplicantStatus | None = None
    references_passed: bool | None = None
    right_to_rent_checked: bool | None = None
    notes: str | None = None

class ApplicantResponse(ApplicantBase):
    id: str
    status: str

    model_config = ConfigDict(from_attributes=True)
