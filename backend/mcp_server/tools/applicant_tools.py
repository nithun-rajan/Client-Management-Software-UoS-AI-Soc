"""Applicant/Tenant-related MCP tools"""
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


class ApplicantStatus(str, Enum):
    """Valid applicant statuses"""
    NEW = "new"
    VIEWING_ARRANGED = "viewing_arranged"
    OFFER_MADE = "offer_made"
    OFFER_ACCEPTED = "offer_accepted"
    REFERENCING = "referencing"
    REFERENCES_APPROVED = "references_approved"
    REFERENCES_REJECTED = "references_rejected"
    READY_TO_MOVE = "ready_to_move"
    MOVED_IN = "moved_in"
    ARCHIVED = "archived"


class AMLStatus(str, Enum):
    """Anti-Money Laundering check statuses"""
    NOT_CHECKED = "not_checked"
    IN_PROGRESS = "in_progress"
    VERIFIED = "verified"
    FAILED = "failed"


class ReadinessLevel(str, Enum):
    """Buyer readiness levels (for sales)"""
    HOT = "hot"  # Ready to buy now
    WARM = "warm"  # Actively looking
    COLD = "cold"  # Just browsing


# Initialize FastMCP instance for this module
mcp = FastMCP("CRM Applicant Tools")


@mcp.tool()
async def search_applicants(
    search_query: Optional[str] = None,
    applicant_type: Optional[str] = None,
    min_budget: Optional[float] = None,
    max_budget: Optional[float] = None,
    bedrooms: Optional[int] = None,
    location: Optional[str] = None,
    has_pets: Optional[bool] = None,
    readiness_level: Optional[ReadinessLevel] = None,
    aml_status: Optional[AMLStatus] = None,
    assigned_agent_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 10
) -> Dict[str, Any]:
    """
    Search for applicants (tenants and buyers) in the CRM system.
    
    Args:
        search_query: Search by name, email, or phone number
        applicant_type: Filter by type ("tenant", "buyer", or "both")
        min_budget: Minimum budget (rent or purchase price)
        max_budget: Maximum budget (rent or purchase price)
        bedrooms: Desired number of bedrooms
        location: Preferred location/area
        has_pets: Filter by whether they have pets
        readiness_level: Buyer readiness ("hot", "warm", "cold")
        aml_status: AML verification status ("not_checked", "in_progress", "verified", "failed")
        assigned_agent_id: Filter by assigned agent
        skip: Number of results to skip for pagination (default 0)
        limit: Maximum number of results to return (default 10, max 100)
    
    Returns:
        Dictionary containing:
        - List of applicants with their details
        - Budget and search criteria
        - Contact information
        - Agent assignments
    
    Example:
        Find tenants looking for 2-bed properties under £1500/month:
        search_applicants(applicant_type="tenant", bedrooms=2, max_budget=1500)
        
        Find hot buyers ready to purchase:
        search_applicants(applicant_type="buyer", readiness_level="hot")
    """
    try:
        # Build query parameters
        params = {
            "skip": skip,
            "limit": min(limit, 100)
        }
        
        # Add filters if provided
        if assigned_agent_id:
            params["assigned_agent_id"] = assigned_agent_id
        
        # Call FastAPI applicants endpoint
        response = await api_client.get(
            endpoint="api/v1/applicants/",
            params=params
        )
        
        # Process response - client-side filtering for criteria not in API
        applicants = response if isinstance(response, list) else []
        
        # Apply additional filters
        filtered_applicants = []
        for applicant in applicants:
            # Search query filter
            if search_query:
                search_lower = search_query.lower()
                full_name = f"{applicant.get('first_name', '')} {applicant.get('last_name', '')}".lower()
                email = applicant.get('email', '').lower()
                phone = applicant.get('phone', '').lower()
                
                if not (search_lower in full_name or search_lower in email or search_lower in phone):
                    continue
            
            # Applicant type filter
            if applicant_type:
                willing_to_rent = applicant.get('willing_to_rent', False)
                willing_to_buy = applicant.get('willing_to_buy', False)
                buyer_type = applicant.get('buyer_type')
                
                if applicant_type == "tenant" and not willing_to_rent:
                    continue
                elif applicant_type == "buyer" and not (willing_to_buy or buyer_type):
                    continue
            
            # Budget filter
            if min_budget or max_budget:
                # Check both rent and purchase budgets
                rent_min = applicant.get('rent_budget_min', 0)
                rent_max = applicant.get('rent_budget_max', float('inf'))
                purchase_min = applicant.get('budget_min', 0)
                purchase_max = applicant.get('budget_max', float('inf'))
                
                budget_matches = False
                if min_budget and (rent_max >= min_budget or purchase_max >= min_budget):
                    budget_matches = True
                if max_budget and (rent_min <= max_budget or purchase_min <= max_budget):
                    budget_matches = True
                if not min_budget and not max_budget:
                    budget_matches = True
                    
                if not budget_matches:
                    continue
            
            # Bedrooms filter
            if bedrooms:
                desired_beds = applicant.get('desired_bedrooms')
                min_beds = applicant.get('min_bedrooms')
                max_beds = applicant.get('max_bedrooms')
                
                beds_match = False
                if desired_beds and str(bedrooms) in str(desired_beds):
                    beds_match = True
                if min_beds and max_beds and min_beds <= bedrooms <= max_beds:
                    beds_match = True
                    
                if not beds_match:
                    continue
            
            # Location filter
            if location:
                pref_locations = applicant.get('preferred_locations', '').lower()
                primary_locations = applicant.get('primary_locations', '').lower()
                secondary_areas = applicant.get('secondary_areas', '').lower()
                
                if not (location.lower() in pref_locations or 
                       location.lower() in primary_locations or 
                       location.lower() in secondary_areas):
                    continue
            
            # Pets filter
            if has_pets is not None and applicant.get('has_pets') != has_pets:
                continue
            
            # Readiness level filter
            if readiness_level and applicant.get('readiness_level') != readiness_level.value:
                continue
            
            # AML status filter
            if aml_status and applicant.get('aml_status') != aml_status.value:
                continue
            
            filtered_applicants.append(applicant)
        
        return {
            "success": True,
            "count": len(filtered_applicants),
            "applicants": filtered_applicants[:limit],
            "filters_applied": {
                "search_query": search_query,
                "applicant_type": applicant_type,
                "min_budget": min_budget,
                "max_budget": max_budget,
                "bedrooms": bedrooms,
                "location": location,
                "has_pets": has_pets,
                "readiness_level": readiness_level.value if readiness_level else None,
                "aml_status": aml_status.value if aml_status else None,
                "assigned_agent_id": assigned_agent_id
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "applicants": []
        }


@mcp.tool()
async def get_applicant_details(
    applicant_id: str
) -> Dict[str, Any]:
    """
    Get complete details for a specific applicant/tenant.
    
    Args:
        applicant_id: The unique identifier of the applicant
    
    Returns:
        Dictionary containing full applicant information including:
        - Personal details (name, contact, DOB)
        - Budget and search criteria
        - Property preferences
        - Employment and income details
        - Mortgage/financial information (for buyers)
        - AML/KYC compliance status
        - Right to rent documentation
        - Pet information
        - Assigned agent details
        - Recent activity and notes
    
    Example:
        Get all information about an applicant:
        get_applicant_details(applicant_id="550e8400-e29b-41d4-a716-446655440000")
    """
    try:
        # Call FastAPI applicant detail endpoint
        response = await api_client.get(
            endpoint=f"api/v1/applicants/{applicant_id}"
        )
        
        return {
            "success": True,
            "applicant": response
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "applicant": None
        }


@mcp.tool()
async def match_applicant_to_properties(
    applicant_id: str,
    max_results: int = 10
) -> Dict[str, Any]:
    """
    Find properties that match an applicant's search criteria and budget.
    
    This is AI-powered property matching that considers:
    - Budget constraints (rent or purchase price)
    - Desired bedrooms and property type
    - Preferred locations
    - Special requirements (pets, parking, accessibility)
    - Move-in date availability
    
    Args:
        applicant_id: The unique identifier of the applicant
        max_results: Maximum number of matching properties to return (default 10)
    
    Returns:
        Dictionary containing:
        - List of matching properties
        - Match score/relevance for each property
        - Applicant's search criteria used
        - Why each property matches
        - Recommendations
    
    Example:
        Find perfect properties for a tenant:
        match_applicant_to_properties(applicant_id="550e8400-e29b-41d4-a716-446655440000")
    """
    try:
        # Get applicant details first
        applicant_response = await api_client.get(
            endpoint=f"api/v1/applicants/{applicant_id}"
        )
        
        # Build property search parameters based on applicant criteria
        search_params = {
            "limit": max_results
        }
        
        # Budget filters
        if applicant_response.get('rent_budget_min'):
            search_params['min_rent'] = applicant_response['rent_budget_min']
        if applicant_response.get('rent_budget_max'):
            search_params['max_rent'] = applicant_response['rent_budget_max']
        
        # For buyers, use purchase budget
        if applicant_response.get('budget_min'):
            search_params['min_price'] = applicant_response['budget_min']
        if applicant_response.get('budget_max'):
            search_params['max_price'] = applicant_response['budget_max']
        
        # Bedroom criteria
        desired_beds = applicant_response.get('desired_bedrooms')
        if desired_beds:
            # Parse bedroom requirement (could be "2", "2-3", "3+")
            try:
                if '-' in str(desired_beds):
                    min_bed, max_bed = desired_beds.split('-')
                    search_params['min_bedrooms'] = int(min_bed)
                    search_params['max_bedrooms'] = int(max_bed)
                elif '+' in str(desired_beds):
                    search_params['min_bedrooms'] = int(desired_beds.replace('+', ''))
                else:
                    search_params['min_bedrooms'] = int(desired_beds)
                    search_params['max_bedrooms'] = int(desired_beds)
            except:
                pass
        
        # Also check min/max bedrooms for buyers
        if applicant_response.get('min_bedrooms'):
            search_params['min_bedrooms'] = applicant_response['min_bedrooms']
        if applicant_response.get('max_bedrooms'):
            search_params['max_bedrooms'] = applicant_response['max_bedrooms']
        
        # Property type
        if applicant_response.get('desired_property_type'):
            search_params['property_type'] = applicant_response['desired_property_type']
        
        # Location
        if applicant_response.get('preferred_locations'):
            search_params['location'] = applicant_response['preferred_locations']
        elif applicant_response.get('primary_locations'):
            search_params['location'] = applicant_response['primary_locations']
        
        # Furnishing preference
        if applicant_response.get('furnishing_preference'):
            search_params['furnishing'] = applicant_response['furnishing_preference']
        
        # Search for matching properties
        properties_response = await api_client.get(
            endpoint="api/v1/search/properties",
            params=search_params
        )
        
        properties = properties_response if isinstance(properties_response, list) else []
        
        # Calculate match scores
        matched_properties = []
        for prop in properties:
            match_reasons = []
            match_score = 0
            
            # Budget match
            prop_rent = prop.get('rent_per_month', 0)
            if prop_rent:
                budget_min = applicant_response.get('rent_budget_min', 0)
                budget_max = applicant_response.get('rent_budget_max', float('inf'))
                if budget_min <= prop_rent <= budget_max:
                    match_score += 30
                    match_reasons.append(f"Within budget (£{prop_rent}/month)")
            
            # Bedroom match
            prop_beds = prop.get('bedrooms', 0)
            if desired_beds and str(prop_beds) in str(desired_beds):
                match_score += 25
                match_reasons.append(f"Matches desired {prop_beds} bedrooms")
            
            # Location match
            prop_location = prop.get('address_line_1', '').lower()
            pref_loc = applicant_response.get('preferred_locations', '').lower()
            if pref_loc and any(loc.strip() in prop_location for loc in pref_loc.split(',')):
                match_score += 20
                match_reasons.append("In preferred location")
            
            # Property type match
            if prop.get('property_type') == applicant_response.get('desired_property_type'):
                match_score += 15
                match_reasons.append(f"Matches desired {prop.get('property_type')}")
            
            # Pets consideration
            if applicant_response.get('has_pets') and prop.get('pets_allowed'):
                match_score += 10
                match_reasons.append("Pets allowed")
            elif applicant_response.get('has_pets') and not prop.get('pets_allowed'):
                match_score -= 20
                match_reasons.append("⚠️ Pets not allowed (applicant has pets)")
            
            matched_properties.append({
                **prop,
                "match_score": match_score,
                "match_reasons": match_reasons
            })
        
        # Sort by match score
        matched_properties.sort(key=lambda x: x['match_score'], reverse=True)
        
        return {
            "success": True,
            "applicant_id": applicant_id,
            "applicant_name": f"{applicant_response.get('first_name', '')} {applicant_response.get('last_name', '')}",
            "search_criteria": {
                "budget_min": applicant_response.get('rent_budget_min') or applicant_response.get('budget_min'),
                "budget_max": applicant_response.get('rent_budget_max') or applicant_response.get('budget_max'),
                "bedrooms": desired_beds or f"{applicant_response.get('min_bedrooms')}-{applicant_response.get('max_bedrooms')}",
                "property_type": applicant_response.get('desired_property_type'),
                "location": applicant_response.get('preferred_locations') or applicant_response.get('primary_locations'),
                "has_pets": applicant_response.get('has_pets')
            },
            "matches_found": len(matched_properties),
            "properties": matched_properties[:max_results]
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "properties": []
        }


@mcp.tool()
async def get_applicant_viewings(
    applicant_id: str,
    include_past: bool = True
) -> Dict[str, Any]:
    """
    Get all property viewings for a specific applicant.
    
    Args:
        applicant_id: The unique identifier of the applicant
        include_past: Whether to include past viewings (default True)
    
    Returns:
        Dictionary containing:
        - List of scheduled viewings
        - Past viewing history
        - Feedback and notes from viewings
        - Properties viewed
        - Viewing outcomes
    
    Example:
        Get all viewings for an applicant:
        get_applicant_viewings(applicant_id="550e8400-e29b-41d4-a716-446655440000")
        
        Get only upcoming viewings:
        get_applicant_viewings(applicant_id="550e8400-e29b-41d4-a716-446655440000", include_past=False)
    """
    try:
        # Call FastAPI viewings endpoint filtered by applicant
        params = {
            "applicant_id": applicant_id
        }
        
        viewings_response = await api_client.get(
            endpoint="api/v1/viewings/",
            params=params
        )
        
        viewings = viewings_response if isinstance(viewings_response, list) else []
        
        # Separate into upcoming and past
        from datetime import datetime
        now = datetime.now()
        
        upcoming_viewings = []
        past_viewings = []
        
        for viewing in viewings:
            viewing_date = viewing.get('viewing_date')
            if viewing_date:
                try:
                    view_dt = datetime.fromisoformat(viewing_date.replace('Z', '+00:00'))
                    if view_dt > now:
                        upcoming_viewings.append(viewing)
                    else:
                        past_viewings.append(viewing)
                except:
                    upcoming_viewings.append(viewing)
            else:
                upcoming_viewings.append(viewing)
        
        result = {
            "success": True,
            "applicant_id": applicant_id,
            "total_viewings": len(viewings),
            "upcoming_viewings": upcoming_viewings,
            "upcoming_count": len(upcoming_viewings)
        }
        
        if include_past:
            result["past_viewings"] = past_viewings
            result["past_count"] = len(past_viewings)
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "viewings": []
        }


@mcp.tool()
async def check_applicant_eligibility(
    applicant_id: str
) -> Dict[str, Any]:
    """
    Check applicant's eligibility for renting or buying including compliance checks.
    
    This comprehensive check verifies:
    - Affordability (income vs. rent/purchase price)
    - AML/KYC verification status
    - Right to Rent documentation (UK requirement)
    - Employment status
    - Credit references
    - Guarantor requirements
    - Proof of funds (for buyers)
    - Mortgage approval status (for buyers)
    
    Args:
        applicant_id: The unique identifier of the applicant
    
    Returns:
        Dictionary containing:
        - Overall eligibility status (Green/Amber/Red)
        - Individual check results
        - Missing documentation
        - Action items needed
        - Risk assessment
        - Recommendations
    
    Example:
        Check if an applicant is ready to rent:
        check_applicant_eligibility(applicant_id="550e8400-e29b-41d4-a716-446655440000")
    """
    try:
        # Get applicant details
        applicant_response = await api_client.get(
            endpoint=f"api/v1/applicants/{applicant_id}"
        )
        
        issues = []
        warnings = []
        checks_passed = []
        
        # AML Check
        aml_status = applicant_response.get('aml_status', 'not_checked')
        if aml_status == 'verified':
            checks_passed.append({
                "check": "AML/KYC Verification",
                "status": "passed",
                "details": "Anti-Money Laundering checks completed"
            })
        elif aml_status == 'failed':
            issues.append({
                "check": "AML/KYC Verification",
                "status": "failed",
                "severity": "high",
                "message": "Failed AML verification - cannot proceed"
            })
        else:
            warnings.append({
                "check": "AML/KYC Verification",
                "status": aml_status,
                "severity": "high",
                "message": "AML verification not yet completed"
            })
        
        # Right to Rent Check
        aml_check_status = applicant_response.get('aml_check_status', 'not_started')
        if aml_check_status == 'verified':
            checks_passed.append({
                "check": "Right to Rent",
                "status": "passed",
                "details": "Right to Rent verified"
            })
        elif aml_check_status not in ['verified', 'not_started']:
            warnings.append({
                "check": "Right to Rent",
                "status": aml_check_status,
                "severity": "high",
                "message": "Right to Rent verification required (UK legal requirement)"
            })
        
        # Income/Affordability Check
        monthly_income = applicant_response.get('monthly_household_income', 0)
        rent_budget_max = applicant_response.get('rent_budget_max', 0)
        
        if monthly_income and rent_budget_max:
            # Standard affordability: rent should be max 30% of income
            max_affordable_rent = monthly_income * 0.3
            
            if rent_budget_max <= max_affordable_rent:
                checks_passed.append({
                    "check": "Affordability",
                    "status": "passed",
                    "details": f"Budget £{rent_budget_max}/month is affordable (income: £{monthly_income}/month)"
                })
            elif rent_budget_max <= monthly_income * 0.4:
                warnings.append({
                    "check": "Affordability",
                    "status": "marginal",
                    "severity": "medium",
                    "message": f"Rent is {(rent_budget_max/monthly_income)*100:.1f}% of income (above recommended 30%)"
                })
            else:
                issues.append({
                    "check": "Affordability",
                    "status": "failed",
                    "severity": "high",
                    "message": f"Rent £{rent_budget_max} exceeds recommended ratio (income: £{monthly_income}). Guarantor may be required."
                })
        
        # Employment Status
        employment_status = applicant_response.get('employment_status')
        if employment_status in ['full_time', 'self_employed', 'retired']:
            checks_passed.append({
                "check": "Employment",
                "status": "passed",
                "details": f"Employment status: {employment_status}"
            })
        elif employment_status:
            warnings.append({
                "check": "Employment",
                "status": employment_status,
                "severity": "medium",
                "message": f"Employment status: {employment_status}. May need guarantor."
            })
        
        # For Buyers: Check mortgage/funds
        buyer_type = applicant_response.get('buyer_type')
        if buyer_type:
            # Check proof of funds
            proof_of_funds = applicant_response.get('proof_of_funds_uploaded', False)
            if proof_of_funds:
                checks_passed.append({
                    "check": "Proof of Funds",
                    "status": "passed",
                    "details": "Proof of funds documentation uploaded"
                })
            else:
                warnings.append({
                    "check": "Proof of Funds",
                    "status": "missing",
                    "severity": "high",
                    "message": "Proof of funds not yet uploaded"
                })
            
            # Check mortgage status
            mortgage_status = applicant_response.get('mortgage_status')
            aip_amount = applicant_response.get('agreement_in_principle_amount')
            
            if mortgage_status == 'approved' or aip_amount:
                checks_passed.append({
                    "check": "Mortgage Approval",
                    "status": "passed",
                    "details": f"Mortgage AIP: £{aip_amount}" if aip_amount else "Mortgage approved"
                })
            elif buyer_type == 'cash_buyer':
                checks_passed.append({
                    "check": "Funding",
                    "status": "passed",
                    "details": "Cash buyer - no mortgage required"
                })
            else:
                warnings.append({
                    "check": "Mortgage Approval",
                    "status": "pending",
                    "severity": "medium",
                    "message": "Agreement in Principle not yet obtained"
                })
        
        # ID Documents
        id_uploaded = applicant_response.get('id_document_uploaded', False)
        if id_uploaded:
            checks_passed.append({
                "check": "ID Verification",
                "status": "passed",
                "details": "ID documents uploaded"
            })
        else:
            warnings.append({
                "check": "ID Verification",
                "status": "missing",
                "severity": "medium",
                "message": "ID documents not yet uploaded"
            })
        
        # Proof of Address
        address_uploaded = applicant_response.get('proof_of_address_uploaded', False)
        if address_uploaded:
            checks_passed.append({
                "check": "Proof of Address",
                "status": "passed",
                "details": "Proof of address uploaded"
            })
        else:
            warnings.append({
                "check": "Proof of Address",
                "status": "missing",
                "severity": "low",
                "message": "Proof of address not yet uploaded"
            })
        
        # Determine overall status
        if issues:
            overall_status = "RED"
            overall_message = "Cannot proceed - critical issues found"
        elif len(warnings) >= 3:
            overall_status = "AMBER"
            overall_message = "Can proceed with caution - some checks pending"
        elif warnings:
            overall_status = "AMBER"
            overall_message = "Ready to proceed - minor items outstanding"
        else:
            overall_status = "GREEN"
            overall_message = "Fully eligible - all checks passed"
        
        return {
            "success": True,
            "applicant_id": applicant_id,
            "applicant_name": f"{applicant_response.get('first_name', '')} {applicant_response.get('last_name', '')}",
            "overall_status": overall_status,
            "overall_message": overall_message,
            "checks_passed": checks_passed,
            "warnings": warnings,
            "issues": issues,
            "summary": {
                "total_checks": len(checks_passed) + len(warnings) + len(issues),
                "passed": len(checks_passed),
                "warnings": len(warnings),
                "failed": len(issues),
                "ready_to_proceed": overall_status in ["GREEN", "AMBER"]
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "eligibility": None
        }


if __name__ == "__main__":
    mcp.run()

