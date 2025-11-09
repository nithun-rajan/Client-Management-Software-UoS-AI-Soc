"""
Request Tracing and Debugging

Provides detailed request tracing information for debugging.
Should only be enabled in development/staging environments.
"""

import os
import traceback
from typing import Any, Dict, List, Optional

from fastapi import Request

from app.middleware.request_id import get_request_id


class RequestTracer:
    """Request tracing for debugging."""

    @staticmethod
    def is_enabled() -> bool:
        """Check if tracing is enabled (only in non-production)."""
        environment = os.getenv("ENVIRONMENT", "development")
        return environment != "production"

    @staticmethod
    async def trace_request(request: Request) -> Dict[str, Any]:
        """
        Get detailed trace information for a request.

        Args:
            request: FastAPI request object

        Returns:
            Dict with request details, headers, body, etc.
        """
        if not RequestTracer.is_enabled():
            return {
                "error": "Tracing is disabled in production",
                "enabled": False,
            }

        trace_info = {
            "enabled": True,
            "request_id": get_request_id(),
            "timestamp": None,  # Will be set by caller
            "request": {
                "method": request.method,
                "url": str(request.url),
                "path": request.url.path,
                "query_params": dict(request.query_params),
                "path_params": dict(request.path_params) if hasattr(request, "path_params") else {},
                "client": {
                    "host": request.client.host if request.client else None,
                    "port": request.client.port if request.client else None,
                },
            },
            "headers": RequestTracer._safe_headers(dict(request.headers)),
            "middleware_stack": RequestTracer._get_middleware_info(request),
        }

        # Try to get request body (if available)
        try:
            # Note: Body can only be read once, so this might not work
            # in all cases depending on when this is called
            body = await request.body()
            if body:
                trace_info["request"]["body_size"] = len(body)
                # Don't include actual body to avoid security issues
        except Exception:
            pass

        return trace_info

    @staticmethod
    def _safe_headers(headers: Dict[str, str]) -> Dict[str, str]:
        """
        Sanitize headers to remove sensitive information.

        Args:
            headers: Raw headers dict

        Returns:
            Sanitized headers dict
        """
        sensitive_headers = {
            "authorization",
            "cookie",
            "x-csrf-token",
            "api-key",
            "x-api-key",
        }

        safe_headers = {}
        for key, value in headers.items():
            if key.lower() in sensitive_headers:
                safe_headers[key] = "[REDACTED]"
            else:
                safe_headers[key] = value

        return safe_headers

    @staticmethod
    def _get_middleware_info(request: Request) -> List[str]:
        """
        Get information about middleware stack.

        Args:
            request: FastAPI request object

        Returns:
            List of middleware names
        """
        middleware_info = []

        # Get app from request
        app = request.app

        # List middleware in the app
        if hasattr(app, "user_middleware"):
            for middleware in app.user_middleware:
                middleware_info.append(middleware.__class__.__name__)

        return middleware_info

    @staticmethod
    def get_context_variables() -> Dict[str, Any]:
        """
        Get current context variables.

        Returns:
            Dict with context variable values
        """
        from app.middleware.request_id import request_id_ctx_var

        try:
            return {
                "request_id": request_id_ctx_var.get(),
            }
        except LookupError:
            return {"error": "No context variables set (outside request context)"}

    @staticmethod
    def get_stack_trace() -> List[str]:
        """
        Get current stack trace for debugging.

        Returns:
            List of stack frames
        """
        if not RequestTracer.is_enabled():
            return ["Stack trace disabled in production"]

        stack = traceback.format_stack()
        # Remove this function from stack
        return stack[:-1]


def get_request_tracer() -> RequestTracer:
    """Get RequestTracer instance."""
    return RequestTracer()
