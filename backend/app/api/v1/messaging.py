"""
Messaging/Communication API Endpoints

Activity Feed / Communication Log system for tracking all interactions
Links communications to Properties, Landlords, and Applicants
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.communication import Communication
from app.models.applicant import Applicant
from app.schemas.communication import CommunicationCreate, CommunicationUpdate, CommunicationResponse

router = APIRouter(prefix="/messaging", tags=["messaging"])


@router.post("", response_model=CommunicationResponse, status_code=status.HTTP_201_CREATED)
def create_communication(
    communication: CommunicationCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new communication log entry
    
    At least one entity (property, landlord, or applicant) must be linked.
    
    CRM Feature: Automatically updates last_contacted_at for applicants when
    a communication is created (email, call, sms, etc.)
    """
<<<<<<< HEAD
    # Create new communication
    db_communication = Communication(**communication.dict())
=======
    # Convert schema to dict (handle Pydantic v2)
    comm_data = communication.model_dump(exclude_unset=True) if hasattr(communication, 'model_dump') else communication.dict(exclude_unset=True)
    
    # Normalize IDs - handle empty strings and convert to strings
    for id_field in ['property_id', 'landlord_id', 'applicant_id']:
        if id_field in comm_data and comm_data[id_field]:
            # Convert to string and strip whitespace
            value = str(comm_data[id_field]).strip()
            comm_data[id_field] = value if value else None
        else:
            comm_data[id_field] = None
    
    # Validate that at least one entity is linked (after normalization)
    if not any([comm_data.get('property_id'), comm_data.get('landlord_id'), comm_data.get('applicant_id')]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one entity (property, landlord, or applicant) must be linked"
        )
    
    # Handle empty strings for optional fields - convert to None
    for field in ['direction', 'subject', 'created_by']:
        if field in comm_data:
            if comm_data[field] == '' or (isinstance(comm_data[field], str) and not comm_data[field].strip()):
                comm_data[field] = None
            elif isinstance(comm_data[field], str):
                comm_data[field] = comm_data[field].strip()
    
    # Create new communication
    db_communication = Communication(**comm_data)
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
    
    db.add(db_communication)
    
    # CRM: Update last_contacted_at for applicant if this communication is for an applicant
    # Only update for outbound communications (email, call, sms) - not notes
<<<<<<< HEAD
    if communication.applicant_id and communication.type in ['email', 'call', 'sms']:
        applicant = db.query(Applicant).filter(Applicant.id == communication.applicant_id).first()
=======
    if db_communication.applicant_id and db_communication.type in ['email', 'call', 'sms']:
        applicant = db.query(Applicant).filter(Applicant.id == db_communication.applicant_id).first()
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
        if applicant:
            applicant.last_contacted_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(db_communication)
    
    return db_communication


@router.get("", response_model=List[CommunicationResponse])
def list_communications(
    db: Session = Depends(get_db),
    type: Optional[str] = Query(None, description="Filter by type (email, call, sms, note, task, meeting, viewing)"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type (property, landlord, applicant)"),
    entity_id: Optional[str] = Query(None, description="Filter by specific entity ID"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    is_important: Optional[bool] = Query(None, description="Filter by importance"),
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of records to skip")
):
    """
    List all communications with optional filters
    
    Supports filtering by:
    - Type (email, call, SMS, note, task)
    - Entity type and ID
    - Date range
    - Importance and read status
    - Pagination (limit/offset)
    """
    query = db.query(Communication)
    
    # Apply filters
    if type:
        query = query.filter(Communication.type == type)
    
    if entity_type and entity_id:
        if entity_type == "property":
            query = query.filter(Communication.property_id == entity_id)
        elif entity_type == "landlord":
            query = query.filter(Communication.landlord_id == entity_id)
        elif entity_type == "applicant":
            query = query.filter(Communication.applicant_id == entity_id)
    
    if start_date:
        query = query.filter(Communication.created_at >= start_date)
    
    if end_date:
        query = query.filter(Communication.created_at <= end_date)
    
    if is_important is not None:
        query = query.filter(Communication.is_important == is_important)
    
    if is_read is not None:
        query = query.filter(Communication.is_read == is_read)
    
    # Order by most recent first
    query = query.order_by(Communication.created_at.desc())
    
    # Apply pagination
    communications = query.offset(offset).limit(limit).all()
    
    return communications


@router.get("/{communication_id}", response_model=CommunicationResponse)
def get_communication(
    communication_id: str,
    db: Session = Depends(get_db)
):
    """Get a single communication by ID"""
    communication = db.query(Communication).filter(Communication.id == communication_id).first()
    
    if not communication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Communication with ID {communication_id} not found"
        )
    
    return communication


@router.put("/{communication_id}", response_model=CommunicationResponse)
def update_communication(
    communication_id: str,
    communication_update: CommunicationUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing communication"""
    db_communication = db.query(Communication).filter(Communication.id == communication_id).first()
    
    if not db_communication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Communication with ID {communication_id} not found"
        )
    
    # Update only provided fields
    update_data = communication_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_communication, field, value)
    
    db.commit()
    db.refresh(db_communication)
    
    return db_communication


@router.delete("/{communication_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_communication(
    communication_id: str,
    db: Session = Depends(get_db)
):
    """Delete a communication"""
    db_communication = db.query(Communication).filter(Communication.id == communication_id).first()
    
    if not db_communication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Communication with ID {communication_id} not found"
        )
    
    db.delete(db_communication)
    db.commit()
    
    return None


# Entity-specific endpoints

@router.get("/property/{property_id}", response_model=List[CommunicationResponse])
def get_property_communications(
    property_id: str,
    db: Session = Depends(get_db),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """
    Get all communications for a specific property
    
    Returns chronological activity feed for compliance and relationship tracking
    """
    communications = db.query(Communication)\
        .filter(Communication.property_id == property_id)\
        .order_by(Communication.created_at.desc())\
        .offset(offset)\
        .limit(limit)\
        .all()
    
    return communications


@router.get("/landlord/{landlord_id}", response_model=List[CommunicationResponse])
def get_landlord_communications(
    landlord_id: str,
    db: Session = Depends(get_db),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """
    Get all communications for a specific landlord
    
    Returns chronological activity feed showing all interactions
    """
    communications = db.query(Communication)\
        .filter(Communication.landlord_id == landlord_id)\
        .order_by(Communication.created_at.desc())\
        .offset(offset)\
        .limit(limit)\
        .all()
    
    return communications


@router.get("/applicant/{applicant_id}", response_model=List[CommunicationResponse])
def get_applicant_communications(
    applicant_id: str,
    db: Session = Depends(get_db),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """
    Get all communications for a specific applicant
    
    Returns chronological activity feed for tenant relationship management
    """
    communications = db.query(Communication)\
        .filter(Communication.applicant_id == applicant_id)\
        .order_by(Communication.created_at.desc())\
        .offset(offset)\
        .limit(limit)\
        .all()
    
    return communications


@router.get("/stats/summary")
def get_communication_stats(
    db: Session = Depends(get_db),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None)
):
    """
    Get communication statistics summary
    
    Returns counts by type and entity for reporting/analytics
    """
    query = db.query(Communication)
    
    if start_date:
        query = query.filter(Communication.created_at >= start_date)
    if end_date:
        query = query.filter(Communication.created_at <= end_date)
    
    all_comms = query.all()
    
    # Count by type
    type_counts = {}
    for comm in all_comms:
        type_counts[comm.type] = type_counts.get(comm.type, 0) + 1
    
    # Count by entity type
    entity_counts = {
        "properties": sum(1 for c in all_comms if c.property_id),
        "landlords": sum(1 for c in all_comms if c.landlord_id),
        "applicants": sum(1 for c in all_comms if c.applicant_id),
    }
    
    # Important/unread counts
    important_count = sum(1 for c in all_comms if c.is_important)
    unread_count = sum(1 for c in all_comms if not c.is_read)
    
    return {
        "total": len(all_comms),
        "by_type": type_counts,
        "by_entity": entity_counts,
        "important": important_count,
        "unread": unread_count
    }
