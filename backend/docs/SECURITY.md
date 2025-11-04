# Security Infrastructure

This document describes the security infrastructure implemented in the Estate Agent CRM backend.

## Table of Contents

1. [Overview](#overview)
2. [Rate Limiting](#rate-limiting)
3. [Input Validation & Sanitization](#input-validation--sanitization)
4. [CSRF Protection](#csrf-protection)
5. [Security Headers](#security-headers)
6. [Security Event Logging](#security-event-logging)
7. [Configuration](#configuration)
8. [Testing](#testing)
9. [Best Practices](#best-practices)

## Overview

The security infrastructure provides defense-in-depth protection against common web vulnerabilities:

- **Rate Limiting**: Prevents abuse and DoS attacks
- **Input Validation**: Detects and blocks SQL injection, XSS, and other injection attacks
- **CSRF Protection**: Double-submit cookie pattern for state-changing operations
- **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- **Security Event Logging**: Structured logging of security-related events

## Rate Limiting

### Implementation

Rate limiting is implemented using [slowapi](https://github.com/laurentS/slowapi) with configurable backends:

- **Development**: In-memory storage (not shared across workers)
- **Production**: Redis backend (recommended for multi-worker deployments)

### Configuration

```bash
# .env
RATE_LIMIT_DEFAULT=100/minute
RATE_LIMIT_STORAGE_URI=memory://  # or redis://localhost:6379
```

### Usage

```python
from app.middleware.rate_limit import limiter

@app.get("/api/endpoint")
@limiter.limit("10/minute")
def my_endpoint(request: Request):
    return {"message": "success"}
```

### Per-IP Rate Limiting

Rate limits are applied per client IP address, automatically extracting from:
1. `X-Forwarded-For` header (if behind proxy/load balancer)
2. Direct remote address

### Excluded Paths

The following paths bypass rate limiting:
- `/metrics` - Prometheus metrics endpoint
- `/health` - Health check endpoint
- `/docs` - API documentation
- `/openapi.json` - OpenAPI specification

### Rate Limit Headers

Responses include rate limit information:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Time when limit resets

## Input Validation & Sanitization

### Available Utilities

#### HTML Sanitization

```python
from app.security import sanitize_html

# Escape HTML special characters
safe_text = sanitize_html("<script>alert('xss')</script>")
# Returns: &lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;
```

#### SQL Injection Detection

```python
from app.security import detect_sql_injection

# Detect SQL injection attempts
is_malicious = detect_sql_injection("'; DROP TABLE users;--")
# Returns: True
```

**Note**: This is defense-in-depth. Primary protection is parameterized queries via SQLAlchemy.

#### XSS Detection

```python
from app.security import detect_xss

# Detect XSS attempts
is_malicious = detect_xss("<script>alert(1)</script>")
# Returns: True
```

#### Filename Sanitization

```python
from app.security import sanitize_filename

# Sanitize user-provided filenames
safe_name = sanitize_filename("../../../etc/passwd")
# Returns: etc_passwd (path traversal removed)
```

#### Search Query Sanitization

```python
from app.security import sanitize_search_query

# Sanitize search input
safe_query = sanitize_search_query("property<script>", max_length=100)
# Returns: propertyscript
```

#### Dictionary Sanitization

```python
from app.security import sanitize_dict

# Recursively sanitize all string values in dict
data = {"name": "<script>hack</script>", "age": 25}
safe_data = sanitize_dict(data)
# Returns: {"name": "&lt;script&gt;hack&lt;/script&gt;", "age": 25}
```

### Validation Patterns Detected

**SQL Injection**:
- `UNION SELECT` statements
- `OR 1=1` conditions
- Comment injection (`--`, `/* */`)
- `DROP TABLE` statements
- String termination attempts

**XSS**:
- `<script>` tags
- `javascript:` protocol
- Event handlers (`onerror`, `onload`, `onclick`)
- Dangerous tags (`<iframe>`, `<object>`, `<embed>`)

## CSRF Protection

### Double-Submit Cookie Pattern

CSRF protection uses a stateless double-submit cookie approach:

1. Client requests CSRF token from `/csrf-token`
2. Server generates signed token, sends as both cookie and response body
3. Client includes token in `X-CSRF-Token` header for state-changing requests
4. Server validates token matches cookie and signature is valid

### Getting a CSRF Token

```bash
curl http://localhost:8000/csrf-token
```

```json
{
  "csrf_token": "random_token.signature"
}
```

The token is also set as an httponly cookie: `csrf_token`.

### Using CSRF Protection

```python
from fastapi import Depends
from app.security.csrf import get_csrf_protection

csrf_protection = get_csrf_protection(secret_key=os.getenv("SECRET_KEY"))

@app.post("/api/protected")
async def protected_endpoint(
    csrf_check=Depends(csrf_protection.validate_csrf)
):
    # This endpoint is protected by CSRF validation
    return {"message": "success"}
```

### Frontend Integration

```javascript
// Get CSRF token
const response = await fetch('/csrf-token');
const { csrf_token } = await response.json();

// Include in state-changing requests
await fetch('/api/protected', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrf_token,
  },
  credentials: 'include',  // Include cookies
});
```

### Safe Methods

GET, HEAD, and OPTIONS requests bypass CSRF validation automatically.

## Security Headers

### Implemented Headers

#### Content Security Policy (CSP)

**Development**:
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
connect-src 'self' ws: wss:;
style-src 'self' 'unsafe-inline';
```

**Production**:
```
default-src 'self';
script-src 'self';
style-src 'self';
img-src 'self' data: https:;
connect-src 'self' https:;
```

#### Other Security Headers

- **Strict-Transport-Security** (production only): `max-age=31536000; includeSubDomains`
- **X-Frame-Options**: `DENY`
- **X-Content-Type-Options**: `nosniff`
- **X-XSS-Protection**: `1; mode=block`
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Permissions-Policy**: Restrictive feature policy

### Environment-Aware Configuration

Security headers adapt based on `ENVIRONMENT` variable:
- `development`: Permissive CSP for Vite HMR
- `production`: Strict CSP, HSTS enabled

## Security Event Logging

### Event Types

```python
class SecurityEventType(str, Enum):
    AUTH_SUCCESS = "auth.success"
    AUTH_FAILURE = "auth.failure"
    SQL_INJECTION_ATTEMPT = "injection.sql"
    XSS_ATTEMPT = "injection.xss"
    CSRF_VALIDATION_FAILED = "csrf.failed"
    RATE_LIMIT_EXCEEDED = "rate_limit.exceeded"
    SUSPICIOUS_ACTIVITY = "suspicious"
```

### Severity Levels

- **LOW**: Rate limit exceeded, routine failures
- **MEDIUM**: Authentication failures, CSRF failures
- **HIGH**: Injection attempts, suspicious activity
- **CRITICAL**: Multiple coordinated attacks, security breaches

### Usage Examples

#### Log Authentication Failure

```python
from app.security.events import log_auth_failure

log_auth_failure(
    request=request,
    username="attacker",
    reason="Invalid password"
)
```

#### Log Injection Attempt

```python
from app.security.events import log_injection_attempt

log_injection_attempt(
    request=request,
    injection_type="SQL",
    field_name="search_query",
    suspicious_value="'; DROP TABLE users;--"
)
```

#### Log Custom Security Event

```python
from app.security.events import (
    log_security_event,
    SecurityEventType,
    SecurityEventSeverity
)

log_security_event(
    event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
    severity=SecurityEventSeverity.HIGH,
    message="Multiple failed login attempts",
    request=request,
    user_id="user123",
    additional_data={"attempt_count": 5}
)
```

### Log Format

Security events are logged in structured JSON format:

```json
{
  "event": "Security event",
  "event_type": "injection.sql",
  "severity": "high",
  "message": "Potential SQL injection attempt detected",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "client_ip": "192.168.1.100",
  "user_agent": "Mozilla/5.0",
  "method": "POST",
  "path": "/api/v1/search",
  "additional_data": {
    "field_name": "query",
    "suspicious_value": "'; DROP TABLE users;--"
  },
  "timestamp": "2025-01-15T10:30:45.123Z",
  "level": "error"
}
```

## Configuration

### Environment Variables

```bash
# Security Settings
SECRET_KEY=your-secret-key-here  # CRITICAL: Change in production!
ENVIRONMENT=development          # development | staging | production
CSP_MODE=permissive             # permissive | strict

# Rate Limiting
RATE_LIMIT_DEFAULT=100/minute
RATE_LIMIT_STORAGE_URI=memory://  # memory:// | redis://host:port

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Secret Key Generation

Generate a secure secret key:

```bash
openssl rand -hex 32
```

Update `.env`:
```bash
SECRET_KEY=<generated-key>
```

## Testing

### Running Security Tests

```bash
# Run all security tests
uv run pytest tests/security/ -v

# Run specific test file
uv run pytest tests/security/test_rate_limit.py -v

# Run with coverage
uv run pytest tests/security/ --cov=app/security --cov=app/middleware/rate_limit
```

### Test Coverage

Current security test coverage:
- **85 tests** covering all security features
- **100% coverage** of security utilities
- **78% coverage** of rate limiting middleware
- Tests include: unit tests, integration tests, security property tests

### Example Security Test

```python
def test_detects_sql_injection():
    """Test detection of SQL injection attempts."""
    assert detect_sql_injection("1 UNION SELECT * FROM users") is True
    assert detect_sql_injection("normal query") is False
```

## Best Practices

### Input Validation

1. **Always validate at the API boundary**
   ```python
   from pydantic import BaseModel, validator
   from app.security import detect_sql_injection, detect_xss

   class SearchRequest(BaseModel):
       query: str

       @validator('query')
       def validate_query(cls, v):
           if detect_sql_injection(v) or detect_xss(v):
               raise ValueError("Malicious input detected")
           return sanitize_search_query(v)
   ```

2. **Use parameterized queries** (SQLAlchemy does this automatically)
   ```python
   # Good
   db.query(User).filter(User.email == email).first()

   # Bad
   db.execute(f"SELECT * FROM users WHERE email = '{email}'")
   ```

3. **Sanitize output** when displaying user-generated content
   ```python
   from app.security import sanitize_html

   safe_description = sanitize_html(property.description)
   ```

### Rate Limiting

1. **Apply rate limits to sensitive endpoints**
   ```python
   @app.post("/api/v1/login")
   @limiter.limit("5/minute")  # Strict limit for authentication
   async def login(request: Request, credentials: LoginRequest):
       ...
   ```

2. **Use tiered rate limits**
   ```python
   # Public endpoints
   @limiter.limit("100/minute")

   # Authenticated endpoints
   @limiter.limit("1000/minute")

   # Administrative endpoints
   @limiter.limit("10/minute")
   ```

3. **Monitor rate limit metrics** via Prometheus `/metrics`

### CSRF Protection

1. **Require CSRF tokens for state-changing operations**
   ```python
   @app.post("/api/v1/properties")
   async def create_property(
       property_data: PropertyCreate,
       csrf_check=Depends(csrf_protection.validate_csrf)
   ):
       ...
   ```

2. **Frontend must include CSRF token in headers**
   ```javascript
   headers: {
       'X-CSRF-Token': csrfToken,
   }
   ```

### Security Headers

1. **Review CSP violations in production logs**
2. **Test CSP in development** before deploying strict policy
3. **Enable HSTS only after** testing HTTPS configuration

### Security Logging

1. **Log all security events** with appropriate severity
2. **Include context** (user ID, IP, request ID) for correlation
3. **Set up alerts** for high/critical severity events
4. **Review security logs regularly** for patterns

### Secret Management

1. **Never commit secrets** to version control
2. **Use environment variables** for configuration
3. **Rotate secrets regularly**
4. **Use different secrets** for each environment

## Monitoring & Alerting

### Prometheus Metrics

Security-related metrics exposed at `/metrics`:

- `http_requests_total{status="429"}` - Rate limit violations
- `http_requests_total{status="403"}` - CSRF failures
- `http_request_duration_seconds` - Request latency

### Log Aggregation

Security events can be aggregated using:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Splunk**
- **Datadog**
- **CloudWatch** (AWS)

Filter by `event_type` field for security event analysis.

### Recommended Alerts

1. **High rate of authentication failures** (potential brute force)
2. **SQL injection attempts detected** (active attack)
3. **Unusual spike in rate limit violations** (potential DoS)
4. **CSRF validation failures** (misconfiguration or attack)

## Compliance

### OWASP Top 10 Coverage

- ✅ **A01:2021 Broken Access Control** - CSRF protection, rate limiting
- ✅ **A03:2021 Injection** - Input validation, parameterized queries
- ✅ **A05:2021 Security Misconfiguration** - Security headers, safe defaults
- ✅ **A07:2021 Identification and Authentication Failures** - Rate limiting, logging

### Security Headers Compliance

- ✅ **Mozilla Observatory** compatible CSP
- ✅ **OWASP Secure Headers Project** guidelines
- ✅ **Security Headers** (securityheaders.com) A+ rating potential

## Incident Response

### If Security Event Occurs

1. **Check security logs** for event details
   ```bash
   grep "Security event" logs/app.log | jq 'select(.severity=="high")'
   ```

2. **Identify affected users/data** using `request_id` correlation

3. **Block malicious IPs** via firewall/load balancer

4. **Review and update** security rules if needed

5. **Document incident** and update runbook

## Further Reading

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [slowapi Documentation](https://github.com/laurentS/slowapi)
- [Content Security Policy Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
