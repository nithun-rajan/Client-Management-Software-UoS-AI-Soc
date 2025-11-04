"""Tests for security event logging."""

from unittest.mock import Mock, patch

import pytest
from fastapi import Request

from app.security.events import (
    SecurityEventSeverity,
    SecurityEventType,
    log_auth_failure,
    log_csrf_failure,
    log_injection_attempt,
    log_rate_limit_exceeded,
    log_security_event,
)


@pytest.fixture
def mock_request():
    """Create mock request object."""
    request = Mock(spec=Request)
    request.client = Mock()
    request.client.host = "192.168.1.100"
    request.headers = {"user-agent": "Mozilla/5.0"}
    request.method = "POST"
    request.url = Mock()
    request.url.path = "/api/v1/login"
    request.query_params = {}
    return request


class TestSecurityEventType:
    """Tests for SecurityEventType enum."""

    def test_event_types_have_correct_values(self):
        """Test that event types have expected values."""
        assert SecurityEventType.AUTH_SUCCESS.value == "auth.success"
        assert SecurityEventType.AUTH_FAILURE.value == "auth.failure"
        assert SecurityEventType.SQL_INJECTION_ATTEMPT.value == "injection.sql"
        assert SecurityEventType.XSS_ATTEMPT.value == "injection.xss"
        assert SecurityEventType.CSRF_VALIDATION_FAILED.value == "csrf.failed"
        assert SecurityEventType.RATE_LIMIT_EXCEEDED.value == "rate_limit.exceeded"


class TestSecurityEventSeverity:
    """Tests for SecurityEventSeverity enum."""

    def test_severity_levels_defined(self):
        """Test that all severity levels are defined."""
        assert SecurityEventSeverity.LOW.value == "low"
        assert SecurityEventSeverity.MEDIUM.value == "medium"
        assert SecurityEventSeverity.HIGH.value == "high"
        assert SecurityEventSeverity.CRITICAL.value == "critical"


class TestLogSecurityEvent:
    """Tests for log_security_event function."""

    @patch("app.security.events.logger")
    def test_logs_event_with_basic_info(self, mock_logger):
        """Test logging event with basic information."""
        log_security_event(
            event_type=SecurityEventType.AUTH_FAILURE,
            severity=SecurityEventSeverity.MEDIUM,
            message="Authentication failed",
        )

        # Verify logger was called
        assert mock_logger.warning.called
        call_args = mock_logger.warning.call_args

        # Check message
        assert call_args[0][0] == "Security event"

        # Check event data
        event_data = call_args[1]
        assert event_data["event_type"] == "auth.failure"
        assert event_data["severity"] == "medium"
        assert event_data["message"] == "Authentication failed"

    @patch("app.security.events.logger")
    def test_logs_event_with_request_info(self, mock_logger, mock_request):
        """Test logging event with request information."""
        log_security_event(
            event_type=SecurityEventType.XSS_ATTEMPT,
            severity=SecurityEventSeverity.HIGH,
            message="XSS attempt detected",
            request=mock_request,
        )

        assert mock_logger.error.called
        event_data = mock_logger.error.call_args[1]

        assert event_data["client_ip"] == "192.168.1.100"
        assert event_data["user_agent"] == "Mozilla/5.0"
        assert event_data["method"] == "POST"
        assert event_data["path"] == "/api/v1/login"

    @patch("app.security.events.logger")
    def test_logs_event_with_user_id(self, mock_logger):
        """Test logging event with user ID."""
        log_security_event(
            event_type=SecurityEventType.AUTH_SUCCESS,
            severity=SecurityEventSeverity.LOW,
            message="User logged in",
            user_id="user123",
        )

        event_data = mock_logger.info.call_args[1]
        assert event_data["user_id"] == "user123"

    @patch("app.security.events.logger")
    def test_logs_event_with_additional_data(self, mock_logger):
        """Test logging event with additional context data."""
        log_security_event(
            event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
            severity=SecurityEventSeverity.HIGH,
            message="Suspicious activity detected",
            additional_data={"attempts": 5, "timeframe": "1 minute"},
        )

        event_data = mock_logger.error.call_args[1]
        assert event_data["additional_data"]["attempts"] == 5
        assert event_data["additional_data"]["timeframe"] == "1 minute"

    @patch("app.security.events.logger")
    def test_uses_correct_log_level_for_severity(self, mock_logger):
        """Test that correct log level is used based on severity."""
        # Critical -> critical
        log_security_event(
            SecurityEventType.SUSPICIOUS_ACTIVITY,
            SecurityEventSeverity.CRITICAL,
            "Critical event",
        )
        assert mock_logger.critical.called

        # High -> error
        log_security_event(
            SecurityEventType.SUSPICIOUS_ACTIVITY,
            SecurityEventSeverity.HIGH,
            "High severity event",
        )
        assert mock_logger.error.called

        # Medium -> warning
        log_security_event(
            SecurityEventType.SUSPICIOUS_ACTIVITY,
            SecurityEventSeverity.MEDIUM,
            "Medium severity event",
        )
        assert mock_logger.warning.called

        # Low -> info
        log_security_event(
            SecurityEventType.SUSPICIOUS_ACTIVITY,
            SecurityEventSeverity.LOW,
            "Low severity event",
        )
        assert mock_logger.info.called


class TestLogAuthFailure:
    """Tests for log_auth_failure convenience function."""

    @patch("app.security.events.log_security_event")
    def test_logs_auth_failure_with_username(self, mock_log_event, mock_request):
        """Test logging authentication failure with username."""
        log_auth_failure(
            request=mock_request,
            username="testuser",
            reason="Invalid password",
        )

        assert mock_log_event.called
        call_args = mock_log_event.call_args

        assert call_args[1]["event_type"] == SecurityEventType.AUTH_FAILURE
        assert call_args[1]["severity"] == SecurityEventSeverity.MEDIUM
        assert "Invalid password" in call_args[1]["message"]
        assert call_args[1]["request"] == mock_request
        assert call_args[1]["additional_data"]["username"] == "testuser"

    @patch("app.security.events.log_security_event")
    def test_logs_auth_failure_without_username(self, mock_log_event, mock_request):
        """Test logging authentication failure without username."""
        log_auth_failure(request=mock_request, reason="Token expired")

        assert mock_log_event.called
        call_args = mock_log_event.call_args

        assert call_args[1].get("additional_data") is None


class TestLogInjectionAttempt:
    """Tests for log_injection_attempt convenience function."""

    @patch("app.security.events.log_security_event")
    def test_logs_sql_injection_attempt(self, mock_log_event, mock_request):
        """Test logging SQL injection attempt."""
        log_injection_attempt(
            request=mock_request,
            injection_type="SQL",
            field_name="search_query",
            suspicious_value="' OR 1=1--",
        )

        assert mock_log_event.called
        call_args = mock_log_event.call_args

        assert call_args[1]["event_type"] == SecurityEventType.SQL_INJECTION_ATTEMPT
        assert call_args[1]["severity"] == SecurityEventSeverity.HIGH
        assert "SQL" in call_args[1]["message"]
        assert call_args[1]["additional_data"]["field_name"] == "search_query"
        assert call_args[1]["additional_data"]["suspicious_value"] == "' OR 1=1--"

    @patch("app.security.events.log_security_event")
    def test_logs_xss_attempt(self, mock_log_event, mock_request):
        """Test logging XSS attempt."""
        log_injection_attempt(
            request=mock_request,
            injection_type="XSS",
            field_name="comment",
            suspicious_value="<script>alert('xss')</script>",
        )

        assert mock_log_event.called
        call_args = mock_log_event.call_args

        assert call_args[1]["event_type"] == SecurityEventType.XSS_ATTEMPT

    @patch("app.security.events.log_security_event")
    def test_truncates_long_suspicious_value(self, mock_log_event, mock_request):
        """Test that long suspicious values are truncated."""
        long_value = "x" * 200

        log_injection_attempt(
            request=mock_request,
            injection_type="SQL",
            field_name="query",
            suspicious_value=long_value,
        )

        call_args = mock_log_event.call_args
        logged_value = call_args[1]["additional_data"]["suspicious_value"]

        # Should be truncated to 100 characters
        assert len(logged_value) == 100


class TestLogRateLimitExceeded:
    """Tests for log_rate_limit_exceeded convenience function."""

    @patch("app.security.events.log_security_event")
    def test_logs_rate_limit_exceeded(self, mock_log_event, mock_request):
        """Test logging rate limit exceeded."""
        log_rate_limit_exceeded(
            request=mock_request,
            limit="100/minute",
            identifier="192.168.1.100",
        )

        assert mock_log_event.called
        call_args = mock_log_event.call_args

        assert call_args[1]["event_type"] == SecurityEventType.RATE_LIMIT_EXCEEDED
        assert call_args[1]["severity"] == SecurityEventSeverity.LOW
        assert "100/minute" in call_args[1]["message"]
        assert call_args[1]["additional_data"]["limit"] == "100/minute"
        assert call_args[1]["additional_data"]["identifier"] == "192.168.1.100"


class TestLogCSRFFailure:
    """Tests for log_csrf_failure convenience function."""

    @patch("app.security.events.log_security_event")
    def test_logs_csrf_failure(self, mock_log_event, mock_request):
        """Test logging CSRF validation failure."""
        log_csrf_failure(
            request=mock_request,
            reason="Token mismatch",
        )

        assert mock_log_event.called
        call_args = mock_log_event.call_args

        assert call_args[1]["event_type"] == SecurityEventType.CSRF_VALIDATION_FAILED
        assert call_args[1]["severity"] == SecurityEventSeverity.MEDIUM
        assert "Token mismatch" in call_args[1]["message"]
        assert call_args[1]["request"] == mock_request


class TestSecurityEventsIntegration:
    """Integration tests for security events."""

    @patch("app.security.events.logger")
    def test_complete_security_event_workflow(self, mock_logger, mock_request):
        """Test complete workflow of logging a security event."""
        # Simulate SQL injection detection and logging
        log_injection_attempt(
            request=mock_request,
            injection_type="SQL",
            field_name="user_input",
            suspicious_value="'; DROP TABLE users;--",
        )

        # Verify event was logged
        assert mock_logger.error.called

        # Verify all required fields are present
        event_data = mock_logger.error.call_args[1]
        assert "event_type" in event_data
        assert "severity" in event_data
        assert "message" in event_data
        assert "request_id" in event_data
        assert "client_ip" in event_data
        assert "user_agent" in event_data
        assert "additional_data" in event_data
