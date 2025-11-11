"""
Valuation Service for AI-Powered Property Valuation Packs

Generates comprehensive sales and lettings valuation reports using LLM analysis
"""

import httpx
import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from app.core.config import settings
from app.services.llm_service import LLMService, get_llm_service
from app.models.property import Property
from app.models.valuation import Valuation, ComparableSale
from app.schemas.valuation import ValuationCreate, ComparableSaleCreate


class ValuationService:
    """
    Service for generating AI-powered property valuation packs
    
    Features:
    - Automated sales valuation packs with market analysis
    - Comparable property analysis
    - Pricing strategy recommendations
    - Comprehensive valuation reasoning
    """
    
    def __init__(self, llm_service: LLMService):
        self.llm_service = llm_service
        self.model = "gpt-4o"  # Using the same model as existing LLM service
        
    async def generate_sales_valuation_pack(self, property_data: Dict[str, Any], 
                                          comparables: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generate comprehensive sales valuation pack as shown in blueprint pages 42-46
        
        Args:
            property_data: Complete property data
            comparables: List of comparable property sales
            
        Returns:
            Structured valuation pack with market analysis and recommendations
        """
        
        if not property_data:
            return {
                "success": False,
                "error": "No property data provided",
                "valuation": None
            }
        
        try:
            prompt = self._build_sales_valuation_prompt(property_data, comparables)
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.llm_service.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.llm_service.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {
                                "role": "system",
                                "content": """You are an expert UK property valuer with 20+ years of experience 
specializing in residential sales valuations. You provide comprehensive, data-driven 
valuation packs that include market analysis, comparable properties, and strategic 
pricing recommendations. Your analysis follows the exact format shown in the CRM blueprint."""
                            },
                            {
                                "role": "user", 
                                "content": prompt
                            }
                        ],
                        "temperature": 0.2,  # More deterministic for valuations
                        "response_format": {"type": "json_object"}
                    }
                )
                
                if response.status_code != 200:
                    error_detail = f"LLM API error: {response.status_code}"
                    quota_exceeded = False
                    try:
                        error_data = response.json()
                        if "error" in error_data:
                            error_msg = error_data['error'].get('message', error_detail)
                            error_detail = f"LLM API error: {error_msg}"
                            # Check if it's a quota/billing error
                            if "quota" in error_msg.lower() or "billing" in error_msg.lower() or "exceeded" in error_msg.lower():
                                quota_exceeded = True
                    except:
                        pass
                    
                    if response.status_code == 401:
                        error_detail = "OpenAI API key is missing or invalid. Please check your OPENAI_API_KEY in the .env file."
                    
                    # If quota exceeded, return mock data for development
                    if quota_exceeded:
                        return {
                            "success": True,
                            "valuation": self._generate_mock_valuation(property_data, comparables),
                            "processing_time": 0,
                            "model_used": "mock (quota exceeded)",
                            "warning": "Using mock data due to OpenAI API quota exceeded. Please add credits to your OpenAI account."
                        }
                    
                    return {
                        "success": False,
                        "error": error_detail,
                        "valuation": None
                    }
                
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                valuation_data = json.loads(content)
                
                return {
                    "success": True,
                    "valuation": self._format_valuation_response(valuation_data, property_data),
                    "processing_time": result.get("usage", {}).get("total_tokens", 0),
                    "model_used": self.model
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Valuation generation error: {str(e)}",
                "valuation": None
            }
    
    def _build_sales_valuation_prompt(self, property_data: Dict[str, Any], 
                                    comparables: List[Dict[str, Any]] = None) -> str:
        """Build comprehensive sales valuation prompt following blueprint format"""
        
        # Extract property details
        address = property_data.get('full_address', 'Unknown address')
        postcode = property_data.get('postcode', 'Unknown postcode')
        property_type = property_data.get('property_type', 'Unknown')
        bedrooms = property_data.get('bedrooms', 'Not specified')
        bathrooms = property_data.get('bathrooms', 'Not specified')
        floor_area = property_data.get('floor_area_sqm', 'Not specified')
        tenure = property_data.get('tenure', 'Not specified')
        
        # Build comparables section
        comparables_text = ""
        if comparables:
            for i, comp in enumerate(comparables[:5], 1):
                comparables_text += f"""
{i}. {comp.get('address', 'Unknown address')}
   - Price: £{comp.get('sale_price', 'N/A'):,}
   - Date: {comp.get('sale_date', 'N/A')}
   - Beds/Baths: {comp.get('bedrooms', 'N/A')}/{comp.get('bathrooms', 'N/A')}
   - Type: {comp.get('property_type', 'N/A')}
   - Distance: {comp.get('distance_km', 'N/A')}km
"""
        else:
            comparables_text = "No comparable sales data available"
        
        prompt = f"""Generate a comprehensive sales valuation pack for this property.

## SUBJECT PROPERTY DETAILS

**Address:** {address}
**Postcode:** {postcode}
**Property Type:** {property_type}
**Bedrooms:** {bedrooms}
**Bathrooms:** {bathrooms}
**Floor Area:** {floor_area} m²
**Tenure:** {tenure}

## COMPARABLE SALES ANALYSIS

{comparables_text}

## VALUATION REQUIREMENTS

Provide a comprehensive valuation in JSON format following this exact structure:

{{
    "valuation_analysis": {{
        "subject_property_details": {{
            "address": "{address}",
            "property_type": "{property_type}",
            "bedrooms": {bedrooms},
            "bathrooms": {bathrooms}
        }},
        "comparable_sales_analysis": {{
            "recent_sales": [
                {{
                    "address": "Comparable property address",
                    "sale_price": 250000,
                    "sale_date": "2024-01-15",
                    "bedrooms": 2,
                    "bathrooms": 1,
                    "key_differences": "List differences from subject property"
                }}
            ],
            "key_takeaways": "Summary of comparable analysis"
        }},
        "active_market_comparables": [
            {{
                "address": "Currently listed property",
                "asking_price": 275000,
                "bedrooms": 2,
                "bathrooms": 2,
                "key_features": "Modern kitchen, parking"
            }}
        ],
        "recommended_valuation": {{
            "price_range": {{
                "quick_sale": 205000,
                "balanced": 220000,
                "aspirational": 240000
            }},
            "recommended_marketing_price": 220000,
            "pricing_strategy": "Guide Price"
        }},
        "valuation_logic": {{
            "comparable_property_analysis": "Detailed analysis of comparable sales",
            "premium_factors": ["En-suite bathrooms", "Modern build", "Parking"],
            "location_analysis": "Analysis of location advantages",
            "market_conditions": "Current market trends and conditions"
        }},
        "conclusion": "Overall valuation conclusion and recommendations"
    }},
    "executive_summary": "Brief summary of valuation and key recommendations",
    "confidence_level": "high",
    "key_recommendations": [
        "Marketing strategy suggestions",
        "Property presentation advice",
        "Target buyer profile"
    ]
}}

Consider:
- Current UK property market conditions and interest rate environment
- Local market trends in the area
- Property-specific advantages and limitations
- Buyer demand patterns for this property type
- Impact of location, transport links, and local amenities
- Construction age, condition, and modern features
- Competitive landscape and pricing strategy"""

        return prompt
    
    def _format_valuation_response(self, valuation_data: Dict[str, Any], 
                                 property_data: Dict[str, Any]) -> Dict[str, Any]:
        """Format the LLM response into structured valuation data"""
        
        analysis = valuation_data.get("valuation_analysis", {})
        recommended = analysis.get("recommended_valuation", {})
        price_range = recommended.get("price_range", {})
        
        return {
            "estimated_value": recommended.get("recommended_marketing_price"),
            "value_range_min": price_range.get("balanced", price_range.get("quick_sale")),
            "value_range_max": price_range.get("aspirational"),
            "confidence": valuation_data.get("confidence_level", "medium"),
            "market_conditions": analysis.get("valuation_logic", {}).get("market_conditions", ""),
            "comparable_properties": analysis.get("comparable_sales_analysis", {}).get("recent_sales", []),
            "key_factors": {
                "positive": analysis.get("valuation_logic", {}).get("premium_factors", []),
                "negative": [],
                "neutral": []
            },
            "recommended_price": recommended.get("recommended_marketing_price"),
            "pricing_strategy": recommended.get("pricing_strategy", "Guide Price"),
            "recommendations": valuation_data.get("key_recommendations", []),
            "property_advantages": analysis.get("valuation_logic", {}).get("location_analysis", ""),
            "property_limitations": "",
            "location_analysis": analysis.get("valuation_logic", {}).get("location_analysis", ""),
            "executive_summary": valuation_data.get("executive_summary", "")
        }
    
    async def find_comparable_sales(self, property_data: Dict[str, Any], 
                                  radius_km: float = 5.0, 
                                  max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Find comparable property sales for valuation analysis
        
        Args:
            property_data: Subject property data
            radius_km: Search radius in kilometers
            max_results: Maximum number of comparables to return
            
        Returns:
            List of comparable property sales
        """
        # This would integrate with land registry service or external APIs
        # For now, return mock data structure
        return [
            {
                "address": "6 Moore Close, SO15 2RS",
                "sale_price": 210000,
                "sale_date": "2024-01-19",
                "bedrooms": 2,
                "bathrooms": 1,
                "property_type": "Flat",
                "distance_km": 0.1,
                "price_per_sqft": 450.50
            }
        ]
    
    def _generate_mock_valuation(self, property_data: Dict[str, Any], 
                                comparables: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generate mock valuation data when API quota is exceeded
        Useful for development and testing
        """
        # Calculate estimated value based on property data
        bedrooms = property_data.get('bedrooms', 2)
        property_type = property_data.get('property_type', 'Unknown')
        
        # Base price per bedroom (rough UK averages)
        base_price_per_bedroom = {
            'Flat': 120000,
            'House': 150000,
            'Terraced': 140000,
            'Semi-Detached': 180000,
            'Detached': 250000
        }
        
        base_price = base_price_per_bedroom.get(property_type, 150000)
        estimated_value = base_price * bedrooms
        
        # Add some variation
        value_range_min = int(estimated_value * 0.85)
        value_range_max = int(estimated_value * 1.15)
        
        return {
            "estimated_value": estimated_value,
            "value_range_min": value_range_min,
            "value_range_max": value_range_max,
            "confidence": "medium",
            "market_conditions": "Current market conditions suggest stable pricing. Note: This is mock data generated due to API quota limitations.",
            "comparable_properties": comparables or [],
            "key_factors": {
                "positive": [
                    f"{bedrooms} bedrooms",
                    property_type,
                    "Good location"
                ],
                "negative": [],
                "neutral": []
            },
            "recommended_price": estimated_value,
            "pricing_strategy": "Guide Price",
            "recommendations": [
                "This is mock valuation data. Add credits to your OpenAI account for AI-powered analysis.",
                "Consider professional valuation for accurate pricing.",
                "Review local market trends and comparable sales."
            ],
            "property_advantages": f"Property features {bedrooms} bedrooms and is a {property_type}.",
            "property_limitations": "Mock data - real analysis requires API access.",
            "location_analysis": "Location analysis unavailable in mock mode.",
            "executive_summary": f"Estimated value: £{estimated_value:,} (mock data). Add OpenAI credits for AI-powered valuation analysis."
        }


# Singleton instance
_valuation_service: Optional[ValuationService] = None


async def get_valuation_service() -> ValuationService:
    """Get or create valuation service instance"""
    global _valuation_service
    if _valuation_service is None:
        llm_service = await get_llm_service()
        _valuation_service = ValuationService(llm_service)
    return _valuation_service

