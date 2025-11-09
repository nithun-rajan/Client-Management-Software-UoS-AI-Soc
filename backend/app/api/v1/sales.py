from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.sales import SalesProgression, SalesOffer
from app.schemas.sales import (
    SalesProgressionCreate, 
    SalesProgressionUpdate, 
    SalesProgressionResponse,
    OfferCreate,
    OfferUpdate,
    OfferResponse
)

router = APIRouter(prefix="/sales", tags=["sales"])


# Sales Progression CRUD Endpoints

@router.post("/progression", response_model=SalesProgressionResponse, status_code=status.HTTP_201_CREATED)
def create_sales_progression(
    sales_progression: SalesProgressionCreate,
    db: Session = Depends(get_db)
):
    """
    Create new sales progression record
    """
    # Check if progression already exists for this property
    existing = db.query(SalesProgression).filter(
        SalesProgression.property_id == sales_progression.property_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sales progression already exists for this property"
        )
    
    db_sales_progression = SalesProgression(**sales_progression.model_dump())
    db.add(db_sales_progression)
    db.commit()
    db.refresh(db_sales_progression)
    
    return db_sales_progression


@router.get("/progression", response_model=List[SalesProgressionResponse])
def get_sales_progression_list(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    property_id: Optional[str] = None,
    vendor_id: Optional[str] = None,
    buyer_id: Optional[str] = None,
    sales_status: Optional[str] = None,
    current_stage: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get list of sales progression records with filtering
    """
    query = db.query(SalesProgression)
    
    # Apply filters
    if property_id:
        query = query.filter(SalesProgression.property_id == property_id)
    if vendor_id:
        query = query.filter(SalesProgression.vendor_id == vendor_id)
    if buyer_id:
        query = query.filter(SalesProgression.buyer_id == buyer_id)
    if sales_status:
        query = query.filter(SalesProgression.sales_status == sales_status)
    if current_stage:
        query = query.filter(SalesProgression.current_stage == current_stage)
    
    sales_progression = query.offset(skip).limit(limit).all()
    return sales_progression


@router.get("/progression/{progression_id}", response_model=SalesProgressionResponse)
def get_sales_progression(
    progression_id: str,
    db: Session = Depends(get_db)
):
    """
    Get specific sales progression by ID
    """
    sales_progression = db.query(SalesProgression).filter(SalesProgression.id == progression_id).first()
    
    if not sales_progression:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales progression not found"
        )
    
    return sales_progression


@router.get("/progression/property/{property_id}", response_model=Optional[SalesProgressionResponse])
def get_sales_progression_by_property(
    property_id: str,
    db: Session = Depends(get_db)
):
    """
    Get sales progression by property ID
    """
    sales_progression = db.query(SalesProgression).filter(
        SalesProgression.property_id == property_id
    ).first()
    
    return sales_progression


@router.put("/progression/{progression_id}", response_model=SalesProgressionResponse)
def update_sales_progression(
    progression_id: str,
    sales_progression_update: SalesProgressionUpdate,
    db: Session = Depends(get_db)
):
    """
    Update sales progression record
    """
    db_sales_progression = db.query(SalesProgression).filter(SalesProgression.id == progression_id).first()
    
    if not db_sales_progression:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales progression not found"
        )
    
    update_data = sales_progression_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_sales_progression, field, value)
    
    db.commit()
    db.refresh(db_sales_progression)
    
    return db_sales_progression


@router.delete("/progression/{progression_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sales_progression(
    progression_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete sales progression record
    """
    db_sales_progression = db.query(SalesProgression).filter(SalesProgression.id == progression_id).first()
    
    if not db_sales_progression:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales progression not found"
        )
    
    db.delete(db_sales_progression)
    db.commit()
    
    return None


@router.put("/progression/{progression_id}/stage", response_model=SalesProgressionResponse)
def update_sales_stage(
    progression_id: str,
    stage: str = Query(..., description="New sales stage"),
    db: Session = Depends(get_db)
):
    """
    Update sales progression stage
    """
    db_sales_progression = db.query(SalesProgression).filter(SalesProgression.id == progression_id).first()
    
    if not db_sales_progression:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales progression not found"
        )
    
    db_sales_progression.current_stage = stage
    
    # Update relevant dates based on stage
    current_time = datetime.now(timezone.utc)
    if stage == "sstc" and not db_sales_progression.sstc_date:
        db_sales_progression.sstc_date = current_time
    elif stage == "exchanged" and not db_sales_progression.exchange_date:
        db_sales_progression.exchange_date = current_time
    elif stage == "completed" and not db_sales_progression.completion_date:
        db_sales_progression.completion_date = current_time
    
    db.commit()
    db.refresh(db_sales_progression)
    
    return db_sales_progression


@router.get("/progression/chain/{chain_id}", response_model=List[SalesProgressionResponse])
def get_sales_progression_by_chain(
    chain_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all sales progression records in a chain
    """
    sales_progression = db.query(SalesProgression).filter(
        SalesProgression.chain_id == chain_id
    ).all()
    
    return sales_progression


# Offer CRUD Endpoints

@router.post("/offers", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
def create_offer(
    offer: OfferCreate,
    db: Session = Depends(get_db)
):
    """
    Create new offer
    """
    db_offer = SalesOffer(**offer.model_dump())
    db.add(db_offer)
    db.commit()
    db.refresh(db_offer)
    
    return db_offer


@router.get("/offers", response_model=List[OfferResponse])
def get_offers_list(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    property_id: Optional[str] = None,
    buyer_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get list of offers with filtering
    """
    query = db.query(SalesOffer)
    
    # Apply filters
    if property_id:
        query = query.filter(SalesOffer.property_id == property_id)
    if buyer_id:
        query = query.filter(SalesOffer.buyer_id == buyer_id)
    if status:
        query = query.filter(SalesOffer.status == status)
    
    offers = query.offset(skip).limit(limit).all()
    return offers


@router.get("/offers/{offer_id}", response_model=OfferResponse)
def get_offer(
    offer_id: str,
    db: Session = Depends(get_db)
):
    """
    Get specific offer by ID
    """
    offer = db.query(SalesOffer).filter(SalesOffer.id == offer_id).first()
    
    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )
    
    return offer


@router.get("/offers/property/{property_id}", response_model=List[OfferResponse])
def get_offers_by_property(
    property_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all offers for a property
    """
    offers = db.query(SalesOffer).filter(SalesOffer.property_id == property_id).all()
    return offers


@router.put("/offers/{offer_id}", response_model=OfferResponse)
def update_offer(
    offer_id: str,
    offer_update: OfferUpdate,
    db: Session = Depends(get_db)
):
    """
    Update offer
    """
    db_offer = db.query(SalesOffer).filter(SalesOffer.id == offer_id).first()
    
    if not db_offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )
    
    update_data = offer_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_offer, field, value)
    
    db.commit()
    db.refresh(db_offer)
    
    return db_offer


@router.put("/offers/{offer_id}/status", response_model=OfferResponse)
def update_offer_status(
    offer_id: str,
    status: str = Query(..., description="New offer status"),
    db: Session = Depends(get_db)
):
    """
    Update offer status
    """
    db_offer = db.query(SalesOffer).filter(SalesOffer.id == offer_id).first()
    
    if not db_offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )
    
    db_offer.status = status
    db_offer.decision_date = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(db_offer)
    
    return db_offer


@router.delete("/offers/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_offer(
    offer_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete offer
    """
    db_offer = db.query(SalesOffer).filter(SalesOffer.id == offer_id).first()
    
    if not db_offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )
    
    db.delete(db_offer)
    db.commit()
    
    return None