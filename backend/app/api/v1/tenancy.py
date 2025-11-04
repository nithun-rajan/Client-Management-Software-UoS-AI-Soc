from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.applicant import Applicant

# Import Enums for status transitions
from app.models.enums import ApplicantStatus, PropertyStatus, TenancyStatus
from app.models.property import Property

# Import necessary models
from app.models.tenancy import Tenancy

# Import necessary schemas
from app.schemas.tenancy import TenancyCreate, TenancyResponse, TenancyUpdate


router = APIRouter(prefix="/tenancies", tags=["tenancies"])


@router.post("/", response_model=TenancyResponse, status_code=status.HTTP_201_CREATED)
def create_tenancy(tenancy_data: TenancyCreate, db: Session = Depends(get_db)):
    """
    Create a new tenancy.

    This basically follows the CRM blueprint logic
    1. Finds the Applicant and Property.
    2. Creates the new Tenancy record.
    3. Updates the Applicant's status to TENANCY_STARTED
    4. Updates the Property's status to TENANTED
    """

    # 1. Find the linked records
    applicant = (
        db.query(Applicant)
        .filter(Applicant.id == tenancy_data.primary_applicant_id)
        .first()
    )
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant is not found")

    property = (
        db.query(Property).filter(Property.id == tenancy_data.property_id).first()
    )
    if not property:
        raise HTTPException(status_code=404, detail="Property is not found")

    # 2. Create the new Tenancy
    # I set the status to ACTIVE on creation, as this is the "Move-In" step
    db_tenancy = Tenancy(**tenancy_data.model_dump(), status=TenancyStatus.ACTIVE)
    db.add(db_tenancy)

    # 3. Update Applicant status
    applicant.status = ApplicantStatus.TENANCY_STARTED

    # 4. Update Property status
    property.status = PropertyStatus.TENANTED
    property.let_date = datetime.now(timezone.utc)  # Set the final 'let date'

    db.commit()
    db.refresh(db_tenancy)
    return db_tenancy


@router.get("/", response_model=list[TenancyResponse])
def list_tenancies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    List all tenancies.
    """
    return db.query(Tenancy).offset(skip).limit(limit).all()


@router.get("/{tenancy_id}", response_model=TenancyResponse)
def get_tenancy(tenancy_id: str, db: Session = Depends(get_db)):
    """
    Get a specific tenancy by its ID.
    """
    tenancy = db.query(Tenancy).filter(Tenancy.id == tenancy_id).first()
    if not tenancy:
        raise HTTPException(status_code=404, detail="Tenancy not found")
    return tenancy


@router.put("/{tenancy_id}", response_model=TenancyResponse)
def update_tenancy(
    tenancy_id: str, tenancy_data: TenancyUpdate, db: Session = Depends(get_db)
):
    """
    Update a tenancy

    If tenancy status is set to ENDED or TERMINATED,
    this will also update the property status back to AVAILABLE.
    """
    tenancy = db.query(Tenancy).filter(Tenancy.id == tenancy_id).first()
    if not tenancy:
        raise HTTPException(status_code=404, detail="Tenancy not found")

    update_data = tenancy_data.model_dump(exclude_unset=True)

    # --- Status Transition Logic ---
    if "status" in update_data:
        new_status = update_data["status"]
        # If the tenancy is ending, free up the property
        if new_status in (TenancyStatus.TERMINATED, TenancyStatus.EXPIRED) and tenancy.property:
            tenancy.property.status = PropertyStatus.AVAILABLE
            tenancy.property.let_date = None  # Clear the let date

    for key, value in update_data.items():
        setattr(tenancy, key, value)

    db.commit()
    db.refresh(tenancy)
    return tenancy


@router.delete("/{tenancy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tenancy(tenancy_id: str, db: Session = Depends(get_db)):
    """
    "Delete" a tenancy

    It sets the status to TERMINATED and updates
    the associated property to AVAILABLE.
    """
    tenancy = db.query(Tenancy).filter(Tenancy.id == tenancy_id).first()
    if not tenancy:
        raise HTTPException(status_code=404, detail="Tenancy not found")

    # 1. Update tenancy status to "TERMINATED" instead of deleting
    tenancy.status = TenancyStatus.TERMINATED

    # 2. Update the property status
    if tenancy.property and tenancy.property.status == PropertyStatus.TENANTED:
        tenancy.property.status = PropertyStatus.AVAILABLE
        tenancy.property.let_date = None
    db.commit()
