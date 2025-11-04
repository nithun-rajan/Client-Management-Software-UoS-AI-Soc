from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional

from app.models.enums import VendorStatus


class VendorBase(BaseModel):
    title: Optional[str] = None
    first_name: str
    last_name: str
    email: str
    primary_phone: str
    secondary_phone: Optional[str] = None
    current_address: Optional[str] = None
    date_of_birth: Optional[date] = None
    nationality: Optional[str] = None
    aml_status: str = "pending"
    status: str = VendorStatus.NEW
    instruction_type: Optional[str] = None  # sole_agency, multi_agency
    agreed_commission: Optional[str] = None  # e.g., "1.5% + VAT"
    minimum_fee: Optional[str] = None


class VendorCreate(VendorBase):
    pass


class VendorUpdate(BaseModel):
    title: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    primary_phone: Optional[str] = None
    secondary_phone: Optional[str] = None
    current_address: Optional[str] = None
    date_of_birth: Optional[date] = None
    nationality: Optional[str] = None
    aml_status: Optional[str] = None
    status: Optional[str] = None
    instruction_type: Optional[str] = None
    agreed_commission: Optional[str] = None
    minimum_fee: Optional[str] = None


class VendorResponse(VendorBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True