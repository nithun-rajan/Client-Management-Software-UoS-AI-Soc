from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.models.offer import Offer
from app.models.property import Property
from app.models.applicant import Applicant

router = APIRouter(prefix="/offers", tags=["offers"])

# Schemas
class OfferCreate(BaseModel):
    property_id: str
    applicant_id: str
    offered_rent: float
    proposed_start_date: Optional[datetime] = None
    proposed_term_months: Optional[int] = 12
    special_conditions: Optional[str] = None
    applicant_notes: Optional[str] = None

class OfferUpdate(BaseModel):
    status: Optional[str] = None
    counter_offer_rent: Optional[float] = None
    negotiation_notes: Optional[str] = None
    agent_notes: Optional[str] = None
    holding_deposit_paid: Optional[bool] = None
    holding_deposit_amount: Optional[float] = None


@router.post("/")
def create_offer(offer: OfferCreate, db: Session = Depends(get_db)):
    """
    Submit an offer on a property
    Blueprint page 779: "Offer submitted – property, rent, term, conditions"
    """
    
    # Verify property and applicant exist
    property = db.query(Property).filter(Property.id == offer.property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    applicant = db.query(Applicant).filter(Applicant.id == offer.applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    
    # Create offer
    db_offer = Offer(**offer.model_dump())
    db.add(db_offer)
    db.commit()
    db.refresh(db_offer)
    
    return {
        "id": db_offer.id,
        "property_id": db_offer.property_id,
        "applicant_id": db_offer.applicant_id,
        "offered_rent": db_offer.offered_rent,
        "asking_rent": property.rent,
        "difference": (db_offer.offered_rent - property.rent) if property.rent else 0,
        "status": db_offer.status,
        "submitted_at": db_offer.submitted_at.isoformat(),
        "property": {
            "address": property.address,
            "rent": property.rent
        },
        "applicant": {
            "name": f"{applicant.first_name} {applicant.last_name}",
            "email": applicant.email
        }
    }


@router.get("/")
def list_offers(
    property_id: Optional[str] = None,
    applicant_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all offers with optional filters"""
    
    query = db.query(Offer)
    
    if property_id:
        query = query.filter(Offer.property_id == property_id)
    if applicant_id:
        query = query.filter(Offer.applicant_id == applicant_id)
    if status:
        query = query.filter(Offer.status == status)
    
    offers = query.order_by(Offer.submitted_at.desc()).limit(limit).all()
    
    result = []
    for o in offers:
        property = db.query(Property).filter(Property.id == o.property_id).first()
        applicant = db.query(Applicant).filter(Applicant.id == o.applicant_id).first()
        
        result.append({
            "id": o.id,
            "offered_rent": o.offered_rent,
            "status": o.status,
            "submitted_at": o.submitted_at.isoformat(),
            "property": {
                "id": property.id,
                "address": property.address,
                "asking_rent": property.rent
            } if property else None,
            "applicant": {
                "id": applicant.id,
                "name": f"{applicant.first_name} {applicant.last_name}"
            } if applicant else None
        })
    
    return {"offers": result, "total": len(result)}


@router.get("/{offer_id}")
def get_offer(offer_id: str, db: Session = Depends(get_db)):
    """Get offer details with negotiation history"""
    
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    property = db.query(Property).filter(Property.id == offer.property_id).first()
    applicant = db.query(Applicant).filter(Applicant.id == offer.applicant_id).first()
    
    return {
        "id": offer.id,
        "property_id": offer.property_id,
        "applicant_id": offer.applicant_id,
        "offered_rent": offer.offered_rent,
        "counter_offer_rent": offer.counter_offer_rent,
        "proposed_start_date": offer.proposed_start_date.isoformat() if offer.proposed_start_date else None,
        "proposed_term_months": offer.proposed_term_months,
        "status": offer.status,
        "special_conditions": offer.special_conditions,
        "negotiation_notes": offer.negotiation_notes,
        "applicant_notes": offer.applicant_notes,
        "agent_notes": offer.agent_notes,
        "holding_deposit_paid": offer.holding_deposit_paid,
        "holding_deposit_amount": offer.holding_deposit_amount,
        "submitted_at": offer.submitted_at.isoformat(),
        "responded_at": offer.responded_at.isoformat() if offer.responded_at else None,
        "accepted_at": offer.accepted_at.isoformat() if offer.accepted_at else None,
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


@router.put("/{offer_id}")
def update_offer(offer_id: str, offer_update: OfferUpdate, db: Session = Depends(get_db)):
    """
    Update offer status or counter-offer
    Blueprint page 779: "Negotiation history tracking"
    """
    
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    # Update fields
    update_data = offer_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(offer, field, value)
    
    # Record response timestamp
    if offer_update.status:
        offer.responded_at = datetime.utcnow()
        if offer_update.status == "accepted":
            offer.accepted_at = datetime.utcnow()
    
    db.commit()
    db.refresh(offer)
    
    return {
        "id": offer.id,
        "status": offer.status,
        "counter_offer_rent": offer.counter_offer_rent,
        "updated_at": offer.updated_at.isoformat(),
        "message": "Offer updated successfully"
    }


@router.post("/{offer_id}/accept")
def accept_offer(offer_id: str, db: Session = Depends(get_db)):
    """Accept an offer"""
    
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    offer.status = "accepted"
    offer.responded_at = datetime.utcnow()
    offer.accepted_at = datetime.utcnow()
    
    # Update applicant status
    applicant = db.query(Applicant).filter(Applicant.id == offer.applicant_id).first()
    if applicant:
        applicant.status = "offer_accepted"
    
    db.commit()
    
    return {
        "id": offer.id,
        "status": "accepted",
        "accepted_at": offer.accepted_at.isoformat(),
        "message": "Offer accepted successfully"
    }


@router.post("/{offer_id}/reject")
def reject_offer(offer_id: str, reason: Optional[str] = None, db: Session = Depends(get_db)):
    """Reject an offer"""
    
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    offer.status = "rejected"
    offer.responded_at = datetime.utcnow()
    if reason:
        offer.agent_notes = f"Rejected: {reason}"
    
    db.commit()
    
    return {
        "id": offer.id,
        "status": "rejected",
        "message": "Offer rejected"
    }


@router.delete("/{offer_id}")
def withdraw_offer(offer_id: str, db: Session = Depends(get_db)):
    """Withdraw an offer (by applicant)"""
    
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    offer.status = "withdrawn"
    db.commit()
    
    return {"message": "Offer withdrawn successfully"}

