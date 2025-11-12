# app/api/v1/agents.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional, List
from datetime import datetime, timedelta, timezone

from app.core.database import get_db
from app.models.user import User
from app.models.property import Property
from app.models.applicant import Applicant
from app.models.landlord import Landlord
from app.models.vendor import Vendor
from app.models.task import Task
from app.models.viewing import Viewing
from app.models.offer import Offer
from app.models.tenancy import Tenancy
from app.schemas.user import Role
from pydantic import BaseModel
from typing import Optional as Opt, Union


class ManagedEntity(BaseModel):
    """Basic info about a managed entity"""
    id: str
    name: str
    property_count: int = 0  # For vendors/landlords, how many properties they have


class AgentManagedEntities(BaseModel):
    """Entities managed by an agent"""
    vendors: List[ManagedEntity] = []
    buyers: List[ManagedEntity] = []
    landlords: List[ManagedEntity] = []
    applicants: List[ManagedEntity] = []
    properties: List[ManagedEntity] = []


class AgentStats(BaseModel):
    """Agent performance statistics"""
    properties_count: int = 0
    applicants_count: int = 0
    landlords_count: int = 0
    vendors_count: int = 0
    tasks_count: int = 0
    viewings_count: int = 0
    offers_count: int = 0
    tenancies_count: int = 0
    # KPI stats
    asking_price_achievement: Opt[float] = None  # Percentage
    days_on_market_avg: Opt[float] = None
    monthly_fees: Opt[float] = None  # Total monthly fees
    satisfaction_score: Opt[float] = None  # Out of 5


class AgentResponse(BaseModel):
    """Agent response with stats"""
    id: str
    email: str
    first_name: Opt[str] = None
    last_name: Opt[str] = None
    role: str
    is_active: bool
    organization_id: Opt[str] = None
    branch_id: Opt[str] = None
    stats: AgentStats
    # Additional metadata
    phone: Opt[str] = None  # Could be stored in user model later
    position: Opt[str] = None  # Job title/position
    team: Opt[str] = None  # Sales Team, Lettings Team, etc.
    online_status: bool = False  # Currently always False, could be tracked later
    
    class Config:
        from_attributes = True


router = APIRouter(prefix="/agents", tags=["agents"])


def calculate_agent_stats(agent_id: str, db: Session) -> AgentStats:
    """Calculate statistics for an agent"""
    stats = AgentStats()
    
    # Count properties managed by this agent
    stats.properties_count = db.query(Property)\
        .filter(Property.managed_by == agent_id)\
        .count()
    
    # Count applicants assigned to this agent
    stats.applicants_count = db.query(Applicant)\
        .filter(Applicant.assigned_agent_id == agent_id)\
        .count()
    
    # Count landlords (properties managed by agent have landlords)
    landlord_ids = db.query(Property.landlord_id)\
        .filter(Property.managed_by == agent_id)\
        .filter(Property.landlord_id.isnot(None))\
        .distinct()\
        .all()
    stats.landlords_count = len([lid[0] for lid in landlord_ids if lid[0]])
    
    # Count vendors (properties for sale managed by agent have vendors)
    vendor_ids = db.query(Property.vendor_id)\
        .filter(Property.managed_by == agent_id)\
        .filter(Property.vendor_id.isnot(None))\
        .distinct()\
        .all()
    stats.vendors_count = len([vid[0] for vid in vendor_ids if vid[0]])
    
    # Count tasks assigned to this agent
    stats.tasks_count = db.query(Task)\
        .filter(Task.assigned_to == agent_id)\
        .count()
    
    # Count viewings for properties managed by this agent
    property_ids = db.query(Property.id)\
        .filter(Property.managed_by == agent_id)\
        .all()
    property_id_list = [pid[0] for pid in property_ids]
    if property_id_list:
        stats.viewings_count = db.query(Viewing)\
            .filter(Viewing.property_id.in_(property_id_list))\
            .count()
    
    # Count offers for properties managed by this agent
    if property_id_list:
        stats.offers_count = db.query(Offer)\
            .filter(Offer.property_id.in_(property_id_list))\
            .count()
    
    # Count tenancies for applicants assigned to this agent
    applicant_ids = db.query(Applicant.id)\
        .filter(Applicant.assigned_agent_id == agent_id)\
        .all()
    applicant_id_list = [aid[0] for aid in applicant_ids]
    if applicant_id_list:
        stats.tenancies_count = db.query(Tenancy)\
            .filter(Tenancy.applicant_id.in_(applicant_id_list))\
            .count()
    
    # Calculate KPI stats
    # Asking price achievement (average of asking vs achieved for sales)
    properties_for_sale = db.query(Property)\
        .filter(Property.managed_by == agent_id)\
        .filter(Property.asking_price.isnot(None))\
        .all()
    
    if properties_for_sale:
        total_asking = sum(p.asking_price or 0 for p in properties_for_sale)
        # For now, we'll use asking_price as achieved (in real app, this would come from sales progression)
        total_achieved = sum(p.asking_price or 0 for p in properties_for_sale)
        if total_asking > 0:
            stats.asking_price_achievement = round((total_achieved / total_asking) * 100, 1)
    
    # Average days on market (simplified - using created_at to now)
    if properties_for_sale:
        now = datetime.now(timezone.utc)
        days_list = []
        for prop in properties_for_sale:
            if prop.created_at:
                # Handle timezone-aware datetime
                if prop.created_at.tzinfo is None:
                    prop_date = prop.created_at.replace(tzinfo=timezone.utc)
                else:
                    prop_date = prop.created_at
                days = (now - prop_date).days
                days_list.append(days)
        if days_list:
            stats.days_on_market_avg = round(sum(days_list) / len(days_list), 1)
    
    # Monthly fees (sum of rent from properties managed)
    properties_letting = db.query(Property)\
        .filter(Property.managed_by == agent_id)\
        .filter(Property.rent.isnot(None))\
        .all()
    if properties_letting:
        stats.monthly_fees = sum(p.rent or 0 for p in properties_letting)
    
    # Satisfaction score (mock for now - could be calculated from feedback/ratings)
    # In a real app, this would come from tenant/landlord feedback
    stats.satisfaction_score = 4.1  # Placeholder
    
    return stats


def get_agent_team(agent_id: str, db: Session) -> str:
    """Determine agent team based on their properties and assignments"""
    # Check if agent has more sales properties or lettings properties
    sales_prop_count = db.query(Property)\
        .filter(Property.managed_by == agent_id)\
        .filter(Property.vendor_id.isnot(None))\
        .count()
    
    lettings_prop_count = db.query(Property)\
        .filter(Property.managed_by == agent_id)\
        .filter(Property.landlord_id.isnot(None))\
        .count()
    
    # Check vendors/buyers vs landlords/applicants assignments
    vendor_count = db.query(Vendor).filter(Vendor.managed_by == agent_id).count()
    buyer_count = db.query(Applicant).filter(
        Applicant.assigned_agent_id == agent_id,
        (
            (Applicant.buyer_type.isnot(None)) |
            (Applicant.willing_to_buy == True)
        )
    ).count()
    
    landlord_count = db.query(Landlord).filter(Landlord.managed_by == agent_id).count()
    applicant_count = db.query(Applicant).filter(
        Applicant.assigned_agent_id == agent_id,
        Applicant.willing_to_rent == True,
        Applicant.buyer_type.is_(None)  # Not a buyer
    ).count()
    
    # Calculate totals
    sales_total = sales_prop_count + vendor_count + buyer_count
    lettings_total = lettings_prop_count + landlord_count + applicant_count
    
    if sales_total > lettings_total:
        return "Sales Team"
    elif lettings_total > sales_total:
        return "Lettings Team"
    else:
        # Default or mixed - if no assignments, default to Lettings Team
        if sales_total == 0 and lettings_total == 0:
            return "Lettings Team"
        # If equal, prefer Sales Team (since we want 3 sales, 3 lettings)
        return "Sales Team" if sales_total > 0 else "Lettings Team"


def get_agent_position(agent_id: str, db: Session) -> str:
    """Determine agent position/title based on their stats"""
    stats = calculate_agent_stats(agent_id, db)
    
    if stats.properties_count >= 20:
        return "Senior Sales & Lettings Manager"
    elif stats.properties_count >= 10:
        return "Sales Manager"
    elif stats.properties_count >= 5:
        return "Property Consultant"
    else:
        return "Lettings Specialist"


@router.get("/", response_model=List[AgentResponse])
def list_agents(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    team: Optional[str] = Query(None, description="Filter by team (Sales Team, Lettings Team)"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    db: Session = Depends(get_db)
):
    """
    List all agents with their statistics
    
    Returns agents (users with role=AGENT) with calculated stats including:
    - Property counts
    - Applicant counts
    - Task counts
    - KPI metrics (achievement rates, fees, etc.)
    """
    # Query for agents only
    query = db.query(User).filter(User.role == Role.AGENT).filter(User.is_active == True)
    
    # Apply search filter
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            (func.lower(User.first_name).like(search_term)) |
            (func.lower(User.last_name).like(search_term)) |
            (func.lower(User.email).like(search_term))
        )
    
    users = query.order_by(User.first_name, User.last_name).offset(skip).limit(limit).all()
    
    # Build response with stats
    agents = []
    for user in users:
        stats = calculate_agent_stats(user.id, db)
        agent_team = get_agent_team(user.id, db)
        agent_position = get_agent_position(user.id, db)
        
        # Apply team filter if provided
        if team and agent_team != team:
            continue
        
        agent_response = AgentResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role.value if user.role else "agent",
            is_active=user.is_active,
            organization_id=user.organization_id,
            branch_id=user.branch_id,
            stats=stats,
            phone=None,  # Could be added to user model later
            position=agent_position,
            team=agent_team,
            online_status=False  # Could be tracked with last_seen timestamp
        )
        agents.append(agent_response)
    
    return agents


@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(
    agent_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a single agent by ID with detailed statistics
    """
    agent = db.query(User).filter(User.id == agent_id).filter(User.role == Role.AGENT).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    stats = calculate_agent_stats(agent_id, db)
    agent_team = get_agent_team(agent_id, db)
    agent_position = get_agent_position(agent_id, db)
    
    return AgentResponse(
        id=agent.id,
        email=agent.email,
        first_name=agent.first_name,
        last_name=agent.last_name,
        role=agent.role.value if agent.role else "agent",
        is_active=agent.is_active,
        organization_id=agent.organization_id,
        branch_id=agent.branch_id,
        stats=stats,
        phone=None,
        position=agent_position,
        team=agent_team,
        online_status=False
    )


@router.get("/{agent_id}/stats", response_model=AgentStats)
def get_agent_stats_endpoint(
    agent_id: str,
    db: Session = Depends(get_db)
):
    """
    Get detailed statistics for a specific agent
    """
    agent = db.query(User).filter(User.id == agent_id).filter(User.role == Role.AGENT).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return calculate_agent_stats(agent_id, db)


@router.get("/{agent_id}/managed", response_model=AgentManagedEntities)
def get_agent_managed_entities(
    agent_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all entities (vendors, buyers, landlords, applicants, properties) managed by an agent
    """
    agent = db.query(User).filter(User.id == agent_id).filter(User.role == Role.AGENT).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    result = AgentManagedEntities()
    
    # Get vendors managed by this agent
    vendors = db.query(Vendor).filter(Vendor.managed_by == agent_id).all()
    for vendor in vendors:
        property_count = db.query(Property).filter(Property.vendor_id == vendor.id).count()
        result.vendors.append(ManagedEntity(
            id=vendor.id,
            name=f"{vendor.first_name} {vendor.last_name}".strip(),
            property_count=property_count
        ))
    
    # Get buyers (applicants with buyer_type or willing_to_buy) managed by this agent
    buyers = db.query(Applicant).filter(
        Applicant.assigned_agent_id == agent_id,
        (
            (Applicant.buyer_type.isnot(None)) |
            (Applicant.willing_to_buy == True)
        )
    ).all()
    for buyer in buyers:
        result.buyers.append(ManagedEntity(
            id=buyer.id,
            name=f"{buyer.first_name} {buyer.last_name}".strip(),
            property_count=0
        ))
    
    # Get landlords managed by this agent
    landlords = db.query(Landlord).filter(Landlord.managed_by == agent_id).all()
    for landlord in landlords:
        property_count = db.query(Property).filter(Property.landlord_id == landlord.id).count()
        result.landlords.append(ManagedEntity(
            id=landlord.id,
            name=landlord.full_name,
            property_count=property_count
        ))
    
    # Get applicants/tenants (willing to rent, not buyers) managed by this agent
    applicants = db.query(Applicant).filter(
        Applicant.assigned_agent_id == agent_id,
        Applicant.willing_to_rent == True,
        Applicant.buyer_type.is_(None)  # Not a buyer
    ).all()
    for applicant in applicants:
        result.applicants.append(ManagedEntity(
            id=applicant.id,
            name=f"{applicant.first_name} {applicant.last_name}".strip(),
            property_count=0
        ))
    
    # Get properties managed by this agent (through landlord or vendor)
    # Properties are managed if their landlord or vendor is managed by this agent
    landlord_ids = [l.id for l in landlords]
    vendor_ids = [v.id for v in vendors]
    
    properties = []
    if landlord_ids:
        landlord_properties = db.query(Property).filter(Property.landlord_id.in_(landlord_ids)).all()
        properties.extend(landlord_properties)
    if vendor_ids:
        vendor_properties = db.query(Property).filter(Property.vendor_id.in_(vendor_ids)).all()
        properties.extend(vendor_properties)
    
    # Remove duplicates
    seen_property_ids = set()
    for prop in properties:
        if prop.id not in seen_property_ids:
            seen_property_ids.add(prop.id)
            address = prop.address_line1 or prop.address or prop.city or "Unknown"
            result.properties.append(ManagedEntity(
                id=prop.id,
                name=address,
                property_count=0
            ))
    
    return result

