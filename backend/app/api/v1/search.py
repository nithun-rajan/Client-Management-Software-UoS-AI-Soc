from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.property import Property
from app.schemas.property import PropertyResponse
from app.security.input_validation import (
    detect_command_injection,
    detect_sql_injection,
    sanitize_search_query,
)


router = APIRouter(prefix="/search", tags=["search"])


@router.get("/properties", response_model=list[PropertyResponse])
def search_properties(
    bedrooms: int | None = Query(None, description="Number of bedrooms"),
    bedrooms_min: int | None = Query(None, description="Minimum bedrooms"),
    bedrooms_max: int | None = Query(None, description="Maximum bedrooms"),
    rent_min: float | None = Query(None, description="Minimum rent"),
    rent_max: float | None = Query(None, description="Maximum rent"),
    property_type: str | None = Query(
        None, description="Property type (flat/house/maisonette)"
    ),
    postcode: str | None = Query(None, description="Postcode (partial match)"),
    city: str | None = Query(None, description="City (partial match)"),
    status: str | None = Query(None, description="Property status"),
    skip: int = Query(0, description="Skip N results"),
    limit: int = Query(100, description="Limit results"),
    db: Session = Depends(get_db),
):
    """
    Search properties with multiple filters.

    Examples:
    - /search/properties?bedrooms=2
    - /search/properties?bedrooms_min=2&bedrooms_max=4&rent_max=2000
    - /search/properties?postcode=SO15&property_type=flat
    """

    # Validate and sanitize
    if postcode:
        if detect_sql_injection(postcode) or detect_command_injection(postcode):
            raise HTTPException(status_code=400, detail="Invalid postcode")
        postcode = sanitize_search_query(postcode)
    if city:
        if detect_command_injection(city) or detect_sql_injection(city):
            raise HTTPException(status_code=400, detail="Invalid city")
        city = sanitize_search_query(city)

    # Start with base query
    query = db.query(Property)

    # Apply filters
    if bedrooms is not None:
        query = query.filter(Property.bedrooms == bedrooms)

    if bedrooms_min is not None:
        query = query.filter(Property.bedrooms >= bedrooms_min)

    if bedrooms_max is not None:
        query = query.filter(Property.bedrooms <= bedrooms_max)

    if rent_min is not None:
        query = query.filter(Property.rent >= rent_min)

    if rent_max is not None:
        query = query.filter(Property.rent <= rent_max)

    if property_type is not None:
        query = query.filter(Property.property_type == property_type)

    if postcode is not None:
        # Partial postcode match (e.g., "SO15" matches "SO15 2AB")
        query = query.filter(Property.postcode.ilike(f"%{postcode}%"))

    if city is not None:
        query = query.filter(Property.city.ilike(f"%{city}%"))

    if status is not None:
        query = query.filter(Property.status == status)

    # Get results with pagination
    return query.offset(skip).limit(limit).all()


@router.get("/properties/count")
def count_search_results(
    bedrooms: int | None = None,
    bedrooms_min: int | None = None,
    bedrooms_max: int | None = None,
    rent_min: float | None = None,
    rent_max: float | None = None,
    property_type: str | None = None,
    postcode: str | None = None,
    city: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    """
    Count how many properties match the search criteria.
    Useful for pagination.
    """

    # Validate
    if postcode and (detect_sql_injection(postcode) or detect_command_injection(postcode)):
        raise HTTPException(status_code=400, detail="Invalid postcode")
    if city and (detect_command_injection(city) or detect_sql_injection(city)):
        raise HTTPException(status_code=400, detail="Invalid city")

    # Start with base query
    query = db.query(Property)

    # Apply same filters as search
    if bedrooms is not None:
        query = query.filter(Property.bedrooms == bedrooms)

    if bedrooms_min is not None:
        query = query.filter(Property.bedrooms >= bedrooms_min)

    if bedrooms_max is not None:
        query = query.filter(Property.bedrooms <= bedrooms_max)

    if rent_min is not None:
        query = query.filter(Property.rent >= rent_min)

    if rent_max is not None:
        query = query.filter(Property.rent <= rent_max)

    if property_type is not None:
        query = query.filter(Property.property_type == property_type)

    if postcode is not None:
        query = query.filter(Property.postcode.ilike(f"%{postcode}%"))
    if city is not None:
        query = query.filter(Property.city.ilike(f"%{city}%"))

    if status is not None:
        query = query.filter(Property.status == status)

    return {"count": query.count()}
