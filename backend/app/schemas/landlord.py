from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr


class LandlordBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: str | None = None
    address: str | None = None
    bank_account_name: str | None = None
    sort_code: str | None = None
    account_number: str | None = None
    notes: str | None = None

class LandlordCreate(LandlordBase):
    pass

class LandlordUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None
    aml_verified: bool | None = None
    aml_verification_date: date | None = None
    bank_account_name: str | None = None
    sort_code: str | None = None
    account_number: str | None = None
    notes: str | None = None

class LandlordResponse(LandlordBase):
    id: str
    aml_verified: bool
    aml_verification_date: date | None = None

    model_config = ConfigDict(from_attributes=True)
