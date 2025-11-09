from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.models.viewing import Viewing
from app.models.property import Property
from app.models.applicant import Applicant

router = APIRouter(prefix="/viewings", tags=["viewings"])

# Schemas
class ViewingCreate(BaseModel):
    property_id: str
    applicant_id: str
    scheduled_date: datetime
    duration_minutes: str = "30"
    assigned_agent: Optional[str] = None
    agent_notes: Optional[str] = None

class ViewingUpdate(BaseModel):
    scheduled_date: Optional[datetime] = None
    status: Optional[str] = None
    agent_notes: Optional[str] = None
    applicant_attended: Optional[bool] = None
    feedback_rating: Optional[str] = None
    feedback_notes: Optional[str] = None


@router.post("/")
def create_viewing(viewing: ViewingCreate, db: Session = Depends(get_db)):
    """
    Book a property viewing
    Blueprint page 779: "Viewing scheduling from applicant record"
    """
    
    # Verify property and applicant exist
    property = db.query(Property).filter(Property.id == viewing.property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    applicant = db.query(Applicant).filter(Applicant.id == viewing.applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    
    # Create viewing
    db_viewing = Viewing(**viewing.model_dump())
    db.add(db_viewing)
    db.commit()
    db.refresh(db_viewing)
    
    return {
        "id": db_viewing.id,
        "property_id": db_viewing.property_id,
        "applicant_id": db_viewing.applicant_id,
        "scheduled_date": db_viewing.scheduled_date.isoformat(),
        "status": db_viewing.status,
        "property": {
            "address": property.address,
            "rent": property.rent
        },
        "applicant": {
            "name": f"{applicant.first_name} {applicant.last_name}",
            "email": applicant.email,
            "phone": applicant.phone
        }
    }


@router.get("/")
def list_viewings(
    property_id: Optional[str] = None,
    applicant_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all viewings with optional filters"""
    
    query = db.query(Viewing)
    
    if property_id:
        query = query.filter(Viewing.property_id == property_id)
    if applicant_id:
        query = query.filter(Viewing.applicant_id == applicant_id)
    if status:
        query = query.filter(Viewing.status == status)
    
    viewings = query.order_by(Viewing.scheduled_date.desc()).limit(limit).all()
    
    result = []
    for v in viewings:
        property = db.query(Property).filter(Property.id == v.property_id).first()
        applicant = db.query(Applicant).filter(Applicant.id == v.applicant_id).first()
        
        result.append({
            "id": v.id,
            "scheduled_date": v.scheduled_date.isoformat(),
            "status": v.status,
            "property": {
                "id": property.id,
                "address": property.address
            } if property else None,
            "applicant": {
                "id": applicant.id,
                "name": f"{applicant.first_name} {applicant.last_name}"
            } if applicant else None,
            "feedback_rating": v.feedback_rating
        })
    
    return {"viewings": result, "total": len(result)}


@router.get("/{viewing_id}")
def get_viewing(viewing_id: str, db: Session = Depends(get_db)):
    """Get viewing details"""
    
    viewing = db.query(Viewing).filter(Viewing.id == viewing_id).first()
    if not viewing:
        raise HTTPException(status_code=404, detail="Viewing not found")
    
    property = db.query(Property).filter(Property.id == viewing.property_id).first()
    applicant = db.query(Applicant).filter(Applicant.id == viewing.applicant_id).first()
    
    return {
        "id": viewing.id,
        "property_id": viewing.property_id,
        "applicant_id": viewing.applicant_id,
        "scheduled_date": viewing.scheduled_date.isoformat(),
        "duration_minutes": viewing.duration_minutes,
        "status": viewing.status,
        "assigned_agent": viewing.assigned_agent,
        "agent_notes": viewing.agent_notes,
        "applicant_attended": viewing.applicant_attended,
        "feedback_rating": viewing.feedback_rating,
        "feedback_notes": viewing.feedback_notes,
        "property": {
            "id": property.id,
            "address": property.address,
            "rent": property.rent,
            "bedrooms": property.bedrooms
        } if property else None,
        "applicant": {
            "id": applicant.id,
            "name": f"{applicant.first_name} {applicant.last_name}",
            "email": applicant.email,
            "phone": applicant.phone
        } if applicant else None
    }


@router.put("/{viewing_id}")
def update_viewing(viewing_id: str, viewing_update: ViewingUpdate, db: Session = Depends(get_db)):
    """
    Update viewing details
    Blueprint page 779: "Viewing feedback entered (by agent after viewing)"
    """
    
    viewing = db.query(Viewing).filter(Viewing.id == viewing_id).first()
    if not viewing:
        raise HTTPException(status_code=404, detail="Viewing not found")
    
    # Update fields
    update_data = viewing_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(viewing, field, value)
    
    # If feedback is submitted, record timestamp
    if viewing_update.feedback_rating or viewing_update.feedback_notes:
        viewing.feedback_submitted_at = datetime.utcnow()
    
    db.commit()
    db.refresh(viewing)
    
    return {
        "id": viewing.id,
        "status": viewing.status,
        "updated_at": viewing.updated_at.isoformat(),
        "message": "Viewing updated successfully"
    }


@router.delete("/{viewing_id}")
def cancel_viewing(viewing_id: str, db: Session = Depends(get_db)):
    """Cancel a viewing"""
    
    viewing = db.query(Viewing).filter(Viewing.id == viewing_id).first()
    if not viewing:
        raise HTTPException(status_code=404, detail="Viewing not found")
    
    viewing.status = "cancelled"
    db.commit()
    
    return {"message": "Viewing cancelled successfully"}

