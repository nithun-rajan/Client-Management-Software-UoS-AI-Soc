"""Security middleware for HTTP security headers."""

import os
from collections.abc import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds security headers to all HTTP responses.

    Headers added:
    - Content-Security-Policy: Prevents XSS attacks
    - Strict-Transport-Security: Enforces HTTPS
    - X-Frame-Options: Prevents clickjacking
    - X-Content-Type-Options: Prevents MIME sniffing
    - X-XSS-Protection: Legacy XSS protection

    The CSP policy adapts to environment:
    - Development: Permissive (allows Vite HMR, unsafe-inline)
    - Production: Strict (no unsafe-inline, no unsafe-eval)
    """

    def __init__(self, app, environment: str | None = None):
        """
        Initialize security headers middleware.

        Args:
            app: The FastAPI application
            environment: Environment mode (development, staging, production)
                        Defaults to ENVIRONMENT env var or 'development'
        """
        super().__init__(app)
        self.environment = environment or os.getenv("ENVIRONMENT", "development")

    def get_csp_header(self) -> str:
        """
        Get Content-Security-Policy header value based on environment.

        Returns:
            CSP header value

        Development CSP:
            - Allows unsafe-inline for Vite HMR
            - Allows unsafe-eval for TailwindCSS JIT
            - Allows ws:/wss: for WebSocket connections

        Production CSP:
            - Strict policy, no unsafe-inline/unsafe-eval
            - Only allows self for scripts/styles
        """
        if self.environment == "production":
            return (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self'; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self';"
            )
        # Development: Permissive CSP for Vite HMR
        return (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' ws: wss:; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self';"
        )

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Add security headers to response.

        Args:
            request: The incoming HTTP request
            call_next: The next middleware or endpoint handler

        Returns:
            Response with security headers added
        """
        response = await call_next(request)

        # Content Security Policy (XSS prevention)
        response.headers["Content-Security-Policy"] = self.get_csp_header()

        # Strict Transport Security (HTTPS enforcement)
        # Only add in production to avoid issues with local dev
        if self.environment == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        # X-Frame-Options (clickjacking prevention)
        response.headers["X-Frame-Options"] = "DENY"

        # X-Content-Type-Options (MIME sniffing prevention)
        response.headers["X-Content-Type-Options"] = "nosniff"

        # X-XSS-Protection (legacy XSS protection for older browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer-Policy (control referrer information)
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions-Policy (control browser features)
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=()"
        )

        return response
