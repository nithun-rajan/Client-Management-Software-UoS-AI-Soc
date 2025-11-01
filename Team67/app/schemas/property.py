from pydantic import BaseModel, Field
from typing import Optional
from app.models.property import PropertyStatus, PropertyType

class PropertyBase(BaseModel):
    address: str
    postcode: str
    property_type: PropertyType
    bedrooms: int = Field(ge=0)
    bathrooms: int = Field(ge=0)
    rent: Optional[float] = None
    description: Optional[str] = None

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    address: Optional[str] = None
    postcode: Optional[str] = None
    property_type: Optional[PropertyType] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    rent: Optional[float] = None
    status: Optional[PropertyStatus] = None
    description: Optional[str] = None

class PropertyResponse(PropertyBase):
    id: int
    status: PropertyStatus

    class Config:
        from_attributes = True