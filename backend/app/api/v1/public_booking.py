from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.calendar_public_booking_service import get_public_booking_service, PublicBookingService
from app.schemas.public_booking import (
    MatchBookingRequest,
    MatchBookingResponse,
    BookingSlotResponse,
    SendMatchRequest
)

router = APIRouter()


@router.post(
    "/send-match-with-booking",
    summary="Send Match with Booking Link",
    description="Send a property match to applicant with integrated viewing booking link"
)
async def send_match_with_booking_link(
    request: SendMatchRequest,
    db: Session = Depends(get_db),
    booking_service: PublicBookingService = Depends(get_public_booking_service)
):
    """
    Send property match with integrated booking link
    
    Implements blueprint: "A match gets sent to John Smith that says you'll like this 
    property blah blah want to book in a viewing and john could click a link to schedule that"
    """
    try:
        result = await booking_service.send_match_with_booking_link(request.dict())
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return {
            "success": True,
            "match_id": result["match"]["id"],
            "booking_url": result["booking_url"],
            "message_sent": result["message_sent"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send match: {str(e)}"
        )


@router.get(
    "/book-viewing/{booking_token}",
    summary="Get Booking Page",
    description="Public endpoint for applicants to book viewings from match links"
)
async def get_booking_page(
    booking_token: str,
    db: Session = Depends(get_db),
    booking_service: PublicBookingService = Depends(get_public_booking_service)
):
    """
    Public booking page for match links
    
    Shows property details and available viewing slots
    Applicants can book directly from this page
    """
    try:
        result = await booking_service.get_available_slots_for_match(booking_token)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return {
            "property": result["property"],
            "applicant": result["applicant"],
            "available_slots": result["available_slots"],
            "match": result["match"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load booking page: {str(e)}"
        )


@router.post(
    "/book-viewing/{booking_token}",
    response_model=MatchBookingResponse,
    summary="Book Viewing from Match",
    description="Book a viewing appointment from a match link"
)
async def book_viewing_from_match(
    booking_token: str,
    request: MatchBookingRequest,
    db: Session = Depends(get_db),
    booking_service: PublicBookingService = Depends(get_public_booking_service)
):
    """
    Book viewing from match link
    
    Implements blueprint: "An appointment would automatically be scheduled in the agents diary"
    """
    try:
        result = await booking_service.book_viewing_from_match(
            booking_token=booking_token,
            preferred_times=request.preferred_times
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return MatchBookingResponse(
            success=True,
            viewing=result["viewing"],
            match=result["match"],
            auto_scheduled=result["auto_scheduled"],
            agent_assigned=result["agent_assigned"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Booking failed: {str(e)}"
        )


@router.get(
    "/booking/{booking_token}/slots",
    response_model=List[BookingSlotResponse],
    summary="Get Available Slots for Booking",
    description="Get available viewing slots for a specific match booking"
)
async def get_booking_slots(
    booking_token: str,
    db: Session = Depends(get_db),
    booking_service: PublicBookingService = Depends(get_public_booking_service)
):
    """
    Get available slots for match booking
    """
    try:
        result = await booking_service.get_available_slots_for_match(booking_token)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return result["available_slots"]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get available slots: {str(e)}"
        )