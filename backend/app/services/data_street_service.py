"""
Data.Street API Integration Service

Integration with data.street.co.uk Property API
Provides: Property details, valuations, sold prices, EPCs, and more

API Documentation: https://api.data.street.co.uk/street-data-api/v2/redoc
"""

import urllib.parse
from typing import Any

import httpx

from app.core.config import settings


class DataStreetService:
    """
    Service for interacting with data.street.co.uk Property API

    Requires: DATA_STREET_API_KEY in environment variables
    """

    BASE_URL = "https://api.data.street.co.uk/street-data-api/v2"

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or settings.DATA_STREET_API_KEY
        if not self.api_key:
            raise ValueError("DATA_STREET_API_KEY not found in environment variables")

        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={"x-api-key": self.api_key, "Content-Type": "application/json"},
        )

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()

    # ==================== Property Lookup ====================

    async def lookup_property(
        self,
        postcode: str,
        house_number: str | None = None,
    ) -> dict[str, Any]:
        """
        Look up a specific property by postcode and optionally house number

        Args:
            postcode: UK postcode
            house_number: Optional house number/name

        Returns:
            Property details including sold prices, valuations, EPCs
        """
        try:
            # Build address string for the API
            address = house_number if house_number else ""

            # Use the correct endpoint: /properties/addresses?tier=premium (POST)
            response = await self.client.post(
                f"{self.BASE_URL}/properties/addresses?tier=premium",
                json={"data": {"address": address, "postcode": postcode}},
            )
            response.raise_for_status()
            response_data = response.json()

            # Check if property was found (404 response)
            if response_data.get("status") == 404:
                return {
                    "found": False,
                    "message": response_data.get(
                        "detail", f"No property found for {address}, {postcode}"
                    ),
                    "postcode": postcode,
                    "house_number": house_number,
                }

            # Extract property data from nested structure
            # Response structure: { "data": { "id": "...", "type": "property", "attributes": {...} }, "meta": {...} }
            property_data = response_data.get("data", {})

            if not property_data or "attributes" not in property_data:
                return {
                    "found": False,
                    "message": f"No property data returned for {address}, {postcode}",
                    "postcode": postcode,
                    "house_number": house_number,
                }

            # Parse and return the comprehensive property data
            # Pass the full response data for comprehensive parsing
            return self._parse_datastreet_response(
                property_data, postcode, house_number
            )

        except httpx.HTTPError as e:
            print(f"Data.Street API Error: {e}")
            return {
                "found": False,
                "message": f"API Error: {e!s}",
                "postcode": postcode,
                "house_number": house_number,
            }

    async def get_property_details(self, property_id: str) -> dict[str, Any]:
        """
        Get detailed information for a specific property

        Args:
            property_id: UPRN or property identifier

        Returns:
            Complete property details
        """
        try:
            response = await self.client.get(f"{self.BASE_URL}/property/{property_id}")
            response.raise_for_status()
            data = response.json()

            return self._parse_property_response(data)

        except httpx.HTTPError as e:
            print(f"Error fetching property details: {e}")
            return {}

    def _parse_datastreet_response(
        self, data: dict, postcode: str, house_number: str | None
    ) -> dict[str, Any]:
        """Parse and normalize data.street API response

        Expected structure:
        {
            "id": "...",
            "type": "property",
            "attributes": {
                "address": {...},
                "property_type": {...},
                "epc": {...},
                "price_paid": {...},
                etc.
            }
        }
        """

        # Extract attributes (where all the property data lives)
        attributes = data.get("attributes", {})

        # Extract address information
        address = attributes.get("address", {})
        royal_mail = address.get("royal_mail_format", {})
        simplified = address.get("simplified_format", {})

        # Build full address
        full_address_parts = []
        if royal_mail.get("organisation_name"):
            full_address_parts.append(royal_mail["organisation_name"])
        if royal_mail.get("building_number"):
            full_address_parts.append(royal_mail["building_number"])
        if royal_mail.get("thoroughfare"):
            full_address_parts.append(royal_mail["thoroughfare"])
        if royal_mail.get("post_town"):
            full_address_parts.append(royal_mail["post_town"])

        full_address = ", ".join(full_address_parts) if full_address_parts else ""

        # Get sales history (price_paid data)
        price_paid = attributes.get("price_paid", {})
        sales_history = price_paid.get("sales", [])

        latest_sale = None
        if sales_history:
            # Sort by date descending
            sorted_sales = sorted(
                sales_history, key=lambda x: x.get("date", ""), reverse=True
            )
            latest_sale = sorted_sales[0]

        # Calculate price trend
        price_trend = None
        if len(sales_history) >= 2:
            sorted_sales = sorted(sales_history, key=lambda x: x.get("date", ""))
            oldest = sorted_sales[0]
            latest = sorted_sales[-1]
            old_price = oldest.get("price", 0)
            new_price = latest.get("price", 0)

            if old_price > 0:
                change = new_price - old_price
                change_pct = (change / old_price) * 100
                price_trend = {
                    "change_amount": change,
                    "change_percentage": round(change_pct, 2),
                    "direction": "up"
                    if change > 0
                    else "down"
                    if change < 0
                    else "stable",
                }

        # Get property characteristics
        property_type_data = attributes.get("property_type", {})
        characteristics = attributes.get("characteristics", {})

        # Get EPC data
        epc = attributes.get("epc", {})

        # Get identities
        identities = attributes.get("identities", {})
        identities.get("ordnance_survey", {})

        return {
            "found": True,
            "property_id": data.get("id"),
            "postcode": postcode,
            "house_number": house_number,
            "full_address": full_address,
            "street": simplified.get("street", ""),
            "town": simplified.get("town", ""),
            "property_type": property_type_data.get("value", ""),
            "bedrooms": characteristics.get("num_bedrooms"),
            "bathrooms": characteristics.get("num_bathrooms"),
            "build_year": characteristics.get("construction_age_band"),
            "floor_area_sqm": characteristics.get("total_floor_area"),
            "tenure": characteristics.get("tenure", ""),
            "latest_sale": {
                "price": latest_sale.get("price") if latest_sale else None,
                "date": latest_sale.get("date") if latest_sale else None,
                "property_type": latest_sale.get("property_type", "")
                if latest_sale
                else "",
            }
            if latest_sale
            else None,
            "sales_history": [
                {
                    "price": sale.get("price"),
                    "date": sale.get("date"),
                    "property_type": sale.get("property_type", ""),
                    "address": full_address,
                }
                for sale in sales_history
            ],
            "total_sales": len(sales_history),
            "price_trend": price_trend,
            "epc": {
                "current_rating": epc.get("current_energy_rating"),
                "potential_rating": epc.get("potential_energy_rating"),
                "current_efficiency": epc.get("current_energy_efficiency"),
                "potential_efficiency": epc.get("potential_energy_efficiency"),
            }
            if epc
            else None,
            "google_maps_url": self._generate_maps_url(full_address, postcode),
            "raw_data": data,  # Include full response for frontend to access all data
        }

    def _parse_property_response(self, data: dict) -> dict[str, Any]:
        """Parse and normalize property response (legacy method)"""

        # Extract key information
        address_parts = data.get("address", {})
        full_address = address_parts.get("full_address", "")

        # Get sold prices history
        sales_history = data.get("sales_history", [])
        latest_sale = sales_history[0] if sales_history else None

        # Calculate price trend
        price_trend = None
        if len(sales_history) >= 2:
            oldest = sales_history[-1]
            latest = sales_history[0]
            old_price = oldest.get("price", 0)
            new_price = latest.get("price", 0)

            if old_price > 0:
                change = new_price - old_price
                change_pct = (change / old_price) * 100
                price_trend = {
                    "change_amount": change,
                    "change_percentage": round(change_pct, 2),
                    "direction": "up"
                    if change > 0
                    else "down"
                    if change < 0
                    else "stable",
                }

        # Get valuation
        valuation = data.get("valuation", {})

        # Get property characteristics
        characteristics = data.get("characteristics", {})

        return {
            "found": True,
            "property_id": data.get("uprn"),
            "postcode": address_parts.get("postcode", ""),
            "full_address": full_address,
            "street": address_parts.get("street", ""),
            "town": address_parts.get("town", ""),
            "property_type": characteristics.get("property_type", ""),
            "bedrooms": characteristics.get("bedrooms"),
            "bathrooms": characteristics.get("bathrooms"),
            "build_year": characteristics.get("build_year"),
            "floor_area_sqm": characteristics.get("floor_area"),
            "tenure": characteristics.get("tenure"),
            "latest_sale": {
                "price": latest_sale.get("price") if latest_sale else None,
                "date": latest_sale.get("date") if latest_sale else None,
                "new_build": latest_sale.get("new_build", False)
                if latest_sale
                else False,
            }
            if latest_sale
            else None,
            "sales_history": [
                {
                    "price": sale.get("price"),
                    "date": sale.get("date"),
                    "property_type": sale.get("property_type", ""),
                    "address": full_address,
                }
                for sale in sales_history
            ],
            "total_sales": len(sales_history),
            "price_trend": price_trend,
            "valuation": {
                "estimated_value": valuation.get("estimated_value"),
                "confidence": valuation.get("confidence"),
                "valuation_date": valuation.get("date"),
            }
            if valuation
            else None,
            "epc": data.get("epc", {}),
            "google_maps_url": self._generate_maps_url(
                full_address, address_parts.get("postcode", "")
            ),
        }

    def _generate_maps_url(self, address: str, postcode: str) -> str:
        """Generate Google Maps URL for a property"""
        query = f"{address}, {postcode}, UK"
        encoded_query = urllib.parse.quote(query)
        return f"https://www.google.com/maps/search/?api=1&query={encoded_query}"

    # ==================== Area Statistics ====================

    async def get_area_statistics(
        self,
        postcode: str,
        property_type: str | None = None,
    ) -> dict[str, Any]:
        """
        Get market statistics for a postcode area

        Args:
            postcode: UK postcode
            property_type: Optional property type filter

        Returns:
            Area statistics and market data
        """
        try:
            clean_postcode = postcode.replace(" ", "").upper()

            response = await self.client.get(
                f"{self.BASE_URL}/market/statistics",
                params={
                    "postcode": clean_postcode,
                    "property_type": property_type,
                },
            )
            response.raise_for_status()
            data = response.json()

            return {
                "postcode": postcode,
                "property_type_filter": property_type,
                "average_price": data.get("average_price"),
                "median_price": data.get("median_price"),
                "min_price": data.get("min_price"),
                "max_price": data.get("max_price"),
                "total_sales": data.get("total_sales", 0),
                "time_period": data.get("time_period", "Last 12 months"),
                "price_trend": data.get("price_trend", {}),
            }

        except httpx.HTTPError as e:
            print(f"Error fetching area statistics: {e}")
            return {
                "postcode": postcode,
                "error": str(e),
                "total_sales": 0,
            }


# Singleton instance
_data_street_service: DataStreetService | None = None


async def get_data_street_service() -> DataStreetService:
    """
    Get or create Data.Street service instance

    Usage:
        service = await get_data_street_service()
        results = await service.lookup_property("SW1A 1AA", "10")
    """
    global _data_street_service
    if _data_street_service is None:
        _data_street_service = DataStreetService()
    return _data_street_service


async def close_data_street_service():
    """Close the Data.Street service client"""
    global _data_street_service
    if _data_street_service:
        await _data_street_service.close()
        _data_street_service = None
