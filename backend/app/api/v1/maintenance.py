from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.maintenance import MaintenanceIssue, MaintenanceStatus, MaintenancePriority, MaintenanceType
from app.models.property import Property
from app.models.tenancy import Tenancy
from app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate, MaintenanceResponse

router = APIRouter(prefix="/maintenance", tags=["maintenance"])


def build_maintenance_response(maintenance: MaintenanceIssue) -> MaintenanceResponse:
    """Helper function to build maintenance response with computed properties"""
    # Get all column values
    response_data = {
        col.name: getattr(maintenance, col.name)
        for col in maintenance.__table__.columns
    }
    # Add computed properties
    response_data["days_open"] = maintenance.days_open
    response_data["is_overdue"] = maintenance.is_overdue
    response_data["requires_attention"] = maintenance.requires_attention
    return MaintenanceResponse(**response_data)


@router.post("/", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
def create_maintenance_issue(
    maintenance_data: MaintenanceCreate,
    db: Session = Depends(get_db)
):
    """Create a new maintenance issue"""
    # Validate property exists
    property = db.query(Property).filter(Property.id == maintenance_data.property_id).first()
    if not property:
        raise HTTPException(
            status_code=404, 
            detail=f"Property not found with ID: {maintenance_data.property_id}. Please use a valid property ID from /api/v1/properties"
        )
    
    # Validate tenancy exists if provided
    if maintenance_data.tenancy_id:
        tenancy = db.query(Tenancy).filter(Tenancy.id == maintenance_data.tenancy_id).first()
        if not tenancy:
            raise HTTPException(status_code=404, detail="Tenancy not found")
    
    # Auto-set reported_date if not provided
    maintenance_dict = maintenance_data.model_dump()
    if 'reported_date' not in maintenance_dict or maintenance_dict['reported_date'] is None:
        maintenance_dict['reported_date'] = datetime.now(timezone.utc)
    
    # Auto-set landlord_id from property if not provided
    if not maintenance_dict.get('landlord_id') and property.landlord_id:
        maintenance_dict['landlord_id'] = property.landlord_id
    
    # Auto-set managed_by from property if not provided
    if not maintenance_dict.get('managed_by') and property.managed_by:
        maintenance_dict['managed_by'] = property.managed_by
    
    # Create maintenance issue
    db_maintenance = MaintenanceIssue(**maintenance_dict)
    db.add(db_maintenance)
    db.commit()
    db.refresh(db_maintenance)
    
    return build_maintenance_response(db_maintenance)


@router.get("/", response_model=List[MaintenanceResponse])
def list_maintenance_issues(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    issue_type: Optional[str] = Query(None, description="Filter by issue type"),
    property_id: Optional[str] = Query(None, description="Filter by property ID"),
    tenancy_id: Optional[str] = Query(None, description="Filter by tenancy ID"),
    managed_by: Optional[str] = Query(None, description="Filter by property manager user ID"),
    is_emergency: Optional[bool] = Query(None, description="Filter by emergency status"),
    is_complaint: Optional[bool] = Query(None, description="Filter by complaint status"),
    db: Session = Depends(get_db)
):
    """List all maintenance issues with optional filtering"""
    query = db.query(MaintenanceIssue)
    
    # Apply filters
    if status:
        query = query.filter(MaintenanceIssue.status == status)
    if priority:
        query = query.filter(MaintenanceIssue.priority == priority)
    if issue_type:
        query = query.filter(MaintenanceIssue.issue_type == issue_type)
    if property_id:
        query = query.filter(MaintenanceIssue.property_id == property_id)
    if tenancy_id:
        query = query.filter(MaintenanceIssue.tenancy_id == tenancy_id)
    if managed_by:
        query = query.filter(MaintenanceIssue.managed_by == managed_by)
    if is_emergency is not None:
        query = query.filter(MaintenanceIssue.is_emergency == is_emergency)
    if is_complaint is not None:
        query = query.filter(MaintenanceIssue.is_complaint == is_complaint)
    
    # Order by reported_date (newest first) and priority
    query = query.order_by(
        MaintenanceIssue.is_emergency.desc(),
        MaintenanceIssue.priority.desc(),
        MaintenanceIssue.reported_date.desc()
    )
    
    maintenance_issues = query.offset(skip).limit(limit).all()
    
    return [build_maintenance_response(issue) for issue in maintenance_issues]


@router.get("/{maintenance_id}", response_model=MaintenanceResponse)
def get_maintenance_issue(
    maintenance_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific maintenance issue by ID"""
    maintenance = db.query(MaintenanceIssue).filter(MaintenanceIssue.id == maintenance_id).first()
    if not maintenance:
        raise HTTPException(status_code=404, detail="Maintenance issue not found")
    
    return build_maintenance_response(maintenance)


@router.patch("/{maintenance_id}", response_model=MaintenanceResponse)
def update_maintenance_issue(
    maintenance_id: str,
    maintenance_data: MaintenanceUpdate,
    db: Session = Depends(get_db)
):
    """Partially update a maintenance issue"""
    maintenance = db.query(MaintenanceIssue).filter(MaintenanceIssue.id == maintenance_id).first()
    if not maintenance:
        raise HTTPException(status_code=404, detail="Maintenance issue not found")
    
    # Update fields
    update_data = maintenance_data.model_dump(exclude_unset=True)
    
    # Auto-update dates based on status changes
    if 'status' in update_data:
        new_status = update_data['status']
        now = datetime.now(timezone.utc)
        
        if new_status == MaintenanceStatus.ACKNOWLEDGED and not maintenance.acknowledged_date:
            update_data['acknowledged_date'] = now
        elif new_status == MaintenanceStatus.INSPECTED and not maintenance.inspection_date:
            update_data['inspection_date'] = now
        elif new_status == MaintenanceStatus.IN_PROGRESS and not maintenance.started_date:
            update_data['started_date'] = now
        elif new_status == MaintenanceStatus.COMPLETED and not maintenance.completed_date:
            update_data['completed_date'] = now
        elif new_status == MaintenanceStatus.CLOSED and not maintenance.closed_date:
            update_data['closed_date'] = now
    
    # Apply updates
    for key, value in update_data.items():
        setattr(maintenance, key, value)
    
    db.commit()
    db.refresh(maintenance)
    
    return build_maintenance_response(maintenance)


@router.put("/{maintenance_id}", response_model=MaintenanceResponse)
def update_maintenance_issue_full(
    maintenance_id: str,
    maintenance_data: MaintenanceUpdate,
    db: Session = Depends(get_db)
):
    """Update a maintenance issue (full update)"""
    # Same as PATCH for now
    return update_maintenance_issue(maintenance_id, maintenance_data, db)


@router.delete("/{maintenance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_maintenance_issue(
    maintenance_id: str,
    db: Session = Depends(get_db)
):
    """Delete a maintenance issue"""
    maintenance = db.query(MaintenanceIssue).filter(MaintenanceIssue.id == maintenance_id).first()
    if not maintenance:
        raise HTTPException(status_code=404, detail="Maintenance issue not found")
    
    db.delete(maintenance)
    db.commit()
    return None


@router.get("/property/{property_id}", response_model=List[MaintenanceResponse])
def get_maintenance_by_property(
    property_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db)
):
    """Get all maintenance issues for a specific property"""
    # Validate property exists
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    query = db.query(MaintenanceIssue).filter(MaintenanceIssue.property_id == property_id)
    
    if status:
        query = query.filter(MaintenanceIssue.status == status)
    
    query = query.order_by(
        MaintenanceIssue.is_emergency.desc(),
        MaintenanceIssue.priority.desc(),
        MaintenanceIssue.reported_date.desc()
    )
    
    maintenance_issues = query.offset(skip).limit(limit).all()
    
    return [build_maintenance_response(issue) for issue in maintenance_issues]


@router.get("/tenancy/{tenancy_id}", response_model=List[MaintenanceResponse])
def get_maintenance_by_tenancy(
    tenancy_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all maintenance issues for a specific tenancy"""
    # Validate tenancy exists
    tenancy = db.query(Tenancy).filter(Tenancy.id == tenancy_id).first()
    if not tenancy:
        raise HTTPException(status_code=404, detail="Tenancy not found")
    
    query = db.query(MaintenanceIssue).filter(MaintenanceIssue.tenancy_id == tenancy_id)
    
    query = query.order_by(
        MaintenanceIssue.is_emergency.desc(),
        MaintenanceIssue.priority.desc(),
        MaintenanceIssue.reported_date.desc()
    )
    
    maintenance_issues = query.offset(skip).limit(limit).all()
    
    return [build_maintenance_response(issue) for issue in maintenance_issues]


@router.get("/emergency/active", response_model=List[MaintenanceResponse])
def get_emergency_maintenance(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all active emergency maintenance issues"""
    # Get emergency issues that are not completed/closed/cancelled
    # Include issues where is_emergency=True OR priority=urgent
    query = db.query(MaintenanceIssue).filter(
        or_(
            MaintenanceIssue.is_emergency == True,
            MaintenanceIssue.priority == MaintenancePriority.URGENT
        ),
        MaintenanceIssue.status.notin_([
            MaintenanceStatus.COMPLETED,
            MaintenanceStatus.CLOSED,
            MaintenanceStatus.CANCELLED
        ])
    )
    
    # Order by: true emergencies first, then by reported date (oldest first)
    query = query.order_by(
        MaintenanceIssue.is_emergency.desc(),  # True emergencies first
        MaintenanceIssue.reported_date.asc()  # Oldest first
    )
    
    maintenance_issues = query.offset(skip).limit(limit).all()
    
    return [build_maintenance_response(issue) for issue in maintenance_issues]


@router.get("/overdue/list", response_model=List[MaintenanceResponse])
def get_overdue_maintenance(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all overdue maintenance issues"""
    # Get all non-closed maintenance issues
    query = db.query(MaintenanceIssue).filter(
        MaintenanceIssue.status.notin_([
            MaintenanceStatus.COMPLETED,
            MaintenanceStatus.CLOSED,
            MaintenanceStatus.CANCELLED
        ])
    )
    
    maintenance_issues = query.offset(skip).limit(limit).all()
    
    # Filter to only overdue issues using the model's is_overdue property
    overdue_issues = [issue for issue in maintenance_issues if issue.is_overdue]
    
    # Sort by priority and days_open
    overdue_issues.sort(key=lambda x: (
        x.is_emergency,
        x.priority == MaintenancePriority.URGENT,
        x.priority == MaintenancePriority.HIGH,
        -x.days_open
    ), reverse=True)
    
    # Limit results after filtering
    overdue_issues = overdue_issues[:limit]
    
    return [build_maintenance_response(issue) for issue in overdue_issues]


@router.get("/requires-attention/list", response_model=List[MaintenanceResponse])
def get_maintenance_requires_attention(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all maintenance issues that require immediate attention"""
    # Get all non-closed maintenance issues
    query = db.query(MaintenanceIssue).filter(
        MaintenanceIssue.status.notin_([
            MaintenanceStatus.COMPLETED,
            MaintenanceStatus.CLOSED,
            MaintenanceStatus.CANCELLED
        ])
    )
    
    maintenance_issues = query.offset(skip).limit(limit * 2).all()  # Get more to filter
    
    # Filter to only issues that require attention
    attention_issues = [issue for issue in maintenance_issues if issue.requires_attention]
    
    # Sort by emergency, priority, days_open
    attention_issues.sort(key=lambda x: (
        x.is_emergency,
        x.priority == MaintenancePriority.URGENT,
        x.priority == MaintenancePriority.HIGH,
        -x.days_open
    ), reverse=True)
    
    # Limit results
    attention_issues = attention_issues[:limit]
    
    return [build_maintenance_response(issue) for issue in attention_issues]

