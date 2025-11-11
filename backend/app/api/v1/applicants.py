
from typing import List, Optional, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, verify_token
from app.models.applicant import Applicant
from app.models.user import User
from app.schemas.applicant import ApplicantCreate, ApplicantResponse, ApplicantUpdate
from app.schemas.user import Role
from app.services.notification_service import notify


router = APIRouter(prefix="/applicants", tags=["applicants"])

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

@router.post("/", response_model=ApplicantResponse, status_code=status.HTTP_201_CREATED)
def create_applicant(
    applicant_data: ApplicantCreate, 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Create a new applicant"""
    # Check if email already exists
    existing = db.query(Applicant).filter(Applicant.email == applicant_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    db_applicant = Applicant(**applicant_data.model_dump())
    db.add(db_applicant)
    db.commit()
    db.refresh(db_applicant)
    
    # Create notification for new applicant
    # Ensure we have a valid applicant ID before creating notification
    if db_applicant.id:
        try:
            # Simple: create notification (user_id can be None for now)
            user_id = current_user.id if current_user else None
            # Store applicant_id in body for navigation (not displayed in UI)
            notify(
                db=db,
                user_id=user_id,
                title=f"New Applicant: {applicant_data.first_name} {applicant_data.last_name}",
                body=str(db_applicant.id),  # Ensure it's a string
                type="applicant",
                priority="low"
            )
        except Exception:
            # Don't fail the request if notification fails
            pass
    
    return db_applicant

@router.get("/", response_model=List[ApplicantResponse])
def list_applicants(
    skip: int = 0, 
    limit: int = 100, 
    assigned_agent_id: Optional[str] = None,  # Filter by agent
    db: Session = Depends(get_db)
):
    """List all applicants (optionally filter by assigned agent)"""
    query = db.query(Applicant)
    
    # Filter by assigned agent if provided
    if assigned_agent_id:
        query = query.filter(Applicant.assigned_agent_id == assigned_agent_id)
    
    applicants = query.order_by(Applicant.last_contacted_at.desc().nulls_last(), Applicant.created_at.desc()).offset(skip).limit(limit).all()
    return applicants

@router.get("/my-applicants", response_model=List[ApplicantResponse])
def get_my_applicants(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get applicants assigned to the current authenticated agent
    
    CRM Feature: "My Applicants" - Shows which applicants belong to which agent
    and when they were last contacted.
    """
    applicants = db.query(Applicant)\
        .filter(Applicant.assigned_agent_id == current_user.id)\
        .order_by(
            Applicant.last_contacted_at.desc().nulls_last(),  # Most recently contacted first, then nulls
            Applicant.created_at.desc()  # Newest first if never contacted
        )\
        .offset(skip)\
        .limit(limit)\
        .all()
    
    return applicants

@router.get("/{applicant_id}", response_model=ApplicantResponse)
def get_applicant(applicant_id: str, db: Session = Depends(get_db)):
    """Get a specific applicant"""
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return applicant

@router.put("/{applicant_id}", response_model=ApplicantResponse)
def update_applicant(
    applicant_id: str,
    applicant_data: ApplicantUpdate,
    db: Session = Depends(get_db)
):
    """Update an applicant"""
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")

    for key, value in applicant_data.model_dump(exclude_unset=True).items():
        setattr(applicant, key, value)

    db.commit()
    db.refresh(applicant)
    return applicant

@router.delete("/{applicant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_applicant(applicant_id: str, db: Session = Depends(get_db)):
    """Delete an applicant"""
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")

    db.delete(applicant)
    db.commit()

@router.get("/search/buyers", response_model=List[ApplicantResponse])
def search_buyers(
    buyer_type: Optional[str] = Query(None, description="Filter by buyer type"),
    mortgage_status: Optional[str] = Query(None, description="Filter by mortgage status"),
    readiness_level: Optional[str] = Query(None, description="Filter by readiness level"),
    min_budget: Optional[float] = Query(None, ge=0, description="Minimum budget"),
    max_budget: Optional[float] = Query(None, ge=0, description="Maximum budget"),
    has_property_to_sell: Optional[bool] = Query(None, description="Filter by chain status"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Search and filter buyers with sales-specific criteria"""
    query = db.query(Applicant).filter(Applicant.buyer_type.isnot(None))
    
    if buyer_type:
        query = query.filter(Applicant.buyer_type == buyer_type)
    if mortgage_status:
        query = query.filter(Applicant.mortgage_status == mortgage_status)
    if readiness_level:
        query = query.filter(Applicant.readiness_level == readiness_level)
    if min_budget:
        query = query.filter(Applicant.budget_max >= min_budget)
    if max_budget:
        query = query.filter(Applicant.budget_min <= max_budget)
    if has_property_to_sell is not None:
        query = query.filter(Applicant.has_property_to_sell == has_property_to_sell)
    
    buyers = query.offset(skip).limit(limit).all()
    return buyers

@router.get("/{applicant_id}/financial", response_model=ApplicantResponse)
def get_applicant_financial_details(applicant_id: str, db: Session = Depends(get_db)):
    """Get applicant financial details for sales progression"""
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return applicant

@router.put("/{applicant_id}/financial", response_model=ApplicantResponse)
def update_applicant_financial_details(
    applicant_id: str,
    budget_min: Optional[float] = Query(None, ge=0),
    budget_max: Optional[float] = Query(None, ge=0),
    mortgage_status: Optional[str] = Query(None),
    agreement_in_principle_amount: Optional[float] = Query(None, ge=0),
    agreement_in_principle_expiry: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Update applicant financial details for sales progression"""
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    
    if budget_min is not None:
        applicant.budget_min = budget_min
    if budget_max is not None:
        applicant.budget_max = budget_max
    if mortgage_status is not None:
        applicant.mortgage_status = mortgage_status
    if agreement_in_principle_amount is not None:
        applicant.agreement_in_principle_amount = agreement_in_principle_amount
    if agreement_in_principle_expiry is not None:
        applicant.agreement_in_principle_expiry = agreement_in_principle_expiry
    
    db.commit()
    db.refresh(applicant)
    return applicant

@router.get("/search/ready-to-buy", response_model=List[ApplicantResponse])
def get_ready_to_buy_applicants(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get applicants who are ready to buy (hot leads with AIP or proof of funds)"""
    ready_buyers = db.query(Applicant).filter(
        Applicant.readiness_level == "hot",
        Applicant.buyer_type.isnot(None),
        (
            (Applicant.agreement_in_principle_amount.isnot(None)) |
            (Applicant.proof_of_funds_uploaded == True)
        )
    ).offset(skip).limit(limit).all()
    
    return ready_buyers

@router.put("/{applicant_id}/aml-status", response_model=ApplicantResponse)
def update_applicant_aml_status(
    applicant_id: str,
    aml_status: str = Query(..., description="AML status: not_checked, in_progress, verified, failed"),
    proof_of_funds_uploaded: bool = Query(False),
    id_document_uploaded: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Update applicant AML/KYC status for sales transactions"""
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    
    applicant.aml_status = aml_status
    applicant.proof_of_funds_uploaded = proof_of_funds_uploaded
    applicant.id_document_uploaded = id_document_uploaded
    
    db.commit()
    db.refresh(applicant)
    return applicant

@router.get("/chain-free/buyers", response_model=List[ApplicantResponse])
def get_chain_free_buyers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get chain-free buyers (first-time buyers or cash buyers with no property to sell)"""
    chain_free_buyers = db.query(Applicant).filter(
        Applicant.is_chain_free == True,
        Applicant.buyer_type.isnot(None)
    ).offset(skip).limit(limit).all()
    
    return chain_free_buyers


@router.post("/sales", response_model=ApplicantResponse, status_code=status.HTTP_201_CREATED)
def create_sales_buyer(applicant_data: ApplicantCreate, db: Session = Depends(get_db)):
    """Create a new sales buyer (specialized endpoint for sales applicants)"""
    # Check if email already exists
    existing = db.query(Applicant).filter(Applicant.email == applicant_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Ensure this is marked as a sales buyer
    buyer_data = applicant_data.model_dump()
    if not buyer_data.get('buyer_type'):
        buyer_data['buyer_type'] = 'first_time_buyer'  # Default value
    
    db_applicant = Applicant(**buyer_data)
    db.add(db_applicant)
    db.commit()
    db.refresh(db_applicant)
    return db_applicant


@router.get("/sales/matching/{property_id}", response_model=List[ApplicantResponse])
def find_matching_buyers(
    property_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Find buyers matching a specific property"""
    from app.models.property import Property
    from app.models.enums_sales import SalesStatus
    
    # Get the property details
    property_obj = db.query(Property).filter(Property.id == property_id).first()
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Build query for matching buyers
    query = db.query(Applicant).filter(
        Applicant.buyer_type.isnot(None),  # Only sales buyers
        Applicant.budget_min <= property_obj.asking_price,  # Within budget
        Applicant.budget_max >= property_obj.asking_price,
    )
    
    # Add property type matching if specified
    if property_obj.property_type and hasattr(Applicant, 'property_types'):
        query = query.filter(Applicant.property_types.contains(property_obj.property_type))
    
    # Add bedroom matching if specified
    if property_obj.bedrooms and hasattr(Applicant, 'min_bedrooms'):
        query = query.filter(Applicant.min_bedrooms <= property_obj.bedrooms)
    if property_obj.bedrooms and hasattr(Applicant, 'max_bedrooms'):
        query = query.filter(Applicant.max_bedrooms >= property_obj.bedrooms)
    
    # Prioritize ready buyers
    query = query.order_by(
        Applicant.readiness_level.desc(),  # Hot buyers first
        Applicant.agreement_in_principle_amount.desc().nulls_last()  # Those with AIP first
    )
    
    matching_buyers = query.offset(skip).limit(limit).all()
    return matching_buyers
