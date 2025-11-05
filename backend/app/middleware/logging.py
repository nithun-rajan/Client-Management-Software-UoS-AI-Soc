"""Structured logging middleware for observability."""

import logging
import time
from collections.abc import Callable

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.middleware.request_id import get_request_id


# Configure structlog for ECS-inspired JSON logging
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=False,
)

logger = structlog.get_logger()


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that logs all HTTP requests/responses in structured JSON format.

    Logs include:
    - Request metadata: method, path, query params, user agent
    - Response metadata: status code, latency
    - Request ID for distributed tracing
    - Error details if request fails

    Log format follows ECS (Elastic Common Schema) inspiration for
    compatibility with log aggregation tools (ELK, Loki, CloudWatch).
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Log request and response details.

        Args:
            request: The incoming HTTP request
            call_next: The next middleware or endpoint handler

        Returns:
            Response from the endpoint handler
        """
        # Start timing
        start_time = time.time()

        # Get request ID
        request_id = get_request_id()

        # Extract request details
        method = request.method
        path = request.url.path
        query_params = str(request.query_params) if request.query_params else None
        user_agent = request.headers.get("user-agent")
        client_host = request.client.host if request.client else None

        # FR-038: Extract user_id from request
        # Once authentication is implemented, this will come from the JWT token or session
        # For now, use placeholder value
        user_id = None  # Placeholder until authentication is implemented
        # Future: user_id = request.state.user.id if hasattr(request.state, "user") else None

        try:
            # Process request
            response = await call_next(request)

            # Calculate latency
            latency_ms = (time.time() - start_time) * 1000

            # Determine log level based on status code
            if response.status_code >= 500:
                log_level = "error"
            elif response.status_code >= 400:
                log_level = "warning"
            else:
                log_level = "info"

            # Log successful request
            log_method = getattr(logger, log_level)
            log_method(
                "Request completed",
                request_id=request_id,
                user_id=user_id,  # FR-038: Include user_id in all logs
                method=method,
                path=path,
                query_params=query_params,
                status_code=response.status_code,
                latency_ms=round(latency_ms, 2),
                user_agent=user_agent,
                client_host=client_host,
            )

            return response

        except Exception as exc:
            # Calculate latency for failed request
            latency_ms = (time.time() - start_time) * 1000

            # Log exception
            logger.error(
                "Request failed with exception",
                request_id=request_id,
                user_id=user_id,  # FR-038: Include user_id in all logs
                method=method,
                path=path,
                query_params=query_params,
                latency_ms=round(latency_ms, 2),
                error_type=type(exc).__name__,
                error_message=str(exc),
                user_agent=user_agent,
                client_host=client_host,
                exc_info=True,
            )

            # Re-raise to let FastAPI handle it
            raise


def get_logger():
    """
    Get a structured logger instance.

    Returns:
        A structlog logger with request context

    Example:
        ```python
        from app.middleware.logging import get_logger

        logger = get_logger()
        logger.info("Processing payment", amount=100.0, currency="USD")
        ```
    """
    return structlog.get_logger()
