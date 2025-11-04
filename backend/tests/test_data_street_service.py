"""Unit tests for DataStreetService using httpx MockTransport (no network)."""

import httpx
import pytest

from app.services.data_street_service import DataStreetService


@pytest.mark.asyncio
async def test_lookup_property_parses_datastreet_response():
    # Build a realistic DataStreet payload (subset)
    payload = {
        "data": {
            "id": "uprn-123",
            "attributes": {
                "address": {
                    "royal_mail_format": {
                        "building_number": "10",
                        "thoroughfare": "Test Street",
                        "post_town": "Testville",
                    },
                    "simplified_format": {"street": "Test Street", "town": "Testville"},
                },
                "property_type": {"value": "flat"},
                "characteristics": {
                    "num_bedrooms": 2,
                    "num_bathrooms": 1,
                    "construction_age_band": "2007-2011",
                    "total_floor_area": 60,
                    "tenure": "leasehold",
                },
                "epc": {
                    "current_energy_rating": "C",
                    "potential_energy_rating": "B",
                    "current_energy_efficiency": 70,
                    "potential_energy_efficiency": 80,
                },
                "price_paid": {
                    "sales": [
                        {"price": 200000, "date": "2020-01-01", "property_type": "Flat"},
                        {"price": 250000, "date": "2023-01-01", "property_type": "Flat"},
                    ]
                },
            },
        }
    }

    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=payload)

    svc = DataStreetService(api_key="test")
    svc.client = httpx.AsyncClient(transport=httpx.MockTransport(handler))

    result = await svc.lookup_property(postcode="SO15 2AB", house_number="10")
    assert result["found"] is True
    assert result["postcode"] == "SO15 2AB"
    assert result["bedrooms"] == 2
    assert result["epc"]["current_rating"] == "C"
    assert result["total_sales"] == 2
    assert result["price_trend"]["direction"] == "up"
    assert "google_maps_url" in result
    await svc.close()


@pytest.mark.asyncio
async def test_get_property_details_legacy_shape():
    payload = {
        "address": {"full_address": "10 Test Street, Testville", "street": "Test Street", "town": "Testville", "postcode": "SO15 2AB"},
        "sales_history": [
            {"price": 300000, "date": "2023-01-01", "property_type": "Flat"},
            {"price": 200000, "date": "2020-01-01", "property_type": "Flat"},
        ],
        "valuation": {"estimated_value": 310000, "confidence": "high", "date": "2024-01-01"},
        "characteristics": {"property_type": "flat", "bedrooms": 2, "bathrooms": 1, "build_year": 2010, "floor_area": 60, "tenure": "leasehold"},
        "epc": {"current": "C"},
    }

    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=payload)

    svc = DataStreetService(api_key="test")
    svc.client = httpx.AsyncClient(transport=httpx.MockTransport(handler))

    res = await svc.get_property_details("uprn-xyz")
    assert res["found"] is True
    assert res["postcode"] == "SO15 2AB"
    assert res["valuation"]["estimated_value"] == 310000
    assert res["price_trend"]["direction"] == "up"
    await svc.close()


@pytest.mark.asyncio
async def test_get_area_statistics_maps_fields():
    stats_payload = {
        "average_price": 250000,
        "median_price": 240000,
        "min_price": 150000,
        "max_price": 400000,
        "total_sales": 123,
        "time_period": "Last 12 months",
        "price_trend": {"direction": "up"},
    }

    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=stats_payload)

    svc = DataStreetService(api_key="test")
    svc.client = httpx.AsyncClient(transport=httpx.MockTransport(handler))

    stats = await svc.get_area_statistics("SO15", property_type="flat")
    assert stats["postcode"] == "SO15"
    assert stats["average_price"] == 250000
    assert stats["total_sales"] == 123
    assert stats["price_trend"]["direction"] == "up"
    await svc.close()

