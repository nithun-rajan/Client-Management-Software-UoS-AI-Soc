from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import date

class ApplicantBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    bedrooms_min: Optional[int] = None
    bedrooms_max: Optional[int] = None
    rent_budget_min: Optional[float] = None
    rent_budget_max: Optional[float] = None
    desired_locations: Optional[str] = None
    move_in_date: Optional[date] = None
    notes: Optional[str] = None

    model_config = ConfigDict(arbitrary_types_allowed=True)

class ApplicantCreate(ApplicantBase):
    pass

class ApplicantUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    bedrooms_min: Optional[int] = None
    bedrooms_max: Optional[int] = None
    rent_budget_min: Optional[float] = None
    rent_budget_max: Optional[float] = None
    desired_locations: Optional[str] = None
    move_in_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class ApplicantResponse(ApplicantBase):
    id: str
    status: str

    class Config:
        from_attributes = True
