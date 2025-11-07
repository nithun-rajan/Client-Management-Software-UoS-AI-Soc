
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.applicant import Applicant
from app.schemas.applicant import ApplicantCreate, ApplicantResponse, ApplicantUpdate


router = APIRouter(prefix="/applicants", tags=["applicants"])

@router.post("/", response_model=ApplicantResponse, status_code=status.HTTP_201_CREATED)
def create_applicant(applicant_data: ApplicantCreate, db: Session = Depends(get_db)):
    """Create a new applicant"""
    # Check if email already exists
    existing = db.query(Applicant).filter(Applicant.email == applicant_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    db_applicant = Applicant(**applicant_data.model_dump())
    db.add(db_applicant)
    db.commit()
    db.refresh(db_applicant)
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
