from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.property import Property
from app.schemas.property import PropertyCreate, PropertyResponse, PropertyUpdate
from app.security.input_validation import detect_sql_injection, detect_xss


router = APIRouter(prefix="/properties", tags=["properties"])


@router.post("/", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def create_property(property_data: PropertyCreate, db: Session = Depends(get_db)):
    """Create a new property"""
    # Basic security: reject obvious SQLi/XSS in inputs
    if detect_sql_injection(property_data.address):
        raise HTTPException(status_code=400, detail="Invalid address input")
    if property_data.description and detect_xss(property_data.description):
        raise HTTPException(status_code=400, detail="Invalid description input")
    db_property = Property(**property_data.model_dump())
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return db_property


@router.get("/", response_model=list[PropertyResponse])
def list_properties(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all properties"""
    return db.query(Property).offset(skip).limit(limit).all()


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: str, db: Session = Depends(get_db)):
    """Get a specific property"""
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    return property


@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: str, property_data: PropertyUpdate, db: Session = Depends(get_db)
):
    """Update a property"""
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")

    # Reject obvious injections
    if property_data.address and detect_sql_injection(property_data.address):
        raise HTTPException(status_code=400, detail="Invalid address input")
    if property_data.description and detect_xss(property_data.description):
        raise HTTPException(status_code=400, detail="Invalid description input")

    for key, value in property_data.model_dump(exclude_unset=True).items():
        setattr(property, key, value)

    db.commit()
    db.refresh(property)
    return property


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(property_id: str, db: Session = Depends(get_db)):
    """Delete a property"""
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")

    db.delete(property)
    db.commit()
