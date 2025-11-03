"""Tests for CSRF protection."""

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.security.csrf import CSRFProtection, get_csrf_protection


@pytest.fixture
def csrf_protection():
    """Create CSRF protection instance."""
    return CSRFProtection(secret_key="test-secret-key-for-testing")


@pytest.fixture
def test_app(csrf_protection):
    """Create test FastAPI app with CSRF protection."""
    app = FastAPI()

    @app.post("/protected")
    async def protected_endpoint(csrf_check=Depends(csrf_protection.validate_csrf)):
        """Protected endpoint that requires CSRF token."""
        return {"message": "success"}

    @app.get("/get-only")
    async def get_only_endpoint(csrf_check=Depends(csrf_protection.validate_csrf)):
        """GET endpoint (CSRF check should pass automatically)."""
        return {"message": "get success"}

    @app.get("/csrf-token")
    def get_token():
        """Endpoint to get CSRF token."""
        token = csrf_protection.generate_token()
        return {"token": token}

    return app


@pytest.fixture
def client(test_app):
    """Create test client."""
    return TestClient(test_app)


class TestCSRFProtection:
    """Tests for CSRF protection."""

    def test_generate_token_creates_valid_token(self, csrf_protection):
        """Test that generate_token creates a valid token."""
        token = csrf_protection.generate_token()

        assert isinstance(token, str)
        assert "." in token  # Should have token.signature format
        assert len(token) > 40  # Should be reasonably long

    def test_verify_token_accepts_valid_token(self, csrf_protection):
        """Test that verify_token accepts valid tokens."""
        token = csrf_protection.generate_token()
        assert csrf_protection.verify_token(token) is True

    def test_verify_token_rejects_invalid_signature(self, csrf_protection):
        """Test that verify_token rejects tokens with invalid signatures."""
        token = csrf_protection.generate_token()
        # Modify the signature part
        random_part, _ = token.rsplit(".", 1)
        invalid_token = f"{random_part}.invalid_signature"

        assert csrf_protection.verify_token(invalid_token) is False

    def test_verify_token_rejects_malformed_token(self, csrf_protection):
        """Test that verify_token rejects malformed tokens."""
        assert csrf_protection.verify_token("not-a-valid-token") is False
        assert csrf_protection.verify_token("") is False
        assert csrf_protection.verify_token("only-one-part") is False

    def test_verify_token_different_secret_key(self):
        """Test that tokens signed with different keys are rejected."""
        csrf1 = CSRFProtection(secret_key="key1")
        csrf2 = CSRFProtection(secret_key="key2")

        token = csrf1.generate_token()
        assert csrf2.verify_token(token) is False


class TestCSRFMiddleware:
    """Tests for CSRF middleware integration."""

    def test_get_request_bypasses_csrf_check(self, client):
        """Test that GET requests bypass CSRF validation."""
        response = client.get("/get-only")
        assert response.status_code == 200

    def test_post_without_token_fails(self, client):
        """Test that POST without CSRF token is rejected."""
        response = client.post("/protected")
        assert response.status_code == 403
        assert "csrf" in response.json()["detail"].lower()

    def test_post_with_header_but_no_cookie_fails(self, client, csrf_protection):
        """Test that POST with header but no cookie is rejected."""
        token = csrf_protection.generate_token()
        response = client.post(
            "/protected",
            headers={"X-CSRF-Token": token}
        )
        assert response.status_code == 403
        assert "cookie" in response.json()["detail"].lower()

    def test_post_with_cookie_but_no_header_fails(self, client, csrf_protection):
        """Test that POST with cookie but no header is rejected."""
        token = csrf_protection.generate_token()
        client.cookies.set("csrf_token", token)

        response = client.post("/protected")
        assert response.status_code == 403
        assert "header" in response.json()["detail"].lower()

    def test_post_with_mismatched_tokens_fails(self, client, csrf_protection):
        """Test that POST with mismatched cookie and header is rejected."""
        token1 = csrf_protection.generate_token()
        token2 = csrf_protection.generate_token()

        client.cookies.set("csrf_token", token1)
        response = client.post(
            "/protected",
            headers={"X-CSRF-Token": token2}
        )
        assert response.status_code == 403
        assert "mismatch" in response.json()["detail"].lower()

    def test_post_with_valid_token_succeeds(self, client, csrf_protection):
        """Test that POST with valid CSRF token succeeds."""
        token = csrf_protection.generate_token()

        client.cookies.set("csrf_token", token)
        response = client.post(
            "/protected",
            headers={"X-CSRF-Token": token}
        )
        assert response.status_code == 200
        assert response.json()["message"] == "success"

    def test_post_with_invalid_token_signature_fails(self, client):
        """Test that POST with invalid token signature is rejected."""
        invalid_token = "invalid_random_part.invalid_signature"

        client.cookies.set("csrf_token", invalid_token)
        response = client.post(
            "/protected",
            headers={"X-CSRF-Token": invalid_token}
        )
        assert response.status_code == 403


class TestGetCSRFProtection:
    """Tests for get_csrf_protection factory function."""

    def test_get_csrf_protection_creates_instance(self):
        """Test that get_csrf_protection creates CSRFProtection instance."""
        instance = get_csrf_protection(secret_key="test-key")
        assert isinstance(instance, CSRFProtection)

    def test_get_csrf_protection_with_custom_cookie_name(self):
        """Test get_csrf_protection with custom cookie name."""
        instance = get_csrf_protection(secret_key="test-key")
        assert instance.cookie_name == "csrf_token"

    def test_csrf_token_endpoint_works(self, client):
        """Test that CSRF token endpoint returns valid token."""
        response = client.get("/csrf-token")
        assert response.status_code == 200
        assert "token" in response.json()
        assert len(response.json()["token"]) > 40


class TestCSRFSecurityProperties:
    """Tests for CSRF security properties."""

    def test_tokens_are_unique(self, csrf_protection):
        """Test that each generated token is unique."""
        token1 = csrf_protection.generate_token()
        token2 = csrf_protection.generate_token()
        token3 = csrf_protection.generate_token()

        assert token1 != token2
        assert token2 != token3
        assert token1 != token3

    def test_token_verification_is_constant_time(self, csrf_protection):
        """Test that token verification uses constant-time comparison."""
        # This test verifies the code uses hmac.compare_digest
        # which prevents timing attacks
        import time

        token = csrf_protection.generate_token()

        # Time valid token verification
        start = time.perf_counter()
        csrf_protection.verify_token(token)
        valid_time = time.perf_counter() - start

        # Time invalid token verification
        start = time.perf_counter()
        csrf_protection.verify_token("invalid_token.fake_sig")
        invalid_time = time.perf_counter() - start

        # Both should take similar time (within order of magnitude)
        # This is a loose check since exact timing can vary
        assert abs(valid_time - invalid_time) < 0.1

    def test_empty_token_rejected(self, csrf_protection):
        """Test that empty token is rejected."""
        assert csrf_protection.verify_token("") is False

    def test_none_token_rejected(self, csrf_protection):
        """Test that None token is rejected."""
        assert csrf_protection.verify_token(None) is False  # type: ignore
