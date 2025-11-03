"""Request ID middleware for distributed tracing."""
import uuid
from collections.abc import Callable
from contextvars import ContextVar

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


# Context variable for request ID propagation across async boundaries
request_id_ctx_var: ContextVar[str] = ContextVar("request_id", default="")


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware that generates or extracts a unique request ID for each request.

    The request ID is:
    1. Extracted from X-Request-ID header if present (for distributed tracing)
    2. Generated as a new UUID if not present
    3. Stored in context variable for access anywhere in the request lifecycle
    4. Added to response headers for client-side correlation

    This enables:
    - Distributed tracing across microservices
    - Log correlation across request lifecycle
    - Client-side request tracking
    - Debugging production issues
    """

    def __init__(
        self,
        app,
        header_name: str = "X-Request-ID"
    ):
        """
        Initialize the middleware.

        Args:
            app: The FastAPI application
            header_name: HTTP header name for request ID (default: X-Request-ID)
        """
        super().__init__(app)
        self.header_name = header_name

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """
        Process each request and inject request ID.

        Args:
            request: The incoming HTTP request
            call_next: The next middleware or endpoint handler

        Returns:
            Response with X-Request-ID header added
        """
        # Extract request ID from header or generate new one
        request_id = request.headers.get(self.header_name) or str(uuid.uuid4())

        # Store in context variable for access anywhere
        request_id_ctx_var.set(request_id)

        # Also attach to request state for convenient access
        request.state.request_id = request_id

        # Process request
        response = await call_next(request)

        # Add request ID to response headers
        response.headers[self.header_name] = request_id

        return response


def get_request_id() -> str:
    """
    Get the current request ID from context variable.

    This can be called from anywhere in the request lifecycle
    (middleware, endpoints, services, etc.) to get the current request ID.

    Returns:
        The current request ID, or empty string if not set

    Example:
        ```python
        from app.middleware.request_id import get_request_id

        def my_service_function():
            request_id = get_request_id()
            logger.info("Processing request", request_id=request_id)
        ```
    """
    return request_id_ctx_var.get()
