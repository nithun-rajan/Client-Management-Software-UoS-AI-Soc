"""
Communication Schemas - Pydantic models for API validation
"""

from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime


class CommunicationBase(BaseModel):
    """Base schema with common fields"""
    type: str = Field(..., description="Type of communication (email, call, sms, note, task, meeting, viewing)")
    subject: Optional[str] = Field(None, max_length=255, description="Optional subject line")
    content: str = Field(..., description="Main content/body/notes")
    direction: Optional[str] = Field(None, description="Communication direction (inbound, outbound)")
    created_by: Optional[str] = Field(None, description="User who created this entry")
    is_important: bool = Field(False, description="Flag for priority communications")
    is_read: bool = Field(False, description="Track if communication has been reviewed")
    
    # Entity associations (at least one required)
    property_id: Optional[int] = Field(None, description="Link to property")
    landlord_id: Optional[int] = Field(None, description="Link to landlord")
    applicant_id: Optional[int] = Field(None, description="Link to applicant")


class CommunicationCreate(CommunicationBase):
    """Schema for creating a new communication log entry"""
    
    @validator('type')
    def validate_type(cls, v):
        """Validate communication type"""
        valid_types = ['email', 'call', 'sms', 'note', 'task', 'meeting', 'viewing']
        if v not in valid_types:
            raise ValueError(f"Type must be one of: {', '.join(valid_types)}")
        return v
    
    @validator('direction')
    def validate_direction(cls, v):
        """Validate communication direction"""
        if v is not None and v not in ['inbound', 'outbound']:
            raise ValueError("Direction must be 'inbound' or 'outbound'")
        return v
    
    @validator('content')
    def validate_content(cls, v):
        """Ensure content is not empty"""
        if not v or not v.strip():
            raise ValueError("Content cannot be empty")
        return v.strip()
    
    @validator('applicant_id', always=True)
    def validate_entity_link(cls, v, values):
        """Ensure at least one entity is linked"""
        property_id = values.get('property_id')
        landlord_id = values.get('landlord_id')
        
        if not any([property_id, landlord_id, v]):
            raise ValueError("At least one entity (property, landlord, or applicant) must be linked")
        return v


class CommunicationUpdate(BaseModel):
    """Schema for updating an existing communication"""
    subject: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None
    is_important: Optional[bool] = None
    is_read: Optional[bool] = None


class CommunicationResponse(CommunicationBase):
    """Schema for API responses"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

