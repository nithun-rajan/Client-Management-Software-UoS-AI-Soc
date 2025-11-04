# Data Model: DevEx, QA, and Security Infrastructure

**Feature**: 001-devex-qa-security-infra
**Date**: 2025-11-03
**Status**: Complete

## Overview

This document defines the logical data model for DevEx, QA, and Security infrastructure. Most entities are **runtime-only** (not persisted to database) and exist only in logs, metrics, or in-memory state. The focus is on observability and monitoring data structures rather than persistent business entities.

---

## Entities

### 1. LogEntry (Runtime Only - JSON Logs)

**Purpose**: Represents a single structured log record for observability and debugging.

**Storage**: Written to stdout as JSON (ingested by container runtime/log aggregator)

**Fields**:
- `timestamp` (ISO 8601 datetime): When the log entry was created
- `request_id` (UUID string): Unique identifier for request tracing across system
- `level` (enum: INFO, WARNING, ERROR, DEBUG, CRITICAL): Log severity level
- `method` (string): HTTP method (GET, POST, PUT, DELETE, PATCH, OPTIONS)
- `path` (string): Request path (e.g., `/api/v1/properties`)
- `status_code` (integer): HTTP response status code (200, 400, 404, 500, etc.)
- `latency_ms` (float): Request processing time in milliseconds
- `user_id` (string, nullable): User identifier (null until authentication implemented)
- `message` (string): Human-readable log message
- `error_type` (string, nullable): Exception class name (for ERROR level logs)
- `error_message` (string, nullable): Exception message
- `error_stack_trace` (string, nullable): Full stack trace (for ERROR level logs)

**Example**:
```json
{
  "timestamp": "2025-11-03T14:23:45.678Z",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "level": "INFO",
  "method": "GET",
  "path": "/api/v1/properties",
  "status_code": 200,
  "latency_ms": 45.3,
  "user_id": null,
  "message": "Request completed successfully"
}
```

**Validation Rules**:
- `timestamp` MUST be ISO 8601 format with timezone
- `request_id` MUST be valid UUID v4
- `level` MUST be one of: INFO, WARNING, ERROR, DEBUG, CRITICAL
- `status_code` MUST be valid HTTP status code (100-599)
- `latency_ms` MUST be non-negative
- Error fields (`error_type`, `error_message`, `error_stack_trace`) MUST be present when `level` is ERROR or CRITICAL

---

### 2. MetricDataPoint (Runtime Only - Prometheus Metrics)

**Purpose**: Represents a performance measurement exposed via `/metrics` endpoint.

**Storage**: Prometheus time-series database (scraped from `/metrics` endpoint)

**Fields**:
- `timestamp` (Unix timestamp): When the metric was recorded
- `endpoint` (string): API path template (e.g., `/api/v1/properties/{id}`)
- `method` (string): HTTP method (GET, POST, PUT, DELETE)
- `status` (string): HTTP status code (200, 400, 404, 500)
- `metric_type` (enum): Type of metric (request_count, request_duration, active_requests, error_rate)
- `value` (float): Metric value (count, seconds, percentage)
- `percentile` (string, nullable): For duration metrics (p50, p95, p99)

**Metric Types**:
- `request_count`: Total number of requests (counter)
- `request_duration`: Request latency histogram (bucket: p50, p95, p99)
- `active_requests`: Currently in-flight requests (gauge)
- `error_rate`: Percentage of 5xx responses (gauge)

**Prometheus Exposition Format**:
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/api/v1/properties",status="200"} 1234

# HELP http_request_duration_seconds HTTP request latency in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",endpoint="/api/v1/properties",le="0.1"} 980
http_request_duration_seconds_bucket{method="GET",endpoint="/api/v1/properties",le="0.5"} 1200
http_request_duration_seconds_bucket{method="GET",endpoint="/api/v1/properties",le="+Inf"} 1234
```

**Validation Rules**:
- `endpoint` MUST use path templates (not actual IDs: `/api/v1/properties/{id}`, not `/api/v1/properties/123`)
- `method` MUST be valid HTTP method
- `status` MUST be valid HTTP status code
- `value` MUST be non-negative
- `percentile` only applicable when `metric_type` is `request_duration`

---

### 3. SecurityEvent (Runtime Only - Logs)

**Purpose**: Represents blocked malicious requests for security monitoring.

**Storage**: Written to security logs (subset of LogEntry with additional fields)

**Fields**:
- `timestamp` (ISO 8601 datetime): When the attack was blocked
- `request_id` (UUID string): Request identifier for correlation
- `ip_address` (string): Source IP address of attacker
- `attack_type` (enum): Type of attack detected (sql_injection, xss, command_injection, rate_limit_exceeded, invalid_input)
- `blocked_payload` (string): The malicious payload that was rejected (truncated to 1000 chars)
- `endpoint_targeted` (string): API endpoint that was targeted
- `method` (string): HTTP method used
- `user_agent` (string): Browser/client user agent
- `action_taken` (enum): Response action (rejected_400, rejected_429, sanitized, logged_only)

**Example**:
```json
{
  "timestamp": "2025-11-03T14:30:12.456Z",
  "request_id": "660e8400-e29b-41d4-a716-446655440111",
  "ip_address": "192.168.1.100",
  "attack_type": "sql_injection",
  "blocked_payload": "'; DROP TABLE properties; --",
  "endpoint_targeted": "/api/v1/properties",
  "method": "POST",
  "user_agent": "curl/7.68.0",
  "action_taken": "rejected_400"
}
```

**Validation Rules**:
- `ip_address` MUST be valid IPv4 or IPv6 address
- `attack_type` MUST be one of: sql_injection, xss, command_injection, rate_limit_exceeded, invalid_input
- `blocked_payload` MUST be truncated to max 1000 characters
- `action_taken` MUST be one of: rejected_400, rejected_429, sanitized, logged_only

---

### 4. ErrorBudget (In-Memory / File-based State)

**Purpose**: Tracks SLO compliance and error budget consumption over rolling 30-day window.

**Storage**: JSON file (`error_budget_state.json`) updated by `check-error-budget.py` script

**Fields**:
- `measurement_period_days` (integer): Rolling window size (default: 30 days)
- `slo_target_uptime` (float): Uptime SLO target (0.999 = 99.9%)
- `slo_target_latency_p95_ms` (float): P95 latency SLO target (500ms)
- `slo_target_error_rate` (float): Error rate SLO target (0.001 = 0.1%)
- `current_uptime` (float): Actual uptime over measurement period (calculated from logs)
- `current_latency_p95_ms` (float): Actual P95 latency over measurement period
- `current_error_rate` (float): Actual error rate over measurement period
- `uptime_budget_consumed_pct` (float): Percentage of uptime budget consumed (0-100)
- `latency_budget_consumed_pct` (float): Percentage of latency budget consumed (0-100)
- `error_rate_budget_consumed_pct` (float): Percentage of error rate budget consumed (0-100)
- `burn_rate` (float): Current rate of budget consumption (1.0 = steady, >1.0 = accelerating)
- `remaining_downtime_minutes` (float): Allowed downtime remaining in period (43.8 min/month for 99.9%)
- `last_updated` (ISO 8601 datetime): When the budget was last calculated

**Example**:
```json
{
  "measurement_period_days": 30,
  "slo_target_uptime": 0.999,
  "slo_target_latency_p95_ms": 500,
  "slo_target_error_rate": 0.001,
  "current_uptime": 0.9995,
  "current_latency_p95_ms": 423,
  "current_error_rate": 0.0008,
  "uptime_budget_consumed_pct": 0,
  "latency_budget_consumed_pct": 0,
  "error_rate_budget_consumed_pct": 0,
  "burn_rate": 0.5,
  "remaining_downtime_minutes": 43.8,
  "last_updated": "2025-11-03T14:00:00Z"
}
```

**Calculation Formula**:
```
uptime_budget_consumed_pct = ((1 - current_uptime) / (1 - slo_target_uptime)) * 100
```

**Validation Rules**:
- `slo_target_uptime` MUST be between 0 and 1 (typically 0.99-0.9999)
- `slo_target_latency_p95_ms` MUST be positive
- `slo_target_error_rate` MUST be between 0 and 1
- `current_*` values MUST be calculated from actual log data
- `burn_rate` = 0 means no budget consumption, 1.0 = steady, >1.0 = accelerating

---

### 5. PipelineJob (GitHub Actions Metadata - Not Stored)

**Purpose**: Represents a CI/CD pipeline execution for tracking build status.

**Storage**: GitHub Actions API (queried via API, not stored in our database)

**Fields**:
- `run_id` (integer): GitHub Actions workflow run ID
- `branch` (string): Git branch name
- `commit_sha` (string): Git commit SHA
- `status` (enum): Pipeline status (queued, in_progress, completed, failed, cancelled)
- `started_at` (ISO 8601 datetime): When the pipeline started
- `completed_at` (ISO 8601 datetime, nullable): When the pipeline finished
- `duration_seconds` (integer): Total pipeline duration
- `logs_url` (string): URL to GitHub Actions logs
- `lint_passed` (boolean): Whether linting checks passed
- `type_check_passed` (boolean): Whether type checking passed
- `tests_passed` (boolean): Whether tests passed
- `coverage_pct` (float): Test coverage percentage
- `contract_check_passed` (boolean): Whether OpenAPI contract check passed

**Example**:
```json
{
  "run_id": 1234567890,
  "branch": "001-devex-qa-security-infra",
  "commit_sha": "a1b2c3d4e5f6g7h8i9j0",
  "status": "completed",
  "started_at": "2025-11-03T14:00:00Z",
  "completed_at": "2025-11-03T14:02:30Z",
  "duration_seconds": 150,
  "logs_url": "https://github.com/org/repo/actions/runs/1234567890",
  "lint_passed": true,
  "type_check_passed": true,
  "tests_passed": true,
  "coverage_pct": 82.5,
  "contract_check_passed": true
}
```

**Validation Rules**:
- `status` MUST be one of: queued, in_progress, completed, failed, cancelled
- `duration_seconds` = `completed_at` - `started_at` (in seconds)
- `coverage_pct` MUST be between 0 and 100

---

### 6. PreviewDeployment (Vercel/Railway Metadata - Not Stored)

**Purpose**: Represents an ephemeral preview environment for a pull request.

**Storage**: Vercel API / Railway API (queried via API, not stored in our database)

**Fields**:
- `pr_number` (integer): GitHub pull request number
- `frontend_url` (string): Vercel preview URL (e.g., `https://crm-pr-123.vercel.app`)
- `backend_url` (string, nullable): Railway preview URL (if backend deployed)
- `created_at` (ISO 8601 datetime): When the preview was deployed
- `deleted_at` (ISO 8601 datetime, nullable): When the preview was deleted
- `status` (enum): Deployment status (building, ready, error, deleted)
- `commit_sha` (string): Git commit SHA deployed
- `environment_vars` (dict): Preview-specific environment variables (masked)

**Example**:
```json
{
  "pr_number": 123,
  "frontend_url": "https://client-management-pr-123.vercel.app",
  "backend_url": "https://client-management-backend-pr-123.railway.app",
  "created_at": "2025-11-03T14:00:00Z",
  "deleted_at": null,
  "status": "ready",
  "commit_sha": "a1b2c3d4e5f6g7h8i9j0",
  "environment_vars": {
    "DATABASE_URL": "***MASKED***",
    "API_BASE_URL": "https://client-management-backend-pr-123.railway.app"
  }
}
```

**Validation Rules**:
- `pr_number` MUST be positive integer
- `frontend_url` MUST be valid HTTPS URL
- `status` MUST be one of: building, ready, error, deleted
- `deleted_at` MUST be null if status is not `deleted`
- `environment_vars` MUST mask sensitive values (password, api_key, secret)

---

## Entity Relationships

**LogEntry → MetricDataPoint**: Logs are aggregated into metrics (many-to-one)
- Logs with `status_code` 200-299 → contribute to `request_count` with `status="200"`
- Logs with `status_code` 500-599 → contribute to `error_rate` metric
- Logs with `latency_ms` → contribute to `request_duration` histogram

**LogEntry → SecurityEvent**: Malicious requests generate both a log entry and a security event
- Security events are a specialized type of log entry with additional attack details

**LogEntry → ErrorBudget**: Logs are the source data for error budget calculations
- All logs in 30-day window are analyzed to calculate `current_uptime`, `current_latency_p95_ms`, `current_error_rate`
- Error budget script reads logs from stdout/file and generates `ErrorBudget` JSON

**PipelineJob → PreviewDeployment**: Successful pipeline run may trigger preview deployment
- If `status="completed"` and `tests_passed=true`, GitHub Actions can trigger Vercel deployment
- `commit_sha` links pipeline run to preview deployment

---

## Non-Persistent Design Rationale

**Why not store in database?**

1. **Performance**: Metrics and logs are high-volume (1000s/day). Database writes would slow down request processing.
2. **Separation of Concerns**: Observability data is ephemeral (30-day retention). Business data (properties, landlords) is permanent.
3. **Tool Integration**: Prometheus, Grafana, Loki are purpose-built for metrics/logs. SQL databases are not optimized for time-series data.
4. **Simplicity**: No schema migrations needed for observability changes. JSON logs are self-describing.

**When to persist?**

- If error budget needs to be tracked historically (>30 days), consider persisting `ErrorBudget` snapshots to database
- If security events need long-term audit trail, consider persisting `SecurityEvent` to database with retention policy

---

## Future Enhancements

1. **Add `Trace` entity**: If distributed tracing (Jaeger/Zipkin) is implemented, add `Trace` and `Span` entities
2. **Add `Alert` entity**: If alerting is implemented (Slack/PagerDuty), track alert history
3. **Add `Incident` entity**: For tracking production incidents linked to error budget consumption
4. **Persist SecurityEvent**: Store security events in database for compliance/audit trail (GDPR, SOC2)
