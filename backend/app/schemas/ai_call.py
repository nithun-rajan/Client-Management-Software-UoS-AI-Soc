from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.model_config import AppBaseModel


class ExtractedApplicantData(BaseModel):
    """
    Structured data extracted from the AI call conversation.
    This represents the information we learned about the applicant.
    """
    # Identity
    full_name: str | None = None
    confirmed_phone: str | None = None
    
    # Employment & Income
    employment_status: str | None = None  # full_time, part_time, self_employed, unemployed, student, retired
    monthly_income: float | None = None
    
    # Household
    number_of_adults: int | None = None
    number_of_children: int | None = None
    
    # Pets
    has_pets: bool | None = None
    pet_type: str | None = None  # dog, cat, other
    pet_count: int | None = None
    pet_details: str | None = None
    
    # Budget & Requirements
    budget_min: float | None = None
    budget_max: float | None = None
    preferred_locations: list[str] | None = None
    desired_bedrooms: str | None = None  # "1", "2", "3+", etc.
    desired_property_type: str | None = None  # flat, house, studio, etc.
    
    # Timeline
    move_in_date: str | None = None  # ISO date string or flexible description
    buying_timeline: str | None = None  # For buyers: ASAP, 1-3 months, etc.
    
    # Special Requirements
    parking_required: bool | None = None
    outdoor_space_required: bool | None = None
    accessibility_requirements: str | None = None
    special_requirements: str | None = None
    
    # Additional Info
    additional_notes: str | None = None  # Any other relevant information from the call
    
    model_config = ConfigDict(arbitrary_types_allowed=True)


class AICallCreate(AppBaseModel):
    """
    Schema for creating a new AI call.
    Frontend sends this when initiating a call.
    """
    applicant_id: str = Field(..., description="ID of the applicant to call")
    phone_number: str | None = Field(None, description="Phone number (E.164 format). For prototype, this is ignored and hardcoded number is used.")
    user_context: str | None = Field(None, description="Additional context or instructions for the AI agent")
    
    model_config = ConfigDict(arbitrary_types_allowed=True)


class AICallResponse(AppBaseModel):
    """
    Full AI call details returned to the frontend.
    """
    id: str
    applicant_id: str
    created_by_user_id: str
    
    # Call details
    phone_number: str
    user_context: str | None = None
    
    # Status
    status: str  # pending, in_progress, completed, failed, no_answer
    
    # External reference
    ultravox_call_id: str | None = None
    
    # Results
    duration_seconds: int | None = None
    transcript: str | None = None
    summary: str | None = None
    extracted_data: dict[str, Any] | None = None  # JSON object with ExtractedApplicantData
    recording_url: str | None = None
    
    # Error handling
    error_message: str | None = None
    
    # Timestamps
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)


class AICallSummary(AppBaseModel):
    """
    Brief version of AI call for list views.
    Doesn't include full transcript to keep response size small.
    """
    id: str
    applicant_id: str
    status: str
    duration_seconds: int | None = None
    summary: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True, arbitrary_types_allowed=True)


class AICallUpdate(BaseModel):
    """
    Schema for updating call status/data from Ultravox webhooks or polling.
    Internal use only.
    """
    status: str | None = None
    duration_seconds: int | None = None
    transcript: str | None = None
    summary: str | None = None
    extracted_data: dict[str, Any] | None = None
    recording_url: str | None = None
    error_message: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    
    model_config = ConfigDict(arbitrary_types_allowed=True)

