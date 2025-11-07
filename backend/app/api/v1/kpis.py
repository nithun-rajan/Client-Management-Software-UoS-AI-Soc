
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.applicant import Applicant
from app.models.landlord import Landlord
from app.models.property import Property
from app.models.enums import PropertyStatus, ApplicantStatus


router = APIRouter(prefix="/kpis", tags=["kpis"])

@router.get("/")
def get_kpis(db: Session = Depends(get_db)):
    """Get dashboard KPIs"""

    # Count properties by status
    total_properties = db.query(Property).count()
    available = db.query(Property).filter(Property.status == PropertyStatus.AVAILABLE).count()
    let_by = db.query(Property).filter(Property.status == PropertyStatus.LET_BY).count()
    tenanted = db.query(Property).filter(Property.status == PropertyStatus.TENANTED).count()
    # Managed properties = properties that are actively being managed (tenanted or let_by)
    managed = let_by + tenanted

    # Average rent
    avg_rent = db.query(func.avg(Property.rent)).scalar() or 0

    # Total landlords
    total_landlords = db.query(Landlord).count()
    verified_landlords = db.query(Landlord).filter(Landlord.aml_verified == True).count()

    # Total applicants
    total_applicants = db.query(Applicant).count()
    # Qualified applicants = those who have passed initial qualification (QUALIFIED status or beyond)
    qualified_applicants = db.query(Applicant).filter(
        Applicant.status.in_([
            ApplicantStatus.QUALIFIED,
            ApplicantStatus.VIEWING_BOOKED,
            ApplicantStatus.OFFER_SUBMITTED,
            ApplicantStatus.OFFER_ACCEPTED,
            ApplicantStatus.REFERENCES,
            ApplicantStatus.LET_AGREED,
            ApplicantStatus.TENANCY_STARTED
        ])
    ).count()

    return {
        "properties": {
            "total": total_properties,
            "available": available,
            "let_by": let_by,
            "managed": managed,
            "avg_rent": round(avg_rent, 2)
        },
        "landlords": {
            "total": total_landlords,
            "aml_verified": verified_landlords,
            "verification_rate": round((verified_landlords / total_landlords * 100) if total_landlords > 0 else 0, 1)
        },
        "applicants": {
            "total": total_applicants,
            "qualified": qualified_applicants,
            "qualification_rate": round((qualified_applicants / total_applicants * 100) if total_applicants > 0 else 0, 1)
        }
    }
