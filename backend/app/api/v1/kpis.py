
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.applicant import Applicant
from app.models.landlord import Landlord
from app.models.property import Property
from app.models.vendor import Vendor
from app.models.enums import PropertyStatus, ApplicantStatus


router = APIRouter(prefix="/kpis", tags=["kpis"])

@router.get("/")
def get_kpis(db: Session = Depends(get_db)):
    """Get dashboard KPIs"""

    # Count properties for letting
    properties_for_let = db.query(Property).filter(Property.sales_status == None).count()
    available_let = db.query(Property).filter(
        Property.status == PropertyStatus.AVAILABLE,
        Property.sales_status == None
    ).count()
    let_by = db.query(Property).filter(Property.status == PropertyStatus.LET_BY).count()
    tenanted = db.query(Property).filter(Property.status == PropertyStatus.TENANTED).count()
    # Managed properties = properties that are actively being managed (tenanted or let_by)
    managed = let_by + tenanted

    # Average rent (only for letting properties)
    avg_rent = db.query(func.avg(Property.rent)).filter(Property.rent != None).scalar() or 0

    # Count properties for sale
    properties_for_sale = db.query(Property).filter(Property.sales_status != None).count()
    # Average selling price
    avg_selling_price = db.query(func.avg(Property.asking_price)).filter(
        Property.asking_price != None
    ).scalar() or 0

    # Total landlords
    total_landlords = db.query(Landlord).count()
    verified_landlords = db.query(Landlord).filter(Landlord.aml_verified == True).count()

    # Total applicants (tenants)
    total_tenants = db.query(Applicant).filter(Applicant.willing_to_rent != False).count()
    # Qualified tenants = those who have passed initial qualification (QUALIFIED status or beyond)
    qualified_tenants = db.query(Applicant).filter(
        Applicant.willing_to_rent != False,
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

    # Total buyers
    total_buyers = db.query(Applicant).filter(Applicant.willing_to_buy == True).count()

    # Total vendors
    total_vendors = db.query(Vendor).count()

    return {
        "properties_letting": {
            "total": properties_for_let,
            "available": available_let,
            "let_by": let_by,
            "managed": managed,
            "avg_rent": round(avg_rent, 2)
        },
        "properties_sale": {
            "total": properties_for_sale,
            "avg_selling_price": round(avg_selling_price, 2)
        },
        "landlords": {
            "total": total_landlords,
            "aml_verified": verified_landlords,
            "verification_rate": round((verified_landlords / total_landlords * 100) if total_landlords > 0 else 0, 1)
        },
        "tenants": {
            "total": total_tenants,
            "qualified": qualified_tenants,
            "qualification_rate": round((qualified_tenants / total_tenants * 100) if total_tenants > 0 else 0, 1)
        },
        "buyers": {
            "total": total_buyers
        },
        "vendors": {
            "total": total_vendors
        }
    }
