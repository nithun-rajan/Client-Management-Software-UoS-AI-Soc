"""
Communication Schemas - Pydantic models for API validation
"""

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from datetime import datetime
from app.schemas.model_config import AppBaseModel


class CommunicationBase(AppBaseModel):
    """Base schema with common fields"""
    type: str = Field(..., description="Type of communication (email, call, sms, note, task, meeting, viewing)")
    subject: Optional[str] = Field(None, max_length=255, description="Optional subject line")
    content: str = Field(..., description="Main content/body/notes")
    direction: Optional[str] = Field(None, description="Communication direction (inbound, outbound)")
    created_by: Optional[str] = Field(None, description="User who created this entry")
    is_important: bool = Field(False, description="Flag for priority communications")
    is_read: bool = Field(False, description="Track if communication has been reviewed")
    
    # Entity associations (at least one required)
    property_id: Optional[str] = Field(None, description="Link to property")
    landlord_id: Optional[str] = Field(None, description="Link to landlord")
    applicant_id: Optional[str] = Field(None, description="Link to applicant")


class CommunicationCreate(CommunicationBase):
    """Schema for creating a new communication log entry"""
    
    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        """Validate communication type"""
        valid_types = ['email', 'call', 'sms', 'note', 'task', 'meeting', 'viewing']
        if v not in valid_types:
            raise ValueError(f"Type must be one of: {', '.join(valid_types)}")
        return v
    
    @field_validator('direction')
    @classmethod
    def validate_direction(cls, v):
        """Validate communication direction"""
        if v is not None and v not in ['inbound', 'outbound']:
            raise ValueError("Direction must be 'inbound' or 'outbound'")
        return v
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v):
        """Ensure content is not empty"""
        if not v or not v.strip():
            raise ValueError("Content cannot be empty")
        return v.strip()
    
    @model_validator(mode='after')
    def validate_entity_link(self) -> 'CommunicationCreate':
        # Normalize and check if at least one entity is linked (handle empty strings)
        property_id = None
        landlord_id = None
        applicant_id = None
        
        if self.property_id:
            property_id = str(self.property_id).strip() if self.property_id else None
            if property_id == "":
                property_id = None
        
        if self.landlord_id:
            landlord_id = str(self.landlord_id).strip() if self.landlord_id else None
            if landlord_id == "":
                landlord_id = None
        
        if self.applicant_id:
            applicant_id = str(self.applicant_id).strip() if self.applicant_id else None
            if applicant_id == "":
                applicant_id = None
        
        if not any([property_id, landlord_id, applicant_id]):
            raise ValueError("At least one entity (property, landlord, or applicant) must be linked")
        
        # Update the model with normalized values (only if they exist)
        if property_id is not None:
            self.property_id = property_id
        if landlord_id is not None:
            self.landlord_id = landlord_id
        if applicant_id is not None:
            self.applicant_id = applicant_id
        
        return self

class CommunicationUpdate(AppBaseModel):
    """Schema for updating an existing communication"""
    subject: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None
    is_important: Optional[bool] = None
    is_read: Optional[bool] = None

    @field_validator('content')
    @classmethod
    def validate_content(cls, v: Optional[str]) -> Optional[str]:
        """Ensure content is not empty if provided"""
        if v is not None and not v.strip():
            raise ValueError("Content cannot be empty if provided")
        return v.strip() if v else v
    
class CommunicationResponse(CommunicationBase):
    """Schema for API responses"""
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    

