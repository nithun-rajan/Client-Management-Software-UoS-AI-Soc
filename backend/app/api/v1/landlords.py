
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_token
from app.models.landlord import Landlord
from app.models.user import User
from app.schemas.landlord import LandlordCreate, LandlordResponse, LandlordUpdate
from app.services.notification_service import notify


router = APIRouter(prefix="/landlords", tags=["landlords"])

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

@router.post("/", response_model=LandlordResponse, status_code=status.HTTP_201_CREATED)
def create_landlord(
    landlord_data: LandlordCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Create a new landlord"""
    # Check if email already exists
    existing = db.query(Landlord).filter(Landlord.email == landlord_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    db_landlord = Landlord(**landlord_data.model_dump())
    db.add(db_landlord)
    db.commit()
    db.refresh(db_landlord)
    
    # Create notification for new landlord
    if db_landlord.id:
        try:
            user_id = current_user.id if current_user else None
            notify(
                db=db,
                user_id=user_id,
                title=f"New Landlord: {landlord_data.full_name}",
                body=str(db_landlord.id),
                type="landlord",
                priority="low"
            )
        except Exception:
            pass
    
    return db_landlord

@router.get("/", response_model=list[LandlordResponse])
def list_landlords(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all landlords"""
    landlords = db.query(Landlord).offset(skip).limit(limit).all()
    return landlords

@router.get("/{landlord_id}", response_model=LandlordResponse)
def get_landlord(landlord_id: str, db: Session = Depends(get_db)):
    """Get a specific landlord"""
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=404, detail="Landlord not found")
    return landlord

@router.put("/{landlord_id}", response_model=LandlordResponse)
def update_landlord(
    landlord_id: str,
    landlord_data: LandlordUpdate,
    db: Session = Depends(get_db)
):
    """Update a landlord"""
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=404, detail="Landlord not found")

    for key, value in landlord_data.model_dump(exclude_unset=True).items():
        setattr(landlord, key, value)

    db.commit()
    db.refresh(landlord)
    return landlord

@router.delete("/{landlord_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_landlord(landlord_id: str, db: Session = Depends(get_db)):
    """Delete a landlord"""
    landlord = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=404, detail="Landlord not found")

    db.delete(landlord)
    db.commit()
