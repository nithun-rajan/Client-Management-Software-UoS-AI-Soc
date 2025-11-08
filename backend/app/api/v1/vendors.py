from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.vendor import Vendor
from app.schemas.vendor import VendorCreate, VendorResponse, VendorUpdate
from app.services.notification_service import notify
from fastapi.security import OAuth2PasswordBearer
from app.core.security import verify_token
from app.models.user import User
from typing import Optional

router = APIRouter(prefix="/vendors", tags=["vendors"])

# OAuth2 scheme for optional authentication
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

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

@router.post("/", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
def create_vendor(
    vendor_data: VendorCreate, 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Create a new vendor"""
    # Check if email already exists
    existing = db.query(Vendor).filter(Vendor.email == vendor_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check required fields
    if not vendor_data.first_name or not vendor_data.last_name:
        raise HTTPException(status_code=400, detail="First name and last name are required")
    if not vendor_data.email:
        raise HTTPException(status_code=400, detail="Email is required")
    if not vendor_data.primary_phone:
        raise HTTPException(status_code=400, detail="Primary phone is required")

    db_vendor = Vendor(**vendor_data.model_dump())
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    
    # Create notification for new vendor
    if db_vendor.id:
        try:
            user_id = current_user.id if current_user else None
            vendor_name = f"{vendor_data.first_name} {vendor_data.last_name}"
            if vendor_data.title:
                vendor_name = f"{vendor_data.title} {vendor_name}"
            notify(
                db=db,
                user_id=user_id,
                title=f"New Vendor: {vendor_name}",
                body=str(db_vendor.id),
                type="vendor",
                priority="low"
            )
        except Exception:
            pass
    
    return db_vendor

@router.get("/", response_model=list[VendorResponse])
def list_vendors(
    skip: int = 0, 
    limit: int = 100, 
    status: str = None,
    aml_status: str = None,
    db: Session = Depends(get_db)
):
    """List all vendors with optional filtering"""
    query = db.query(Vendor)
    
    # Apply filters if provided
    if status:
        query = query.filter(Vendor.status == status)
    if aml_status:
        query = query.filter(Vendor.aml_status == aml_status)
    
    vendors = query.offset(skip).limit(limit).all()
    return vendors

@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(vendor_id: str, db: Session = Depends(get_db)):
    """Get a specific vendor by ID"""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor

# additional endpoints 

@router.get("/status/{status}", response_model=list[VendorResponse])
def get_vendors_by_status(status: str, db: Session = Depends(get_db)):
    """Get all vendors with a specific status"""
    vendors = db.query(Vendor).filter(Vendor.status == status).all()
    return vendors

@router.get("/aml/{aml_status}", response_model=list[VendorResponse])
def get_vendors_by_aml_status(aml_status: str, db: Session = Depends(get_db)):
    """Get all vendors with a specific AML status"""
    vendors = db.query(Vendor).filter(Vendor.aml_status == aml_status).all()
    return vendors

@router.put("/{vendor_id}/verify-aml", response_model=VendorResponse)
def verify_vendor_aml(vendor_id: str, db: Session = Depends(get_db)):
    """Mark a vendor as AML verified"""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    vendor.aml_status = "verified"
    db.commit()
    db.refresh(vendor)
    return vendor



@router.put("/{vendor_id}", response_model=VendorResponse)
def update_vendor(
    vendor_id: str,
    vendor_data: VendorUpdate,
    db: Session = Depends(get_db)
):
    """Update a vendor"""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # If email is being updated, check for duplicates
    if vendor_data.email and vendor_data.email != vendor.email:
        existing = db.query(Vendor).filter(Vendor.email == vendor_data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

    update_data = vendor_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(vendor, key, value)

    db.commit()
    db.refresh(vendor)
    return vendor

@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vendor(vendor_id: str, db: Session = Depends(get_db)):
    """Delete a vendor"""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    db.delete(vendor)
    db.commit()