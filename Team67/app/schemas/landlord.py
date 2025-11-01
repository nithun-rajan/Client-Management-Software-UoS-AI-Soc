from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date

class LandlordBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    bank_account_name: Optional[str] = None
    sort_code: Optional[str] = None
    account_number: Optional[str] = None
    notes: Optional[str] = None

class LandlordCreate(LandlordBase):
    pass

class LandlordUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    aml_verified: Optional[bool] = None
    aml_verification_date: Optional[date] = None
    bank_account_name: Optional[str] = None
    sort_code: Optional[str] = None
    account_number: Optional[str] = None
    notes: Optional[str] = None

class LandlordResponse(LandlordBase):
    id: int
    aml_verified: bool
    aml_verification_date: Optional[date] = None

    class Config:
        from_attributes = True