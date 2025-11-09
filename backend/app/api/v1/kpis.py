
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime # --- ADDED ---

from app.core.database import get_db
from app.models.applicant import Applicant
from app.models.landlord import Landlord
from app.models.property import Property
from app.models.vendor import Vendor
from app.models.tenancy import Tenancy # --- ADDED ---
from app.models.workflow import WorkflowTransition # --- ADDED ---
from app.models.task import Task # --- ADDED ---
from app.models.enums import PropertyStatus, ApplicantStatus, TaskStatus, TenancyStatus


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

    # --- SECTION ADDED ---
    # Compliance KPIs (Blueprint p. 34)
    overdue_tasks = db.query(Task).filter(
        Task.status == TaskStatus.PENDING,
        Task.due_date < datetime.utcnow()
    ).count()
    upcoming_tasks = db.query(Task).filter(
        Task.status == TaskStatus.PENDING,
        Task.due_date >= datetime.utcnow()
    ).count()
    # --- END OF SECTION ---

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
        },
         # --- SECTION ADDED ---
        "compliance": {
            "overdue_tasks": overdue_tasks,
            "upcoming_tasks": upcoming_tasks
        }
        # --- END OF SECTION ---
    }

# --- NEW ENDPOINT ADDED ---
@router.get("/lettings-funnel")
def get_lettings_funnel(db: Session = Depends(get_db)):
    """
    Get a KPI snapshot of the current lettings progression funnel.
    (Blueprint pages 29-33)
    """
    # Define the order of the funnel
    funnel_stages = [
        TenancyStatus.OFFER_ACCEPTED,
        TenancyStatus.REFERENCING,
        TenancyStatus.DOCUMENTATION,
        TenancyStatus.MOVE_IN_PREP,
        TenancyStatus.ACTIVE
    ]

    # Query the count for each status
    funnel_data = db.query(
        Tenancy.status,
        func.count(Tenancy.status)
    ).filter(
        Tenancy.status.in_(funnel_stages)
    ).group_by(
        Tenancy.status
    ).all()
    # Format the data
    funnel_dict = {status: count for status, count in funnel_data}

    # Ensure all stages are present in the response
    response = {
        stage.value: funnel_dict.get(stage.value, 0) for stage in funnel_stages
    }

    return response
# --- END OF NEW ENDPOINT ---

# --- NEW ENDPOINT ADDED ---
@router.get("/lettings-performance")
def get_lettings_performance(db: Session = Depends(get_db)):
    """
    Get KPIs on the performance (speed) of the lettings process.
    """

    # --- 1. Average Tenancy Progression Time ---
    # (Time from "offer_accepted" to "active")

    # Alias WorkflowTransition to join it to itself
    t1 = aliased(WorkflowTransition)
    t2 = aliased(WorkflowTransition)

    # Calculate the average difference in seconds between the two timestamps
    # NOTE: func.extract('epoch', ...) is for PostgreSQL.
    # For SQLite, you might use: func.avg(func.julianday(t2.created_at) - func.julianday(t1.created_at)) * 86400
    avg_progression_seconds_query = db.query(
        func.avg(func.extract('epoch', t2.created_at - t1.created_at))
    ).join(
        t2, and_(
            t1.entity_id == t2.entity_id,
            t1.domain == 'tenancy',
            t2.domain == 'tenancy'
        )
    ).filter(
        t1.to_status == TenancyStatus.OFFER_ACCEPTED.value,
        t2.to_status == TenancyStatus.ACTIVE.value
    )

    avg_progression_seconds = avg_progression_seconds_query.scalar() or 0
    avg_progression_days = avg_progression_seconds / (60 * 60 * 24) # Convert seconds to days

    # --- 2. Average Referencing Time ---
    # (Time from "referencing" to "referenced")
    avg_referencing_seconds_query = db.query(
        func.avg(func.extract('epoch', t2.created_at - t1.created_at))
    ).join(
        t2, and_(
            t1.entity_id == t2.entity_id,
            t1.domain == 'tenancy',
            t2.domain == 'tenancy'
        )
    ).filter(
        t1.to_status == TenancyStatus.REFERENCING.value,
        t2.to_status == TenancyStatus.DOCUMENTATION.value # "referenced"
    )

    avg_referencing_seconds = avg_referencing_seconds_query.scalar() or 0
    avg_referencing_days = avg_referencing_seconds / (60 * 60 * 24)

    return {
        "avg_progression_time_days": round(avg_progression_days, 2),
        "avg_referencing_time_days": round(avg_referencing_days, 2)
    }
# --- END OF NEW ENDPOINT ---