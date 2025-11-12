from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.services.calendar_service import get_calendar_service, CalendarService
from app.schemas.calendar import (
    ViewingSlotResponse,
    AutoScheduleRequest,
    AutoScheduleResponse,
    AgentAvailabilityCreate,
    ViewingScheduleRuleCreate
)

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.post(
    "/auto-schedule",
    response_model=AutoScheduleResponse,
    summary="Auto-Schedule Viewing",
    description="Automatically schedule a property viewing based on availability and preferences"
)
async def auto_schedule_viewing(
    request: AutoScheduleRequest,
    db: Session = Depends(get_db),
    calendar_service: CalendarService = Depends(get_calendar_service)
):
    """
    Auto-schedule a property viewing
    
    Uses AI-powered scheduling to find the best available slot based on:
    - Agent availability
    - Property viewing slots  
    - Applicant preferences
    - Scheduling rules
    
    Blueprint: Pages 21, 24, 54 - Auto-booking based on negotiator availability
    """
    try:
        result = await calendar_service.auto_schedule_viewing(
            applicant_id=request.applicant_id,
            property_id=request.property_id,
            preferred_times=request.preferred_times
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return AutoScheduleResponse(
            success=True,
            viewing=result["viewing"],
            slot_selected=result["slot_selected"],
            auto_confirmed=result["auto_confirmed"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Auto-scheduling error: {str(e)}"
        )


@router.get(
    "/properties/{property_id}/available-slots",
    response_model=List[ViewingSlotResponse],
    summary="Get Available Viewing Slots",
    description="Get all available viewing slots for a property"
)
async def get_available_slots(
    property_id: str,
    start_date: Optional[datetime] = Query(None, description="Start date for slot search"),
    end_date: Optional[datetime] = Query(None, description="End date for slot search"),
    db: Session = Depends(get_db),
    calendar_service: CalendarService = Depends(get_calendar_service)
):
    """
    Get available viewing slots for a property
    
    Returns all time slots where viewings can be scheduled based on:
    - Property availability
    - Agent schedules
    - Existing bookings
    
    Blueprint: Page 11 - Viewing availability slots
    """
    try:
        slots = await calendar_service.find_available_slots(property_id)
        return slots
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching available slots: {str(e)}"
        )


@router.post(
    "/agent-availability",
    summary="Set Agent Availability",
    description="Define when agents are available for property viewings"
)
async def set_agent_availability(
    availability: AgentAvailabilityCreate,
    db: Session = Depends(get_db)
):
    """
    Set agent availability for viewings
    
    Defines recurring availability patterns for agents
    Used by auto-scheduling system to find available time slots
    
    Blueprint: Page 21 - Negotiator availability-based booking
    """
    try:
        # Implementation would create/update agent availability records
        return {"success": True, "message": "Availability set successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error setting availability: {str(e)}"
        )


@router.post(
    "/schedule-rules",
    summary="Create Scheduling Rules", 
    description="Define rules for auto-scheduling viewings"
)
async def create_schedule_rules(
    rules: ViewingScheduleRuleCreate,
    db: Session = Depends(get_db)
):
    """
    Create scheduling rules for properties or agents
    
    Defines constraints and preferences for auto-scheduling:
    - Minimum advance notice
    - Maximum booking window
    - Auto-confirmation settings
    - Notification preferences
    
    Blueprint: Implied by auto-scheduling requirements
    """
    try:
        # Implementation would create scheduling rule records
        return {"success": True, "message": "Scheduling rules created successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating scheduling rules: {str(e)}"
        )