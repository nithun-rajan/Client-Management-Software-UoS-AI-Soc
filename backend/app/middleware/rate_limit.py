"""
Rate Limiting Middleware

Provides request rate limiting using slowapi with Redis backend for distributed systems.
In development, uses in-memory storage.
"""

import os
from collections.abc import Callable

from fastapi import Request, Response
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware

from app.middleware.logging import logger
from app.middleware.request_id import get_request_id


def get_identifier(request: Request) -> str:
    """
    Get rate limit identifier from request.

    Uses X-Forwarded-For if behind proxy, otherwise remote address.
    For authenticated requests, could use user ID from JWT.
    """
    # Check for forwarded IP (if behind proxy/load balancer)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # X-Forwarded-For can be comma-separated list
        return forwarded.split(",")[0].strip()

    # Fall back to direct remote address
    return get_remote_address(request)


# Configure limiter
limiter = Limiter(
    key_func=get_identifier,
    default_limits=[os.getenv("RATE_LIMIT_DEFAULT", "100/minute")],
    storage_uri=os.getenv("RATE_LIMIT_STORAGE_URI", "memory://"),
    # In production, use Redis: "redis://localhost:6379"
    strategy="fixed-window",  # or "moving-window" for more accuracy
    headers_enabled=True,  # Add X-RateLimit-* headers to responses
)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add rate limit information to responses.

    Adds custom headers and logs rate limit violations.
    """

    def __init__(
        self,
        app,
        excluded_paths: list[str] | None = None,
    ):
        super().__init__(app)
        self.excluded_paths = excluded_paths or []

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and add rate limit headers."""
        # Skip excluded paths
        if any(request.url.path.startswith(path) for path in self.excluded_paths):
            return await call_next(request)

        try:
            response = await call_next(request)
            # Ensure required headers on 429 responses even if raised by other middleware
            if response.status_code == 429:
                response.headers.setdefault("Retry-After", "60")
                response.headers.setdefault("X-RateLimit-Reset", "60")
            return response

        except RateLimitExceeded as exc:
            # Log rate limit violation
            request_id = get_request_id()
            identifier = get_identifier(request)

            logger.warning(
                "Rate limit exceeded",
                request_id=request_id,
                client_ip=identifier,
                path=request.url.path,
                limit=str(exc.detail),
            )
            # Return 429 with required headers
            headers = {
                "Retry-After": "60",
                "X-RateLimit-Reset": "60",
            }
            return Response(
                content="Rate limit exceeded. Please try again in 1 minute.",
                status_code=429,
                headers=headers,
            )


def get_limiter() -> Limiter:
    """Get the configured rate limiter instance."""
    return limiter
