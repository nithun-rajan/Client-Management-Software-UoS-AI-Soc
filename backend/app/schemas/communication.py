"""
Communication Schemas - Pydantic models for API validation
"""

from datetime import datetime

from pydantic import BaseModel, Field
from pydantic import ConfigDict
from pydantic import field_validator, model_validator


class CommunicationBase(BaseModel):
    """Base schema with common fields"""

    type: str = Field(
        ...,
        description="Type of communication (email, call, sms, note, task, meeting, viewing)",
    )
    subject: str | None = Field(
        None, max_length=255, description="Optional subject line"
    )
    content: str = Field(..., description="Main content/body/notes")
    direction: str | None = Field(
        None, description="Communication direction (inbound, outbound)"
    )
    created_by: str | None = Field(None, description="User who created this entry")
    is_important: bool = Field(False, description="Flag for priority communications")
    is_read: bool = Field(False, description="Track if communication has been reviewed")

    # Entity associations (at least one required)
    property_id: int | None = Field(None, description="Link to property")
    landlord_id: int | None = Field(None, description="Link to landlord")
    applicant_id: int | None = Field(None, description="Link to applicant")


class CommunicationCreate(CommunicationBase):
    """Schema for creating a new communication log entry"""

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        """Validate communication type"""
        valid_types = ["email", "call", "sms", "note", "task", "meeting", "viewing"]
        if v not in valid_types:
            raise ValueError(f"Type must be one of: {', '.join(valid_types)}")
        return v

    @field_validator("direction")
    @classmethod
    def validate_direction(cls, v: str | None) -> str | None:
        """Validate communication direction"""
        if v is not None and v not in ["inbound", "outbound"]:
            raise ValueError("Direction must be 'inbound' or 'outbound'")
        return v

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Ensure content is not empty"""
        if not v or not v.strip():
            raise ValueError("Content cannot be empty")
        return v.strip()

    @model_validator(mode="after")
    def validate_entity_link(self):
        """Ensure at least one entity is linked"""
        if not any([self.property_id, self.landlord_id, self.applicant_id]):
            raise ValueError(
                "At least one entity (property, landlord, or applicant) must be linked"
            )
        return self


class CommunicationUpdate(BaseModel):
    """Schema for updating an existing communication"""

    subject: str | None = Field(None, max_length=255)
    content: str | None = None
    is_important: bool | None = None
    is_read: bool | None = None


class CommunicationResponse(CommunicationBase):
    """Schema for API responses"""

    id: int
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
