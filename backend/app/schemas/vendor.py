from app.schemas.model_config import AppBaseModel
from datetime import datetime, date
from typing import Optional


<<<<<<< HEAD
class AgentInfo(AppBaseModel):
    """Basic agent information for vendor/landlord responses"""
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
class VendorBase(AppBaseModel):
    first_name: str
    last_name: str
    email: str
    primary_phone: str
    current_address: Optional[str] = None
    date_of_birth: Optional[date] = None
    nationality: Optional[str] = None
    aml_status: str = "pending"
    status: str = "new"
    instruction_type: Optional[str] = None  # sole_agency, multi_agency
    agreed_commission: Optional[str] = None  # e.g., "1.5% + VAT"
    minimum_fee: Optional[str] = None
    vendor_complete_info: bool = False


class VendorCreate(VendorBase):
    pass


class VendorUpdate(AppBaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    primary_phone: Optional[str] = None
    current_address: Optional[str] = None
    date_of_birth: Optional[date] = None
    nationality: Optional[str] = None
    aml_status: Optional[str] = None
    status: Optional[str] = None
    instruction_type: Optional[str] = None
    agreed_commission: Optional[str] = None
    minimum_fee: Optional[str] = None
    vendor_complete_info: Optional[bool] = None
    last_contacted_at: Optional[datetime] = None
<<<<<<< HEAD
    managed_by: Optional[str] = None
=======
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4


class VendorResponse(VendorBase):
    id: str
    instructed_property_id: Optional[str] = None
    vendor_complete_info: bool = False
    last_contacted_at: Optional[datetime] = None
<<<<<<< HEAD
    managed_by: Optional[str] = None
    managed_agent: Optional[AgentInfo] = None
=======
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    
