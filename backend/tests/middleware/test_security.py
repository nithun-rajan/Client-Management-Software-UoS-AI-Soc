"""Tests for security headers middleware."""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.middleware.security import SecurityHeadersMiddleware


@pytest.fixture
def development_app():
    """Create a test FastAPI app with security middleware in development mode."""
    test_app = FastAPI()
    test_app.add_middleware(SecurityHeadersMiddleware, environment="development")

    @test_app.get("/test")
    def test_endpoint():
        return {"message": "success"}

    return test_app


@pytest.fixture
def production_app():
    """Create a test FastAPI app with security middleware in production mode."""
    test_app = FastAPI()
    test_app.add_middleware(SecurityHeadersMiddleware, environment="production")

    @test_app.get("/test")
    def test_endpoint():
        return {"message": "success"}

    return test_app


def test_csp_header_added_development(development_app):
    """Test that CSP header is added in development mode."""
    client = TestClient(development_app)
    response = client.get("/test")

    assert response.status_code == 200
    assert "Content-Security-Policy" in response.headers

    csp = response.headers["Content-Security-Policy"]
    assert "unsafe-inline" in csp
    assert "unsafe-eval" in csp
    assert "ws:" in csp or "wss:" in csp


def test_csp_header_strict_production(production_app):
    """Test that CSP header is strict in production mode."""
    client = TestClient(production_app)
    response = client.get("/test")

    assert response.status_code == 200
    assert "Content-Security-Policy" in response.headers

    csp = response.headers["Content-Security-Policy"]
    assert "unsafe-inline" not in csp
    assert "unsafe-eval" not in csp
    assert "'self'" in csp


def test_hsts_header_production_only(development_app, production_app):
    """Test that HSTS header is only added in production."""
    dev_client = TestClient(development_app)
    prod_client = TestClient(production_app)

    dev_response = dev_client.get("/test")
    prod_response = prod_client.get("/test")

    # HSTS should NOT be present in development
    assert "Strict-Transport-Security" not in dev_response.headers

    # HSTS SHOULD be present in production
    assert "Strict-Transport-Security" in prod_response.headers
    hsts = prod_response.headers["Strict-Transport-Security"]
    assert "max-age=31536000" in hsts
    assert "includeSubDomains" in hsts


def test_x_frame_options_header_added(development_app):
    """Test that X-Frame-Options header is added."""
    client = TestClient(development_app)
    response = client.get("/test")

    assert response.status_code == 200
    assert response.headers["X-Frame-Options"] == "DENY"


def test_x_content_type_options_header_added(development_app):
    """Test that X-Content-Type-Options header is added."""
    client = TestClient(development_app)
    response = client.get("/test")

    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"


def test_x_xss_protection_header_added(development_app):
    """Test that X-XSS-Protection header is added."""
    client = TestClient(development_app)
    response = client.get("/test")

    assert response.status_code == 200
    assert response.headers["X-XSS-Protection"] == "1; mode=block"


def test_referrer_policy_header_added(development_app):
    """Test that Referrer-Policy header is added."""
    client = TestClient(development_app)
    response = client.get("/test")

    assert response.status_code == 200
    assert "Referrer-Policy" in response.headers
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"


def test_permissions_policy_header_added(development_app):
    """Test that Permissions-Policy header is added."""
    client = TestClient(development_app)
    response = client.get("/test")

    assert response.status_code == 200
    assert "Permissions-Policy" in response.headers

    permissions_policy = response.headers["Permissions-Policy"]
    assert "geolocation=()" in permissions_policy
    assert "microphone=()" in permissions_policy
    assert "camera=()" in permissions_policy


def test_all_security_headers_present(production_app):
    """Test that all security headers are present."""
    client = TestClient(production_app)
    response = client.get("/test")

    assert response.status_code == 200

    # Verify all expected security headers are present
    expected_headers = [
        "Content-Security-Policy",
        "Strict-Transport-Security",
        "X-Frame-Options",
        "X-Content-Type-Options",
        "X-XSS-Protection",
        "Referrer-Policy",
        "Permissions-Policy",
    ]

    for header in expected_headers:
        assert header in response.headers, f"Missing header: {header}"


def test_security_headers_do_not_break_api_functionality(development_app):
    """Test that security headers don't interfere with API responses."""
    client = TestClient(development_app)
    response = client.get("/test")

    assert response.status_code == 200
    assert response.json() == {"message": "success"}
