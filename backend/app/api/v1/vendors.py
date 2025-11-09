from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta


from app.core.database import get_db
from app.models.vendor import Vendor
from app.schemas.vendor import VendorCreate, VendorResponse, VendorUpdate
from app.services.notification_service import notify
from fastapi.security import OAuth2PasswordBearer
from app.core.security import verify_token
from app.models.user import User
from typing import Optional
from app.models.enums_sales import InstructionType

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


@router.put("/{vendor_id}/sales-instruction", response_model=VendorResponse)
def update_sales_instruction(
    vendor_id: str,
    instructed_property_id: str = Query(..., description="Property ID being sold"),
    instruction_type: str = Query(..., description="sole_agency, joint_sole, multi_agency"),
    agreed_commission: float = Query(..., ge=0, le=100, description="Commission percentage"),
    minimum_fee: float = Query(..., ge=0, description="Minimum fee amount"),
    contract_length_weeks: int = Query(..., ge=1, description="Contract length in weeks"),
    db: Session = Depends(get_db)
):
    """
    Update vendor sales instruction details (Pages 49-50)
    Sets up the formal agency agreement for property sale
    """
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Validate instruction type
    if instruction_type not in [InstructionType.SOLE_AGENCY, InstructionType.JOINT_SOLE, InstructionType.MULTI_AGENCY]:
        raise HTTPException(
            status_code=400, 
            detail=f"Instruction type must be one of: {', '.join([InstructionType.SOLE_AGENCY, InstructionType.JOINT_SOLE, InstructionType.MULTI_AGENCY])}"
        )
    
    vendor.instructed_property_id = instructed_property_id
    vendor.instruction_type = instruction_type
    vendor.agreed_commission = agreed_commission
    vendor.minimum_fee = minimum_fee
    vendor.instruction_date = datetime.now(timezone.utc)
    vendor.contract_expiry_date = datetime.now(timezone.utc) + timedelta(weeks=contract_length_weeks)
    vendor.status = "instructed"  # Update relationship status
    
    db.commit()
    db.refresh(vendor)
    return vendor


@router.put("/{vendor_id}/aml-comprehensive", response_model=VendorResponse)
def update_vendor_aml_comprehensive(
    vendor_id: str,
    aml_status: str = Query(..., description="AML verification status: verified, failed, pending"),
    aml_agent_name: str = Query(..., description="Name of agent who performed AML check"),
    aml_provider_used: str = Query(None, description="AML provider used (SmartSearch, Credas, Onfido)"),
    is_pep: bool = Query(False, description="Politically Exposed Person status"),
    proof_of_ownership_uploaded: bool = Query(False, description="Land Registry title uploaded"),
    db: Session = Depends(get_db)
):
    """
    Comprehensive AML verification update (Page 48)
    Includes all AML workflow fields for compliance tracking
    """
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    if aml_status not in ["verified", "failed", "pending"]:
        raise HTTPException(status_code=400, detail="AML status must be: verified, failed, or pending")
    
    vendor.aml_status = aml_status
    vendor.aml_verification_date = datetime.now(timezone.utc)
    vendor.aml_verification_expiry = datetime.now(timezone.utc) + timedelta(days=365)  # 12 months
    vendor.aml_agent_name = aml_agent_name
    vendor.is_pep = is_pep
    vendor.proof_of_ownership_uploaded = proof_of_ownership_uploaded
    
    if aml_provider_used:
        vendor.aml_provider_used = aml_provider_used
    
    db.commit()
    db.refresh(vendor)
    return vendor


@router.get("/aml/expiring-soon", response_model=list[VendorResponse])
def get_vendors_with_aml_expiring_soon(
    days_threshold: int = Query(30, ge=1, le=365, description="Days threshold for expiry warning"),
    db: Session = Depends(get_db)
):
    """
    Get vendors with AML verification expiring soon (Page 48)
    Automated reminder system for compliance
    """
    threshold_date = datetime.now(timezone.utc) + timedelta(days=days_threshold)
    
    vendors = db.query(Vendor).filter(
        Vendor.aml_verification_expiry <= threshold_date,
        Vendor.aml_status == "verified"
    ).all()
    
    return vendors


@router.put("/{vendor_id}/conveyancer", response_model=VendorResponse)
def update_vendor_conveyancer(
    vendor_id: str,
    conveyancer_name: str = Query(..., description="Solicitor/conveyancer name"),
    conveyancer_firm: str = Query(..., description="Law firm name"),
    conveyancer_contact: str = Query(..., description="Phone number or email"),
    db: Session = Depends(get_db)
):
    """
    Update vendor conveyancer/solicitor details (Page 51)
    Essential for sales progression coordination
    """
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    vendor.conveyancer_name = conveyancer_name
    vendor.conveyancer_firm = conveyancer_firm
    vendor.conveyancer_contact = conveyancer_contact
    
    db.commit()
    db.refresh(vendor)
    return vendor


@router.get("/search/instruction-type", response_model=list[VendorResponse])
def get_vendors_by_instruction_type(
    instruction_type: str = Query(..., description="sole_agency, joint_sole, multi_agency"),
    db: Session = Depends(get_db)
):
    """
    Get vendors by instruction type (Page 49)
    Useful for reporting and management
    """
    if instruction_type not in [InstructionType.SOLE_AGENCY, InstructionType.JOINT_SOLE, InstructionType.MULTI_AGENCY]:
        raise HTTPException(
            status_code=400, 
            detail=f"Instruction type must be one of: {', '.join([InstructionType.SOLE_AGENCY, InstructionType.JOINT_SOLE, InstructionType.MULTI_AGENCY])}"
        )
    
    vendors = db.query(Vendor).filter(Vendor.instruction_type == instruction_type).all()
    return vendors


@router.get("/contracts/expiring-soon", response_model=list[VendorResponse])
def get_vendors_with_contracts_expiring_soon(
    weeks_threshold: int = Query(4, ge=1, le=52, description="Weeks threshold for contract expiry"),
    db: Session = Depends(get_db)
):
    """
    Get vendors with sales contracts expiring soon (Page 49)
    For proactive renewal and chasing
    """
    threshold_date = datetime.now(timezone.utc) + timedelta(weeks=weeks_threshold)
    
    vendors = db.query(Vendor).filter(
        Vendor.contract_expiry_date <= threshold_date,
        Vendor.contract_expiry_date >= datetime.now(timezone.utc),  # Not expired yet
        Vendor.status == "instructed"  # Only active instructions
    ).all()
    
    return vendors


@router.put("/{vendor_id}/marketing-consent", response_model=VendorResponse)
def update_vendor_marketing_consent(
    vendor_id: str,
    consent: bool = Query(..., description="Marketing consent status"),
    db: Session = Depends(get_db)
):
    """
    Update vendor marketing consent (Page 50)
    GDPR compliance for communications
    """
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    vendor.marketing_consent = consent
    db.commit()
    db.refresh(vendor)
    return vendor


@router.get("/source/{lead_source}", response_model=list[VendorResponse])
def get_vendors_by_lead_source(
    lead_source: str = Path(..., description="Source of lead: portal, referral, board, past_client"),
    db: Session = Depends(get_db)
):
    """
    Get vendors by lead source (Page 50)
    For marketing ROI tracking and analysis
    """
    valid_sources = ["portal", "referral", "board", "past_client", "walk_in"]
    if lead_source not in valid_sources:
        raise HTTPException(
            status_code=400,
            detail=f"Lead source must be one of: {', '.join(valid_sources)}"
        )
    
    vendors = db.query(Vendor).filter(Vendor.source_of_lead == lead_source).all()
    return vendors


@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vendor(vendor_id: str, db: Session = Depends(get_db)):
    """Delete a vendor"""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    db.delete(vendor)
    db.commit()

