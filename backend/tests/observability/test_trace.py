"""Tests for request tracing functionality."""

from unittest.mock import Mock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.observability.trace import RequestTracer


class TestRequestTracer:
    """Tests for RequestTracer class."""

    @patch.dict("os.environ", {"ENVIRONMENT": "development"})
    def test_is_enabled_in_development(self):
        """Test that tracing is enabled in development."""
        assert RequestTracer.is_enabled() is True

    @patch.dict("os.environ", {"ENVIRONMENT": "staging"})
    def test_is_enabled_in_staging(self):
        """Test that tracing is enabled in staging."""
        assert RequestTracer.is_enabled() is True

    @patch.dict("os.environ", {"ENVIRONMENT": "production"})
    def test_is_disabled_in_production(self):
        """Test that tracing is disabled in production."""
        assert RequestTracer.is_enabled() is False

    @pytest.mark.asyncio
    @patch.dict("os.environ", {"ENVIRONMENT": "development"})
    async def test_trace_request_returns_request_details(self):
        """Test that trace_request returns request details."""
        # Create mock request
        mock_request = Mock()
        mock_request.method = "GET"
        mock_request.url = Mock()
        mock_request.url.__str__ = Mock(return_value="http://localhost:8000/test")
        mock_request.url.path = "/test"
        mock_request.query_params = {"foo": "bar"}
        # Make path_params iterable by not mocking hasattr check
        delattr(mock_request, "path_params")
        mock_request.client = Mock()
        mock_request.client.host = "127.0.0.1"
        mock_request.client.port = 54321
        mock_request.headers = {
            "user-agent": "test-client",
            "accept": "application/json",
        }
        mock_request.body = Mock(return_value=b"")

        # Mock app with middleware list
        mock_app = Mock()
        mock_app.user_middleware = []
        mock_request.app = mock_app

        tracer = RequestTracer()
        trace_info = await tracer.trace_request(mock_request)

        assert trace_info["enabled"] is True
        assert "request_id" in trace_info
        assert trace_info["request"]["method"] == "GET"
        assert trace_info["request"]["path"] == "/test"
        assert trace_info["request"]["query_params"] == {"foo": "bar"}
        assert trace_info["request"]["client"]["host"] == "127.0.0.1"
        assert "headers" in trace_info

    @pytest.mark.asyncio
    @patch.dict("os.environ", {"ENVIRONMENT": "production"})
    async def test_trace_request_disabled_in_production(self):
        """Test that trace_request is disabled in production."""
        mock_request = Mock()

        tracer = RequestTracer()
        trace_info = await tracer.trace_request(mock_request)

        assert trace_info["enabled"] is False
        assert "error" in trace_info
        assert "production" in trace_info["error"]

    def test_safe_headers_redacts_sensitive_headers(self):
        """Test that sensitive headers are redacted."""
        headers = {
            "user-agent": "test-client",
            "authorization": "Bearer secret-token",
            "cookie": "session=abc123",
            "x-csrf-token": "csrf-token-value",
            "x-api-key": "api-key-value",
            "accept": "application/json",
        }

        tracer = RequestTracer()
        safe = tracer._safe_headers(headers)

        # Safe headers should be included
        assert safe["user-agent"] == "test-client"
        assert safe["accept"] == "application/json"

        # Sensitive headers should be redacted
        assert safe["authorization"] == "[REDACTED]"
        assert safe["cookie"] == "[REDACTED]"
        assert safe["x-csrf-token"] == "[REDACTED]"
        assert safe["x-api-key"] == "[REDACTED]"

    def test_safe_headers_case_insensitive(self):
        """Test that header redaction is case-insensitive."""
        headers = {
            "Authorization": "Bearer token",
            "COOKIE": "session=abc",
            "X-CSRF-Token": "token",
        }

        tracer = RequestTracer()
        safe = tracer._safe_headers(headers)

        assert safe["Authorization"] == "[REDACTED]"
        assert safe["COOKIE"] == "[REDACTED]"
        assert safe["X-CSRF-Token"] == "[REDACTED]"

    def test_get_middleware_info_returns_list(self):
        """Test that get_middleware_info returns middleware list."""
        # Create mock request with app
        mock_app = Mock()
        mock_app.user_middleware = []

        mock_request = Mock()
        mock_request.app = mock_app

        tracer = RequestTracer()
        middleware_info = tracer._get_middleware_info(mock_request)

        assert isinstance(middleware_info, list)

    def test_get_context_variables_returns_request_id(self):
        """Test that get_context_variables returns context info."""
        from app.middleware.request_id import request_id_ctx_var

        # Set a test request ID
        test_request_id = "test-request-id-123"
        token = request_id_ctx_var.set(test_request_id)

        try:
            tracer = RequestTracer()
            context = tracer.get_context_variables()

            assert "request_id" in context
            assert context["request_id"] == test_request_id
        finally:
            # Clean up context
            request_id_ctx_var.reset(token)

    def test_get_context_variables_handles_no_context(self):
        """Test that get_context_variables handles missing context."""
        # Ensure no context is set by creating new tracer
        tracer = RequestTracer()

        # This should not raise an error
        context = tracer.get_context_variables()

        # Should return error message
        assert "error" in context or "request_id" in context

    @patch.dict("os.environ", {"ENVIRONMENT": "development"})
    def test_get_stack_trace_returns_frames_in_development(self):
        """Test that stack trace returns frames in development."""
        tracer = RequestTracer()
        stack = tracer.get_stack_trace()

        assert isinstance(stack, list)
        # Should have at least some frames
        assert len(stack) > 0

    @patch.dict("os.environ", {"ENVIRONMENT": "production"})
    def test_get_stack_trace_disabled_in_production(self):
        """Test that stack trace is disabled in production."""
        tracer = RequestTracer()
        stack = tracer.get_stack_trace()

        assert isinstance(stack, list)
        assert len(stack) == 1
        assert "disabled" in stack[0].lower()


class TestTraceEndpointIntegration:
    """Integration tests for /trace endpoint."""

    def test_trace_endpoint_exists(self):
        """Test that /trace endpoint exists."""
        from app.main import app

        # Check that route is registered
        routes = [r.path for r in app.routes if hasattr(r, "path")]
        assert "/trace" in routes
