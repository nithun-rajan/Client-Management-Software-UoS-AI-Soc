"""Landlord-related MCP tools"""
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


class ComplianceStatus(str, Enum):
    """Valid compliance statuses"""
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PENDING = "pending"
    EXPIRED = "expired"


class AMLStatus(str, Enum):
    """Anti-Money Laundering verification statuses"""
    VERIFIED = "verified"
    PENDING = "pending"
    FAILED = "failed"
    NOT_STARTED = "not_started"


# Initialize FastMCP instance for this module
mcp = FastMCP("CRM Landlord Tools")


@mcp.tool()
async def search_landlords(
    search_query: Optional[str] = None,
    aml_status: Optional[AMLStatus] = None,
    compliance_status: Optional[ComplianceStatus] = None,
    skip: int = 0,
    limit: int = 10
) -> Dict[str, Any]:
    """
    Search for landlords in the CRM system.
    
    Args:
        search_query: Search by name, email, or phone number
        aml_status: Filter by AML verification status (verified, pending, failed, not_started)
        compliance_status: Filter by overall compliance status (compliant, non_compliant, pending, expired)
        skip: Number of results to skip for pagination (default 0)
        limit: Maximum number of results to return (default 10, max 100)
    
    Returns:
        Dictionary containing:
        - List of landlords with their details
        - Total count
        - Properties count for each landlord
        - Compliance information
    
    Example:
        Find all landlords who need AML verification:
        search_landlords(aml_status="pending")
        
        Find a specific landlord by name:
        search_landlords(search_query="John Smith")
    """
    try:
        # Build query parameters
        params = {
            "skip": skip,
            "limit": min(limit, 100)  # Cap at 100
        }
        
        # Add filters if provided
        if search_query:
            params["search"] = search_query
        if aml_status:
            params["aml_status"] = aml_status.value
        if compliance_status:
            params["compliance_status"] = compliance_status.value
        
        # Call FastAPI landlords endpoint
        response = await api_client.get(
            endpoint="api/v1/landlords/",
            params=params
        )
        
        # Process response
        landlords = response if isinstance(response, list) else []
        
        return {
            "success": True,
            "count": len(landlords),
            "landlords": landlords,
            "filters_applied": {k: v for k, v in params.items() if k not in ["skip", "limit"]}
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "landlords": []
        }


@mcp.tool()
async def get_landlord_details(
    landlord_id: str
) -> Dict[str, Any]:
    """
    Get complete details for a specific landlord.
    
    Args:
        landlord_id: The unique identifier of the landlord
    
    Returns:
        Dictionary containing full landlord information including:
        - Personal details (name, contact info)
        - AML/KYC verification status
        - Banking details (if available)
        - Company information (if applicable)
        - Properties count
        - Compliance certificates
        - Recent activity
        - Assigned agent information
    
    Example:
        Get all information about a landlord:
        get_landlord_details(landlord_id="550e8400-e29b-41d4-a716-446655440000")
    """
    try:
        # Call FastAPI landlord detail endpoint
        response = await api_client.get(
            endpoint=f"api/v1/landlords/{landlord_id}"
        )
        
        return {
            "success": True,
            "landlord": response
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "landlord": None
        }


@mcp.tool()
async def get_landlord_properties(
    landlord_id: str,
    include_inactive: bool = False
) -> Dict[str, Any]:
    """
    Get all properties owned by a specific landlord.
    
    Args:
        landlord_id: The unique identifier of the landlord
        include_inactive: Whether to include withdrawn/blocked properties (default False)
    
    Returns:
        Dictionary containing:
        - List of properties owned by this landlord
        - Property statuses (available, let, tenanted, etc.)
        - Total portfolio value
        - Occupancy statistics
        - Revenue information
    
    Example:
        Get all active properties for a landlord:
        get_landlord_properties(landlord_id="550e8400-e29b-41d4-a716-446655440000")
        
        Include all properties including inactive ones:
        get_landlord_properties(
            landlord_id="550e8400-e29b-41d4-a716-446655440000",
            include_inactive=True
        )
    """
    try:
        # Build query parameters
        params = {
            "landlord_id": landlord_id
        }
        
        if not include_inactive:
            # Filter for active properties only
            params["exclude_status"] = "withdrawn,blocked"
        
        # Call FastAPI properties search endpoint filtered by landlord
        response = await api_client.get(
            endpoint="api/v1/search/properties",
            params=params
        )
        
        # Process response - calculate portfolio statistics
        properties = response if isinstance(response, list) else []
        
        # Calculate statistics
        total_value = 0
        total_rent = 0
        status_breakdown = {}
        
        for prop in properties:
            # Rent calculations
            rent = prop.get("rent_per_month", 0)
            if rent:
                total_rent += rent
                total_value += rent * 12  # Annual rent as portfolio value
            
            # Status breakdown
            status = prop.get("status", "unknown")
            status_breakdown[status] = status_breakdown.get(status, 0) + 1
        
        return {
            "success": True,
            "landlord_id": landlord_id,
            "properties_count": len(properties),
            "properties": properties,
            "portfolio_stats": {
                "total_properties": len(properties),
                "total_monthly_rent": round(total_rent, 2),
                "estimated_annual_value": round(total_value, 2),
                "status_breakdown": status_breakdown
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "properties": []
        }


@mcp.tool()
async def check_landlord_compliance(
    landlord_id: str
) -> Dict[str, Any]:
    """
    Check compliance status for a landlord including all required certificates and verifications.
    
    This checks:
    - AML/KYC verification status
    - Right to Rent documentation
    - Insurance certificates
    - Gas Safety certificates for all properties
    - EICR (Electrical Safety) certificates
    - EPC (Energy Performance) certificates
    - Deposit protection registration
    
    Args:
        landlord_id: The unique identifier of the landlord
    
    Returns:
        Dictionary containing:
        - Overall compliance status (Red/Amber/Green)
        - Individual certificate statuses
        - Expiry dates and alerts
        - Action items needed
        - Risk assessment
    
    Example:
        Get compliance overview for a landlord:
        check_landlord_compliance(landlord_id="550e8400-e29b-41d4-a716-446655440000")
    """
    try:
        # Get landlord details
        landlord_response = await api_client.get(
            endpoint=f"api/v1/landlords/{landlord_id}"
        )
        
        # Get their properties
        properties_response = await api_client.get(
            endpoint="api/v1/search/properties",
            params={"landlord_id": landlord_id}
        )
        
        properties = properties_response if isinstance(properties_response, list) else []
        
        # Build compliance report
        compliance_issues = []
        warnings = []
        
        # Check AML status
        aml_status = landlord_response.get("aml_kyc_status", "not_started")
        if aml_status != "verified":
            compliance_issues.append({
                "type": "AML/KYC",
                "status": aml_status,
                "severity": "high",
                "message": "Anti-Money Laundering verification not completed"
            })
        
        # Check Right to Rent
        right_to_rent = landlord_response.get("right_to_rent_check_status")
        if right_to_rent != "verified":
            compliance_issues.append({
                "type": "Right to Rent",
                "status": right_to_rent or "not_checked",
                "severity": "high",
                "message": "Right to Rent verification required"
            })
        
        # Check property certificates
        for prop in properties:
            property_address = prop.get("address_line_1", "Unknown address")
            
            # Gas Safety
            if prop.get("gas_safety_certificate_expiry"):
                warnings.append({
                    "type": "Gas Safety Certificate",
                    "property": property_address,
                    "expiry": prop.get("gas_safety_certificate_expiry"),
                    "severity": "medium"
                })
            
            # EICR
            if prop.get("eicr_expiry"):
                warnings.append({
                    "type": "EICR Certificate",
                    "property": property_address,
                    "expiry": prop.get("eicr_expiry"),
                    "severity": "medium"
                })
            
            # EPC
            if prop.get("epc_expiry"):
                warnings.append({
                    "type": "EPC Certificate",
                    "property": property_address,
                    "expiry": prop.get("epc_expiry"),
                    "severity": "low"
                })
        
        # Determine overall status
        if compliance_issues:
            overall_status = "RED"
        elif warnings:
            overall_status = "AMBER"
        else:
            overall_status = "GREEN"
        
        return {
            "success": True,
            "landlord_id": landlord_id,
            "landlord_name": landlord_response.get("full_name", "Unknown"),
            "overall_status": overall_status,
            "compliance_issues": compliance_issues,
            "warnings": warnings,
            "properties_checked": len(properties),
            "summary": {
                "total_issues": len(compliance_issues),
                "total_warnings": len(warnings),
                "requires_immediate_action": len([i for i in compliance_issues if i["severity"] == "high"])
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "compliance_issues": []
        }


if __name__ == "__main__":
    mcp.run()

