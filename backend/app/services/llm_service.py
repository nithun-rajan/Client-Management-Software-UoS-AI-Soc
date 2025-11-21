"""
LLM Service for AI-Powered Property Analysis

Provides intelligent rent estimation and property insights using LLM
"""

import httpx
from typing import Dict, Any, Optional
from app.core.config import settings


class LLMService:
    """
    Service for LLM-powered property analysis
    
    Features:
    - Intelligent monthly rent estimation
    - Market analysis and reasoning
    - Property insights and recommendations
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not configured")
        
        self.base_url = "https://api.openai.com/v1"
        self.model = "gpt-4o-mini"  # Fast and cost-effective
        
    async def estimate_monthly_rent(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Estimate monthly rent for a property using AI analysis
        
        Args:
            property_data: Complete property data from data.street.co.uk
            
        Returns:
            {
                "estimated_rent": 1500,
                "confidence": "high",
                "reasoning": "...",
                "factors": {
                    "positive": [...],
                    "negative": [...],
                    "neutral": [...]
                },
                "market_comparison": "...",
                "recommendations": [...]
            }
        """
        
        # Validate property data
        if not property_data:
            return {
                "success": False,
                "error": "No property data provided",
                "estimated_rent": None
            }
        
        # Build comprehensive analysis prompt
        try:
            prompt = self._build_rent_estimation_prompt(property_data)
        except Exception as e:
            print(f"Error building prompt: {e}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": f"Error building prompt: {str(e)}",
                "estimated_rent": None
            }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {
                                "role": "system",
                                "content": """You are an expert UK property letting agent with 20+ years of experience. 
You specialize in accurate rent valuations based on comprehensive property data, market trends, 
and local area analysis. You provide detailed, justified recommendations that help agents 
price properties competitively while maximizing returns."""
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "temperature": 0.3,  # More deterministic for pricing
                        "response_format": {"type": "json_object"}
                    }
                )
                
                if response.status_code != 200:
                    return {
                        "error": f"LLM API error: {response.status_code}",
                        "estimated_rent": None
                    }
                
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                # Parse JSON response
                import json
                analysis = json.loads(content)
                
                return {
                    "success": True,
                    "estimated_rent": analysis.get("estimated_monthly_rent"),
                    "rent_range": analysis.get("rent_range", {}),
                    "confidence": analysis.get("confidence", "medium"),
                    "reasoning": analysis.get("reasoning", ""),
                    "factors": analysis.get("factors", {}),
                    "market_comparison": analysis.get("market_comparison", ""),
                    "recommendations": analysis.get("recommendations", []),
                    "price_per_sqm": analysis.get("price_per_sqm"),
                    "model_used": self.model
                }
                
        except Exception as e:
            print(f"Error in LLM rent estimation: {e}")
            return {
                "success": False,
                "error": str(e),
                "estimated_rent": None
            }
    
    def _safe_dict(self, value: Any) -> Dict:
        """
        Convert any value to a safe dictionary.
        If value is None or not a dict, return empty dict {}
        This prevents 'NoneType' object has no attribute 'get' errors
        """
        return value if isinstance(value, dict) else {}
    
    def _build_rent_estimation_prompt(self, property_data: Dict[str, Any]) -> str:
        """Build comprehensive prompt for rent estimation"""
        
        # Extract key data and FORCE everything to be a dict (never None)
        raw_data = self._safe_dict(property_data.get("raw_data"))
        attributes = self._safe_dict(raw_data.get("attributes"))
        
        # Safely extract ALL nested data - convert any None to {}
        address = self._safe_dict(attributes.get("address"))
        royal_mail = self._safe_dict(address.get("royal_mail_format"))
        simplified = self._safe_dict(address.get("simplified_format"))
        property_type = self._safe_dict(attributes.get("property_type"))
        characteristics = self._safe_dict(attributes.get("characteristics"))
        epc = self._safe_dict(attributes.get("epc"))
        localities = self._safe_dict(attributes.get("localities"))
        airport_noise = self._safe_dict(attributes.get("airport_noise"))
        price_paid = self._safe_dict(attributes.get("price_paid"))
        
        # Now ALL variables are guaranteed to be dicts, never None!
        
        # Also extract these potentially None fields
        latest_sale = self._safe_dict(property_data.get('latest_sale'))
        price_trend = self._safe_dict(property_data.get('price_trend'))
        
        # Use simplified fields first, fall back to raw data
        full_address = property_data.get('full_address', 'Unknown address')
        postcode = property_data.get('postcode', 'Unknown postcode')
        prop_type = property_data.get('property_type', property_type.get('value', 'Unknown'))
        bedrooms = property_data.get('bedrooms', characteristics.get('num_bedrooms', 'Not specified'))
        bathrooms = property_data.get('bathrooms', characteristics.get('num_bathrooms', 'Not specified'))
        floor_area = property_data.get('floor_area_sqm', characteristics.get('total_floor_area', 'Not specified'))
        
        # Build prompt
        prompt = f"""Analyze this UK property and estimate the optimal monthly rent for letting.

## PROPERTY DETAILS

**Address:** {full_address}
**Postcode:** {postcode}

**Property Type:** {prop_type}
**Bedrooms:** {bedrooms}
**Bathrooms:** {bathrooms}
**Total Floor Area:** {floor_area} m²
**Construction Age:** {characteristics.get('construction_age_band', 'Not specified') if characteristics else 'Not specified'}
**Tenure:** {property_data.get('tenure', characteristics.get('tenure', 'Not specified') if characteristics else 'Not specified')}

## LOCATION ANALYSIS

**Area:** {localities.get('ward', 'Unknown')}
**Local Authority:** {localities.get('local_authority', 'Unknown')}
**County:** {localities.get('county', 'Unknown')}

## ENERGY PERFORMANCE

**EPC Rating:** {epc.get('current_energy_rating', 'Not available')} (Current) → {epc.get('potential_energy_rating', 'N/A')} (Potential)
**Energy Efficiency:** {epc.get('current_energy_efficiency', 'N/A')}/100
**Main Heating:** {epc.get('main_heating', 'Not specified')}
**Main Fuel:** {epc.get('main_fuel', 'Not specified')}

## ENVIRONMENTAL FACTORS

**Airport Noise:** {airport_noise.get('category', 'Not assessed')} ({airport_noise.get('level', 'N/A')} dB)
**Commercial Property:** {'Yes' if address.get('is_none_residential') else 'No'}

## SALES HISTORY

**Total Sales:** {len(price_paid.get('sales', []))} transactions recorded
**Latest Sale:** {latest_sale.get('price', 'N/A')} on {latest_sale.get('date', 'N/A') if latest_sale else 'N/A'}
**Price Trend:** {price_trend.get('direction', 'N/A') + ' (' + str(price_trend.get('change_percentage', 0)) + '% change)' if price_trend and price_trend.get('direction') else 'No trend data'}

## YOUR TASK

Provide a comprehensive monthly rent estimate in JSON format with the following structure:

{{
    "estimated_monthly_rent": 1500,
    "rent_range": {{
        "minimum": 1400,
        "maximum": 1600,
        "optimal": 1500
    }},
    "confidence": "high",
    "reasoning": "Detailed explanation of how you arrived at this price, considering all factors",
    "factors": {{
        "positive": ["List factors that increase rent value"],
        "negative": ["List factors that decrease rent value"],
        "neutral": ["List neutral considerations"]
    }},
    "market_comparison": "How this compares to typical rents in the area",
    "recommendations": [
        "Actionable recommendations for the letting agent",
        "Suggestions to maximize rental income",
        "Tenant targeting advice"
    ],
    "price_per_sqm": 15.50
}}

Consider:
- Location desirability and transport links
- Property size, type, and condition
- EPC rating (tenants increasingly value energy efficiency)
- Local market trends and demand
- Comparable properties in the area
- Airport noise impact on desirability
- Construction age and modern amenities
- Number of bedrooms/bathrooms vs. market demand

Be realistic, data-driven, and justify your reasoning thoroughly."""

        return prompt
    
    async def estimate_sale_price(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Estimate sale price for a property using AI analysis
        
        Args:
            property_data: Complete property data from data.street.co.uk
            
        Returns:
            {
                "estimated_sale_price": 350000,
                "confidence": "high",
                "reasoning": "...",
                "factors": {
                    "positive": [...],
                    "negative": [...],
                    "neutral": [...]
                },
                "market_comparison": "...",
                "recommendations": [...]
            }
        """
        
        # Validate property data
        if not property_data:
            return {
                "success": False,
                "error": "No property data provided",
                "estimated_sale_price": None
            }
        
        # Build comprehensive analysis prompt
        try:
            prompt = self._build_sale_estimation_prompt(property_data)
        except Exception as e:
            print(f"Error building sale estimation prompt: {e}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": f"Error building prompt: {str(e)}",
                "estimated_sale_price": None
            }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {
                                "role": "system",
                                "content": """You are an expert UK property valuer with 25+ years of experience in residential sales. 
You specialize in accurate property valuations based on comprehensive market data, comparable sales, 
and local area analysis. You provide detailed, justified valuations that help estate agents 
price properties competitively to achieve quick sales while maximizing vendor returns."""
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "temperature": 0.3,  # More deterministic for pricing
                        "response_format": {"type": "json_object"}
                    }
                )
                
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"LLM API error: {response.status_code}",
                        "estimated_sale_price": None
                    }
                
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                # Parse JSON response
                import json
                analysis = json.loads(content)
                
                return {
                    "success": True,
                    "estimated_sale_price": analysis.get("estimated_sale_price"),
                    "price_range": analysis.get("price_range", {}),
                    "confidence": analysis.get("confidence", "medium"),
                    "reasoning": analysis.get("reasoning", ""),
                    "factors": analysis.get("factors", {}),
                    "market_comparison": analysis.get("market_comparison", ""),
                    "recommendations": analysis.get("recommendations", []),
                    "price_per_sqm": analysis.get("price_per_sqm"),
                    "model_used": self.model
                }
                
        except Exception as e:
            print(f"Error in LLM sale price estimation: {e}")
            return {
                "success": False,
                "error": str(e),
                "estimated_sale_price": None
            }
    
    def _build_sale_estimation_prompt(self, property_data: Dict[str, Any]) -> str:
        """Build comprehensive prompt for sale price estimation"""
        
        # Extract key data and FORCE everything to be a dict (never None)
        raw_data = self._safe_dict(property_data.get("raw_data"))
        attributes = self._safe_dict(raw_data.get("attributes"))
        
        # Safely extract ALL nested data - convert any None to {}
        address = self._safe_dict(attributes.get("address"))
        royal_mail = self._safe_dict(address.get("royal_mail_format"))
        simplified = self._safe_dict(address.get("simplified_format"))
        property_type = self._safe_dict(attributes.get("property_type"))
        characteristics = self._safe_dict(attributes.get("characteristics"))
        epc = self._safe_dict(attributes.get("epc"))
        localities = self._safe_dict(attributes.get("localities"))
        price_paid = self._safe_dict(attributes.get("price_paid"))
        
        # Extract potentially None fields
        latest_sale = self._safe_dict(property_data.get('latest_sale'))
        price_trend = self._safe_dict(property_data.get('price_trend'))
        
        # Use simplified fields first, fall back to raw data
        full_address = property_data.get('full_address', 'Unknown address')
        postcode = property_data.get('postcode', 'Unknown postcode')
        prop_type = property_data.get('property_type', property_type.get('value', 'Unknown'))
        bedrooms = property_data.get('bedrooms', characteristics.get('num_bedrooms', 'Not specified'))
        bathrooms = property_data.get('bathrooms', characteristics.get('num_bathrooms', 'Not specified'))
        floor_area = property_data.get('floor_area_sqm', characteristics.get('total_floor_area', 'Not specified'))
        
        # Extract sales history
        sales_history = price_paid.get('sales', [])
        recent_sales = sorted(sales_history, key=lambda x: x.get('date', ''), reverse=True)[:5]
        
        # Build sales history summary
        sales_summary = ""
        if recent_sales:
            sales_summary = "\n**Recent Sales History:**\n"
            for sale in recent_sales:
                sales_summary += f"- {sale.get('date', 'N/A')}: £{sale.get('price', 0):,}\n"
        else:
            sales_summary = "\n**No recent sales history available**\n"
        
        # Build prompt
        prompt = f"""Analyze this UK property and estimate the optimal sale price for the current market.

## PROPERTY DETAILS

**Address:** {full_address}
**Postcode:** {postcode}

**Property Type:** {prop_type}
**Bedrooms:** {bedrooms}
**Bathrooms:** {bathrooms}
**Total Floor Area:** {floor_area} m²
**Construction Age:** {characteristics.get('construction_age_band', 'Not specified')}
**Tenure:** {property_data.get('tenure', characteristics.get('tenure', 'Not specified'))}

## LOCATION ANALYSIS

**Area:** {localities.get('ward', 'Unknown')}
**Local Authority:** {localities.get('local_authority', 'Unknown')}
**County:** {localities.get('county', 'Unknown')}

## SALES HISTORY & MARKET PERFORMANCE

**Total Recorded Sales:** {len(sales_history)} transactions
{sales_summary}
**Price Trend:** {price_trend.get('direction', 'N/A') + ' (' + str(price_trend.get('change_percentage', 0)) + '% change)' if price_trend and price_trend.get('direction') else 'No trend data available'}

## ENERGY PERFORMANCE

**EPC Rating:** {epc.get('current_energy_rating', 'Not available')} (Current) → {epc.get('potential_energy_rating', 'N/A')} (Potential)
**Energy Efficiency:** {epc.get('current_energy_efficiency', 'N/A')}/100
**Environmental Impact:** {epc.get('environmental_efficiency', 'N/A')}/100

This is increasingly important to buyers due to:
- Rising energy costs
- Environmental concerns
- EPC regulations for mortgages

## YOUR TASK

Provide a comprehensive sale price estimate in JSON format with the following structure:

{{
    "estimated_sale_price": 350000,
    "price_range": {{
        "minimum": 330000,
        "maximum": 370000,
        "optimal": 350000
    }},
    "confidence": "high",
    "reasoning": "Detailed explanation of how you arrived at this valuation, considering all factors",
    "factors": {{
        "positive": ["List factors that increase property value"],
        "negative": ["List factors that decrease property value"],
        "neutral": ["List neutral considerations"]
    }},
    "market_comparison": "How this compares to recent sales in the area and current market conditions",
    "recommendations": [
        "Actionable recommendations for the estate agent",
        "Pricing strategy suggestions",
        "Marketing angle recommendations",
        "Buyer targeting advice"
    ],
    "price_per_sqm": 2500
}}

## VALUATION CONSIDERATIONS

**Market Analysis:**
- Recent comparable sales in the area (weight heavily)
- Current market conditions (buyer's vs seller's market)
- Local demand for this property type
- Seasonal factors (time of year)

**Property Specifics:**
- Size and layout efficiency
- Condition and age
- EPC rating (critical for mortgageability)
- Outdoor space and parking
- Modernization needs

**Location Factors:**
- Transport links and commutability
- Local schools and amenities
- Area desirability and demographics
- Future development plans

**Pricing Strategy:**
- Price to achieve quick sale vs. maximum value
- Competition from similar properties
- Buyer psychology (pricing just below thresholds)

Be realistic, data-driven, and justify your reasoning thoroughly. Consider that buyers are increasingly savvy and will compare against recent sales data."""

        return prompt


# Singleton instance
_llm_service: Optional[LLMService] = None


async def get_llm_service() -> LLMService:
    """Get or create LLM service instance"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service


