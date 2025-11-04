
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import PropertyStatus
from app.models.property import Property
from app.schemas.property import PropertyResponse


router = APIRouter(prefix="/search", tags=["search"])

@router.get("/properties", response_model=list[PropertyResponse])
def search_properties(
    bedrooms: int | None = Query(None, description="Number of bedrooms"),
    bedrooms_min: int | None = Query(None, description="Minimum bedrooms"),
    bedrooms_max: int | None = Query(None, description="Maximum bedrooms"),
    rent_min: float | None = Query(None, description="Minimum rent"),
    rent_max: float | None = Query(None, description="Maximum rent"),
    property_type: str | None = Query(None, description="Property type (flat/house/maisonette)"),
    postcode: str | None = Query(None, description="Postcode (partial match)"),
    status: PropertyStatus | None = Query(None, description="Property status"),
    skip: int = Query(0, description="Skip N results"),
    limit: int = Query(100, description="Limit results"),
    db: Session = Depends(get_db)
):
    """
    Search properties with multiple filters.

    Examples:
    - /search/properties?bedrooms=2
    - /search/properties?bedrooms_min=2&bedrooms_max=4&rent_max=2000
    - /search/properties?postcode=SO15&property_type=flat
    """

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

    if status is not None:
        query = query.filter(Property.status == status)

    # Get results with pagination
    properties = query.offset(skip).limit(limit).all()

    return properties


@router.get("/properties/count")
def count_search_results(
    bedrooms: int | None = None,
    bedrooms_min: int | None = None,
    bedrooms_max: int | None = None,
    rent_min: float | None = None,
    rent_max: float | None = None,
    property_type: str | None = None,
    postcode: str | None = None,
    status: PropertyStatus | None = None,
    db: Session = Depends(get_db)
):
    """
    Count how many properties match the search criteria.
    Useful for pagination.
    """

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

    if status is not None:
        query = query.filter(Property.status == status)

    return {"count": query.count()}
