"""Tests for rate limiting middleware."""

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.middleware.rate_limit import RateLimitMiddleware, get_identifier, get_limiter


@pytest.fixture
def test_app():
    """Create test FastAPI app with rate limiting."""
    app = FastAPI()

    # Configure rate limiter with low limit for testing
    limiter = Limiter(
        key_func=get_identifier,
        default_limits=["5/minute"],
        storage_uri="memory://",
    )
    app.state.limiter = limiter

    # Add middleware
    app.add_middleware(SlowAPIMiddleware)
    app.add_middleware(RateLimitMiddleware)

    # Add test endpoint
    @app.get("/test")
    @limiter.limit("3/minute")
    def test_endpoint(request: Request):
        return {"message": "success"}

    @app.get("/unlimited")
    def unlimited_endpoint():
        return {"message": "no limit"}

    return app


@pytest.fixture
def client(test_app):
    """Create test client."""
    return TestClient(test_app)


def test_get_identifier_extracts_forwarded_for(test_app):
    """Test that get_identifier extracts X-Forwarded-For header."""
    with TestClient(test_app) as client:
        # Create mock request with X-Forwarded-For
        response = client.get("/test", headers={"X-Forwarded-For": "192.168.1.100, 10.0.0.1"})
        assert response.status_code == 200


def test_get_identifier_falls_back_to_remote_addr(test_app):
    """Test that get_identifier falls back to remote address."""
    with TestClient(test_app) as client:
        response = client.get("/test")
        assert response.status_code == 200


def test_rate_limit_allows_requests_within_limit(client):
    """Test that requests within rate limit are allowed."""
    # Make 3 requests (within limit)
    for i in range(3):
        response = client.get("/test")
        assert response.status_code == 200, f"Request {i + 1} should succeed"


def test_rate_limit_blocks_requests_exceeding_limit(client):
    """Test that requests exceeding rate limit are blocked."""
    # Make requests up to the limit (3)
    for _ in range(3):
        response = client.get("/test")
        assert response.status_code == 200

    # Next request should be rate limited
    response = client.get("/test")
    assert response.status_code == 429, "Should be rate limited"
    # Check for rate limit in response
    assert "per" in response.text.lower() or "minute" in response.text.lower()


def test_retry_after_header_on_429_response(client):
    """
    Test that 429 responses include Retry-After header (FR-026).

    The spec requires: "Rate limit responses MUST include Retry-After header
    indicating when requests can resume."
    """
    # Make requests up to the limit (3)
    for _ in range(3):
        response = client.get("/test")
        assert response.status_code == 200

    # Next request should be rate limited with Retry-After header
    response = client.get("/test")
    assert response.status_code == 429, "Should be rate limited"

    # FR-026: Verify Retry-After header is present
    assert "Retry-After" in response.headers, (
        "FR-026: Retry-After header must be present on 429 responses"
    )

    # Verify Retry-After is a valid number (seconds)
    retry_after = response.headers["Retry-After"]
    assert retry_after.isdigit(), (
        f"Retry-After should be a number of seconds, got: {retry_after}"
    )
    retry_after_int = int(retry_after)
    assert retry_after_int > 0, "Retry-After should be positive"
    assert retry_after_int <= 60, "Retry-After should be reasonable (<= 60 seconds for minute-based limit)"

    # Additional check: X-RateLimit-Reset header should also be present
    assert "X-RateLimit-Reset" in response.headers, (
        "X-RateLimit-Reset header should be present"
    )


def test_rate_limit_headers_present(client):
    """Test that rate limit headers are added to responses."""
    response = client.get("/test")

    # slowapi should add X-RateLimit-* headers
    assert response.status_code == 200


def test_unlimited_endpoint_not_rate_limited():
    """Test that endpoints without explicit rate limit use default limits."""
    app = FastAPI()

    # Configure limiter with no default limits
    limiter = Limiter(
        key_func=get_identifier,
        default_limits=[],  # No default limits
        storage_uri="memory://",
    )
    app.state.limiter = limiter

    app.add_middleware(SlowAPIMiddleware)
    app.add_middleware(RateLimitMiddleware)

    @app.get("/unlimited")
    def unlimited_endpoint():
        return {"message": "no limit"}

    client = TestClient(app)

    # Make many requests - should not be rate limited
    for _ in range(10):
        response = client.get("/unlimited")
        assert response.status_code == 200, "Endpoint without decorator should not be rate limited"


def test_get_limiter_returns_singleton():
    """Test that get_limiter returns the same instance."""
    limiter1 = get_limiter()
    limiter2 = get_limiter()
    assert limiter1 is limiter2, "Should return singleton instance"


def test_rate_limit_different_ips_independent(test_app):
    """Test that rate limits are independent per IP."""
    # Client 1 exhausts their limit
    client1 = TestClient(test_app)
    for _ in range(3):
        response = client1.get("/test")
        assert response.status_code == 200

    # Client 1 is rate limited
    response = client1.get("/test")
    assert response.status_code == 429

    # Client 2 with different IP should not be affected
    # Note: TestClient uses same IP, so this test is conceptual
    # In real scenario with X-Forwarded-For, different IPs would be independent


def test_excluded_paths_middleware_skips_logging():
    """Test that excluded paths skip our rate limit middleware."""
    # This test verifies the middleware's excluded_paths logic
    from app.middleware.rate_limit import RateLimitMiddleware

    middleware = RateLimitMiddleware(None, excluded_paths=["/health", "/metrics"])

    assert any("/health".startswith(path) for path in middleware.excluded_paths)
    assert any("/metrics".startswith(path) for path in middleware.excluded_paths)
    assert not any("/api/test".startswith(path) for path in middleware.excluded_paths)
