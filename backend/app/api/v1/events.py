from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/events", tags=["events"])

@router.get("/log")
def get_event_log():
    """Get recent events - STUB for now"""
    return [
        {
            "id": 1,
            "event": "property.created",
            "entity_type": "property",
            "entity_id": 1,
            "timestamp": datetime.now().isoformat(),
            "user": "system"
        },
        {
            "id": 2,
            "event": "applicant.registered",
            "entity_type": "applicant",
            "entity_id": 5,
            "timestamp": datetime.now().isoformat(),
            "user": "system"
        }
    ]

@router.post("/trigger")
def trigger_event(event_type: str, entity_id: int):
    """Trigger an event - STUB for now"""
    return {
        "status": "ok",
        "event": event_type,
        "entity_id": entity_id,
        "triggered_at": datetime.now().isoformat()
    }