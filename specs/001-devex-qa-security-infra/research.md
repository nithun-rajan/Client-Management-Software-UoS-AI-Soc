# Research & Technology Decisions

**Feature**: DevEx, QA, and Security Infrastructure
**Date**: 2025-11-03
**Status**: Complete

## Overview

This document contains research findings and technology decisions for implementing comprehensive DevEx, QA, and Security infrastructure. All decisions prioritize simplicity, minimal dependencies, and alignment with the existing FastAPI/React tech stack.

---

## 1. Rate Limiting Strategy

**Decision**: slowapi (in-memory, FastAPI middleware)

**Rationale**:
- **slowapi** is a FastAPI-specific port of Flask-Limiter with native async support
- In-memory storage sufficient for MVP (no Redis dependency, simpler deployment)
- Supports per-IP rate limiting out of the box
- Provides rate limit headers (`X-RateLimit-*`) and Retry-After automatically
- Easy configuration: decorator-based (`@limiter.limit("100/minute")`)
- Can later upgrade to Redis backend if distributed rate limiting needed

**Alternatives Considered**:
- **fastapi-limiter** (Redis-required): More complex setup, adds Redis dependency
- **aiohttp-rate-limit**: Not FastAPI-specific, requires custom integration
- **Custom middleware**: Reinventing the wheel, more maintenance burden

**Implementation Details**:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

---

## 2. Structured Logging Format

**Decision**: structlog with custom JSON renderer (ECS-inspired schema)

**Rationale**:
- **structlog** provides structured logging with minimal performance overhead (<5ms/request)
- JSON output is machine-parsable for log aggregation (ELK, Loki, CloudWatch)
- ECS (Elastic Common Schema) inspired format ensures compatibility with observability tools
- Supports context binding (`structlog.contextvars` for request ID propagation)
- No external service dependencies (logs to stdout, ingested by container runtime)

**Log Schema**:
```json
{
  "timestamp": "2025-11-03T14:23:45.678Z",
  "level": "INFO",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "path": "/api/v1/properties",
  "status_code": 200,
  "latency_ms": 45,
  "user_id": null,
  "message": "Request completed",
  "error": null
}
```

**Alternatives Considered**:
- **python-json-logger**: Less feature-rich than structlog, no context binding
- **OpenTelemetry logging**: Overkill for MVP, requires OTEL collector setup
- **Standard logging with JSON formatter**: Manual work to add request context

**Implementation Details**:
```python
import structlog
from contextvars import ContextVar

request_id_ctx_var = ContextVar("request_id", default=None)

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
)
```

---

## 3. Metrics Cardinality

**Decision**: prometheus-fastapi-instrumentator with endpoint+method+status labels

**Rationale**:
- **prometheus-fastapi-instrumentator** is the standard for FastAPI metrics
- Provides default metrics: request count, duration histograms (P50/P95/P99), in-progress requests
- Label cardinality: `endpoint`, `method`, `status` (safe cardinality, ~20 endpoints × 5 methods × 6 status codes = 600 series)
- Avoids high-cardinality labels (user_id, session_id) that cause Prometheus performance issues
- Exposes `/metrics` endpoint in Prometheus text format (standard)

**Label Strategy**:
- `endpoint`: API path template (e.g., `/api/v1/properties/{id}`, not `/api/v1/properties/123`)
- `method`: HTTP method (GET, POST, PUT, DELETE, PATCH)
- `status`: HTTP status code (200, 400, 404, 500, etc.)

**Alternatives Considered**:
- **Custom Prometheus client**: More control but more boilerplate code
- **OpenTelemetry metrics**: Requires OTEL collector, overkill for MVP
- **Datadog/New Relic**: Proprietary, expensive, not open-source

**Implementation Details**:
```python
from prometheus_fastapi_instrumentator import Instrumentator

instrumentator = Instrumentator(
    should_group_status_codes=False,
    should_ignore_untemplated=True,
    should_respect_env_var=True,
    excluded_handlers=["/metrics"],
    env_var_name="ENABLE_METRICS"
)

instrumentator.instrument(app).expose(app)
```

---

## 4. OpenAPI Diff Tool

**Decision**: openapi-diff (npm package)

**Rationale**:
- **openapi-diff** is a mature CLI tool with clear breaking change detection
- Outputs JSON report: `breaking`, `non-breaking`, `unclassified` changes
- Works with OpenAPI 3.0/3.1 (FastAPI generates OpenAPI 3.1 by default)
- No Python dependency conflicts (runs as npm package in CI)
- Simple integration: `npx openapi-diff main-spec.json pr-spec.json`

**Breaking Change Detection**:
- Removed endpoints
- Removed required fields from request/response
- Changed field types (string → number)
- Removed enum values
- Changed authentication requirements

**Alternatives Considered**:
- **oasdiff**: Go-based, similar features but less npm ecosystem integration
- **openapitools/openapi-diff**: Java-based, heavy dependency
- **Custom Python script**: Reinventing the wheel, complex to handle all edge cases

**CI Integration**:
```yaml
- name: Check API Contract
  run: |
    curl http://localhost:8000/openapi.json > pr-spec.json
    npx openapi-diff specs/001-devex-qa-security-infra/contracts/openapi-baseline.json pr-spec.json --fail-on-incompatible
```

---

## 5. Preview Deployment Backend

**Decision**: Railway (with documentation, not full automation)

**Rationale**:
- **Railway** has better free tier than Render (500 hours/month vs. 750 hours/month, but simpler UX)
- Supports GitHub integration (auto-deploy on PR)
- Provides unique URLs per deployment (`https://project-pr-123.railway.app`)
- Simpler database setup (built-in PostgreSQL, though we use SQLite)
- CLI available for scripting (`railway up`)

**Initial Approach**: Documentation only (not full automation)
- Provide step-by-step guide in `docs/preview-deployments.md`
- Developer manually runs `railway up` from PR branch
- Future enhancement: GitHub Actions automation

**Alternatives Considered**:
- **Render**: Similar features, slightly better free tier, but more complex UI
- **Heroku**: Discontinued free tier, not suitable for preview deployments
- **Fly.io**: More complex setup, less GitHub integration

**Manual Deployment Steps** (documented in quickstart):
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Deploy from PR branch: `railway up`
4. Post preview URL in PR comment manually

---

## 6. Pre-commit Hook Framework

**Decision**: husky (Node.js pre-commit hooks)

**Rationale**:
- **husky** is already Node.js ecosystem (frontend uses npm)
- Simpler than Python pre-commit framework (no additional language dependency)
- Works cross-platform (Windows, macOS, Linux)
- Easy to configure: `.husky/pre-commit` script
- Integrates with npm lifecycle hooks (`npm run prepare`)

**Hook Actions**:
- Check for `.env` files: `git diff --cached --name-only | grep -E '\.env$' && exit 1`
- Check for secrets patterns: `git diff --cached | grep -E '(password|api_key|secret)' && exit 1` (basic check)

**Alternatives Considered**:
- **pre-commit (Python)**: Requires Python on all developer machines, more complex config (`.pre-commit-config.yaml`)
- **Manual git hooks**: No versioning, developers must copy hooks manually
- **lefthook**: Similar to husky, less popular in ecosystem

**Implementation**:
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check for .env files
if git diff --cached --name-only | grep -E '\.env$'; then
  echo "Error: Attempting to commit .env file!"
  exit 1
fi
```

---

## 7. Error Budget Calculation

**Decision**: Calculate from structured logs with Python script (no external database)

**Rationale**:
- **Simple approach**: Parse JSON logs, calculate uptime/latency/error rate over rolling 30-day window
- No additional database required (logs already exist in stdout/files)
- Python script can be run on-demand or scheduled (cron, GitHub Actions)
- Stores minimal state (last 30 days of aggregated metrics in JSON file)

**Calculation Algorithm**:
```python
def calculate_error_budget(logs):
    total_requests = len(logs)
    error_requests = len([l for l in logs if l['status_code'] >= 500])

    uptime_pct = 1 - (error_requests / total_requests)
    slo_uptime = 0.999  # 99.9%
    budget_consumed_pct = (1 - uptime_pct) / (1 - slo_uptime) * 100

    return {
        "uptime_pct": uptime_pct,
        "slo_uptime": slo_uptime,
        "budget_consumed_pct": budget_consumed_pct,
        "remaining_downtime_minutes": (1 - uptime_pct) * 43.8  # 43.8 min/month allowed
    }
```

**Alternatives Considered**:
- **Prometheus Alertmanager**: Requires Prometheus setup, more complex for MVP
- **External SLO tools** (Nobl9, Lightstep): Proprietary, expensive, overkill
- **Store in database**: Additional schema, more complex queries

---

## 8. Security Header CSP

**Decision**: Permissive CSP for development, strict for production

**Development CSP** (allows Vite HMR, Tailwind inline styles):
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ws: wss:;
```

**Production CSP** (strict, no unsafe-inline):
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; connect-src 'self';
```

**Rationale**:
- **Development**: `unsafe-inline` needed for Vite HMR and TailwindCSS JIT compilation
- **Production**: Remove `unsafe-inline` to prevent XSS attacks
- Use environment variable (`ENV=development|production`) to toggle CSP strictness

**Other Security Headers** (same for dev/prod):
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HTTPS only)
- `X-Frame-Options: DENY` (prevent clickjacking)
- `X-Content-Type-Options: nosniff` (prevent MIME sniffing)
- `X-XSS-Protection: 1; mode=block` (legacy XSS protection)

**Alternatives Considered**:
- **Nonce-based CSP**: More secure but requires coordinating nonces between backend and frontend build
- **Strict CSP in dev**: Breaks Vite HMR, poor developer experience

---

## 9. Request ID Propagation

**Decision**: contextvars (Python 3.7+ standard, thread-safe)

**Rationale**:
- **contextvars** is built into Python 3.7+, no external dependency
- Automatically propagates context across async/await boundaries
- Thread-safe for concurrent requests
- No need to pass `request_id` through function arguments (reduces boilerplate)

**Usage Pattern**:
```python
from contextvars import ContextVar

request_id_ctx_var = ContextVar("request_id", default=None)

# In middleware:
request_id = str(uuid.uuid4())
request_id_ctx_var.set(request_id)

# In any function:
current_request_id = request_id_ctx_var.get()
logger.info("Processing request", request_id=current_request_id)
```

**Alternatives Considered**:
- **threading.local**: Not safe for async code (asyncio tasks share threads)
- **Pass through function args**: Too much boilerplate, clutters function signatures
- **Global variable**: Not thread-safe, causes race conditions

---

## 10. Test Coverage Thresholds

**Decision**: Per-module thresholds (critical ≥80%, others ≥60%)

**Critical Modules** (≥80% coverage required):
- `app/api/v1/` (all API endpoints)
- `app/middleware/` (security, logging, metrics)
- `app/core/rate_limit.py`
- `app/core/slo.py`

**Standard Modules** (≥60% coverage required):
- `app/models/` (SQLAlchemy models - mostly declarative)
- `app/schemas/` (Pydantic schemas - mostly declarative)

**pytest.ini Configuration**:
```ini
[tool:pytest]
addopts =
    --cov=app
    --cov-report=term-missing
    --cov-report=html
    --cov-fail-under=70
    --cov-branch

[coverage:run]
source = app
omit = app/tests/*

[coverage:report]
exclude_lines =
    pragma: no cover
    def __repr__
    raise NotImplementedError
    if TYPE_CHECKING:
```

**Rationale**:
- **Per-module**: More granular than global threshold, highlights weak areas
- **Critical modules higher**: API endpoints and security code require stricter testing
- **Models/schemas lower**: Mostly declarative code, less logic to test
- **Branch coverage**: Ensures all code paths tested, not just line coverage

**Alternatives Considered**:
- **Global 80% threshold**: Too strict for declarative code, not strict enough for critical code
- **No thresholds**: No enforcement, coverage can silently drop
- **100% coverage**: Unrealistic, diminishing returns on effort

---

## Implementation Priority

**Phase 1 (Quick Wins)**: Security headers, rate limiting, pre-commit hooks (1-2 hours)
**Phase 2 (Foundation)**: Structured logging, metrics, request ID propagation (2-3 hours)
**Phase 3 (CI/CD)**: GitHub Actions workflow, OpenAPI diff checker (2 hours)
**Phase 4 (Preview)**: Vercel config, Railway documentation (1 hour)
**Phase 5 (Monitoring)**: Error budget script, /health endpoint enhancements (1 hour)

**Total Estimated Time**: 7-9 hours of focused development work

---

## Risk Mitigation

**Risk**: Rate limiting in-memory storage lost on server restart
**Mitigation**: Acceptable for MVP. Document Redis upgrade path in `docs/scaling.md`

**Risk**: Log volume grows unbounded, fills disk
**Mitigation**: Implement log rotation (logrotate or Python logging.handlers.RotatingFileHandler)

**Risk**: Prometheus metrics high cardinality causes memory issues
**Mitigation**: Limit labels to low-cardinality fields (endpoint template, not user_id)

**Risk**: Preview deployments cost exceeds free tier
**Mitigation**: Document manual deployment process, auto-cleanup after PR merge

**Risk**: CSP breaks frontend in production
**Mitigation**: Test CSP in staging environment before enabling in production

---

## References

- [slowapi Documentation](https://github.com/laurentS/slowapi)
- [structlog Documentation](https://www.structlog.org/)
- [prometheus-fastapi-instrumentator](https://github.com/trallnag/prometheus-fastapi-instrumentator)
- [openapi-diff](https://github.com/Azure/openapi-diff)
- [Railway Documentation](https://docs.railway.app/)
- [MDN CSP Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Python contextvars](https://docs.python.org/3/library/contextvars.html)
