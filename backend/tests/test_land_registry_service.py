"""Unit tests for LandRegistryService using httpx MockTransport."""

import asyncio
from datetime import datetime

import httpx
import pytest

from app.services.land_registry_service import LandRegistryService


def make_sparql_bindings(entries):
    return {
        "results": {
            "bindings": entries,
        }
    }


def binding(paon=None, saon=None, street=None, town=None, postcode=None, amount=None, date=None, property_type="Flat", new_build=False):
    b = {}
    if paon is not None:
        b["paon"] = {"value": paon}
    if saon is not None:
        b["saon"] = {"value": saon}
    if street is not None:
        b["street"] = {"value": street}
    if town is not None:
        b["town"] = {"value": town}
    if postcode is not None:
        b["postcode"] = {"value": postcode}
    if amount is not None:
        b["amount"] = {"value": str(amount)}
    if date is not None:
        b["date"] = {"value": date}
    b["propertyType"] = {"value": property_type}
    b["newBuild"] = {"value": "true" if new_build else "false"}
    return b


@pytest.mark.asyncio
async def test_get_sold_prices_by_postcode_parses_results():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=make_sparql_bindings([
            binding(paon="10", street="High St", town="Testville", postcode="SO152AB", amount=250000, date="2024-06-01", property_type="Flat", new_build=False),
            binding(paon="12", street="High St", town="Testville", postcode="SO152AB", amount=300000, date="2024-05-01", property_type="Terraced", new_build=True),
        ]))

    transport = httpx.MockTransport(handler)
    svc = LandRegistryService()
    svc.client = httpx.AsyncClient(transport=transport)

    results = await svc.get_sold_prices_by_postcode("SO15 2AB", limit=2, months_back=1)
    assert len(results) == 2
    assert results[0]["price"] == 250000.0
    assert results[0]["property_type"] == "Flat"
    assert results[1]["new_build"] is True
    await svc.close()


@pytest.mark.asyncio
async def test_lookup_specific_property_latest_and_trend():
    # Two sales, latest first
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=make_sparql_bindings([
            binding(paon="1", street="Main Rd", town="T", postcode="SO15 2AB", amount=300000, date="2024-06-01", property_type="Flat"),
            binding(paon="1", street="Main Rd", town="T", postcode="SO15 2AB", amount=200000, date="2023-06-01", property_type="Flat"),
        ]))

    svc = LandRegistryService()
    svc.client = httpx.AsyncClient(transport=httpx.MockTransport(handler))

    data = await svc.lookup_specific_property("1", "SO15 2AB")
    assert data["found"] is True
    assert data["latest_sale"]["price"] == 300000.0
    assert data["price_trend"]["direction"] == "up"
    assert "google_maps_url" in data
    await svc.close()


@pytest.mark.asyncio
async def test_search_by_town_filters_and_limits():
    async def handler(request: httpx.Request) -> httpx.Response:
        # Provide three results, different types/prices
        return httpx.Response(200, json=make_sparql_bindings([
            binding(paon="1", street="A", town="Town", postcode="PC1", amount=100000, date="2024-06-01", property_type="Flat"),
            binding(paon="2", street="B", town="Town", postcode="PC2", amount=200000, date="2024-05-01", property_type="Detached"),
            binding(paon="3", street="C", town="Town", postcode="PC3", amount=300000, date="2024-04-01", property_type="Terraced"),
        ]))

    svc = LandRegistryService()
    svc.client = httpx.AsyncClient(transport=httpx.MockTransport(handler))

    # The service does filtering via SPARQL text, but handler returns all; just assert parse + limit behavior
    res = await svc.search_by_town("Town", limit=3)
    assert len(res) == 3
    assert res[0]["address"].startswith("1")
    await svc.close()


@pytest.mark.asyncio
async def test_area_statistics_happy_path(monkeypatch):
    svc = LandRegistryService()

    async def fake_sold_prices(postcode: str, limit: int = 200, months_back: int = 12):
        return [
            {"price": 100000, "property_type": "Flat"},
            {"price": 200000, "property_type": "Flat"},
            {"price": 300000, "property_type": "Terraced"},
        ]

    monkeypatch.setattr(svc, "get_sold_prices_by_postcode", fake_sold_prices)
    stats = await svc.get_area_statistics("SO15")
    assert stats["total_sales"] == 3
    assert stats["average_price"] == 200000.0
    assert stats["min_price"] == 100000
    assert stats["max_price"] == 300000
    assert stats["property_types"]["Flat"] == 2
    await svc.close()
