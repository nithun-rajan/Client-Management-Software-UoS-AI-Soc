
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_token, get_current_user
from app.models.property import Property
from app.models.landlord import Landlord
from app.models.vendor import Vendor
from app.models.user import User
from app.schemas.property import PropertyCreate, PropertyResponse, PropertyUpdate, LandlordInfo, VendorInfo, AgentInfo
from app.services.notification_service import notify


router = APIRouter(prefix="/properties", tags=["properties"])

# OAuth2 scheme for optional authentication
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def add_agent_info_to_property_response(property: Property, response: PropertyResponse, db: Session) -> PropertyResponse:
    """Helper function to add agent information to property response"""
    if property.managed_by:
        agent = db.query(User).filter(User.id == property.managed_by).first()
        if agent:
            response.managed_agent = AgentInfo(
                id=agent.id,
                first_name=agent.first_name,
                last_name=agent.last_name,
                email=agent.email
            )
    return response

def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None"""
    if not token:
        return None
    try:
        payload = verify_token(token, "access")
        email = payload.get("sub")
        if email:
            user = db.query(User).filter(User.email == email).first()
            if user and user.is_active:
                return user
    except Exception:
        pass
    return None

@router.post("/", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def create_property(
    property_data: PropertyCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Create a new property"""
    property_dict = property_data.model_dump()
    
    # Construct full address if not provided but city is
    if not property_dict.get("address") and property_dict.get("city"):
        property_dict["address"] = property_dict["city"]
    
    # Ensure address is set (required field in model)
    if not property_dict.get("address"):
        property_dict["address"] = property_dict.get("city", "Unknown")
    
    db_property = Property(**property_dict)
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    
    # Create notification for new property
    if db_property.id:
        try:
            user_id = current_user.id if current_user else None
            # Use address or city for the title
            property_title = property_dict.get("address") or property_dict.get("city", "New Property")
            notify(
                db=db,
                user_id=user_id,
                title=f"New Property: {property_title}",
                body=str(db_property.id),
                type="property",
                priority="low"
            )
        except Exception:
            pass
    
    # Include landlord or vendor information in response
    response = PropertyResponse.model_validate(db_property)
    if db_property.landlord_id:
        landlord = db.query(Landlord).filter(Landlord.id == db_property.landlord_id).first()
        if landlord:
            response.landlord = LandlordInfo(
                id=landlord.id,
                full_name=landlord.full_name,
                email=landlord.email,
                phone=landlord.phone
            )
    if db_property.vendor_id:
        vendor = db.query(Vendor).filter(Vendor.id == db_property.vendor_id).first()
        if vendor:
            response.vendor = VendorInfo(
                id=vendor.id,
                first_name=vendor.first_name,
                last_name=vendor.last_name,
                email=vendor.email,
                primary_phone=vendor.primary_phone
            )
    return add_agent_info_to_property_response(db_property, response, db)

@router.get("/", response_model=list[PropertyResponse])
def list_properties(
    skip: int = Query(0, ge=0), 
    limit: int = Query(100, ge=1, le=1000), 
    landlord_id: Optional[str] = Query(None, description="Filter properties by landlord ID"),
    db: Session = Depends(get_db)
):
    """List all properties with landlord information. Optionally filter by landlord_id."""
    query = db.query(Property)
    
    # Filter by landlord_id if provided
    if landlord_id:
        query = query.filter(Property.landlord_id == landlord_id)
    
    properties = query.offset(skip).limit(limit).all()
    result = []
    for property in properties:
        response = PropertyResponse.model_validate(property)
        # Include landlord information if property has a landlord
        if property.landlord_id:
            landlord = db.query(Landlord).filter(Landlord.id == property.landlord_id).first()
            if landlord:
                response.landlord = LandlordInfo(
                    id=landlord.id,
                    full_name=landlord.full_name,
                    email=landlord.email,
                    phone=landlord.phone
                )
        # Include vendor information if property has a vendor
        if property.vendor_id:
            vendor = db.query(Vendor).filter(Vendor.id == property.vendor_id).first()
            if vendor:
                response.vendor = VendorInfo(
                    id=vendor.id,
                    first_name=vendor.first_name,
                    last_name=vendor.last_name,
                    email=vendor.email,
                    primary_phone=vendor.primary_phone
                )
        result.append(add_agent_info_to_property_response(property, response, db))
    return result

@router.get("/my-properties", response_model=list[PropertyResponse])
def get_my_properties(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get properties managed by the current authenticated user
    
    CRM Feature: "My Properties" - Shows which properties are managed by which user
    """
    properties = db.query(Property)\
        .filter(Property.managed_by == current_user.id)\
        .order_by(Property.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    result = []
    for property in properties:
        response = PropertyResponse.model_validate(property)
        # Include landlord information if property has a landlord
        if property.landlord_id:
            landlord = db.query(Landlord).filter(Landlord.id == property.landlord_id).first()
            if landlord:
                response.landlord = LandlordInfo(
                    id=landlord.id,
                    full_name=landlord.full_name,
                    email=landlord.email,
                    phone=landlord.phone
                )
        result.append(add_agent_info_to_property_response(property, response, db))
    return result

@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: str, db: Session = Depends(get_db)):
    """Get a specific property with landlord information"""
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    response = PropertyResponse.model_validate(property)
    # Include landlord information if property has a landlord
    if property.landlord_id:
        landlord = db.query(Landlord).filter(Landlord.id == property.landlord_id).first()
        if landlord:
            response.landlord = LandlordInfo(
                id=landlord.id,
                full_name=landlord.full_name,
                email=landlord.email,
                phone=landlord.phone
            )
    # Include vendor information if property has a vendor
    if property.vendor_id:
        vendor = db.query(Vendor).filter(Vendor.id == property.vendor_id).first()
        if vendor:
            response.vendor = VendorInfo(
                id=vendor.id,
                first_name=vendor.first_name,
                last_name=vendor.last_name,
                email=vendor.email,
                primary_phone=vendor.primary_phone
            )
    return add_agent_info_to_property_response(property, response, db)

@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: str,
    property_data: PropertyUpdate,
    db: Session = Depends(get_db)
):
    """Update a property"""
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")

    for key, value in property_data.model_dump(exclude_unset=True).items():
        setattr(property, key, value)

    db.commit()
    db.refresh(property)
    
    # Include landlord or vendor information in response
    response = PropertyResponse.model_validate(property)
    if property.landlord_id:
        landlord = db.query(Landlord).filter(Landlord.id == property.landlord_id).first()
        if landlord:
            response.landlord = LandlordInfo(
                id=landlord.id,
                full_name=landlord.full_name,
                email=landlord.email,
                phone=landlord.phone
            )
    if property.vendor_id:
        vendor = db.query(Vendor).filter(Vendor.id == property.vendor_id).first()
        if vendor:
            response.vendor = VendorInfo(
                id=vendor.id,
                first_name=vendor.first_name,
                last_name=vendor.last_name,
                email=vendor.email,
                primary_phone=vendor.primary_phone
            )
    return add_agent_info_to_property_response(property, response, db)

@router.patch("/{property_id}", response_model=PropertyResponse)
def patch_property(
    property_id: str,
    property_data: PropertyUpdate,
    db: Session = Depends(get_db)
):
    """Partially update a property (PATCH)"""
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")

    for key, value in property_data.model_dump(exclude_unset=True).items():
        setattr(property, key, value)

    db.commit()
    db.refresh(property)
    
    # Include landlord or vendor information in response
    response = PropertyResponse.model_validate(property)
    if property.landlord_id:
        landlord = db.query(Landlord).filter(Landlord.id == property.landlord_id).first()
        if landlord:
            response.landlord = LandlordInfo(
                id=landlord.id,
                full_name=landlord.full_name,
                email=landlord.email,
                phone=landlord.phone
            )
    if property.vendor_id:
        vendor = db.query(Vendor).filter(Vendor.id == property.vendor_id).first()
        if vendor:
            response.vendor = VendorInfo(
                id=vendor.id,
                first_name=vendor.first_name,
                last_name=vendor.last_name,
                email=vendor.email,
                primary_phone=vendor.primary_phone
            )
    return add_agent_info_to_property_response(property, response, db)

@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(property_id: str, db: Session = Depends(get_db)):
    """Delete a property"""
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")

    db.delete(property)
    db.commit()
