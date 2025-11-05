from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

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


@router.get("/", response_model=list[LandlordResponse])
def list_landlords(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all landlords"""
    return db.query(Landlord).offset(skip).limit(limit).all()


@router.get("/{landlord_id}", response_model=LandlordResponse)
def get_landlord(landlord_id: int, db: Session = Depends(get_db)):
    """Get a specific landlord"""
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=404, detail="Landlord not found")
    return landlord


@router.put("/{landlord_id}", response_model=LandlordResponse)
def update_landlord(
    landlord_id: int, landlord_data: LandlordUpdate, db: Session = Depends(get_db)
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
def delete_landlord(landlord_id: int, db: Session = Depends(get_db)):
    """Delete a landlord"""
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=404, detail="Landlord not found")

    db.delete(landlord)
    db.commit()
