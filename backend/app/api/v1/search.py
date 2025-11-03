from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.property import Property
from app.schemas.property import PropertyResponse

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/properties", response_model=List[PropertyResponse])
def search_properties(
    bedrooms: Optional[int] = Query(None),
    bedrooms_min: Optional[int] = Query(None),
    bedrooms_max: Optional[int] = Query(None),
    rent_min: Optional[float] = Query(None),
    rent_max: Optional[float] = Query(None),
    property_type: Optional[str] = Query(None),
    postcode: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(100),
    db: Session = Depends(get_db)
):
    q=db.query(Property)
    if bedrooms:q=q.filter(Property.bedrooms==bedrooms)
    if bedrooms_min:q=q.filter(Property.bedrooms>=bedrooms_min)
    if bedrooms_max:q=q.filter(Property.bedrooms<=bedrooms_max)
    if rent_min:q=q.filter(Property.rent>=rent_min)
    if rent_max:q=q.filter(Property.rent<=rent_max)
    if property_type:q=q.filter(Property.property_type.ilike(f"%{property_type}%"))
    if postcode:q=q.filter(Property.postcode.ilike(f"%{postcode}%"))
    if status:q=q.filter(Property.status==status)
    return q.offset(skip).limit(limit).all()

@router.get("/properties/count")
def count_properties(
    bedrooms:Optional[int]=Query(None),
    rent_min:Optional[float]=Query(None),
    rent_max:Optional[float]=Query(None),
    property_type:Optional[str]=Query(None),
    postcode:Optional[str]=Query(None),
    status:Optional[str]=Query(None),
    db:Session=Depends(get_db)
):
    q=db.query(Property)
    if bedrooms:q=q.filter(Property.bedrooms==bedrooms)
    if rent_min:q=q.filter(Property.rent>=rent_min)
    if rent_max:q=q.filter(Property.rent<=rent_max)
    if property_type:q=q.filter(Property.property_type.ilike(f"%{property_type}%"))
    if postcode:q=q.filter(Property.postcode.ilike(f"%{postcode}%"))
    if status:q=q.filter(Property.status==status)
    return{"count":q.count()}