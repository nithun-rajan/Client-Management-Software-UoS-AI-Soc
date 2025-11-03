from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.property import Property
from app.models.landlord import Landlord
from app.models.applicant import Applicant

router = APIRouter(prefix="/kpis", tags=["kpis"])

@router.get("/")
def get_kpis(db: Session = Depends(get_db)):
    total_properties = db.query(Property).count()
    available = db.query(Property).filter(Property.status == "available").count()
    let_by = db.query(Property).filter(Property.status == "let_by").count()
    managed = db.query(Property).filter(Property.status == "managed").count()
    
    avg_rent = db.query(func.avg(Property.rent)).scalar() or 0
    
    total_landlords = db.query(Landlord).count()
    verified_landlords = db.query(Landlord).filter(Landlord.aml_verified == True).count()
    
    total_applicants = db.query(Applicant).count()
    
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
            "qualified": 0,
            "qualification_rate": 0
        }
    }