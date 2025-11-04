from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.applicant import Applicant
from app.models.landlord import Landlord
from app.models.property import Property


router = APIRouter(prefix="/kpis", tags=["kpis"])


@router.get("/")
def get_kpis(db: Session = Depends(get_db)):
    """Get dashboard KPIs"""

    # Count properties by status
    total_properties = db.query(Property).count()
    available = db.query(Property).filter(Property.status == "available").count()
    let_by = db.query(Property).filter(Property.status == "let_by").count()
    # Managed status not tracked explicitly in model; report 0 for now
    managed = 0

    # Average rent
    avg_rent = db.query(func.avg(Property.rent)).scalar() or 0

    # Total landlords
    total_landlords = db.query(Landlord).count()
    verified_landlords = db.query(Landlord).filter(Landlord.aml_verified).count()

    # Total applicants
    total_applicants = db.query(Applicant).count()
    # Applicant model doesn't include references_passed field; report 0
    qualified_applicants = 0

    return {
        "properties": {
            "total": total_properties,
            "available": available,
            "let_by": let_by,
            "managed": managed,
            "avg_rent": round(avg_rent, 2),
        },
        "landlords": {
            "total": total_landlords,
            "aml_verified": verified_landlords,
            "verification_rate": round(
                (verified_landlords / total_landlords * 100)
                if total_landlords > 0
                else 0,
                1,
            ),
        },
        "applicants": {
            "total": total_applicants,
            "qualified": qualified_applicants,
            "qualification_rate": round(
                (qualified_applicants / total_applicants * 100)
                if total_applicants > 0
                else 0,
                1,
            ),
        },
    }
