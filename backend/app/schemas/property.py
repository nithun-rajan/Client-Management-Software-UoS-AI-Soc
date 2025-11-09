from pydantic import ConfigDict, Field

from app.models.enums import PropertyStatus

from app.schemas.model_config import AppBaseModel

class PropertyBase(AppBaseModel):
    address: str | None = None
    postcode: str
    property_type: str
    bedrooms: int = Field(ge=0)
    bathrooms: int = Field(ge=0)
    rent: float | None = None
    description: str | None = None

class PropertyCreate(PropertyBase):
    city: str
    landlord_id: str | None = None

class PropertyUpdate(AppBaseModel):
    address: str | None = None
    city: str | None = None
    postcode: str | None = None
    property_type: str | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    rent: float | None = None
    status: str | None = None
    description: str | None = None
    sales_status: str | None = None
    asking_price: float | None = None
    price_qualifier: str | None = None
    has_valuation_pack: bool | None = None
    landlord_id: str | None = None
    managed_by: str | None = None
    management_type: str | None = None
    management_notes: str | None = None

class LandlordInfo(AppBaseModel):
    """Basic landlord information for property responses"""
    id: str
    full_name: str
    email: str
    phone: str | None = None

class PropertyResponse(PropertyBase):
    id: str
    status: PropertyStatus
    city: str
    address_line1: str | None = None
    address_line2: str | None = None
    landlord_id: str | None = None
    sales_status: str | None = None
    asking_price: float | None = None
    price_qualifier: str | None = None
    has_valuation_pack: bool | None = None
