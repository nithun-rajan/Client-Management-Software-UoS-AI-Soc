from pydantic import BaseModel, Field
from typing import Optional
from app.models.enums import PropertyStatus
from pydantic import ConfigDict


class PropertyBase(BaseModel):
    address: str
    postcode: str
    property_type: str
    bedrooms: int = Field(ge=0)
    bathrooms: int = Field(ge=0)
    rent: Optional[float] = None
    description: Optional[str] = None

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    address: Optional[str] = None
    postcode: Optional[str] = None
    property_type: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    rent: Optional[float] = None
    status: Optional[PropertyStatus] = None
    description: Optional[str] = None

class PropertyResponse(PropertyBase):
    id: int
    status: PropertyStatus

    model_config = ConfigDict(from_attributes=True)