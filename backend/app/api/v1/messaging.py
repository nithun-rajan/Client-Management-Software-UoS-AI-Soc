"""
Messaging/Communication API Endpoints

Activity Feed / Communication Log system for tracking all interactions
Links communications to Properties, Landlords, and Applicants
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
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
    db_communication = Communication(**communication.dict())
    
    db.add(db_communication)
    db.commit()
    db.refresh(db_communication)
    
    return db_communication


@router.get("", response_model=List[CommunicationResponse])
def list_communications(
    db: Session = Depends(get_db),
    type: Optional[str] = Query(None, description="Filter by type (email, call, sms, note, task, meeting, viewing)"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type (property, landlord, applicant)"),
    entity_id: Optional[int] = Query(None, description="Filter by specific entity ID"),
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
    
    # Pagination
    communications = query.offset(offset).limit(limit).all()
    
    return communications


@router.get("/{communication_id}", response_model=CommunicationResponse)
def get_communication(
    communication_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific communication by ID"""
    communication = db.query(Communication).filter(Communication.id == communication_id).first()
    
    if not communication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Communication not found"
        )
    
    return communication


@router.put("/{communication_id}", response_model=CommunicationResponse)
def update_communication(
    communication_id: int,
    communication_update: CommunicationUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing communication"""
    communication = db.query(Communication).filter(Communication.id == communication_id).first()
    
    if not communication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Communication not found"
        )
    
    # Update fields
    update_data = communication_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(communication, field, value)
    
    db.commit()
    db.refresh(communication)
    
    return communication


@router.delete("/{communication_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_communication(
    communication_id: int,
    db: Session = Depends(get_db)
):
    """Delete a communication"""
    communication = db.query(Communication).filter(Communication.id == communication_id).first()
    
    if not communication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Communication not found"
        )
    
    db.delete(communication)
    db.commit()
    
    return None


@router.get("/stats/summary")
def get_communication_stats(db: Session = Depends(get_db)):
    """
    Get communication statistics summary
    
    Returns:
    - Total count
    - Count by type
    - Count by entity
    - Unread count
    """
    # Total count
    total = db.query(func.count(Communication.id)).scalar()
    
    # Count by type
    by_type_query = db.query(
        Communication.type,
        func.count(Communication.id).label('count')
    ).group_by(Communication.type).all()
    
    by_type = {row.type: row.count for row in by_type_query}
    
    # Count by entity
    properties_count = db.query(func.count(Communication.id)).filter(Communication.property_id.isnot(None)).scalar()
    landlords_count = db.query(func.count(Communication.id)).filter(Communication.landlord_id.isnot(None)).scalar()
    applicants_count = db.query(func.count(Communication.id)).filter(Communication.applicant_id.isnot(None)).scalar()
    
    by_entity = {
        "properties": properties_count,
        "landlords": landlords_count,
        "applicants": applicants_count
    }
    
    # Unread count
    unread = db.query(func.count(Communication.id)).filter(Communication.is_read == False).scalar()
    
    return {
        "total": total,
        "by_type": by_type,
        "by_entity": by_entity,
        "unread": unread
    }
