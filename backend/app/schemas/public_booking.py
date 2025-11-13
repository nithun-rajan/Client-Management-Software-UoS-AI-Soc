from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class SendMatchRequest(BaseModel):
    property_id: str
    applicant_id: str
    match_score: Optional[float] = Field(None, ge=0, le=1)
    match_reason: Optional[str] = None
    personalization_data: Optional[Dict[str, Any]] = None
    sent_via: str = Field(default="email", regex="^(email|sms|whatsapp|portal)$")
    sent_by_agent: Optional[str] = None


class MatchBookingRequest(BaseModel):
    preferred_times: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None


class MatchBookingResponse(BaseModel):
    success: bool
    viewing: Dict[str, Any]  # Would be proper Viewing schema
    match: Dict[str, Any]    # Would be proper Match schema
    auto_scheduled: bool
    agent_assigned: bool
    error: Optional[str] = None


class BookingSlotResponse(BaseModel):
    datetime: datetime
    agent_id: str
    agent_name: str
    duration_minutes: int
    property_id: str


class PublicBookingPage(BaseModel):
    property: Dict[str, Any]
    applicant: Dict[str, Any]
    available_slots: List[BookingSlotResponse]
    match: Dict[str, Any]