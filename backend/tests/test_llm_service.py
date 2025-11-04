"""Unit tests for LLMService using httpx MockTransport (no network)."""

import json

import httpx
import pytest

from app.services.llm_service import LLMService


class DummyAsyncClient:
    def __init__(self, handler):
        self._handler = handler

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def post(self, url, headers=None, json=None):
        # Build a Request to reuse handler signature
        req = httpx.Request("POST", url, headers=headers, json=json)
        return await self._handler(req)


@pytest.mark.asyncio
async def test_estimate_monthly_rent_success(monkeypatch):
    # Mock OpenAI-like response
    payload = {
        "estimated_monthly_rent": 1500,
        "rent_range": {"minimum": 1400, "maximum": 1600, "optimal": 1500},
        "confidence": "high",
        "reasoning": "Solid comps",
        "factors": {"positive": ["EPC C"], "negative": [], "neutral": []},
        "market_comparison": "Above average",
        "recommendations": ["List now"],
        "price_per_sqm": 20.5,
    }

    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "choices": [
                    {"message": {"content": json.dumps(payload)}},
                ]
            },
        )

    # Patch AsyncClient to use our transport
    monkeypatch.setattr(httpx, "AsyncClient", lambda timeout=30.0: DummyAsyncClient(handler))

    svc = LLMService(api_key="test")
    result = await svc.estimate_monthly_rent({"full_address": "1 Test St", "postcode": "SO15"})

    assert result["success"] is True
    assert result["estimated_rent"] == 1500
    assert result["rent_range"]["maximum"] == 1600
    assert result["confidence"] == "high"
    assert result["model_used"] == svc.model


@pytest.mark.asyncio
async def test_estimate_monthly_rent_api_error(monkeypatch):
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"error": "oops"})

    monkeypatch.setattr(httpx, "AsyncClient", lambda timeout=30.0: DummyAsyncClient(handler))

    svc = LLMService(api_key="test")
    result = await svc.estimate_monthly_rent({"full_address": "x", "postcode": "y"})
    assert "LLM API error" in result["error"]
    assert result["estimated_rent"] is None


@pytest.mark.asyncio
async def test_estimate_monthly_rent_empty_input():
    svc = LLMService(api_key="test")
    result = await svc.estimate_monthly_rent({})
    assert result["success"] is False
    assert result["estimated_rent"] is None
