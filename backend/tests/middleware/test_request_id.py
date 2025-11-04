"""Tests for request ID middleware."""

import uuid

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.middleware.request_id import (
    RequestIDMiddleware,
    get_request_id,
    request_id_ctx_var,
)


@pytest.fixture
def app():
    """Create a test FastAPI app with request ID middleware."""
    test_app = FastAPI()
    test_app.add_middleware(RequestIDMiddleware)

    @test_app.get("/test")
    def test_endpoint():
        return {"request_id": get_request_id()}

    return test_app


@pytest.fixture
def client(app):
    """Create a test client."""
    return TestClient(app)


def test_request_id_generated_if_not_provided(client):
    """Test that request ID is generated if not provided in headers."""
    response = client.get("/test")

    assert response.status_code == 200
    assert "X-Request-ID" in response.headers

    # Verify it's a valid UUID
    request_id = response.headers["X-Request-ID"]
    assert uuid.UUID(request_id)


def test_request_id_extracted_from_header(client):
    """Test that request ID is extracted from X-Request-ID header."""
    test_request_id = str(uuid.uuid4())

    response = client.get("/test", headers={"X-Request-ID": test_request_id})

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == test_request_id
    assert response.json()["request_id"] == test_request_id


def test_request_id_added_to_response_headers(client):
    """Test that request ID is added to response headers."""
    response = client.get("/test")

    assert response.status_code == 200
    assert "X-Request-ID" in response.headers


def test_get_request_id_returns_current_request_id(client):
    """Test that get_request_id() returns the current request ID."""
    test_request_id = str(uuid.uuid4())

    response = client.get("/test", headers={"X-Request-ID": test_request_id})

    assert response.status_code == 200
    assert response.json()["request_id"] == test_request_id


def test_get_request_id_returns_empty_string_if_not_set():
    """Test that get_request_id() returns empty string if not set."""
    # Clear context variable
    request_id_ctx_var.set("")

    assert get_request_id() == ""


def test_request_id_unique_per_request(client):
    """Test that each request gets a unique request ID."""
    response1 = client.get("/test")
    response2 = client.get("/test")

    request_id1 = response1.headers["X-Request-ID"]
    request_id2 = response2.headers["X-Request-ID"]

    assert request_id1 != request_id2


def test_custom_header_name():
    """Test that custom header name can be configured."""
    app = FastAPI()
    app.add_middleware(RequestIDMiddleware, header_name="X-Trace-ID")

    @app.get("/test")
    def test_endpoint():
        return {"request_id": get_request_id()}

    client = TestClient(app)
    test_trace_id = str(uuid.uuid4())

    response = client.get("/test", headers={"X-Trace-ID": test_trace_id})

    assert response.status_code == 200
    assert response.headers["X-Trace-ID"] == test_trace_id
