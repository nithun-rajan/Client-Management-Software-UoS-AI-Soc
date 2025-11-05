"""
Input Validation and Sanitization Utilities

Provides security utilities for validating and sanitizing user inputs
to prevent common injection attacks (XSS, SQL injection, etc.).
"""

import html
import re
from typing import Any


# Common SQL injection patterns
SQL_INJECTION_PATTERNS = [
    r"(\bUNION\b.*\bSELECT\b)",
    r"(\bSELECT\b.*\bFROM\b)",
    r"(\bINSERT\b.*\bINTO\b)",
    r"(\bUPDATE\b.*\bSET\b)",
    r"(\bDELETE\b.*\bFROM\b)",
    r"(\bDROP\b.*\bTABLE\b)",
    r"(;.*--)",
    r"(--.*)",
    r"(/\*.*\*/)",
    r"(\bOR\b.*=.*)",
    r"(\bAND\b.*=.*)",
    r"('.*OR.*'.*=.*')",
]

# Compile patterns for performance
COMPILED_SQL_PATTERNS = [
    re.compile(pattern, re.IGNORECASE) for pattern in SQL_INJECTION_PATTERNS
]

# XSS patterns
XSS_PATTERNS = [
    r"<script[^>]*>.*?</script>",
    r"javascript:",
    r"onerror\s*=",
    r"onload\s*=",
    r"onclick\s*=",
    r"<iframe",
    r"<object",
    r"<embed",
]

COMPILED_XSS_PATTERNS = [
    re.compile(pattern, re.IGNORECASE | re.DOTALL) for pattern in XSS_PATTERNS
]


def sanitize_html(text: str) -> str:
    """
    Escape HTML special characters to prevent XSS attacks.

    Args:
        text: Input text that may contain HTML

    Returns:
        HTML-escaped text safe for display
    """
    if not isinstance(text, str):
        return text

    return html.escape(text, quote=True)


def detect_sql_injection(text: str) -> bool:
    """
    Detect potential SQL injection attempts in input.

    Note: This is a defense-in-depth measure. Primary protection
    should be parameterized queries via SQLAlchemy.

    Args:
        text: Input text to check

    Returns:
        True if SQL injection pattern detected, False otherwise
    """
    if not isinstance(text, str):
        return False

    return any(pattern.search(text) for pattern in COMPILED_SQL_PATTERNS)


def detect_xss(text: str) -> bool:
    """
    Detect potential XSS attempts in input.

    Args:
        text: Input text to check

    Returns:
        True if XSS pattern detected, False otherwise
    """
    if not isinstance(text, str):
        return False

    return any(pattern.search(text) for pattern in COMPILED_XSS_PATTERNS)


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal attacks.

    Args:
        filename: Original filename

    Returns:
        Sanitized filename safe for file operations
    """
    if not isinstance(filename, str):
        return ""

    # Remove path components
    filename = filename.replace("../", "").replace("..\\", "")

    # Allow only alphanumeric, dash, underscore, and dot
    filename = re.sub(r"[^a-zA-Z0-9._-]", "_", filename)

    # Prevent hidden files
    if filename.startswith("."):
        filename = "_" + filename[1:]

    # Limit length
    max_length = 255
    if len(filename) > max_length:
        name_part, ext_part = (
            filename.rsplit(".", 1) if "." in filename else (filename, "")
        )
        name_part = name_part[: max_length - len(ext_part) - 1]
        filename = f"{name_part}.{ext_part}" if ext_part else name_part

    return filename


def validate_email_format(email: str) -> bool:
    """
    Validate email format (basic check).

    Note: For production, use pydantic's EmailStr which provides
    more robust validation.

    Args:
        email: Email address to validate

    Returns:
        True if valid format, False otherwise
    """
    if not isinstance(email, str):
        return False

    # Basic email pattern
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def sanitize_search_query(query: str, max_length: int = 100) -> str:
    """
    Sanitize search query input.

    Args:
        query: Search query string
        max_length: Maximum allowed length

    Returns:
        Sanitized query string
    """
    if not isinstance(query, str):
        return ""

    # Remove excessive whitespace
    query = " ".join(query.split())

    # Truncate to max length
    query = query[:max_length]

    # Remove potentially dangerous characters for search
    # Allow alphanumeric, space, and common punctuation
    query = re.sub(r"[^\w\s\-.,@]", "", query)

    return query.strip()


def validate_integer_range(
    value: Any,
    min_value: int | None = None,
    max_value: int | None = None,
) -> bool:
    """
    Validate integer is within acceptable range.

    Args:
        value: Value to validate
        min_value: Minimum acceptable value (inclusive)
        max_value: Maximum acceptable value (inclusive)

    Returns:
        True if valid, False otherwise
    """
    try:
        int_value = int(value)
    except (ValueError, TypeError):
        return False

    if min_value is not None and int_value < min_value:
        return False

    return not (max_value is not None and int_value > max_value)


def sanitize_dict(data: dict[str, Any], sanitize_values: bool = True) -> dict[str, Any]:
    """
    Recursively sanitize dictionary values.

    Args:
        data: Dictionary to sanitize
        sanitize_values: Whether to HTML-escape string values

    Returns:
        Sanitized dictionary
    """
    sanitized = {}

    for key, value in data.items():
        # Sanitize keys (prevent key injection)
        safe_key = re.sub(r"[^\w\-_]", "_", str(key))

        # Sanitize values
        if isinstance(value, str) and sanitize_values:
            sanitized[safe_key] = sanitize_html(value)
        elif isinstance(value, dict):
            sanitized[safe_key] = sanitize_dict(value, sanitize_values)
        elif isinstance(value, list):
            sanitized[safe_key] = [
                sanitize_dict(item, sanitize_values) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            sanitized[safe_key] = value

    return sanitized
