"""
Security Event Logging

Provides structured logging for security-related events including
authentication failures, suspicious activity, and potential attacks.
"""

from enum import Enum
from typing import Any

from fastapi import Request

from app.middleware.logging import logger
from app.middleware.request_id import get_request_id


class SecurityEventType(str, Enum):
    """Types of security events."""

    # Authentication & Authorization
    AUTH_SUCCESS = "auth.success"
    AUTH_FAILURE = "auth.failure"
    AUTH_RATE_LIMIT = "auth.rate_limit"
    AUTHZ_DENIED = "authz.denied"

    # Input Validation
    SQL_INJECTION_ATTEMPT = "injection.sql"
    XSS_ATTEMPT = "injection.xss"
    PATH_TRAVERSAL_ATTEMPT = "path_traversal"
    INVALID_INPUT = "input.invalid"

    # CSRF & Session
    CSRF_VALIDATION_FAILED = "csrf.failed"
    SESSION_HIJACK_ATTEMPT = "session.hijack"

    # Rate Limiting
    RATE_LIMIT_EXCEEDED = "rate_limit.exceeded"

    # Other
    SUSPICIOUS_ACTIVITY = "suspicious"
    SECURITY_SCAN_DETECTED = "scan.detected"


class SecurityEventSeverity(str, Enum):
    """Severity levels for security events."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


def log_security_event(
    event_type: SecurityEventType,
    severity: SecurityEventSeverity,
    message: str,
    request: Request | None = None,
    user_id: str | None = None,
    additional_data: dict[str, Any] | None = None,
) -> None:
    """
    Log a security event with structured data.

    Args:
        event_type: Type of security event
        severity: Severity level
        message: Human-readable message
        request: FastAPI request object (if available)
        user_id: User ID involved (if available)
        additional_data: Additional context data
    """
    # Build event data
    event_data = {
        "event_type": event_type.value,
        "severity": severity.value,
        "message": message,
        "request_id": get_request_id(),
    }

    # Add request information if available
    if request:
        event_data.update(
            {
                "client_ip": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent"),
                "method": request.method,
                "path": request.url.path,
                "query_params": str(request.query_params)
                if request.query_params
                else None,
            }
        )

    # Add user ID if available
    if user_id:
        event_data["user_id"] = user_id

    # Add additional data
    if additional_data:
        event_data["additional_data"] = additional_data

    # Log at appropriate level based on severity
    if severity == SecurityEventSeverity.CRITICAL:
        logger.critical("Security event", **event_data)
    elif severity == SecurityEventSeverity.HIGH:
        logger.error("Security event", **event_data)
    elif severity == SecurityEventSeverity.MEDIUM:
        logger.warning("Security event", **event_data)
    else:
        logger.info("Security event", **event_data)


def log_auth_failure(
    request: Request,
    username: str | None = None,
    reason: str = "Invalid credentials",
) -> None:
    """
    Log authentication failure.

    Args:
        request: FastAPI request object
        username: Username attempted
        reason: Reason for failure
    """
    log_security_event(
        event_type=SecurityEventType.AUTH_FAILURE,
        severity=SecurityEventSeverity.MEDIUM,
        message=f"Authentication failed: {reason}",
        request=request,
        additional_data={"username": username} if username else None,
    )


def log_injection_attempt(
    request: Request,
    injection_type: str,
    field_name: str,
    suspicious_value: str,
) -> None:
    """
    Log potential injection attack attempt.

    Args:
        request: FastAPI request object
        injection_type: Type of injection (SQL, XSS, etc.)
        field_name: Name of field with suspicious input
        suspicious_value: The suspicious input value (truncated for logging)
    """
    log_security_event(
        event_type=(
            SecurityEventType.SQL_INJECTION_ATTEMPT
            if injection_type.lower() == "sql"
            else SecurityEventType.XSS_ATTEMPT
        ),
        severity=SecurityEventSeverity.HIGH,
        message=f"Potential {injection_type} injection attempt detected",
        request=request,
        additional_data={
            "field_name": field_name,
            # Truncate suspicious value for logging
            "suspicious_value": suspicious_value[:100],
        },
    )


def log_rate_limit_exceeded(
    request: Request,
    limit: str,
    identifier: str,
) -> None:
    """
    Log rate limit exceeded event.

    Args:
        request: FastAPI request object
        limit: Rate limit that was exceeded
        identifier: Identifier (IP, user ID, etc.)
    """
    log_security_event(
        event_type=SecurityEventType.RATE_LIMIT_EXCEEDED,
        severity=SecurityEventSeverity.LOW,
        message=f"Rate limit exceeded: {limit}",
        request=request,
        additional_data={"limit": limit, "identifier": identifier},
    )


def log_csrf_failure(request: Request, reason: str) -> None:
    """
    Log CSRF validation failure.

    Args:
        request: FastAPI request object
        reason: Reason for CSRF failure
    """
    log_security_event(
        event_type=SecurityEventType.CSRF_VALIDATION_FAILED,
        severity=SecurityEventSeverity.MEDIUM,
        message=f"CSRF validation failed: {reason}",
        request=request,
    )
