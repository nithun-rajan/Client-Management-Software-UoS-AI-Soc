
from fastapi import APIRouter, Depends
from sqlalchemy import func, and_
from sqlalchemy.orm import Session, aliased
from sqlalchemy import func, and_, cast, Float
from datetime import datetime # --- ADDED ---
from typing import Dict

from app.core.database import get_db
from app.models.applicant import Applicant
from app.models.landlord import Landlord
from app.models.property import Property
from app.models.vendor import Vendor
from app.models.tenancy import Tenancy # --- ADDED ---
from app.models.workflow import WorkflowTransition # --- ADDED ---
from app.models.task import Task # --- ADDED ---
from app.models.enums import PropertyStatus, ApplicantStatus, TaskStatus, TenancyStatus
from app.models.enums_sales import SalesStatus
from app.models.sales import SalesProgression

def _to_float(value) -> float:
    return float(value) if value not in (None,) else 0.0

def _average_sale_price_per_bedroom(db: Session) -> float:
    total_price , total_bedrooms = (
        db.query(
            func.sum(Property.asking_price),
            func.sum(Property.bedrooms),
        )
        .filter(
            Property.asking_price != None,
            Property.bedrooms != None,
            Property.bedrooms > 0,
        )
        .one()
    )

    if total_price and total_bedrooms:
        return float(total_price) / float(total_bedrooms)
    return 0.0

def _asking_vs_achieved_price(db: Session):
    avg_asking = (
        db.query(func.avg(Property.asking_price))
        .filter(Property.asking_price != None)
        .scalar()
    )
    avg_achieved = (
        db.query(func.avg(SalesProgression.agreed_price))
        .filter(SalesProgression.agreed_price != None)
        .scalar()
    )

    avg_asking_float = _to_float(avg_asking)
    avg_achieved_float = _to_float(avg_achieved)
    achievement_rate = (
        (avg_achieved_float / avg_asking_float)*100
        if avg_asking_float
        else 0.0
    )

    return {
        "avg_asking_price": round(avg_asking_float, 2),
        'avg_achieved_price': round(avg_achieved_float, 2),
        'achievement': round(achievement_rate, 2),
        'price_gap': round(avg_achieved_float - avg_asking_float, 2),
    }


def _listing_to_sales_ratio(db: Session, total_listed: int):
    completed_sales = (
        db.query(func.count(Property.id))
        .filter(Property.sales_status == SalesStatus.COMPLETED)
        .scalar()
    )

    conversion_rate = (
        (completed_sales / total_listed) * 100
        if total_listed
        else 0.0
    )

    loss_rows = (
        db.query(
            SalesProgression.fall_through_reason,
            func.count(SalesProgression.id),
        )
        .filter(SalesProgression.is_fall_through == True)
        .group_by(SalesProgression.fall_through_reason)
        .all()
    )

    loss_breakdown: Dict[str, int] = {}
    for reason, count in loss_rows:
        label = reason or 'unspecified'
        loss_breakdown[label] = count

    total_losses = sum(loss_breakdown.values())

    return {
        'total_listed': total_listed,
        'total_completed': completed_sales,
        'conversion_rate': round(conversion_rate, 2),
        'total_losses': total_losses,
        'loss_breakdown': loss_breakdown,
    }


router = APIRouter(prefix="/kpis", tags=["kpis"])

def _average_sale_price_per_bedroom(db: Session) -> float:
    value = (
        db.query(
            cast(
                func.sum(Property.asking_price)
                / func.nullif(func.sum(Property.bedrooms), 0),
                Float,
            ))

        .filter(
            Property.asking_price != None,
            Property.bedrooms != None,
            Property.bedrooms > 0,
        )
        .scalar()
    )
    return float(value or 0)


@router.get("/")
def get_kpis(db: Session = Depends(get_db)):
    """Get dashboard KPIs"""

    # Count properties for letting (properties with rent set, not for sale)
    properties_for_let = db.query(Property).filter(Property.rent != None).count()
    available_let = db.query(Property).filter(
        and_(
            Property.status == PropertyStatus.AVAILABLE,
            Property.rent != None
        )
    ).count()
    let_by = db.query(Property).filter(
        and_(
            Property.status == PropertyStatus.LET_BY,
            Property.rent != None
        )
    ).count()
    tenanted = db.query(Property).filter(
        and_(
            Property.status == PropertyStatus.TENANTED,
            Property.rent != None
        )
    ).count()
    # Managed properties = properties that are actively being managed (tenanted or let_by)
    managed = let_by + tenanted

    # Average rent (only for letting properties)
    avg_rent = db.query(func.avg(Property.rent)).filter(Property.rent != None).scalar() or 0

    # Count properties for sale (properties with asking_price set)
    properties_for_sale = db.query(Property).filter(Property.asking_price != None).count()
    # Average selling price
    avg_selling_price = db.query(func.avg(Property.asking_price)).filter(
        Property.asking_price != None
    ).scalar() or 0

    avg_sale_price_per_bedroom = _average_sale_price_per_bedroom(db)
    price_comparison =  _asking_vs_achieved_price(db)
    listing_to_sales = _listing_to_sales_ratio(db, properties_for_sale)

    # Total landlords
    total_landlords = db.query(Landlord).count()
    verified_landlords = db.query(Landlord).filter(Landlord.aml_verified == True).count()

    # Total applicants (tenants)
    total_tenants = db.query(Applicant).filter(Applicant.willing_to_rent != False).count()
    # Qualified tenants = those who have passed initial qualification (QUALIFIED status or beyond)
    qualified_tenants = db.query(Applicant).filter(
        and_(
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
        )
    ).count()

    # Total buyers
    total_buyers = db.query(Applicant).filter(Applicant.willing_to_buy == True).count()

    # Total vendors
    total_vendors = db.query(Vendor).count()

    # --- SECTION ADDED ---
    # Compliance KPIs (Blueprint p. 34)
    active_task_statuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS]
    overdue_tasks = db.query(Task).filter(
        Task.status.in_(active_task_statuses),
        Task.due_date < datetime.utcnow()
    ).count()
    upcoming_tasks = db.query(Task).filter(
        Task.status.in_(active_task_statuses),
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
            "avg_selling_price": round(avg_selling_price, 2),
            "avg_price_per_bedroom": round(avg_sale_price_per_bedroom, 2),
            "price_comparison": price_comparison,
            "listing_to_sales": listing_to_sales,
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