from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import get_db
from app.services.valuation_service import get_valuation_service, ValuationService
from app.schemas.valuation import (
    Valuation,
    ValuationCreate,
    ValuationUpdate,
    ValuationRequest,
    ValuationResponse,
    ComparablePropertiesRequest,
    ComparablePropertiesResponse,
    ValuationPackResponse
)
from app.models.valuation import Valuation as ValuationModel
from app.models.property import Property as PropertyModel

router = APIRouter(prefix="/valuations", tags=["valuations"])


@router.post(
    "/generate",
    response_model=ValuationResponse,
    summary="Generate AI Valuation Pack",
    description="Generate comprehensive sales or lettings valuation pack using AI analysis"
)
async def generate_valuation_pack(
    request: ValuationRequest,
    db: Session = Depends(get_db),
):
    # Log the incoming request for debugging
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Received valuation request: property_id={request.property_id}, valuation_type={request.valuation_type}, include_comparables={request.include_comparables}, market_analysis_depth={request.market_analysis_depth}, radius_km={request.radius_km}, max_comparables={request.max_comparables}")
    """
    Generate AI-powered valuation pack for a property
    
    Creates comprehensive valuation analysis including:
    - Market conditions assessment
    - Comparable property analysis  
    - Pricing strategy recommendations
    - Detailed valuation reasoning
    """
    try:
        # Get services (await async dependencies)
        valuation_service = await get_valuation_service()
        
        # Log the request for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Valuation request received: property_id={request.property_id}, valuation_type={request.valuation_type}")
        # Verify property exists
        property_obj = db.query(PropertyModel).filter(PropertyModel.id == request.property_id).first()
        if not property_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Property with ID {request.property_id} not found"
            )
        
        # Get property data for analysis
        property_data = {
            'id': property_obj.id,
            'full_address': property_obj.address or property_obj.address_line1,
            'postcode': property_obj.postcode,
            'property_type': property_obj.property_type,
            'bedrooms': property_obj.bedrooms,
            'bathrooms': property_obj.bathrooms,
            'floor_area_sqm': property_obj.floor_area_sqft / 10.764 if property_obj.floor_area_sqft else None,
            'tenure': 'Unknown',  # Would come from land registry
            'asking_price': float(property_obj.asking_price) if property_obj.asking_price else None,
            'sales_status': property_obj.sales_status
        }
        
        # Find comparable properties if requested
        comparables = []
        if request.include_comparables:
            comparables = await valuation_service.find_comparable_sales(
                property_data, 
                radius_km=request.radius_km,
                max_results=10
            )
        
        # Generate valuation pack
        result = await valuation_service.generate_sales_valuation_pack(
            property_data, 
            comparables
        )
        
        if not result.get("success"):
            error_msg = result.get("error", "Valuation generation failed")
            
            # Provide more helpful error messages
            if "401" in error_msg or "API key" in error_msg or "unauthorized" in error_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="OpenAI API key is missing or invalid. Please configure OPENAI_API_KEY in your .env file."
                )
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_msg
            )
        
        # Create valuation record in database
        valuation_data = result["valuation"]
        db_valuation = ValuationModel(
            property_id=request.property_id,
            valuation_type=request.valuation_type,
            estimated_value=valuation_data.get("estimated_value"),
            value_range_min=valuation_data.get("value_range_min"),
            value_range_max=valuation_data.get("value_range_max"),
            confidence=valuation_data.get("confidence"),
            market_conditions=valuation_data.get("market_conditions"),
            comparable_properties=valuation_data.get("comparable_properties"),
            key_factors=valuation_data.get("key_factors"),
            recommended_price=valuation_data.get("recommended_price"),
            pricing_strategy=valuation_data.get("pricing_strategy"),
            recommendations=valuation_data.get("recommendations"),
            property_advantages=valuation_data.get("property_advantages"),
            property_limitations=valuation_data.get("property_limitations"),
            location_analysis=valuation_data.get("location_analysis"),
            valuation_logic=valuation_data.get("valuation_logic"),
            location_infrastructure=valuation_data.get("location_infrastructure"),
            valuation_method="ai_analysis",
            model_used=result.get("model_used"),
            status="active"
        )
        
        db.add(db_valuation)
        db.commit()
        db.refresh(db_valuation)
        
        return ValuationResponse(
            success=True,
            valuation=db_valuation,
            processing_time=result.get("processing_time"),
            model_used=result.get("model_used")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Valuation generation error: {str(e)}"
        )


@router.get(
    "/property/{property_id}",
    response_model=List[Valuation],
    summary="Get Property Valuations",
    description="Get all valuation records for a specific property"
)
def get_property_valuations(
    property_id: str,
    valuation_type: Optional[str] = Query(None, regex="^(sales|lettings)$"),
    db: Session = Depends(get_db)
):
    """
    Retrieve all valuation records for a property
    
    Optionally filter by valuation type (sales/lettings)
    Returns historical valuation data for trend analysis
    """
    try:
        query = db.query(ValuationModel).filter(ValuationModel.property_id == property_id)
        
        if valuation_type:
            query = query.filter(ValuationModel.valuation_type == valuation_type)
            
        valuations = query.order_by(ValuationModel.created_at.desc()).all()
        
        return valuations
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving valuations: {str(e)}"
        )


@router.get(
    "/{valuation_id}",
    response_model=Valuation,
    summary="Get Valuation by ID",
    description="Get specific valuation record by its ID"
)
def get_valuation(
    valuation_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific valuation record
    
    Returns complete valuation data including comparable analysis
    and market reasoning
    """
    valuation = db.query(ValuationModel).filter(ValuationModel.id == valuation_id).first()
    
    if not valuation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Valuation with ID {valuation_id} not found"
        )
    
    return valuation


@router.put(
    "/{valuation_id}",
    response_model=Valuation,
    summary="Update Valuation",
    description="Update valuation record (e.g., mark as superseded, update confidence)"
)
def update_valuation(
    valuation_id: str,
    valuation_update: ValuationUpdate,
    db: Session = Depends(get_db)
):
    """
    Update valuation record
    
    Typically used to:
    - Mark valuations as superseded when new data available
    - Update confidence levels after manual review
    - Adjust pricing strategy based on market feedback
    """
    try:
        db_valuation = db.query(ValuationModel).filter(ValuationModel.id == valuation_id).first()
        
        if not db_valuation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Valuation with ID {valuation_id} not found"
            )
        
        # Update fields from request
        update_data = valuation_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_valuation, field, value)
        
        db_valuation.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(db_valuation)
        
        return db_valuation
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating valuation: {str(e)}"
        )


@router.get(
    "/{property_id}/comparables",
    response_model=ComparablePropertiesResponse,
    summary="Find Comparable Properties",
    description="Find comparable property sales for valuation analysis"
)
async def get_comparable_properties(
    property_id: str,
    radius_km: float = Query(5.0, ge=0.1, le=50.0, description="Search radius in kilometers"),
    max_results: int = Query(10, ge=1, le=50, description="Maximum number of comparables"),
    min_bedrooms: Optional[int] = Query(None, ge=0, le=10),
    max_bedrooms: Optional[int] = Query(None, ge=0, le=10),
    property_types: Optional[List[str]] = Query(None),
    valuation_service: ValuationService = Depends(get_valuation_service)
):
    """
    Find comparable property sales for valuation analysis
    
    Uses property data and search criteria to find similar properties
    that have recently sold in the area for market comparison
    """
    try:
        # Get property data (in real implementation, this would come from database)
        property_data = {
            'id': property_id,
            # Additional property data would be fetched from DB
        }
        
        # This would integrate with land registry service in production
        comparables = await valuation_service.find_comparable_sales(
            property_data,
            radius_km=radius_km,
            max_results=max_results
        )
        
        return ComparablePropertiesResponse(
            success=True,
            comparables=comparables,
            total_found=len(comparables),
            search_radius=radius_km
        )
        
    except Exception as e:
        return ComparablePropertiesResponse(
            success=False,
            comparables=[],
            total_found=0,
            search_radius=radius_km,
            error=f"Error finding comparable properties: {str(e)}"
        )


@router.get(
    "/{valuation_id}/blueprint-format",
    response_model=ValuationPackResponse,
    summary="Get Valuation in Blueprint Format",
    description="Get valuation data formatted exactly as shown in CRM blueprint pages 42-46"
)
def get_valuation_blueprint_format(
    valuation_id: str,
    db: Session = Depends(get_db)
):
    """
    Get valuation pack in blueprint-specific format
    
    Returns valuation data structured exactly as shown in the CRM blueprint
    with tables for subject property, comparables, and detailed reasoning
    """
    try:
        valuation = db.query(ValuationModel).filter(ValuationModel.id == valuation_id).first()
        
        if not valuation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Valuation with ID {valuation_id} not found"
            )
        
        # Convert database valuation to blueprint format
        # This would involve formatting the data into the specific table structures
        # shown in pages 42-46 of the blueprint
        
        # For now, return basic structure - full implementation would parse
        # the stored data into the exact blueprint table formats
        blueprint_pack = {
            "subject_property_details": {
                "address": valuation.property.address if valuation.property else "Unknown",
                "property_type": valuation.property.property_type if valuation.property else "Unknown",
                "bedrooms": valuation.property.bedrooms if valuation.property else 0,
                "bathrooms": valuation.property.bathrooms if valuation.property else 0
            },
            "comparable_sales_analysis": {
                "recent_sales": valuation.comparable_properties or [],
                "key_takeaways": valuation.valuation_logic or "No analysis available"
            },
            "active_market_comparables": [],
            "recommended_valuation": {
                "price_range": {
                    "quick_sale": valuation.value_range_min,
                    "balanced": valuation.estimated_value,
                    "aspirational": valuation.value_range_max
                },
                "recommended_marketing_price": valuation.recommended_price,
                "pricing_strategy": valuation.pricing_strategy
            },
            "valuation_logic": {
                "comparable_property_analysis": valuation.valuation_logic or "",
                "premium_factors": valuation.key_factors.get("positive", []) if valuation.key_factors else [],
                "location_analysis": valuation.location_analysis or "",
                "market_conditions": valuation.market_conditions or ""
            },
            "executive_summary": f"AI-generated valuation with {valuation.confidence} confidence",
            "confidence_level": valuation.confidence or "medium",
            "key_recommendations": valuation.recommendations or []
        }
        
        return ValuationPackResponse(
            success=True,
            valuation_pack=blueprint_pack,
            valuation_record=valuation
        )
        
    except Exception as e:
        return ValuationPackResponse(
            success=False,
            valuation_pack=None,
            valuation_record=None,
            error=f"Error formatting valuation pack: {str(e)}"
        )


@router.delete(
    "/{valuation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Valuation",
    description="Soft delete a valuation record (mark as superseded)"
)
def delete_valuation(
    valuation_id: str,
    db: Session = Depends(get_db)
):
    """
    Soft delete valuation record
    
    Marks valuation as superseded rather than hard deletion
    to maintain historical data for analytics
    """
    try:
        db_valuation = db.query(ValuationModel).filter(ValuationModel.id == valuation_id).first()
        
        if not db_valuation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Valuation with ID {valuation_id} not found"
            )
        
        # Soft delete by marking as superseded
        db_valuation.status = "superseded"
        db_valuation.updated_at = datetime.now(timezone.utc)
        db.commit()
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting valuation: {str(e)}"
        )

