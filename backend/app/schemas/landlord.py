from datetime import date, datetime

from pydantic import ConfigDict, EmailStr
from app.schemas.model_config import AppBaseModel


<<<<<<< HEAD
class AgentInfo(AppBaseModel):
    """Basic agent information for landlord responses"""
    id: str
    first_name: str
    last_name: str
    email: str
    
    @property
    def full_name(self) -> str:
        """Computed field combining first_name and last_name"""
        return f"{self.first_name} {self.last_name}"


=======
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
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
    last_contacted_at: datetime | None = None
    landlord_complete_info: bool | None = None
<<<<<<< HEAD
    managed_by: str | None = None
=======
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4

class LandlordResponse(LandlordBase):
    id: str
    aml_verified: bool
    aml_verification_date: date | None = None
    aml_check_expiry: date | None = None
    properties_count: int = 0  # Number of properties owned by this landlord
    last_contacted_at: datetime | None = None
    landlord_complete_info: bool = False
<<<<<<< HEAD
    managed_by: str | None = None
    managed_agent: AgentInfo | None = None
=======
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4

