# Backend Utility Scripts

This directory contains utility scripts for operations, monitoring, and analysis.

## Burn Rate Calculator (FR-053)

`calculate_burn_rate.py` - Calculate SLO metrics and burn rates from structured JSON logs.

### Purpose

This script parses structured logs produced by the application's logging middleware to calculate:
- **Availability**: Percentage of successful requests (non-5xx)
- **Error Rate**: Percentage of 5xx errors
- **Latency P95**: 95th percentile latency
- **Burn Rate**: Speed at which error budget is being consumed

### Usage

```bash
# Basic usage - analyze last 24 hours
python scripts/calculate_burn_rate.py logs/app.log

# Analyze specific time window (e.g., last 1 hour)
python scripts/calculate_burn_rate.py logs/app.log --window-hours 1

# Output as JSON for alerting/automation
python scripts/calculate_burn_rate.py logs/app.log --output json

# Help
python scripts/calculate_burn_rate.py --help
```

### Example Output (Text)

```
================================================================================
BURN RATE ANALYSIS FROM LOGS (FR-053)
================================================================================

Time Window: 24 hours
Start: 2025-01-10T00:00:00+00:00
End: 2025-01-11T00:00:00+00:00

Request Summary:
  Total Requests: 15430
  Successful: 15380
  5xx Errors: 50

Calculated Metrics:
  Availability: 0.9968 (99.68%)
  Error Rate: 0.0032 (0.32%)
  Latency P95: 345.20 ms

Error Budget Analysis:
--------------------------------------------------------------------------------

✅ API Availability
  Target: 0.9990 (99.90%)
  Actual: 0.9968 (99.68%)
  Status: HEALTHY
  Budget Remaining: 78.2%
  Burn Rate: 0.44x (safe)

⚠️  Error Rate
  Target: 0.0010 (0.10%)
  Actual: 0.0032 (0.32%)
  Status: WARNING
  Budget Remaining: 35.6%
  Burn Rate: 3.2x (high)
  Time to Exhaustion: 7.3 days
  ⚠️  RECOMMENDATION: Reduce release frequency, increase testing

✅ API Latency P95
  Target: 0.5000 (500.00 ms)
  Actual: 0.3452 (345.20 ms)
  Status: HEALTHY
  Budget Remaining: 95.1%
  Burn Rate: 0.12x (safe)
```

### Example Output (JSON)

```json
{
  "timestamp": "2025-01-11T12:34:56.789Z",
  "metrics": {
    "window": {
      "start": "2025-01-10T00:00:00+00:00",
      "end": "2025-01-11T00:00:00+00:00",
      "hours": 24
    },
    "requests": {
      "total": 15430,
      "successful": 15380,
      "errors_5xx": 50,
      "status_codes": {
        "200": 14280,
        "201": 350,
        "400": 200,
        "404": 550,
        "500": 50
      }
    },
    "availability": 0.9968,
    "error_rate": 0.0032,
    "latency_p95_ms": 345.20
  },
  "error_budgets": [
    {
      "slo_name": "API Availability",
      "slo_type": "availability",
      "target": 0.999,
      "actual": 0.9968,
      "status": "healthy",
      "budget_remaining_pct": 78.2,
      "burn_rate": 0.44,
      "burn_rate_level": "safe"
    }
  ]
}
```

### Integration Examples

#### Cron Job for Daily Analysis

```bash
# Add to crontab for daily burn rate reports
0 9 * * * cd /app/backend && python scripts/calculate_burn_rate.py /var/log/app.log --window-hours 24 | mail -s "Daily Burn Rate Report" ops@example.com
```

#### CI/CD Integration

```yaml
# GitHub Actions workflow
- name: Calculate Burn Rate
  run: |
    python scripts/calculate_burn_rate.py logs/production.log --output json > burn_rate.json

    # Parse and alert if critical
    CRITICAL=$(jq '.error_budgets[] | select(.status == "critical") | .slo_name' burn_rate.json)
    if [ -n "$CRITICAL" ]; then
      echo "::error::Critical error budget exhaustion: $CRITICAL"
      exit 1
    fi
```

#### Prometheus Alerting Alternative

For real-time monitoring, use Prometheus metrics at `/metrics`. This script is useful for:
- Historical analysis of log files
- Backup verification when Prometheus is unavailable
- Cross-validation of Prometheus metrics
- Post-incident analysis from archived logs

### Log Format Requirements

The script expects JSON logs with the following fields:
- `status_code` (int): HTTP status code
- `latency_ms` (float): Request latency in milliseconds
- `timestamp` (str, optional): ISO 8601 timestamp

Example log entry:
```json
{"event": "Request completed", "status_code": 200, "latency_ms": 245.3, "timestamp": "2025-01-11T12:34:56.789Z", "method": "GET", "path": "/api/v1/properties"}
```

### Burn Rate Thresholds

- **Safe** (< 1x): Consuming budget slower than allocated
- **Elevated** (1-2x): Consuming budget at expected rate
- **High** (2-10x): Consuming budget quickly - investigate
- **Critical** (> 10x): Budget will be exhausted soon - halt deployments

### Troubleshooting

**No logs parsed:**
- Check log file path exists
- Verify logs are in JSON format (one JSON object per line)
- Check timestamp format matches ISO 8601

**Inaccurate metrics:**
- Ensure log file covers full time window
- Check for log rotation during analysis period
- Verify `status_code` and `latency_ms` fields are present

**Permission errors:**
- Ensure script has read access to log files
- Run with appropriate user permissions

### Related Documentation

- Error Budget Calculation: `app/observability/error_budget.py`
- Structured Logging: `app/middleware/logging.py`
- Health Endpoint: `app/observability/health.py` (includes error budget summary)

---

## Per-Module Coverage Checker (SC-013)

`check_module_coverage.py` - Enforce coverage thresholds for critical modules.

### Purpose

This script enforces tiered coverage requirements based on module criticality:
- **Critical modules** (85%): Security middleware
- **High-priority modules** (80%): API endpoints, services, observability
- **Standard modules** (75%): Data models
- **Other modules** (70%): General application code
- **Configuration/utilities** (50-60%): Relaxed thresholds

### Usage

```bash
# Check coverage after running tests
pytest --cov=app --cov-report=xml
python scripts/check_module_coverage.py

# Specify custom coverage file
python scripts/check_module_coverage.py --coverage-file build/coverage.xml
```

### Example Output

```
================================================================================
PER-MODULE COVERAGE ENFORCEMENT (SC-013)
================================================================================

🔒 Critical Modules (≥75-85% coverage required):
--------------------------------------------------------------------------------
✅ app/api/v1/applicants.py
   Coverage: 92.45% (threshold: 80.00%)
   Lines: 147/159

✅ app/middleware/logging.py
   Coverage: 88.24% (threshold: 85.00%)
   Lines: 45/51

❌ app/services/matching.py
   Coverage: 72.50% (threshold: 80.00%)
   Lines: 58/80

📦 Standard Modules (≥70% coverage required):
--------------------------------------------------------------------------------
✅ app/models/property.py: 82.14% (92/112 lines)
✅ app/core/database.py: 75.00% (45/60 lines)
   ... (15 standard modules checked)

⚙️  Configuration/Utility Modules (relaxed thresholds):
--------------------------------------------------------------------------------
✅ app/core/config.py: 65.00% (threshold: 60.00%)

================================================================================
Summary: 16/17 modules passed coverage thresholds
================================================================================

❌ FAILURES:
--------------------------------------------------------------------------------
  ❌ app/services/matching.py: 72.50% < 80.00% (covered 58/80 lines)

💡 To improve coverage:
   1. Add tests for uncovered code paths
   2. Check htmlcov/index.html for detailed coverage report
   3. Run: pytest --cov=app --cov-report=html
```

### Integration

This script is automatically run in CI after tests. It will fail the build if any module doesn't meet its threshold.

```yaml
# .github/workflows/backend-ci.yml
- name: Check per-module coverage (SC-013)
  run: |
    uv run python scripts/check_module_coverage.py --coverage-file coverage.xml
```

### Module Categories

**Critical Modules** (80-85% threshold):
- `app/api/` - API endpoints (business logic entry points)
- `app/services/` - Core business logic
- `app/middleware/` - Security and observability middleware
- `app/observability/` - Health checks, metrics, error budgets

**High-Priority Modules** (75% threshold):
- `app/models/` - Data models and schemas
- `app/core/database.py` - Database connection and session management

**Standard Modules** (70% threshold):
- All other application code

**Relaxed Modules** (50-60% threshold):
- `app/core/config.py` - Configuration (mostly constants)
- `app/__init__.py` - Package initialization

### Customizing Thresholds

Edit `scripts/check_module_coverage.py` to adjust thresholds:

```python
CRITICAL_MODULE_THRESHOLDS = {
    "app/api": 80.0,
    "app/services": 80.0,
    "app/middleware": 85.0,
    # Add your critical modules here
}

STANDARD_MODULE_THRESHOLD = 70.0

RELAXED_MODULES = {
    "app/core/config.py": 60.0,
    # Add utilities that don't need high coverage
}
```

### Why Per-Module Coverage?

Global coverage (80%) can hide gaps in critical modules. Per-module enforcement ensures:
- Security-critical code (middleware) has comprehensive tests
- Business logic (services, API endpoints) is well-tested
- Configuration files aren't over-tested at expense of critical code

### Related Documentation

- Pytest Configuration: `pytest.ini`
- CI Workflow: `.github/workflows/backend-ci.yml`
- Coverage Reports: `htmlcov/index.html` (after running tests)
