from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.property import Property
from app.schemas.property import PropertyCreate, PropertyResponse, PropertyUpdate

router = APIRouter(prefix="/properties", tags=["properties"])

@router.post("/", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def create_property(property_data: PropertyCreate, db: Session = Depends(get_db)):
    db_property = Property(**property_data.model_dump())
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return db_property

@router.get("/", response_model=List[PropertyResponse])
def list_properties(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    properties = db.query(Property).offset(skip).limit(limit).all()
    return properties

@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: str, db: Session = Depends(get_db)):
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    return property

@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(property_id: str, property_data: PropertyUpdate, db: Session = Depends(get_db)):
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    for key, value in property_data.model_dump(exclude_unset=True).items():
        setattr(property, key, value)
    db.commit()
    db.refresh(property)
    return property

@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(property_id: str, db: Session = Depends(get_db)):
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    db.delete(property)
    db.commit()