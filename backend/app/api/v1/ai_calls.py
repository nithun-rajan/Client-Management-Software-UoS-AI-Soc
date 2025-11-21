"""
API endpoints for AI Call Agent functionality.

Handles creating AI voice calls, fetching call status, and managing call data.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.ai_call import AICall
from app.models.applicant import Applicant
from app.models.user import User
from app.schemas.ai_call import (
    AICallCreate, 
    AICallResponse, 
    AICallSummary,
    ExtractedApplicantData
)
from app.services.ultravox_service import UltravoxService


router = APIRouter(prefix="/ai-calls", tags=["ai-calls"])


@router.post("/", response_model=AICallResponse, status_code=status.HTTP_201_CREATED)
async def create_ai_call(
    call_data: AICallCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new AI voice call to qualify an applicant.
    
    For prototype: Always calls the hardcoded number (+447584628012).
    The phone_number in the request is stored but not used for the actual call.
    """
    
    # Verify applicant exists
    applicant = db.query(Applicant).filter(Applicant.id == call_data.applicant_id).first()
    if not applicant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Applicant with id {call_data.applicant_id} not found"
        )
    
    # Create initial call record
    db_call = AICall(
        applicant_id=call_data.applicant_id,
        created_by_user_id=current_user.id,
        phone_number=call_data.phone_number or applicant.phone,  # Store for reference
        user_context=call_data.user_context,
        status="pending"
    )
    
    db.add(db_call)
    db.commit()
    db.refresh(db_call)
    
    # Initialize Ultravox service and create the call
    try:
        ultravox_service = UltravoxService()
        ultravox_response = await ultravox_service.create_call(
            applicant=applicant,
            user_context=call_data.user_context
        )
        
        # Update call record with Ultravox details
        db_call.ultravox_call_id = ultravox_response.get("callId")
        db_call.status = "in_progress"
        db_call.started_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(db_call)
        
        return AICallResponse.model_validate(db_call)
        
    except Exception as e:
        # Mark call as failed
        db_call.status = "failed"
        db_call.error_message = str(e)
        db.commit()
        db.refresh(db_call)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create call: {str(e)}"
        )


@router.get("/{call_id}", response_model=AICallResponse)
async def get_ai_call(
    call_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get AI call details by ID.
    
    If the call is completed and transcript hasn't been fetched yet,
    this endpoint will fetch it from Ultravox and update the record.
    """
    
    # Get call from database
    db_call = db.query(AICall).filter(AICall.id == call_id).first()
    if not db_call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Call with id {call_id} not found"
        )
    
    # If call is in progress, check Ultravox for updates
    if db_call.status == "in_progress" and db_call.ultravox_call_id:
        try:
            ultravox_service = UltravoxService()
            call_status = await ultravox_service.get_call_status(db_call.ultravox_call_id)
            
            # Check if call has ended
            call_ended = call_status.get("ended")
            if call_ended:
                db_call.status = "completed"
                db_call.completed_at = datetime.fromisoformat(call_ended.replace('Z', '+00:00'))
                
                # Get duration if available
                if "durationSeconds" in call_status:
                    db_call.duration_seconds = call_status["durationSeconds"]
                
                # Fetch transcript and process it
                try:
                    messages = await ultravox_service.get_call_messages(db_call.ultravox_call_id)
                    transcript = ultravox_service.format_transcript(messages)
                    db_call.transcript = transcript
                    
                    # Generate summary
                    if transcript:
                        summary = await ultravox_service.generate_call_summary(transcript)
                        db_call.summary = summary
                        
                        # Extract structured data
                        extracted_data = await ultravox_service.extract_applicant_data(transcript)
                        db_call.extracted_data = extracted_data.model_dump(exclude_none=True)
                    
                    # Try to get recording URL
                    recording_url = await ultravox_service.get_call_recording(db_call.ultravox_call_id)
                    if recording_url:
                        db_call.recording_url = recording_url
                        
                except Exception as e:
                    print(f"Error processing call transcript: {str(e)}")
                    # Don't fail the whole request if transcript processing fails
                
                db.commit()
                db.refresh(db_call)
                
        except Exception as e:
            print(f"Error checking call status: {str(e)}")
            # Don't fail the request, just return current state
    
    return AICallResponse.model_validate(db_call)


@router.get("/applicant/{applicant_id}", response_model=List[AICallSummary])
async def get_applicant_calls(
    applicant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all AI calls for a specific applicant.
    
    Returns a list of call summaries (without full transcripts for performance).
    """
    
    # Verify applicant exists
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Applicant with id {applicant_id} not found"
        )
    
    # Get all calls for this applicant
    calls = db.query(AICall).filter(
        AICall.applicant_id == applicant_id
    ).order_by(AICall.created_at.desc()).all()
    
    return [AICallSummary.model_validate(call) for call in calls]


@router.post("/{call_id}/apply-data", response_model=dict)
async def apply_call_data_to_applicant(
    call_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Apply extracted data from an AI call to the applicant record.
    
    Updates the applicant's profile with information gathered during the call.
    """
    
    # Get call from database
    db_call = db.query(AICall).filter(AICall.id == call_id).first()
    if not db_call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Call with id {call_id} not found"
        )
    
    if not db_call.extracted_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No extracted data available for this call"
        )
    
    # Get applicant
    applicant = db.query(Applicant).filter(Applicant.id == db_call.applicant_id).first()
    if not applicant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Applicant not found"
        )
    
    # Parse extracted data
    try:
        extracted = ExtractedApplicantData(**db_call.extracted_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid extracted data format: {str(e)}"
        )
    
    # Update applicant fields with extracted data (only non-null values)
    updates_applied = []
    
    if extracted.employment_status:
        applicant.employment_status = extracted.employment_status
        updates_applied.append("employment_status")
    
    if extracted.monthly_income:
        applicant.monthly_household_income = extracted.monthly_income
        updates_applied.append("monthly_income")
    
    if extracted.has_pets is not None:
        applicant.has_pets = extracted.has_pets
        updates_applied.append("has_pets")
        
        if extracted.pet_details:
            applicant.pet_details = extracted.pet_details
            updates_applied.append("pet_details")
    
    if extracted.budget_min:
        applicant.rent_budget_min = extracted.budget_min
        updates_applied.append("budget_min")
    
    if extracted.budget_max:
        applicant.rent_budget_max = extracted.budget_max
        updates_applied.append("budget_max")
    
    if extracted.preferred_locations:
        applicant.preferred_locations = ", ".join(extracted.preferred_locations)
        updates_applied.append("preferred_locations")
    
    if extracted.desired_bedrooms:
        applicant.desired_bedrooms = extracted.desired_bedrooms
        updates_applied.append("desired_bedrooms")
    
    if extracted.desired_property_type:
        applicant.desired_property_type = extracted.desired_property_type
        updates_applied.append("desired_property_type")
    
    if extracted.move_in_date:
        # Try to parse date
        try:
            from dateutil import parser
            move_in = parser.parse(extracted.move_in_date)
            applicant.move_in_date = move_in.date()
            updates_applied.append("move_in_date")
        except:
            # If can't parse, skip
            pass
    
    if extracted.parking_required is not None:
        applicant.parking_required = extracted.parking_required
        updates_applied.append("parking_required")
    
    if extracted.outdoor_space_required is not None:
        applicant.outdoor_space_required = extracted.outdoor_space_required
        updates_applied.append("outdoor_space_required")
    
    if extracted.accessibility_requirements:
        applicant.accessibility_requirements = extracted.accessibility_requirements
        updates_applied.append("accessibility_requirements")
    
    if extracted.special_requirements:
        # Append to existing special requirements if any
        if applicant.special_requirements:
            applicant.special_requirements += f"\n\nFrom AI Call ({db_call.created_at.date()}):\n{extracted.special_requirements}"
        else:
            applicant.special_requirements = extracted.special_requirements
        updates_applied.append("special_requirements")
    
    # Add note about AI call data
    note_text = f"AI Call data applied on {datetime.now(timezone.utc).date()}. Fields updated: {', '.join(updates_applied)}"
    if applicant.notes:
        applicant.notes += f"\n\n{note_text}"
    else:
        applicant.notes = note_text
    
    # Mark as contacted
    applicant.last_contacted_at = db_call.completed_at or datetime.now(timezone.utc)
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Applied {len(updates_applied)} fields to applicant profile",
        "fields_updated": updates_applied
    }


@router.post("/{call_id}/sync", response_model=AICallResponse)
async def sync_ai_call_status(
    call_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sync call status, transcript, and summary from Ultravox.
    
    Call this endpoint after a call completes to fetch the final data.
    """
    
    db_call = db.query(AICall).filter(AICall.id == call_id).first()
    if not db_call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Call with id {call_id} not found"
        )
    
    if not db_call.ultravox_call_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Call has no Ultravox ID to sync from"
        )
    
    try:
        ultravox_service = UltravoxService()
        
        # Get call status from Ultravox
        call_status = await ultravox_service.get_call_status(db_call.ultravox_call_id)
        
        # Update status based on call outcome
        if call_status.get("ended"):
            end_reason = call_status.get("endReason", "")
            
            if end_reason == "unjoined":
                db_call.status = "no_answer"
                db_call.error_message = "Call was not answered"
            elif call_status.get("joined"):
                db_call.status = "completed"
            else:
                db_call.status = "failed"
                
            db_call.completed_at = datetime.now(timezone.utc)
            
            # Calculate duration if call was joined
            if call_status.get("joined") and call_status.get("ended"):
                from datetime import datetime as dt
                joined = dt.fromisoformat(call_status["joined"].replace("Z", "+00:00"))
                ended = dt.fromisoformat(call_status["ended"].replace("Z", "+00:00"))
                db_call.duration_seconds = int((ended - joined).total_seconds())
        
        # Get transcript (only if call was actually joined)
        if call_status.get("joined"):
            try:
                messages = await ultravox_service.get_call_messages(db_call.ultravox_call_id)
                if messages:
                    # Build transcript from messages
                    transcript_lines = []
                    for msg in messages:
                        role = msg.get("role", "unknown")
                        text = msg.get("text", "")
                        if text:
                            speaker = "Agent" if role == "agent" else "User"
                            transcript_lines.append(f"{speaker}: {text}")
                    
                    if transcript_lines:
                        db_call.transcript = "\n".join(transcript_lines)
            except Exception as msg_error:
                # Don't fail the whole sync if messages aren't available
                print(f"Warning: Could not fetch messages: {msg_error}")
        
        # Get/generate summary (only if call was joined)
        if call_status.get("joined"):
            try:
                if call_status.get("shortSummary"):
                    db_call.summary = call_status["shortSummary"]
                elif call_status.get("summary"):
                    db_call.summary = call_status["summary"]
                elif db_call.transcript:
                    # Generate summary if not available
                    summary = await ultravox_service.generate_call_summary(db_call.transcript)
                    db_call.summary = summary
            except Exception as summary_error:
                print(f"Warning: Could not generate summary: {summary_error}")
        
        # Extract structured data from transcript (only if we have a transcript)
        if db_call.transcript:
            try:
                extracted = await ultravox_service.extract_applicant_data(db_call.transcript)
                db_call.extracted_data = extracted
            except Exception as extract_error:
                print(f"Warning: Could not extract data: {extract_error}")
        
        # Get recording URL if available
        try:
            recording_url = await ultravox_service.get_call_recording(db_call.ultravox_call_id)
            if recording_url:
                db_call.recording_url = recording_url
        except:
            pass  # Recording might not be ready yet
        
        db.commit()
        db.refresh(db_call)
        
        return AICallResponse.model_validate(db_call)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync call: {str(e)}"
        )


@router.delete("/{call_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ai_call(
    call_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete an AI call record.
    
    Note: This only deletes the database record, not the Ultravox call.
    """
    
    db_call = db.query(AICall).filter(AICall.id == call_id).first()
    if not db_call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Call with id {call_id} not found"
        )
    
    db.delete(db_call)
    db.commit()
    
    return None

