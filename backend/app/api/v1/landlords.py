from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.landlord import Landlord
from app.schemas.landlord import LandlordCreate, LandlordResponse, LandlordUpdate

router = APIRouter(prefix="/landlords", tags=["landlords"])

@router.post("/", response_model=LandlordResponse, status_code=status.HTTP_201_CREATED)
def create_landlord(landlord_data: LandlordCreate, db: Session = Depends(get_db)):
    """Create a new landlord"""
    # Check if email already exists
    existing = db.query(Landlord).filter(Landlord.email == landlord_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_landlord = Landlord(**landlord_data.model_dump())
    db.add(db_landlord)
    db.commit()
    db.refresh(db_landlord)
    return db_landlord

@router.get("/", response_model=List[LandlordResponse])
def list_landlords(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all landlords"""
    landlords = db.query(Landlord).offset(skip).limit(limit).all()
    return landlords

@router.get("/{landlord_id}", response_model=LandlordResponse)
def get_landlord(landlord_id: str, db: Session = Depends(get_db)):
    """Get a specific landlord"""
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=404, detail="Landlord not found")
    return landlord

@router.put("/{landlord_id}", response_model=LandlordResponse)
def update_landlord(
    landlord_id: str,
    landlord_data: LandlordUpdate,
    db: Session = Depends(get_db)
):
    """Update a landlord"""
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=404, detail="Landlord not found")
    
    for key, value in landlord_data.model_dump(exclude_unset=True).items():
        setattr(landlord, key, value)
    
    db.commit()
    db.refresh(landlord)
    return landlord

@router.delete("/{landlord_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_landlord(landlord_id: str, db: Session = Depends(get_db)):
    """Delete a landlord"""
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=404, detail="Landlord not found")
    
    db.delete(landlord)
    db.commit()

@router.get("/compliance/aml-check")
def check_aml_compliance(db: Session = Depends(get_db)):
    """
    Check AML document expiry for all landlords
    Blueprint: "System auto-flags any AML doc expiring within 12 months"
    """
    from datetime import datetime, timedelta
    
    landlords = db.query(Landlord).all()
    
    flagged = []
    compliant = []
    
    for landlord in landlords:
        alert_level = "green"  # compliant
        issues = []
        
        if landlord.aml_check_expiry:
            days_until_expiry = (landlord.aml_check_expiry - datetime.now().date()).days
            
            if days_until_expiry < 0:
                alert_level = "red"
                issues.append(f"AML expired {abs(days_until_expiry)} days ago")
            elif days_until_expiry < 90:  # 3 months
                alert_level = "red"
                issues.append(f"AML expires in {days_until_expiry} days - URGENT")
            elif days_until_expiry < 365:  # 12 months
                alert_level = "amber"
                issues.append(f"AML expires in {days_until_expiry} days")
        else:
            alert_level = "red"
            issues.append("No AML expiry date recorded")
        
        landlord_data = {
            "id": landlord.id,
            "name": landlord.full_name,
            "alert_level": alert_level,
            "aml_expiry": landlord.aml_check_expiry.isoformat() if landlord.aml_check_expiry else None,
            "issues": issues
        }
        
        if alert_level in ["red", "amber"]:
            flagged.append(landlord_data)
        else:
            compliant.append(landlord_data)
    
    return {
        "total_landlords": len(landlords),
        "flagged_count": len(flagged),
        "compliant_count": len(compliant),
        "flagged_landlords": flagged,
        "compliant_landlords": compliant,
        "summary": {
            "red_alerts": len([l for l in flagged if l["alert_level"] == "red"]),
            "amber_alerts": len([l for l in flagged if l["alert_level"] == "amber"])
        }
    }
