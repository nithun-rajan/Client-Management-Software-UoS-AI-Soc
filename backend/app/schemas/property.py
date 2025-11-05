from pydantic import BaseModel, Field
from typing import Optional
from pydantic import ConfigDict

class PropertyBase(BaseModel):
    address: Optional[str] = None
    postcode: str
    property_type: str
    bedrooms: int = Field(ge=0)
    bathrooms: int = Field(ge=0)
    rent: Optional[float] = None
    description: Optional[str] = None

class PropertyCreate(PropertyBase):
    city: str

class PropertyUpdate(BaseModel):
    address: Optional[str] = None
    city: Optional[str] = None
    postcode: Optional[str] = None
    property_type: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    rent: Optional[float] = None
    status: Optional[str] = None
    description: Optional[str] = None

class PropertyResponse(PropertyBase):
    id: str
    status: str
    city: str

    model_config = ConfigDict(from_attributes=True)
