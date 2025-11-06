"""Prometheus metrics middleware for performance monitoring."""
import time
from collections.abc import Callable

from fastapi import Request, Response
from fastapi.responses import Response as FastAPIResponse
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    Counter,
    Gauge,
    Histogram,
    generate_latest,
)
from starlette.middleware.base import BaseHTTPMiddleware


# Define Prometheus metrics

# HTTP request counter (total requests by method, endpoint, status)
http_requests_total = Counter(
    "http_requests_total",
    "Total number of HTTP requests",
    ["method", "endpoint", "status"]
)

# HTTP request duration histogram (latency by method, endpoint)
http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0)
)

# HTTP requests in progress gauge
http_requests_in_progress = Gauge(
    "http_requests_in_progress",
    "Number of HTTP requests currently being processed",
    ["method", "endpoint"]
)


def normalize_endpoint(path: str) -> str:
    """
    Normalize endpoint paths to reduce cardinality.

    Converts path parameters to placeholders to avoid high cardinality.
    For example: /api/v1/properties/123 -> /api/v1/properties/{id}

    Args:
        path: The raw request path

    Returns:
        Normalized endpoint path template

    Examples:
        /api/v1/properties/123 -> /api/v1/properties/{id}
        /api/v1/landlords/456 -> /api/v1/landlords/{id}
        /api/v1/properties -> /api/v1/properties
    """
    # Split path into segments
    segments = path.split("/")
    normalized = []

    for i, segment in enumerate(segments):
        # Check if segment looks like an ID (numeric or UUID pattern)
        if segment.isdigit() or (
            len(segment) == 36 and segment.count("-") == 4
        ):
            # Replace with placeholder
            normalized.append("{id}")
        else:
            normalized.append(segment)

    return "/".join(normalized)


class MetricsMiddleware(BaseHTTPMiddleware):
    """
    Middleware that collects Prometheus metrics for all HTTP requests.

    Metrics collected:
    - http_requests_total: Counter of total requests by method, endpoint, status
    - http_request_duration_seconds: Histogram of request latencies
    - http_requests_in_progress: Gauge of currently in-flight requests

    Endpoint normalization ensures low cardinality:
    - /api/v1/properties/123 -> /api/v1/properties/{id}
    - This prevents metrics explosion from unique IDs
    """

    def __init__(self, app, excluded_paths: list[str] | None = None):
        """
        Initialize metrics middleware.

        Args:
            app: The FastAPI application
            excluded_paths: List of paths to exclude from metrics
                           (e.g., /metrics, /health)
        """
        super().__init__(app)
        self.excluded_paths = excluded_paths or ["/metrics", "/health"]

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """
        Collect metrics for each request.

        Args:
            request: The incoming HTTP request
            call_next: The next middleware or endpoint handler

        Returns:
            Response from the endpoint handler
        """
        # Skip metrics collection for excluded paths
        if request.url.path in self.excluded_paths:
            return await call_next(request)

        # Normalize endpoint to reduce cardinality
        endpoint = normalize_endpoint(request.url.path)
        method = request.method

        # Increment in-progress gauge
        http_requests_in_progress.labels(method=method, endpoint=endpoint).inc()

        # Start timing
        start_time = time.time()

        try:
            # Process request
            response = await call_next(request)

            # Record metrics
            status = str(response.status_code)
            http_requests_total.labels(
                method=method, endpoint=endpoint, status=status
            ).inc()

            # Record latency
            duration = time.time() - start_time
            http_request_duration_seconds.labels(
                method=method, endpoint=endpoint
            ).observe(duration)

            return response

        except Exception:
            # Record error metric
            http_requests_total.labels(
                method=method, endpoint=endpoint, status="500"
            ).inc()

            # Record latency even for failed requests
            duration = time.time() - start_time
            http_request_duration_seconds.labels(
                method=method, endpoint=endpoint
            ).observe(duration)

            raise

        finally:
            # Decrement in-progress gauge
            http_requests_in_progress.labels(
                method=method, endpoint=endpoint
            ).dec()


def metrics_endpoint() -> FastAPIResponse:
    """
    Endpoint that exposes Prometheus metrics in text format.

    Returns:
        Response with metrics in Prometheus exposition format

    Example:
        ```python
        from app.middleware.metrics import metrics_endpoint

        @app.get("/metrics")
        def metrics():
            return metrics_endpoint()
        ```
    """
    return FastAPIResponse(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
