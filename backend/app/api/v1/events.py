from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.core.database import get_db
from app.models.property import Property
from app.models.applicant import Applicant
from app.models.landlord import Landlord
from app.models.vendor import Vendor
from app.models.communication import Communication
from app.models.task import Task
from app.models.viewing import Viewing
from app.models.offer import Offer


router = APIRouter(prefix="/events", tags=["events"])


@router.get("/log")
def get_event_log(
    limit: int = Query(50, ge=1, le=200, description="Maximum number of activities to return"),
    db: Session = Depends(get_db)
):
    """
    Get recent activity feed - aggregates activities from all sources:
    - Properties (created, status changes)
    - Applicants (created, registered)
    - Landlords (created)
    - Vendors (created)
    - Communications (all types)
    - Tasks (created, completed)
    - Viewings (scheduled, completed)
    - Offers (created, accepted)
    """
    activities = []
    
    # Calculate cutoff date (30 days ago)
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)
    
    # Get recent properties (created in last 30 days)
    recent_properties = db.query(Property)\
        .filter(Property.created_at >= cutoff_date)\
        .order_by(Property.created_at.desc())\
        .limit(limit)\
        .all()
    
    for prop in recent_properties:
        # Get property address - try address first, then address_line1, then fallback
        property_address = prop.address or prop.address_line1 or f"{prop.address_line1 or ''} {prop.address_line2 or ''}".strip() or f"Property in {prop.city or 'Unknown'}"
        activities.append({
            "id": f"property_{prop.id}",
            "event": "property.created",
            "entity_type": "property",
            "entity_id": str(prop.id),
            "timestamp": prop.created_at.isoformat() if prop.created_at else datetime.now(timezone.utc).isoformat(),
            "user": "system",
            "description": f"Property Created: {property_address}",
            "entity_name": property_address
        })
    
    # Get recent applicants (created in last 30 days)
    recent_applicants = db.query(Applicant)\
        .filter(Applicant.created_at >= cutoff_date)\
        .order_by(Applicant.created_at.desc())\
        .limit(limit)\
        .all()
    
    for applicant in recent_applicants:
        applicant_name = f"{applicant.first_name or ''} {applicant.last_name or ''}".strip() or f"Applicant #{applicant.id}"
        activities.append({
            "id": f"applicant_{applicant.id}",
            "event": "applicant.registered",
            "entity_type": "applicant",
            "entity_id": str(applicant.id),
            "timestamp": applicant.created_at.isoformat() if applicant.created_at else datetime.now(timezone.utc).isoformat(),
            "user": "system",
            "description": f"Applicant Registered: {applicant_name}",
            "entity_name": applicant_name
        })
    
    # Get recent landlords (created in last 30 days)
    recent_landlords = db.query(Landlord)\
        .filter(Landlord.created_at >= cutoff_date)\
        .order_by(Landlord.created_at.desc())\
        .limit(limit)\
        .all()
    
    for landlord in recent_landlords:
        activities.append({
            "id": f"landlord_{landlord.id}",
            "event": "landlord.created",
            "entity_type": "landlord",
            "entity_id": str(landlord.id),
            "timestamp": landlord.created_at.isoformat() if landlord.created_at else datetime.now(timezone.utc).isoformat(),
            "user": "system",
            "description": f"Landlord Created: {landlord.full_name}",
            "entity_name": landlord.full_name or f"Landlord #{landlord.id}"
        })
    
    # Get recent vendors (created in last 30 days)
    recent_vendors = db.query(Vendor)\
        .filter(Vendor.created_at >= cutoff_date)\
        .order_by(Vendor.created_at.desc())\
        .limit(limit)\
        .all()
    
    for vendor in recent_vendors:
        vendor_name = f"{vendor.first_name or ''} {vendor.last_name or ''}".strip() or f"Vendor #{vendor.id}"
        activities.append({
            "id": f"vendor_{vendor.id}",
            "event": "vendor.created",
            "entity_type": "vendor",
            "entity_id": str(vendor.id),
            "timestamp": vendor.created_at.isoformat() if vendor.created_at else datetime.now(timezone.utc).isoformat(),
            "user": "system",
            "description": f"Vendor Created: {vendor_name}",
            "entity_name": vendor_name
        })
    
    # Get recent communications (created in last 30 days)
    recent_communications = db.query(Communication)\
        .filter(Communication.created_at >= cutoff_date)\
        .order_by(Communication.created_at.desc())\
        .limit(limit)\
        .all()
    
    for comm in recent_communications:
        event_type = f"communication.{comm.type}"
        entity_type = None
        entity_id = None
        entity_name = None
        
        if comm.property_id:
            entity_type = "property"
            # Handle both string and integer property_id (Communication uses Integer, Property uses String)
            property_id_str = str(comm.property_id) if comm.property_id else None
            entity_id = property_id_str
            prop = db.query(Property).filter(Property.id == property_id_str).first()
            if prop:
                entity_name = prop.address or prop.address_line1 or f"{prop.address_line1 or ''} {prop.address_line2 or ''}".strip() or f"Property in {prop.city or 'Unknown'}"
            else:
                entity_name = f"Property #{property_id_str}"
        elif comm.landlord_id:
            entity_type = "landlord"
            # Handle both string and integer landlord_id
            landlord_id_str = str(comm.landlord_id) if comm.landlord_id else None
            entity_id = landlord_id_str
            landlord = db.query(Landlord).filter(Landlord.id == landlord_id_str).first()
            entity_name = landlord.full_name if landlord else f"Landlord #{landlord_id_str}"
        elif comm.applicant_id:
            entity_type = "applicant"
            # Handle both string and integer applicant_id
            applicant_id_str = str(comm.applicant_id) if comm.applicant_id else None
            entity_id = applicant_id_str
            applicant = db.query(Applicant).filter(Applicant.id == applicant_id_str).first()
            if applicant:
                entity_name = f"{applicant.first_name or ''} {applicant.last_name or ''}".strip() or f"Applicant #{applicant_id_str}"
            else:
                entity_name = f"Applicant #{applicant_id_str}"
        
        if entity_type:
            comm_description = comm.subject or (comm.content[:50] if comm.content else "No subject")
            activities.append({
                "id": f"communication_{comm.id}",
                "event": event_type,
                "entity_type": entity_type,
                "entity_id": str(entity_id),
                "timestamp": comm.created_at.isoformat() if comm.created_at else datetime.now(timezone.utc).isoformat(),
                "user": comm.created_by or "system",
                "description": f"{comm.type.capitalize()}: {comm_description}",
                "entity_name": entity_name or f"{entity_type} #{entity_id}"
            })
    
    # Get recent tasks (created in last 30 days)
    recent_tasks = db.query(Task)\
        .filter(Task.created_at >= cutoff_date)\
        .order_by(Task.created_at.desc())\
        .limit(limit)\
        .all()
    
    for task in recent_tasks:
        activities.append({
            "id": f"task_{task.id}",
            "event": "task.created" if task.status == "todo" else f"task.{task.status}",
            "entity_type": "task",
            "entity_id": str(task.id),
            "timestamp": task.created_at.isoformat() if task.created_at else datetime.now(timezone.utc).isoformat(),
            "user": task.assigned_to or "system",
            "description": f"Task: {task.title}",
            "entity_name": task.title or f"Task #{task.id}"
        })
    
    # Get recent viewings (created in last 30 days)
    recent_viewings = db.query(Viewing)\
        .filter(Viewing.created_at >= cutoff_date)\
        .order_by(Viewing.created_at.desc())\
        .limit(limit)\
        .all()
    
    for viewing in recent_viewings:
        prop = db.query(Property).filter(Property.id == viewing.property_id).first()
        if prop:
            property_name = prop.address or prop.address_line1 or f"{prop.address_line1 or ''} {prop.address_line2 or ''}".strip() or f"Property in {prop.city or 'Unknown'}"
        else:
            property_name = f"Property #{viewing.property_id}"
        
        activities.append({
            "id": f"viewing_{viewing.id}",
            "event": f"viewing.{viewing.status}",
            "entity_type": "viewing",
            "entity_id": str(viewing.id),
            "timestamp": viewing.created_at.isoformat() if viewing.created_at else datetime.now(timezone.utc).isoformat(),
            "user": viewing.assigned_agent or "system",
            "description": f"Viewing {viewing.status}: {property_name}",
            "entity_name": property_name
        })
    
    # Get recent offers (created in last 30 days)
    recent_offers = db.query(Offer)\
        .filter(Offer.created_at >= cutoff_date)\
        .order_by(Offer.created_at.desc())\
        .limit(limit)\
        .all()
    
    for offer in recent_offers:
        prop = db.query(Property).filter(Property.id == offer.property_id).first()
        if prop:
            property_name = prop.address or prop.address_line1 or f"{prop.address_line1 or ''} {prop.address_line2 or ''}".strip() or f"Property in {prop.city or 'Unknown'}"
        else:
            property_name = f"Property #{offer.property_id}"
        
        activities.append({
            "id": f"offer_{offer.id}",
            "event": f"offer.{offer.status}",
            "entity_type": "offer",
            "entity_id": str(offer.id),
            "timestamp": offer.created_at.isoformat() if offer.created_at else datetime.now(timezone.utc).isoformat(),
            "user": "system",
            "description": f"Offer {offer.status}: £{offer.offered_rent:.0f} for {property_name}",
            "entity_name": property_name
        })
    
    # Sort all activities by timestamp (most recent first)
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    # Return the most recent activities up to the limit
    return activities[:limit]


@router.post("/trigger")
def trigger_event(event_type: str, entity_id: str):
    """Trigger an event - STUB for now"""
    return {
        "status": "ok",
        "event": event_type,
        "entity_id": entity_id,
        "triggered_at": datetime.now(timezone.utc).isoformat()
    }
