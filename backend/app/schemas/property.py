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

class PropertyResponse(PropertyBase):
    id: str
    status: PropertyStatus
    city: str
