"""Property-related MCP tools"""
from typing import Optional, List, Dict, Any
from enum import Enum
from fastmcp import FastMCP

# Use absolute import to support both direct execution and package import
import sys
from pathlib import Path

# Add parent directory to path for imports
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir))

from api_client import api_client


class PropertyType(str, Enum):
    """Valid property types in the system"""
    FLAT = "flat"
    HOUSE = "house"
    MAISONETTE = "maisonette"
    APARTMENT = "apartment"
    BUNGALOW = "bungalow"
    TERRACED = "terraced"
    SEMI_DETACHED = "semi-detached"
    DETACHED = "detached"
    STUDIO = "studio"


class PropertyStatus(str, Enum):
    """Valid property statuses"""
    AVAILABLE = "available"
    LET_AGREED = "let_agreed"
    LET_BY = "let_by"
    TENANTED = "tenanted"
    UNDER_OFFER = "under_offer"
    BLOCKED = "blocked"
    MAINTENANCE = "maintenance"
    WITHDRAWN = "withdrawn"


class FurnishingType(str, Enum):
    """Valid furnishing types"""
    FURNISHED = "furnished"
    UNFURNISHED = "unfurnished"
    PART_FURNISHED = "part-furnished"


# Initialize FastMCP instance for this module
mcp = FastMCP("CRM Property Tools")


@mcp.tool()
async def search_properties(
    property_type: Optional[PropertyType] = None,
    status: Optional[PropertyStatus] = None,
    min_bedrooms: Optional[int] = None,
    max_bedrooms: Optional[int] = None,
    min_rent: Optional[float] = None,
    max_rent: Optional[float] = None,
    location: Optional[str] = None,
    furnishing: Optional[FurnishingType] = None,
    min_square_footage: Optional[int] = None,
    max_square_footage: Optional[int] = None,
    available_from: Optional[str] = None,
    skip: int = 0,
    limit: int = 10
) -> Dict[str, Any]:
    """
    Search for properties based on various criteria.
    
    Args:
        property_type: Type of property (flat, house, maisonette, apartment, bungalow, terraced, semi-detached, detached, studio)
        status: Property status (available, let_agreed, let_by, tenanted, under_offer, blocked, maintenance, withdrawn)
        min_bedrooms: Minimum number of bedrooms (0 for studio)
        max_bedrooms: Maximum number of bedrooms
        min_rent: Minimum monthly rent in GBP
        max_rent: Maximum monthly rent in GBP
        location: Location to search (city, postcode, area name)
        furnishing: Furnishing status (furnished, unfurnished, part-furnished)
        min_square_footage: Minimum property size in square feet
        max_square_footage: Maximum property size in square feet
        available_from: Available from date (YYYY-MM-DD format)
        skip: Number of results to skip for pagination (default 0)
        limit: Maximum number of results to return (default 10)
    
    Returns:
        Dictionary containing list of properties and metadata
    """
    # Build query parameters
    params = {
        "skip": skip,
        "limit": limit
    }
    
    # Add optional filters (convert enums to their string values)
    if property_type:
        params["property_type"] = property_type.value
    if status:
        params["status"] = status.value
    if min_bedrooms is not None:
        params["min_bedrooms"] = min_bedrooms
    if max_bedrooms is not None:
        params["max_bedrooms"] = max_bedrooms
    if min_rent is not None:
        params["min_rent"] = min_rent
    if max_rent is not None:
        params["max_rent"] = max_rent
    if location:
        params["location"] = location
    if furnishing:
        params["furnishing"] = furnishing.value
    if min_square_footage is not None:
        params["min_square_footage"] = min_square_footage
    if max_square_footage is not None:
        params["max_square_footage"] = max_square_footage
    if available_from:
        params["available_from"] = available_from
    
    try:
        # Call FastAPI search endpoint
        response = await api_client.get(
            endpoint="api/v1/search/properties",
            params=params
        )
        
        return {
            "success": True,
            "count": len(response) if isinstance(response, list) else 0,
            "properties": response,
            "filters_applied": {k: v for k, v in params.items() if k not in ["skip", "limit"]}
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "properties": []
        }


@mcp.tool()
async def get_property_details(
    property_id: str
) -> Dict[str, Any]:
    """
    Get complete details for a specific property.
    
    Args:
        property_id: The unique identifier of the property
    
    Returns:
        Dictionary containing full property information including:
        - All property fields (address, bedrooms, rent, etc.)
        - Landlord information
        - Current tenancy status
        - Recent viewings
        - Compliance certificates
    """
    try:
        # Call FastAPI property detail endpoint
        response = await api_client.get(
            endpoint=f"api/v1/properties/{property_id}"
        )
        
        return {
            "success": True,
            "property": response
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "property": None
        }


@mcp.tool()
async def get_comparable_properties(
    property_id: str
) -> Dict[str, Any]:
    """
    Find similar properties for rent comparison and valuation purposes.
    
    This tool finds properties that are comparable based on:
    - Location (same area/postcode)
    - Property type (flat, house, etc.)
    - Number of bedrooms
    - Square footage
    
    Useful for rent estimation and market analysis.
    
    Args:
        property_id: The unique identifier of the property to find comparables for
    
    Returns:
        Dictionary containing:
        - List of comparable properties with their rent prices
        - Similarity scores
        - Market statistics
    """
    try:
        # Call FastAPI comparables endpoint
        response = await api_client.get(
            endpoint=f"api/v1/valuations/{property_id}/comparables"
        )
        
        return {
            "success": True,
            "comparable_properties": response
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "comparable_properties": []
        }

if __name__ == "__main__":
  mcp.run()
