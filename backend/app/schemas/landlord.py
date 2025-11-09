from datetime import date

from pydantic import ConfigDict, EmailStr
from app.schemas.model_config import AppBaseModel


class LandlordBase(AppBaseModel):
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

class LandlordUpdate(AppBaseModel):
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
    aml_check_expiry: date | None = None
    properties_count: int = 0  # Number of properties owned by this landlord

