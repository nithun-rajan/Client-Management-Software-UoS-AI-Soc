import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy.orm import Session
import time

import app.models  # ensure all models are registered before table creation
from app.api.v1 import applicants, events, kpis, landlords, properties, search
from app.core.database import Base, engine, get_db
from app.middleware.logging import StructuredLoggingMiddleware
from app.middleware.rate_limit import RateLimitMiddleware, get_limiter
from prometheus_fastapi_instrumentator import Instrumentator

# Import middleware
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.security import SecurityHeadersMiddleware
from app.models.applicant import Applicant
from app.models.landlord import Landlord
from app.models.property import Property
from app.observability import get_health_check, get_request_tracer, get_error_budget_calculator
from app.security.csrf import get_csrf_protection
from app.security.events import SecurityEventType, SecurityEventSeverity, log_security_event


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    # FR-060/61: Validate required secrets in production/staging environments
    environment = os.getenv("ENVIRONMENT", "development")
    if environment in ("production", "staging"):
        print(f"🔒 Validating secrets for {environment} environment...")

        # Validate SECRET_KEY
        secret_key = os.getenv("SECRET_KEY")
        if not secret_key:
            raise RuntimeError(
                f"CRITICAL: SECRET_KEY environment variable is not set in {environment} environment. "
                "This is required for CSRF protection and session security. "
                "Please set SECRET_KEY to a strong random value."
            )

        # Check for default/weak secret key
        default_secret = "default-secret-key-change-in-production"
        if secret_key == default_secret or len(secret_key) < 32:
            raise RuntimeError(
                f"CRITICAL: SECRET_KEY appears to be using default or weak value in {environment} environment. "
                "Please set SECRET_KEY to a cryptographically strong random value (minimum 32 characters). "
                "Example: openssl rand -hex 32"
            )

        # Validate DATABASE_URL
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise RuntimeError(
                f"CRITICAL: DATABASE_URL environment variable is not set in {environment} environment. "
                "This is required for database connectivity. "
                "Please configure DATABASE_URL with your database connection string."
            )

        print("✅ Secrets validation passed")

    print("🚀 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database ready")
    yield
    # Shutdown
    print("👋 Shutting down...")


app = FastAPI(
    title="🏢 UoS Scouting Challenge",
    description="""
    ## 🚀 UoS Scouting Challenge API

    Built by **Team 67** for the University of Southampton AI Society hackathon.

    ### Features:
    * 🏠 **Properties** - Complete property management
    * 👔 **Landlords** - Landlord records with AML compliance
    * 👥 **Applicants** - Tenant applicant tracking
    * 🔍 **Search** - Advanced property search with filters
    * 📊 **KPIs** - Real-time business metrics dashboard
    * 📝 **Events** - Event logging and tracking

    ### Endpoints by Category:

    #### 🏠 Properties
    - `POST /api/v1/properties` - Create new property
    - `GET /api/v1/properties` - List all properties
    - `GET /api/v1/properties/{id}` - Get property details
    - `PUT /api/v1/properties/{id}` - Update property
    - `DELETE /api/v1/properties/{id}` - Delete property

    #### 👔 Landlords
    - Complete CRUD operations for landlord management
    - AML verification tracking
    - Banking details (secure)

    #### 👥 Applicants
    - Tenant applicant registration
    - Search criteria tracking
    - Reference & right-to-rent checks

    #### 🔍 Search
    - Multi-filter property search
    - Filter by: bedrooms, rent, type, postcode, status
    - Result count endpoint for pagination

    #### 📊 KPIs
    - Real-time dashboard metrics
    - Property, landlord, and applicant analytics

    #### 📝 Events
    - Event logging system
    - Activity tracking

    ---
    **Team 67** | Hackathon 2025
    """,
    version="1.0.0",
    contact={
        "name": "Team 67",
        "email": "ali.marzooq13@outlook.com"
    },
    license_info={
        "name": "MIT"
    },
    lifespan=lifespan
)

# Configure rate limiter
limiter = get_limiter()
app.state.limiter = limiter

# Custom rate limit exceeded handler that explicitly includes Retry-After header
# FR-026: Ensure Retry-After header is present on 429 responses
def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """
    Custom handler for rate limit exceeded errors.

    Ensures Retry-After header is explicitly included per FR-026.
    """
    # Calculate retry_after in seconds from the limiter's reset time
    retry_after = 60  # Default to 60 seconds for /minute limits

    # Try to get more accurate retry time from exception or limiter
    if hasattr(exc, 'retry_after'):
        retry_after = int(exc.retry_after)
    elif hasattr(request.app.state, 'limiter'):
        # Calculate based on window (e.g., for "100/minute", window is 60 seconds)
        retry_after = 60

    response = JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "detail": f"Too many requests. Please try again in {retry_after} seconds.",
            "retry_after": retry_after
        },
        headers={
            "Retry-After": str(retry_after),  # FR-026: Explicit Retry-After header
            "X-RateLimit-Reset": str(int(time.time()) + retry_after),
        }
    )

    return response

# Add exception handler for rate limit exceeded
app.add_exception_handler(RateLimitExceeded, custom_rate_limit_handler)

# Initialize CSRF protection
csrf_protection = get_csrf_protection(
    secret_key=os.getenv("SECRET_KEY", "default-secret-key-change-in-production")
)

# Add middleware (order matters: first added = outermost = executed first)
# 1. Security headers (outermost)
app.add_middleware(
    SecurityHeadersMiddleware,
    environment=os.getenv("ENVIRONMENT", "development")
)

# 2. CORS (before other middleware to handle preflight)
# Get allowed origins from environment variable
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

# In development, allow all origins for convenience
# In production, MUST use specific origins from CORS_ORIGINS env variable
environment = os.getenv("ENVIRONMENT", "development")
if environment == "development" and cors_origins_env == "http://localhost:3000,http://localhost:5173":
    # Development mode with default origins - allow all for convenience
    allowed_origins = ["*"]
elif "*" in allowed_origins and environment != "development":
    # Security: Prevent wildcard CORS in non-development environments
    raise ValueError(
        "CORS wildcard '*' is not allowed in production/staging. "
        "Set CORS_ORIGINS environment variable with specific frontend domains."
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Rate limiting (with slowapi)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    RateLimitMiddleware,
    excluded_paths=["/metrics", "/health", "/docs", "/openapi.json"]
)

# 4. Structured logging
app.add_middleware(StructuredLoggingMiddleware)

# 5. Request ID (innermost - sets context for other middleware)
app.add_middleware(RequestIDMiddleware)

# FR-041: Configure Prometheus metrics collection using prometheus-fastapi-instrumentator
# This provides standardized metrics collection with proper cardinality management
instrumentator = Instrumentator(
    should_group_status_codes=True,  # Group 2xx, 3xx, 4xx, 5xx for cardinality
    should_ignore_untemplated=False,
    should_respect_env_var=True,
    should_instrument_requests_inprogress=True,
    excluded_handlers=["/metrics", "/health"],  # Exclude monitoring endpoints
    env_var_name="ENABLE_METRICS",
    inprogress_name="http_requests_in_progress",
    inprogress_labels=True,
)

# Instrument the app and expose metrics endpoint
instrumentator.instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)


@app.get("/", response_class=HTMLResponse)
def root(db: Session = Depends(get_db)):
    """Landing page with dynamic stats"""

    # Get real counts from database
    property_count = db.query(Property).count()
    landlord_count = db.query(Landlord).count()
    applicant_count = db.query(Applicant).count()
    endpoint_count = len([r for r in app.routes if hasattr(r, "methods")])

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>UoS Scouting Challenge API</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }}
            .container {{
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }}
            h1 {{
                font-size: 3em;
                margin: 0;
                text-align: center;
            }}
            .emoji {{
                font-size: 4em;
                text-align: center;
                margin: 20px 0;
            }}
            .subtitle {{
                text-align: center;
                font-size: 1.3em;
                opacity: 0.9;
                margin-bottom: 30px;
            }}
            .stats {{
                display: flex;
                justify-content: space-around;
                margin: 30px 0;
                flex-wrap: wrap;
                gap: 20px;
            }}
            .stat {{
                text-align: center;
                min-width: 120px;
            }}
            .stat-number {{
                font-size: 2.5em;
                font-weight: bold;
            }}
            .stat-label {{
                opacity: 0.8;
                font-size: 0.9em;
            }}
            .buttons {{
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 30px;
                flex-wrap: wrap;
            }}
            .button {{
                background: white;
                color: #667eea;
                padding: 15px 30px;
                border-radius: 10px;
                text-decoration: none;
                font-weight: bold;
                transition: transform 0.2s;
            }}
            .button:hover {{
                transform: translateY(-2px);
            }}
            .footer {{
                text-align: center;
                margin-top: 40px;
                opacity: 0.7;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="emoji">🏢</div>
            <h1>UoS Scouting Challenge</h1>
            <div class="subtitle">API by Team 67</div>
            
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">{endpoint_count}</div>
                    <div class="stat-label">API Endpoints</div>
                </div>
                <div class="stat">
                    <div class="stat-number">{property_count}</div>
                    <div class="stat-label">Properties</div>
                </div>
                <div class="stat">
                    <div class="stat-number">{landlord_count}</div>
                    <div class="stat-label">Landlords</div>
                </div>
                <div class="stat">
                    <div class="stat-number">{applicant_count}</div>
                    <div class="stat-label">Applicants</div>
                </div>
            </div>
            
            <div class="buttons">
                <a href="/docs" class="button">📖 API Documentation</a>
                <a href="/api/v1/kpis/" class="button">📊 KPI Dashboard</a><a href="/health" class="button">💚 Health Check</a>
                
            </div>
            
            <div class="footer">
                Built with FastAPI • Python • SQLAlchemy<br>
                Hackathon 2025
            </div>
        </div>
    </body>
    </html>
    """


@app.get("/health")
@limiter.limit("60/minute")
def health_check(request: Request, detailed: bool = False):
    """
    Comprehensive health check endpoint.

    Args:
        detailed: Include detailed system metrics and SLO info

    Returns:
        Health status with component checks
    """
    health = get_health_check()
    return health.get_comprehensive_health(include_details=detailed)


# FR-041: Prometheus metrics endpoint configured via instrumentator below
# (no explicit endpoint definition needed)


@app.get("/csrf-token")
@limiter.limit("10/minute")
def get_csrf_token(request: Request, response: Response):
    """
    Get CSRF token for frontend.

    Returns a CSRF token that must be included in state-changing requests.
    The token is also set as a cookie for double-submit verification.
    """
    token = csrf_protection.generate_token()

    # Set cookie (httponly for security)
    response.set_cookie(
        key=csrf_protection.cookie_name,
        value=token,
        httponly=True,
        secure=os.getenv("ENVIRONMENT") == "production",
        samesite="strict",
        max_age=3600,  # 1 hour
    )

    return {"csrf_token": token}


@app.get("/trace")
@limiter.limit("20/minute")
async def trace_request(request: Request):
    """
    Request tracing endpoint for debugging.

    ⚠️ Only available in development/staging environments.
    Provides detailed request information including headers, middleware stack, etc.

    Returns:
        Detailed trace information
    """
    from datetime import datetime, timezone

    tracer = get_request_tracer()
    trace_info = await tracer.trace_request(request)

    if trace_info.get("enabled"):
        trace_info["timestamp"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        trace_info["context"] = tracer.get_context_variables()

    return trace_info


@app.get("/error-budget")
@limiter.limit("60/minute")
def error_budget_status(request: Request):
    """
    Error budget status endpoint.

    Returns current error budget status for all configured SLOs.
    Useful for understanding how much error budget remains and burn rate.

    Returns:
        Error budget calculations with status and burn rate
    """
    from datetime import datetime, timezone

    calculator = get_error_budget_calculator()

    # Get current metrics (in production, fetch from Prometheus)
    # For now, return example calculations based on health check
    health = get_health_check()
    health_data = health.get_comprehensive_health(include_details=False)

    # Calculate example metrics based on database health
    db_status = health_data.get("checks", {}).get("database", {})
    db_latency = db_status.get("latency_ms", 0)

    # Example metrics (in production, fetch from actual metrics store)
    metrics = {
        "API Availability": 0.9995,  # 99.95% uptime (example)
        "API Latency P95": db_latency / 1000,  # Convert to seconds
        "Error Rate": 0.0005,  # 0.05% error rate (example)
    }

    budgets = calculator.get_error_budget_summary(metrics)

    # Format response
    response = {
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "overall_status": "healthy",  # Will be set based on worst SLO
        "slos": [],
    }

    worst_status = "healthy"
    for budget in budgets:
        slo_data = {
            "name": budget.slo_name,
            "type": budget.slo_type.value,
            "target": f"{budget.target * 100:.2f}%"
            if budget.slo_type.value != "latency"
            else f"{budget.target * 1000:.0f}ms",
            "actual": f"{budget.actual * 100:.3f}%"
            if budget.slo_type.value != "latency"
            else f"{budget.actual * 1000:.1f}ms",
            "status": budget.status,
            "budget": {
                "total": f"{budget.budget_total * 100:.3f}%",
                "consumed": f"{budget.budget_consumed * 100:.3f}%",
                "remaining": f"{budget.budget_remaining * 100:.3f}%",
                "remaining_pct": f"{budget.budget_remaining_pct:.1f}%",
            },
            "burn_rate": {
                "current": round(budget.burn_rate, 2),
                "level": budget.burn_rate_level.value,
                "time_to_exhaustion": calculator.format_time_to_exhaustion(
                    budget.time_to_exhaustion_hours
                ),
            },
            "window": {
                "days": budget.window_days,
                "start": budget.window_start.isoformat().replace("+00:00", "Z"),
                "end": budget.window_end.isoformat().replace("+00:00", "Z"),
            },
        }

        response["slos"].append(slo_data)

        # Track worst status
        if budget.status == "critical":
            worst_status = "critical"
        elif budget.status == "warning" and worst_status != "critical":
            worst_status = "warning"

    response["overall_status"] = worst_status

    # Add allowed downtime reference
    response["reference"] = {
        "99.9% SLO": calculator.calculate_allowed_downtime(0.999, 30),
        "99.95% SLO": calculator.calculate_allowed_downtime(0.9995, 30),
        "99.99% SLO": calculator.calculate_allowed_downtime(0.9999, 30),
    }

    return response


# Register all routers
app.include_router(properties.router, prefix="/api/v1")
app.include_router(landlords.router, prefix="/api/v1")
app.include_router(applicants.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(kpis.router, prefix="/api/v1")
app.include_router(events.router, prefix="/api/v1")
