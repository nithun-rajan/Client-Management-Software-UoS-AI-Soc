
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
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
def list_applicants(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all applicants"""
    applicants = db.query(Applicant).offset(skip).limit(limit).all()
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
