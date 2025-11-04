"""
Security utilities and middleware.

Provides input validation, CSRF protection, and security event logging.
"""

from app.security.csrf import CSRFProtection, get_csrf_protection
from app.security.input_validation import (
    detect_sql_injection,
    detect_xss,
    sanitize_dict,
    sanitize_filename,
    sanitize_html,
    sanitize_search_query,
    validate_email_format,
    validate_integer_range,
)

__all__ = [
    # CSRF Protection
    "CSRFProtection",
    "get_csrf_protection",
    # Input Validation
    "sanitize_html",
    "detect_sql_injection",
    "detect_xss",
    "sanitize_filename",
    "validate_email_format",
    "sanitize_search_query",
    "validate_integer_range",
    "sanitize_dict",
]
