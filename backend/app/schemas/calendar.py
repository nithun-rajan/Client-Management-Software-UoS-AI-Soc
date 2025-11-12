from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, time, date


class ViewingSlotBase(BaseModel):
    datetime: datetime
    agent_id: str
    agent_name: str
    duration_minutes: int
    property_id: str


class ViewingSlotResponse(ViewingSlotBase):
    pass


class AutoScheduleRequest(BaseModel):
    applicant_id: str
    property_id: str
    preferred_times: Optional[List[Dict[str, Any]]] = None


class AutoScheduleResponse(BaseModel):
    success: bool
    viewing: Dict[str, Any]  # Would be proper Viewing schema
    slot_selected: ViewingSlotResponse
    auto_confirmed: bool
    error: Optional[str] = None


class AgentAvailabilityCreate(BaseModel):
    agent_id: str
    day_of_week: int = Field(..., ge=0, le=6)
    start_time: time
    end_time: time
    is_available: bool = True
    recurrence_type: str = Field(default="weekly", pattern="^(weekly|biweekly|monthly)$")
    valid_from: date
    valid_to: Optional[date] = None


class ViewingScheduleRuleCreate(BaseModel):
    property_id: Optional[str] = None
    agent_id: Optional[str] = None
    min_advance_hours: int = Field(default=24, ge=1)
    max_advance_days: int = Field(default=14, ge=1, le=90)
    slot_duration_minutes: int = Field(default=30, ge=15, le=120)
    buffer_between_viewings: int = Field(default=15, ge=0, le=60)
    auto_confirm_viewings: bool = False
    require_agent_approval: bool = True
    allow_tenant_self_service: bool = False
    send_auto_reminders: bool = True
    reminder_hours_before: int = Field(default=24, ge=1, le=168)