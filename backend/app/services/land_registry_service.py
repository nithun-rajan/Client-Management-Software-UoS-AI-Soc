"""
HM Land Registry API Integration Service

This service provides integration with UK Government's official property data:
- Price Paid Data (actual sold prices)
- Property transactions
- Market statistics

API Documentation: https://landregistry.data.gov.uk/app/root/doc/ppd
Best part: Completely FREE, no API key required!
"""

import httpx
from typing import Optional, List, Dict, Any
<<<<<<< HEAD
from datetime import datetime, timedelta
=======
from datetime import datetime, timedelta, timezone
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
import urllib.parse
import re


class LandRegistryService:
    """
    Service for interacting with HM Land Registry Open Data APIs
    
    No API key required - completely free government data!
    """
    
    # Price Paid Data SPARQL endpoint
    SPARQL_ENDPOINT = "https://landregistry.data.gov.uk/landregistry/query"
    
    # REST API endpoints
    BASE_URL = "http://landregistry.data.gov.uk"
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
    
    async def _sparql_query(self, query: str) -> Dict[str, Any]:
        """
        Execute a SPARQL query against Land Registry data
        
        Args:
            query: SPARQL query string
            
        Returns:
            Query results as dictionary
        """
        try:
            response = await self.client.get(
                self.SPARQL_ENDPOINT,
                params={
                    "query": query,
                    "output": "json"
                },
                headers={
                    "Accept": "application/sparql-results+json"
                }
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            print(f"Land Registry API Error: {e}")
            raise
    
    # ==================== Specific Property Lookup ====================
    
    async def lookup_specific_property(
        self,
        house_number: str,
        postcode: str,
    ) -> Dict[str, Any]:
        """
        Look up a SPECIFIC property by house number and postcode
        Returns the exact property with its sold price history
        
        Args:
            house_number: House number (e.g., "123" or "Flat 5")
            postcode: UK postcode
            
        Returns:
            Property details with sold price history
        """
        clean_postcode = postcode.replace(" ", "").upper()
        
        query = f"""
        PREFIX  lrcommon: <http://landregistry.data.gov.uk/def/common/>
        PREFIX  lrppi: <http://landregistry.data.gov.uk/def/ppi/>
        PREFIX  skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX  xsd:  <http://www.w3.org/2001/XMLSchema#>

        SELECT ?paon ?saon ?street ?town ?county ?postcode ?amount ?date ?propertyType ?newBuild
        WHERE
        {{
          ?addr lrcommon:postcode "{clean_postcode}"^^xsd:string .
          
          ?transx lrppi:propertyAddress ?addr ;
                  lrppi:pricePaid ?amount ;
                  lrppi:transactionDate ?date ;
                  lrppi:propertyType ?propertyTypeURI .
          
          OPTIONAL {{ ?addr lrcommon:paon ?paon }}
          OPTIONAL {{ ?addr lrcommon:saon ?saon }}
          OPTIONAL {{ ?addr lrcommon:street ?street }}
          OPTIONAL {{ ?addr lrcommon:town ?town }}
          OPTIONAL {{ ?addr lrcommon:county ?county }}
          OPTIONAL {{ ?addr lrcommon:postcode ?postcode }}
          OPTIONAL {{ ?transx lrppi:newBuild ?newBuild }}
          
          ?propertyTypeURI skos:prefLabel ?propertyType .
          
          # Filter by house number (PAON - Primary Addressable Object Name)
          FILTER(CONTAINS(LCASE(STR(?paon)), LCASE("{house_number}")) || 
                 CONTAINS(LCASE(STR(?saon)), LCASE("{house_number}")))
        }}
        ORDER BY DESC(?date)
        LIMIT 20
        """
        
        results = await self._sparql_query(query)
        
        # Parse results
        sales_history = []
        for binding in results.get("results", {}).get("bindings", []):
            sales_history.append({
                "paon": binding.get("paon", {}).get("value", ""),
                "saon": binding.get("saon", {}).get("value", ""),
                "address": self._format_address(binding),
                "street": binding.get("street", {}).get("value", ""),
                "town": binding.get("town", {}).get("value", ""),
                "postcode": binding.get("postcode", {}).get("value", postcode),
                "price": float(binding.get("amount", {}).get("value", 0)),
                "date": binding.get("date", {}).get("value", ""),
                "property_type": binding.get("propertyType", {}).get("value", "Unknown"),
                "new_build": binding.get("newBuild", {}).get("value", "false") == "true",
            })
        
        if not sales_history:
            return {
                "found": False,
                "message": f"No sales data found for {house_number}, {postcode}",
                "house_number": house_number,
                "postcode": postcode,
            }
        
        # Get the most recent sale
        latest_sale = sales_history[0]
        
        # Calculate price trend
        price_trend = None
        if len(sales_history) >= 2:
            oldest_price = sales_history[-1]["price"]
            latest_price = latest_sale["price"]
            price_change = latest_price - oldest_price
            price_change_pct = (price_change / oldest_price) * 100 if oldest_price > 0 else 0
            
            price_trend = {
                "change_amount": price_change,
                "change_percentage": round(price_change_pct, 2),
                "direction": "up" if price_change > 0 else "down" if price_change < 0 else "stable",
            }
        
        return {
            "found": True,
            "house_number": house_number,
            "postcode": postcode,
            "full_address": latest_sale["address"],
            "street": latest_sale["street"],
            "town": latest_sale["town"],
            "property_type": latest_sale["property_type"],
            "latest_sale": {
                "price": latest_sale["price"],
                "date": latest_sale["date"],
                "new_build": latest_sale["new_build"],
            },
            "sales_history": sales_history,
            "total_sales": len(sales_history),
            "price_trend": price_trend,
            # Google Maps URL
            "google_maps_url": self._generate_maps_url(latest_sale["address"], latest_sale["postcode"]),
        }
    
    def _generate_maps_url(self, address: str, postcode: str) -> str:
        """Generate Google Maps URL for a property"""
        query = f"{address}, {postcode}, UK"
        encoded_query = urllib.parse.quote(query)
        return f"https://www.google.com/maps/search/?api=1&query={encoded_query}"
    
    # ==================== Sold Prices ====================
    
    async def get_sold_prices_by_postcode(
        self,
        postcode: str,
        limit: int = 100,
        months_back: int = 24,
    ) -> List[Dict[str, Any]]:
        """
        Get sold property prices for a postcode
        
        Args:
            postcode: UK postcode (e.g., "SO15 2JS")
            limit: Maximum number of results
            months_back: How many months of history to fetch
            
        Returns:
            List of sold properties with prices
        """
        # Calculate date range
<<<<<<< HEAD
        end_date = datetime.now()
=======
        end_date = datetime.now(timezone.utc)
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
        start_date = end_date - timedelta(days=months_back * 30)
        
        # Clean postcode (remove spaces, uppercase)
        clean_postcode = postcode.replace(" ", "").upper()
        
        query = f"""
        PREFIX  rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX  rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX  owl:  <http://www.w3.org/2002/07/owl#>
        PREFIX  xsd:  <http://www.w3.org/2001/XMLSchema#>
        PREFIX  sr:   <http://data.ordnancesurvey.co.uk/ontology/spatialrelations/>
        PREFIX  ukhpi: <http://landregistry.data.gov.uk/def/ukhpi/>
        PREFIX  lrppi: <http://landregistry.data.gov.uk/def/ppi/>
        PREFIX  skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX  lrcommon: <http://landregistry.data.gov.uk/def/common/>

        SELECT ?paon ?saon ?street ?town ?county ?postcode ?amount ?date ?propertyType ?newBuild
        WHERE
        {{
          ?addr lrcommon:postcode "{clean_postcode}"^^xsd:string .
          
          ?transx lrppi:propertyAddress ?addr ;
                  lrppi:pricePaid ?amount ;
                  lrppi:transactionDate ?date ;
                  lrppi:propertyType ?propertyTypeURI .
                  
          OPTIONAL {{ ?addr lrcommon:paon ?paon }}
          OPTIONAL {{ ?addr lrcommon:saon ?saon }}
          OPTIONAL {{ ?addr lrcommon:street ?street }}
          OPTIONAL {{ ?addr lrcommon:town ?town }}
          OPTIONAL {{ ?addr lrcommon:county ?county }}
          OPTIONAL {{ ?addr lrcommon:postcode ?postcode }}
          OPTIONAL {{ ?transx lrppi:newBuild ?newBuild }}
          
          ?propertyTypeURI skos:prefLabel ?propertyType .
          
          FILTER (?date >= "{start_date.strftime('%Y-%m-%d')}"^^xsd:date)
          FILTER (?date <= "{end_date.strftime('%Y-%m-%d')}"^^xsd:date)
        }}
        ORDER BY DESC(?date)
        LIMIT {limit}
        """
        
        results = await self._sparql_query(query)
        
        # Parse results
        properties = []
        for binding in results.get("results", {}).get("bindings", []):
            properties.append({
                "address": self._format_address(binding),
                "postcode": binding.get("postcode", {}).get("value", postcode),
                "price": float(binding.get("amount", {}).get("value", 0)),
                "date": binding.get("date", {}).get("value", ""),
                "property_type": binding.get("propertyType", {}).get("value", "Unknown"),
                "new_build": binding.get("newBuild", {}).get("value", "false") == "true",
            })
        
        return properties
    
    def _format_address(self, binding: Dict) -> str:
        """Format address from SPARQL binding"""
        parts = []
        
        saon = binding.get("saon", {}).get("value")
        paon = binding.get("paon", {}).get("value")
        street = binding.get("street", {}).get("value")
        town = binding.get("town", {}).get("value")
        
        if saon:
            parts.append(saon)
        if paon:
            parts.append(paon)
        if street:
            parts.append(street)
        if town:
            parts.append(town)
        
        return ", ".join(parts) if parts else "Address not available"
    
    # ==================== Statistics & Analysis ====================
    
    async def get_area_statistics(
        self,
        postcode: str,
        property_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Calculate statistics for an area based on recent sales
        
        Args:
            postcode: UK postcode
            property_type: Filter by property type (e.g., "Flat", "Terraced", "Detached")
            
        Returns:
            Statistics including average price, median, min, max, etc.
        """
        # Get sold prices
        sold_properties = await self.get_sold_prices_by_postcode(
            postcode=postcode,
            limit=200,
            months_back=12,
        )
        
        if not sold_properties:
            return {
                "postcode": postcode,
                "error": "No data found",
                "total_sales": 0,
            }
        
        # Filter by property type if specified
        if property_type:
            sold_properties = [
                p for p in sold_properties 
                if property_type.lower() in p["property_type"].lower()
            ]
        
        # Calculate statistics
        prices = [p["price"] for p in sold_properties]
        prices.sort()
        
        total_sales = len(prices)
        if total_sales == 0:
            return {
                "postcode": postcode,
                "property_type_filter": property_type,
                "error": "No matching properties found",
                "total_sales": 0,
            }
        
        avg_price = sum(prices) / total_sales
        median_price = prices[total_sales // 2] if total_sales > 0 else 0
        
        # Count by property type
        type_counts = {}
        for prop in sold_properties:
            ptype = prop["property_type"]
            type_counts[ptype] = type_counts.get(ptype, 0) + 1
        
        return {
            "postcode": postcode,
            "property_type_filter": property_type,
            "total_sales": total_sales,
            "average_price": round(avg_price, 2),
            "median_price": median_price,
            "min_price": min(prices),
            "max_price": max(prices),
            "property_types": type_counts,
            "recent_sales": sold_properties[:10],  # Last 10 sales
            "time_period": "Last 12 months",
        }
    
    # ==================== Valuation Pack Generator ====================
    
    async def generate_valuation_pack(
        self,
        postcode: str,
        property_type: str,
        bedrooms: Optional[int] = None,
<<<<<<< HEAD
=======
        asking_price_fallback: Optional[float] = None,
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive valuation pack
        
        This combines:
        1. Recent sold prices (comparables)
        2. Area statistics
        3. Price trends
        4. Recommended valuation range
        
        Args:
            postcode: Property postcode
            property_type: Type of property (e.g., "Flat", "Terraced")
            bedrooms: Number of bedrooms (for filtering)
<<<<<<< HEAD
=======
            asking_price_fallback: Optional asking price to use if no Land Registry data found
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
            
        Returns:
            Comprehensive valuation pack
        """
        # Get all data
        sold_prices = await self.get_sold_prices_by_postcode(
            postcode=postcode,
            limit=200,
            months_back=24,
        )
        
<<<<<<< HEAD
        # Filter by property type
        filtered_sales = [
            p for p in sold_prices
            if property_type.lower() in p["property_type"].lower()
        ]
        
        # Calculate statistics
        if filtered_sales:
            prices = [p["price"] for p in filtered_sales]
            avg_price = sum(prices) / len(prices)
            median_price = sorted(prices)[len(prices) // 2]
            
            # Calculate price trend (last 6 months vs previous 6 months)
            mid_point = datetime.now() - timedelta(days=180)
            recent_prices = [
                p["price"] for p in filtered_sales
                if datetime.fromisoformat(p["date"].replace("Z", "+00:00")) > mid_point
            ]
            older_prices = [
                p["price"] for p in filtered_sales
                if datetime.fromisoformat(p["date"].replace("Z", "+00:00")) <= mid_point
            ]
            
            trend = "stable"
            trend_percentage = 0
            if recent_prices and older_prices:
                recent_avg = sum(recent_prices) / len(recent_prices)
                older_avg = sum(older_prices) / len(older_prices)
                trend_percentage = ((recent_avg - older_avg) / older_avg) * 100
                
                if trend_percentage > 3:
                    trend = "increasing"
                elif trend_percentage < -3:
                    trend = "decreasing"
        else:
            avg_price = 0
            median_price = 0
            trend = "unknown"
            trend_percentage = 0
        
        # Get area statistics
        area_stats = await self.get_area_statistics(postcode, property_type)
        
        # Recommended valuation range (±5% of average)
        recommended_min = int(avg_price * 0.95) if avg_price else None
        recommended_max = int(avg_price * 1.05) if avg_price else None
=======
        # Filter by property type (case-insensitive, partial match)
        filtered_sales = [
            p for p in sold_prices
            if property_type and property_type.lower() in p.get("property_type", "").lower()
        ]
        
        # If no results with property_type filter, try broader search with variants
        if not filtered_sales and sold_prices:
            type_variants = {
                "flat": ["flat", "apartment"],
                "house": ["house", "terraced", "semi-detached", "detached"],
                "terraced": ["terraced", "house"],
                "semi-detached": ["semi", "detached", "house"],
                "detached": ["detached", "house"],
            }
            variants = type_variants.get(property_type.lower() if property_type else "", [property_type.lower()] if property_type else [])
            if variants:
                filtered_sales = [
                    p for p in sold_prices
                    if any(variant in p.get("property_type", "").lower() for variant in variants)
                ]
            
            # If still no results, use all sales (remove property_type filter)
            if not filtered_sales:
                filtered_sales = sold_prices
        
        # Initialize variables
        avg_price = 0
        median_price = 0
        trend = "unknown"
        trend_percentage = 0.0
        has_land_registry_data = len(filtered_sales) > 0
        
        # Calculate statistics from Land Registry data if available
        if filtered_sales:
            prices = [p.get("price", 0) for p in filtered_sales if p.get("price", 0) > 0]
            if prices:
                avg_price = sum(prices) / len(prices)
                sorted_prices = sorted(prices)
                median_price = sorted_prices[len(sorted_prices) // 2]
                
                # Calculate price trend (last 6 months vs previous 6 months)
                mid_point = datetime.now(timezone.utc) - timedelta(days=180)
                recent_prices = []
                older_prices = []
                
                for p in filtered_sales:
                    try:
                        date_str = p.get("date", "")
                        if date_str:
                            # Handle different date formats
                            if "T" in date_str:
                                sale_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                            else:
                                sale_date = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                            
                            if sale_date > mid_point:
                                recent_prices.append(p.get("price", 0))
                            else:
                                older_prices.append(p.get("price", 0))
                    except Exception:
                        continue
                
                if recent_prices and older_prices:
                    recent_avg = sum(recent_prices) / len(recent_prices)
                    older_avg = sum(older_prices) / len(older_prices)
                    if older_avg > 0:
                        trend_percentage = ((recent_avg - older_avg) / older_avg) * 100
                        
                        if trend_percentage > 3:
                            trend = "increasing"
                        elif trend_percentage < -3:
                            trend = "decreasing"
                        else:
                            trend = "stable"
                elif recent_prices or older_prices:
                    trend = "stable"
        
        # Get area statistics (might have data even if filtered_sales is empty)
        area_stats = await self.get_area_statistics(postcode, property_type)
        
        # Fallback logic: use area_stats, asking_price, or estimate
        if avg_price == 0:
            # Try area_stats first
            if area_stats.get("average_price") and area_stats["average_price"] > 0:
                avg_price = area_stats["average_price"]
                median_price = area_stats.get("median_price", avg_price)
                has_land_registry_data = True
            # Try asking_price fallback
            elif asking_price_fallback and asking_price_fallback > 0:
                avg_price = asking_price_fallback
                median_price = asking_price_fallback
                trend = "stable"
            # Last resort: estimate based on property type and bedrooms
            else:
                # UK average prices by property type (rough estimates)
                base_estimates = {
                    "flat": 180000,
                    "apartment": 180000,
                    "terraced": 220000,
                    "semi-detached": 280000,
                    "detached": 350000,
                    "house": 250000,
                }
                
                # Find matching property type
                property_type_lower = (property_type or "").lower()
                base_price = 200000  # Default
                for prop_type, price in base_estimates.items():
                    if prop_type in property_type_lower:
                        base_price = price
                        break
                
                # Adjust for bedrooms (rough estimate: +£30k per bedroom above 2)
                if bedrooms and bedrooms > 0:
                    if bedrooms >= 2:
                        base_price = base_price + ((bedrooms - 2) * 30000)
                    else:
                        base_price = int(base_price * 0.8)  # 1-bed properties are cheaper
                
                avg_price = base_price
                median_price = base_price
                trend = "stable"
        
        # Ensure we have valid prices
        if avg_price <= 0:
            avg_price = 200000  # Absolute fallback
            median_price = 200000
        
        # Recommended valuation range
        if asking_price_fallback and asking_price_fallback > 0 and abs(avg_price - asking_price_fallback) < 1000:
            # If using asking_price as fallback, create a reasonable range around it
            recommended_min = max(0, int(asking_price_fallback * 0.90))
            recommended_max = int(asking_price_fallback * 1.10)
        else:
            recommended_min = max(0, int(avg_price * 0.95))
            recommended_max = int(avg_price * 1.05)
        
        # Determine confidence and data source
        if len(filtered_sales) >= 10:
            confidence = "High"
            data_source = "HM Land Registry (Official UK Government Data)"
        elif len(filtered_sales) >= 5:
            confidence = "Medium"
            data_source = "HM Land Registry (Official UK Government Data)"
        elif has_land_registry_data:
            confidence = "Low"
            data_source = "HM Land Registry (Limited Data)"
        elif asking_price_fallback and asking_price_fallback > 0:
            confidence = "Low"
            data_source = "Property Asking Price (No Land Registry data available)"
        else:
            confidence = "Low"
            data_source = "Estimated (No Land Registry data available for this postcode)"
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
        
        return {
            "postcode": postcode,
            "property_type": property_type,
            "bedrooms": bedrooms,
<<<<<<< HEAD
            "generated_at": datetime.now().isoformat(),
            "valuation_summary": {
                "average_price": round(avg_price, 2),
                "median_price": median_price,
=======
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "valuation_summary": {
                "average_price": round(avg_price, 2),
                "median_price": round(median_price, 2),
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
                "recommended_range": {
                    "min": recommended_min,
                    "max": recommended_max,
                },
<<<<<<< HEAD
                "confidence": "High" if len(filtered_sales) >= 10 else "Medium" if len(filtered_sales) >= 5 else "Low",
=======
                "confidence": confidence,
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
            },
            "market_trend": {
                "direction": trend,
                "percentage_change": round(trend_percentage, 2),
<<<<<<< HEAD
                "period": "Last 6 months vs previous 6 months",
            },
            "comparables": filtered_sales[:15],  # Top 15 comparables
=======
                "period": "Last 6 months vs previous 6 months" if has_land_registry_data else "No trend data available",
            },
            "comparables": filtered_sales[:15] if filtered_sales else [],  # Top 15 comparables
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
            "area_statistics": area_stats,
            "data_quality": {
                "total_comparables": len(filtered_sales),
                "data_period": "Last 24 months",
<<<<<<< HEAD
                "source": "HM Land Registry (Official UK Government Data)",
=======
                "source": data_source,
                "has_land_registry_data": has_land_registry_data,
                "used_fallback": not has_land_registry_data,
>>>>>>> 9d0b1540847c2b481219f38d6f6162ceb0b2aae4
            },
        }
    
    # ==================== Search by Town/City ====================
    
    async def search_by_town(
        self,
        town: str,
        property_type: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Search for sold properties by town/city name
        
        Args:
            town: Town or city name (e.g., "Southampton")
            property_type: Filter by property type
            min_price: Minimum price
            max_price: Maximum price
            limit: Maximum results
            
        Returns:
            List of sold properties
        """
        property_filter = ""
        if property_type:
            property_filter = f'FILTER (regex(?propertyType, "{property_type}", "i"))'
        
        price_filter = ""
        if min_price:
            price_filter += f'FILTER (?amount >= {min_price}) '
        if max_price:
            price_filter += f'FILTER (?amount <= {max_price}) '
        
        query = f"""
        PREFIX  lrcommon: <http://landregistry.data.gov.uk/def/common/>
        PREFIX  lrppi: <http://landregistry.data.gov.uk/def/ppi/>
        PREFIX  skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX  xsd:  <http://www.w3.org/2001/XMLSchema#>

        SELECT ?paon ?saon ?street ?town ?postcode ?amount ?date ?propertyType
        WHERE
        {{
          ?addr lrcommon:town "{town}"^^xsd:string .
          
          ?transx lrppi:propertyAddress ?addr ;
                  lrppi:pricePaid ?amount ;
                  lrppi:transactionDate ?date ;
                  lrppi:propertyType ?propertyTypeURI .
          
          OPTIONAL {{ ?addr lrcommon:paon ?paon }}
          OPTIONAL {{ ?addr lrcommon:saon ?saon }}
          OPTIONAL {{ ?addr lrcommon:street ?street }}
          OPTIONAL {{ ?addr lrcommon:town ?town }}
          OPTIONAL {{ ?addr lrcommon:postcode ?postcode }}
          
          ?propertyTypeURI skos:prefLabel ?propertyType .
          
          {property_filter}
          {price_filter}
        }}
        ORDER BY DESC(?date)
        LIMIT {limit}
        """
        
        results = await self._sparql_query(query)
        
        properties = []
        for binding in results.get("results", {}).get("bindings", []):
            properties.append({
                "address": self._format_address(binding),
                "postcode": binding.get("postcode", {}).get("value", ""),
                "price": float(binding.get("amount", {}).get("value", 0)),
                "date": binding.get("date", {}).get("value", ""),
                "property_type": binding.get("propertyType", {}).get("value", "Unknown"),
            })
        
        return properties


# Singleton instance
_land_registry_service: Optional[LandRegistryService] = None


async def get_land_registry_service() -> LandRegistryService:
    """
    Get or create Land Registry service instance
    
    Usage:
        service = await get_land_registry_service()
        results = await service.get_sold_prices_by_postcode("SO15 2JS")
    """
    global _land_registry_service
    if _land_registry_service is None:
        _land_registry_service = LandRegistryService()
    return _land_registry_service


async def close_land_registry_service():
    """Close the Land Registry service client"""
    global _land_registry_service
    if _land_registry_service:
        await _land_registry_service.close()
        _land_registry_service = None

