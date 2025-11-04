"""
Messaging/Communication API Endpoints

Activity Feed / Communication Log system for tracking all interactions
Links communications to Properties, Landlords, and Applicants
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.communication import Communication
from app.schemas.communication import CommunicationCreate, CommunicationUpdate, CommunicationResponse

router = APIRouter(prefix="/messaging", tags=["messaging"])


@router.post("", response_model=CommunicationResponse, status_code=status.HTTP_201_CREATED)
def create_communication(
    communication: CommunicationCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new communication log entry
    
    At least one entity (property, landlord, or applicant) must be linked
    """
    # Create new communication
    db_communication = Communication(**communication.model_dump())
    
    db.add(db_communication)
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
    communication_id: int,
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
    communication_id: int,
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
    communication_id: int,
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
    property_id: int,
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
    landlord_id: int,
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
    applicant_id: int,
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
