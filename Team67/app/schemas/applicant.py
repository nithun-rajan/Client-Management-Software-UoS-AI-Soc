from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date
from app.models.applicant import ApplicantStatus

class ApplicantBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    bedrooms_min: Optional[int] = None
    bedrooms_max: Optional[int] = None
    rent_budget_min: Optional[float] = None
    rent_budget_max: Optional[float] = None
    desired_locations: Optional[str] = None
    move_in_date: Optional[date] = None
    notes: Optional[str] = None

class ApplicantCreate(ApplicantBase):
    pass

class ApplicantUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    bedrooms_min: Optional[int] = None
    bedrooms_max: Optional[int] = None
    rent_budget_min: Optional[float] = None
    rent_budget_max: Optional[float] = None
    desired_locations: Optional[str] = None
    move_in_date: Optional[date] = None
    status: Optional[ApplicantStatus] = None
    references_passed: Optional[bool] = None
    right_to_rent_checked: Optional[bool] = None
    notes: Optional[str] = None

class ApplicantResponse(ApplicantBase):
    id: int
    status: ApplicantStatus
    references_passed: bool
    right_to_rent_checked: bool

    class Config:
        from_attributes = True