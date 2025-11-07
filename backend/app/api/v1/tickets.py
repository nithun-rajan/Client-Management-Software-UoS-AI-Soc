from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db

from app.models.tickets import Ticket
from app.schemas.tickets import TicketCreate, TicketResponse, TicketUpdate
from app.models.enums import TicketStatus
from app.models.property import Property

# Creates a ticket
router = APIRouter(prefix="/tickets", tags=["tickets"])

@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(ticket_data: TicketCreate, db: Session = Depends(get_db)):

    
    # Validate that the property_id exists before creating the ticket
    db_property = db.query(Property).filter(Property.id == ticket_data.property_id).first()
    if not db_property:
        raise HTTPException(status_code=404, detail="Property not found")
        
    # Manually map data from the Pydantic schema to the database model
    db_ticket = Ticket(
        title=ticket_data.title,
        description=ticket_data.description,
        property_id=ticket_data.property_id,
        applicant_id=ticket_data.applicant_id,
        status=ticket_data.status,
        urgency=ticket_data.urgency,
        ticket_category=ticket_data.ticket_category,
        priority=ticket_data.priority,
        reported_date=ticket_data.reported_date,
    )
    
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

@router.get("/", response_model=List[TicketResponse])
def list_tickets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Lists all maintenance tickets.
    """
    tickets = db.query(Ticket).offset(skip).limit(limit).all()
    return tickets

@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    """
    Gets a single maintenance ticket by its ID.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@router.put("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: str,
    ticket_data: TicketUpdate,
    db: Session = Depends(get_db)
):
    """
    Updates a ticket.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    
    update_data = ticket_data.model_dump(exclude_unset=True)
    
    # Iterate through and apply updates only for fields that were sent
    for key, value in update_data.items():
        setattr(ticket, key, value)
    
    db.commit()
    db.refresh(ticket)
    return ticket

@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: str, db: Session = Depends(get_db)):
    
    # Deletes a ticket.
    
    
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    db.delete(ticket)
    db.commit()