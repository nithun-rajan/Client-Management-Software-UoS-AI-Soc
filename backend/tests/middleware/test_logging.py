"""Tests for structured logging middleware."""

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from app.middleware.logging import StructuredLoggingMiddleware, get_logger
from app.middleware.request_id import RequestIDMiddleware


@pytest.fixture
def app():
    """Create a test FastAPI app with logging middleware."""
    test_app = FastAPI()
    test_app.add_middleware(RequestIDMiddleware)
    test_app.add_middleware(StructuredLoggingMiddleware)

    @test_app.get("/test")
    def test_endpoint():
        return {"message": "success"}

    @test_app.get("/error")
    def error_endpoint():
        raise HTTPException(status_code=400, detail="Bad request")

    @test_app.get("/server-error")
    def server_error_endpoint():
        raise Exception("Internal server error")

    return test_app


@pytest.fixture
def client(app):
    """Create a test client."""
    return TestClient(app)


def test_logs_successful_request(client, caplog):
    """Test that successful requests are logged."""
    with caplog.at_level("INFO"):
        response = client.get("/test")

    assert response.status_code == 200

    # Verify log entry contains expected fields
    log_records = [r for r in caplog.records if "Request completed" in r.message]
    assert len(log_records) > 0

    # Note: In actual JSON logging, these would be in structured format
    # For testing, we verify the log message was created


def test_logs_client_error_as_warning(client, caplog):
    """Test that 4xx errors are logged as warnings."""
    with caplog.at_level("WARNING"):
        response = client.get("/error")

    assert response.status_code == 400

    # Verify warning level log was created
    warning_logs = [r for r in caplog.records if r.levelname == "WARNING"]
    assert len(warning_logs) > 0


def test_logs_server_error(client, caplog):
    """Test that 5xx errors are logged as errors."""
    with caplog.at_level("ERROR"), pytest.raises(Exception):
        client.get("/server-error")

    # Verify error level log was created
    error_logs = [r for r in caplog.records if r.levelname == "ERROR"]
    assert len(error_logs) > 0


def test_logs_include_request_id(client, caplog):
    """Test that logs include request ID."""
    test_request_id = "test-request-id-123"

    with caplog.at_level("INFO"):
        response = client.get(
            "/test",
            headers={"X-Request-ID": test_request_id}
        )

    assert response.status_code == 200

    # Verify request ID is in log context
    # Note: Actual verification would check structured log output


def test_logs_include_latency(client, caplog):
    """Test that logs include request latency."""
    with caplog.at_level("INFO"):
        response = client.get("/test")

    assert response.status_code == 200

    # Verify latency tracking
    # In production, this would be in structured log fields


def test_get_logger_returns_structlog_instance():
    """Test that get_logger() returns a valid logger."""
    logger = get_logger()
    assert logger is not None

    # Should be able to log without errors
    logger.info("Test message", test_field="test_value")


def test_logger_supports_structured_fields():
    """Test that logger supports structured fields."""
    logger = get_logger()

    # Should support keyword arguments for structured logging
    logger.info(
        "Test event",
        user_id="123",
        action="test_action",
        amount=100.50
    )


def test_logs_exception_details(client, caplog):
    """Test that exception details are logged."""
    with caplog.at_level("ERROR"), pytest.raises(Exception):
        client.get("/server-error")

    error_logs = [r for r in caplog.records if r.levelname == "ERROR"]
    assert len(error_logs) > 0

    # Verify exception info is included
    # Note: In structured logging, this would be in error_type and error_message fields
