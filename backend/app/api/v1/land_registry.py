"""
HM Land Registry API Integration Endpoints

Provides endpoints for:
- Sold property prices (official UK government data)
- Property valuations with comparables
- Market statistics and trends
- Area analysis

🎉 Completely FREE - No API key required!
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from pydantic import BaseModel

from app.services.land_registry_service import get_land_registry_service
from app.services.data_street_service import get_data_street_service
from app.services.llm_service import get_llm_service


router = APIRouter(prefix="/land-registry", tags=["UK Land Registry"])


# ==================== Request/Response Models ====================

class ValuationPackRequest(BaseModel):
    """Valuation pack generation parameters"""
    postcode: str
    property_type: str  # e.g., "Flat", "Terraced", "Semi-Detached", "Detached"
    bedrooms: Optional[int] = None
    property_id: Optional[str] = None  # Optional: property ID to get asking_price as fallback
    asking_price: Optional[float] = None  # Optional: asking price to use as fallback


# ==================== Endpoints ====================

@router.get("/lookup-property")
async def lookup_specific_property(
    house_number: str = Query(..., description="House number or flat number (e.g., '123' or 'Flat 5')"),
    postcode: str = Query(..., description="UK postcode (e.g., 'SO15 2JS')"),
):
    """
    🏠 Look Up Specific Property by Address
    
    This is the **Alto-style** property lookup! Enter a house number and postcode
    to get the EXACT property's details:
    - Last sold price
    - Complete sales history
    - Property type
    - Bedrooms/Bathrooms
    - EPC rating
    - Current valuation
    - Price trends over time
    - Google Maps link
    
    **Example:**
    ```
    GET /api/v1/land-registry/lookup-property?house_number=10&postcode=SW1A%201AA
    ```
    
    **Returns:**
    - Exact property match
    - Sales history (all transactions)
    - Price appreciation/depreciation
    - Property characteristics
    - Google Maps URL
    """
    try:
        # Use data.street.co.uk API (commercial, real data!)
        service = await get_data_street_service()
        property_data = await service.lookup_property(
            postcode=postcode,
            house_number=house_number,
        )
        
        return {
            "success": True,
            "data": property_data,
            "source": "data.street.co.uk Property API",
        }
    except ValueError as e:
        # API key not configured
        raise HTTPException(
            status_code=500,
            detail="DATA_STREET_API_KEY not configured. Please add your API key to .env file."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error looking up property: {str(e)}"
        )


@router.post("/ai-rent-estimate")
async def ai_rent_estimate(
    house_number: str = Query(..., description="House number or flat number"),
    postcode: str = Query(..., description="UK postcode"),
):
    """
    🤖 AI-Powered Monthly Rent Estimation
    
    Uses advanced AI to analyze comprehensive property data and estimate
    the optimal monthly rent. Perfect for estate agents to make data-driven
    pricing decisions!
    
    **What the AI Analyzes:**
    - Property type, size, bedrooms, bathrooms
    - Location desirability and local market
    - EPC rating and energy efficiency
    - Sales history and price trends
    - Environmental factors (noise, etc.)
    - Construction age and amenities
    - Local authority and area statistics
    
    **Returns:**
    - Estimated monthly rent (£)
    - Confidence level (low/medium/high)
    - Detailed reasoning for the estimate
    - Positive/negative factors affecting price
    - Market comparison
    - Actionable recommendations for agents
    
    **Example:**
    ```
    POST /api/v1/land-registry/ai-rent-estimate?house_number=1&postcode=SW1V%201QH
    ```
    """
    try:
        # First, get comprehensive property data
        data_street_service = await get_data_street_service()
        property_data = await data_street_service.lookup_property(
            postcode=postcode,
            house_number=house_number,
        )
        
        if not property_data.get("found"):
            raise HTTPException(
                status_code=404,
                detail=f"Property not found: {property_data.get('message', 'Unknown error')}"
            )
        
        # Get AI-powered rent estimation
        llm_service = await get_llm_service()
        ai_analysis = await llm_service.estimate_monthly_rent(property_data)
        
        if not ai_analysis.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"AI analysis failed: {ai_analysis.get('error', 'Unknown error')}"
            )
        
        return {
            "success": True,
            "property": {
                "address": property_data.get("full_address"),
                "postcode": postcode,
                "property_type": property_data.get("property_type"),
                "bedrooms": property_data.get("bedrooms"),
                "bathrooms": property_data.get("bathrooms"),
                "floor_area_sqm": property_data.get("floor_area_sqm"),
            },
            "ai_estimate": {
                "monthly_rent": ai_analysis.get("estimated_rent"),
                "rent_range": ai_analysis.get("rent_range", {}),
                "confidence": ai_analysis.get("confidence"),
                "reasoning": ai_analysis.get("reasoning"),
                "factors": ai_analysis.get("factors", {}),
                "market_comparison": ai_analysis.get("market_comparison"),
                "recommendations": ai_analysis.get("recommendations", []),
                "price_per_sqm": ai_analysis.get("price_per_sqm"),
                "model_used": ai_analysis.get("model_used"),
            },
            "source": "AI-Powered Analysis (OpenAI + data.street.co.uk)"
        }
        
    except ValueError as e:
        # API key not configured
        error_msg = str(e)
        if "OPENAI_API_KEY" in error_msg:
            raise HTTPException(
                status_code=500,
                detail="OPENAI_API_KEY not configured. Please add your OpenAI API key to .env file."
            )
        elif "DATA_STREET_API_KEY" in error_msg:
            raise HTTPException(
                status_code=500,
                detail="DATA_STREET_API_KEY not configured. Please add your data.street API key to .env file."
            )
        else:
            raise HTTPException(status_code=500, detail=str(e))
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error estimating rent: {str(e)}"
        )


@router.get("/sold-prices")
async def get_sold_prices(
    postcode: str = Query(..., description="UK postcode (e.g., 'SO15 2JS')"),
    limit: int = Query(100, description="Maximum number of results"),
    months_back: int = Query(24, description="Months of history to fetch"),
):
    """
    📊 Get actual sold property prices for a postcode
    
    Returns official HM Land Registry data showing real transaction prices.
    This is the gold standard for UK property valuations!
    
    **Example:**
    ```
    GET /api/v1/land-registry/sold-prices?postcode=SO15%202JS&limit=50
    ```
    
    **Returns:**
    - Address
    - Sale price
    - Sale date
    - Property type
    - New build status
    """
    try:
        service = await get_land_registry_service()
        sold_properties = await service.get_sold_prices_by_postcode(
            postcode=postcode,
            limit=limit,
            months_back=months_back,
        )
        
        return {
            "success": True,
            "postcode": postcode,
            "total_results": len(sold_properties),
            "time_period": f"Last {months_back} months",
            "data": sold_properties,
            "source": "HM Land Registry (Official UK Government Data)",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching sold prices: {str(e)}"
        )


@router.get("/area-stats")
async def get_area_statistics(
    postcode: str = Query(..., description="UK postcode"),
    property_type: Optional[str] = Query(None, description="Filter by property type (e.g., 'Flat', 'Terraced')"),
):
    """
    📈 Get market statistics for a postcode area
    
    Returns comprehensive statistics including:
    - Average and median prices
    - Price ranges (min/max)
    - Property type breakdown
    - Recent sales
    
    **Example:**
    ```
    GET /api/v1/land-registry/area-stats?postcode=SO15%202JS&property_type=Flat
    ```
    """
    try:
        service = await get_land_registry_service()
        stats = await service.get_area_statistics(
            postcode=postcode,
            property_type=property_type,
        )
        
        return {
            "success": True,
            "data": stats,
            "source": "HM Land Registry",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching area statistics: {str(e)}"
        )


@router.post("/valuation-pack")
async def generate_valuation_pack(request: ValuationPackRequest):
    """
    📦 Generate Comprehensive Valuation Pack
    
    This endpoint generates a complete valuation report as described in the blueprint:
    - Property value estimates based on real sold prices
    - Comparable properties (actual sales)
    - Market statistics and trends
    - Recommended valuation range
    - Data quality indicators
    
    **Example Request:**
    ```json
    {
        "postcode": "SO15 2JS",
        "property_type": "Flat",
        "bedrooms": 2
    }
    ```
    
    **Returns:**
    A comprehensive valuation report with:
    - Valuation summary (avg price, median, recommended range)
    - Market trend (increasing/decreasing/stable)
    - Top 15 comparable sales
    - Area statistics
    - Confidence level
    
    **Perfect for:**
    - Landlord valuations
    - Property appraisals
    - Market analysis
    - Client presentations
    """
    try:
        service = await get_land_registry_service()
        
        # Get property asking_price as fallback if property_id is provided
        asking_price_fallback = request.asking_price
        # Note: We can't use get_db() directly here since it's a dependency
        # The asking_price should be passed from the frontend, which we now do
        
        valuation_pack = await service.generate_valuation_pack(
            postcode=request.postcode,
            property_type=request.property_type,
            bedrooms=request.bedrooms,
            asking_price_fallback=asking_price_fallback,
        )
        
        return {
            "success": True,
            "data": valuation_pack,
            "message": "Valuation pack generated successfully",
            "source": "HM Land Registry (Official UK Government Data)",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating valuation pack: {str(e)}"
        )


@router.get("/search-by-town")
async def search_by_town(
    town: str = Query(..., description="Town or city name (e.g., 'Southampton')"),
    property_type: Optional[str] = Query(None, description="Property type filter"),
    min_price: Optional[float] = Query(None, description="Minimum price (£)"),
    max_price: Optional[float] = Query(None, description="Maximum price (£)"),
    limit: int = Query(50, description="Maximum results"),
):
    """
    🔍 Search sold properties by town/city
    
    Search for recently sold properties in a specific town or city.
    
    **Example:**
    ```
    GET /api/v1/land-registry/search-by-town?town=Southampton&property_type=Flat&min_price=150000&max_price=300000
    ```
    """
    try:
        service = await get_land_registry_service()
        properties = await service.search_by_town(
            town=town,
            property_type=property_type,
            min_price=min_price,
            max_price=max_price,
            limit=limit,
        )
        
        return {
            "success": True,
            "town": town,
            "filters": {
                "property_type": property_type,
                "min_price": min_price,
                "max_price": max_price,
            },
            "total_results": len(properties),
            "data": properties,
            "source": "HM Land Registry",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching properties: {str(e)}"
        )


@router.get("/health")
async def land_registry_health_check():
    """
    ✅ Check Land Registry API connectivity
    
    Verifies that the service is working.
    No API key required - this is free government data!
    """
    try:
        service = await get_land_registry_service()
        # Test with a simple query
        test_result = await service.get_sold_prices_by_postcode("SW1A 1AA", limit=1, months_back=1)
        
        return {
            "success": True,
            "message": "HM Land Registry API is ready",
            "api_key_required": False,
            "cost": "FREE",
            "test_query": "Success" if test_result is not None else "Failed",
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}",
        }

