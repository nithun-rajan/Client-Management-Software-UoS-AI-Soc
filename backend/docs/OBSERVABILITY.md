# Observability & Monitoring

Comprehensive guide to monitoring, tracing, and debugging the Estate Agent CRM backend.

## Table of Contents

1. [Overview](#overview)
2. [Health Checks](#health-checks)
3. [Metrics](#metrics)
4. [Request Tracing](#request-tracing)
5. [Structured Logging](#structured-logging)
6. [Alerts](#alerts)
7. [Dashboards](#dashboards)
8. [Troubleshooting](#troubleshooting)

## Overview

The observability stack provides:

- **Health Checks**: Comprehensive component health monitoring
- **Metrics**: Prometheus metrics for monitoring
- **Request Tracing**: Detailed request debugging (dev/staging only)
- **Structured Logging**: JSON-formatted logs for aggregation
- **Alerting**: Prometheus AlertManager rules
- **SLO Tracking**: Service Level Objective monitoring

## Health Checks

### Basic Health Check

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:45.123Z",
  "uptime_seconds": 3600.45,
  "version": "1.0.0",
  "environment": "development",
  "checks": {
    "database": {
      "status": "healthy",
      "latency_ms": 12.34,
      "pool": {
        "size": 5,
        "checked_in": 4,
        "checked_out": 1,
        "overflow": 0
      },
      "error": null
    }
  }
}
```

### Detailed Health Check

Include system metrics and SLO information:

```bash
curl http://localhost:8000/health?detailed=true
```

Additional fields:
```json
{
  "system": {
    "cpu_percent": 25.5,
    "memory_percent": 45.2,
    "memory_available_mb": 2048.5,
    "disk_percent": 35.8
  },
  "slo": {
    "uptime_target": 0.999,
    "latency_p95_target_ms": 500,
    "error_rate_target": 0.001
  }
}
```

### Health Status Values

- **`healthy`**: All components operating normally
- **`degraded`**: Some components slow but operational (e.g., high DB latency)
- **`unhealthy`**: Critical component failure (e.g., database down)

### Component Checks

#### Database Check
- Tests connectivity with `SELECT 1` query
- Measures query latency
- Reports connection pool status
- Status thresholds:
  - Healthy: < 1s latency
  - Degraded: 1-5s latency
  - Unhealthy: > 5s latency or connection failure

### Integration with Load Balancers

Configure load balancer health checks:

**Kubernetes Liveness/Readiness Probe:**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

**AWS ALB Target Group:**
```
Health Check Path: /health
Health Check Interval: 30 seconds
Unhealthy Threshold: 2
Healthy Threshold: 2
Timeout: 5 seconds
```

## Metrics

### Prometheus Endpoint

Metrics available at `/metrics`:

```bash
curl http://localhost:8000/metrics
```

### Available Metrics

#### HTTP Metrics

**Request Counter:**
```
http_requests_total{method="GET",endpoint="/api/v1/properties",status="200"} 1234
```

**Request Duration Histogram:**
```
http_request_duration_seconds_bucket{method="GET",endpoint="/api/v1/properties",le="0.1"} 950
http_request_duration_seconds_bucket{method="GET",endpoint="/api/v1/properties",le="0.5"} 1200
http_request_duration_seconds_sum{method="GET",endpoint="/api/v1/properties"} 125.5
http_request_duration_seconds_count{method="GET",endpoint="/api/v1/properties"} 1234
```

**Active Requests Gauge:**
```
http_requests_in_progress{method="GET",endpoint="/api/v1/properties"} 5
```

#### System Metrics (from `/health?detailed=true`)

- CPU usage percentage
- Memory usage percentage
- Memory available (MB)
- Disk usage percentage

### Prometheus Configuration

**prometheus.yml:**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'estate-agent-crm'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
    scrape_interval: 10s
```

### Useful Queries

**Request Rate (req/s):**
```promql
rate(http_requests_total[5m])
```

**Error Rate (%):**
```promql
rate(http_requests_total{status=~"5.."}[5m]) /
rate(http_requests_total[5m]) * 100
```

**P95 Latency:**
```promql
histogram_quantile(0.95,
  rate(http_request_duration_seconds_bucket[5m]))
```

**Requests by Endpoint:**
```promql
sum by (endpoint) (rate(http_requests_total[5m]))
```

## Request Tracing

### Debug Endpoint

**⚠️ Only available in development/staging** (disabled in production)

Get detailed request information:

```bash
curl http://localhost:8000/trace
```

Response:
```json
{
  "enabled": true,
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-01-15T10:30:45.123Z",
  "request": {
    "method": "GET",
    "url": "http://localhost:8000/trace",
    "path": "/trace",
    "query_params": {},
    "path_params": {},
    "client": {
      "host": "127.0.0.1",
      "port": 54321
    }
  },
  "headers": {
    "user-agent": "curl/7.79.1",
    "accept": "*/*",
    "x-request-id": "550e8400-e29b-41d4-a716-446655440000",
    "authorization": "[REDACTED]"
  },
  "middleware_stack": [
    "SecurityHeadersMiddleware",
    "CORSMiddleware",
    "SlowAPIMiddleware",
    "RateLimitMiddleware",
    "MetricsMiddleware",
    "StructuredLoggingMiddleware",
    "RequestIDMiddleware"
  ],
  "context": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Security Features

- Sensitive headers automatically redacted (`authorization`, `cookie`, `x-csrf-token`)
- Request body size reported but content not included
- Completely disabled in production environment

### Use Cases

- Debug middleware execution order
- Verify headers are set correctly
- Troubleshoot context propagation
- Understand request routing

## Structured Logging

### Log Format

All logs use structured JSON format (ECS-inspired):

```json
{
  "event": "Request completed",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "path": "/api/v1/properties",
  "status_code": 200,
  "latency_ms": 45.23,
  "timestamp": "2025-01-15T10:30:45.123456Z",
  "level": "info"
}
```

### Log Levels

- **DEBUG**: Detailed diagnostic information
- **INFO**: General informational messages
- **WARNING**: Warning messages (non-critical issues)
- **ERROR**: Error messages (request failures)
- **CRITICAL**: Critical system failures

### Security Event Logs

Security events have additional fields:

```json
{
  "event": "Security event",
  "event_type": "injection.sql",
  "severity": "high",
  "message": "Potential SQL injection attempt detected",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "client_ip": "192.168.1.100",
  "user_agent": "malicious-bot/1.0",
  "additional_data": {
    "field_name": "query",
    "suspicious_value": "'; DROP TABLE users;--"
  },
  "level": "error"
}
```

### Log Aggregation

#### Using ELK Stack

**Filebeat configuration:**
```yaml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/estate-agent-crm/*.log
    json.keys_under_root: true
    json.add_error_key: true

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "estate-agent-crm-%{+yyyy.MM.dd}"
```

**Kibana Dashboard Queries:**
```
# Error rate over time
level:error | timechart count()

# Security events
event_type:* AND severity:high

# Slow requests
latency_ms:>1000 | stats avg(latency_ms) by path
```

#### Using CloudWatch Logs

**CloudWatch Agent config:**
```json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/estate-agent-crm/app.log",
            "log_group_name": "/aws/estate-agent-crm/api",
            "log_stream_name": "{instance_id}",
            "timezone": "UTC"
          }
        ]
      }
    }
  }
}
```

## Alerts

### Alert Rules

Alert rules defined in `config/alerts/prometheus-rules.yml`.

#### Critical Alerts

| Alert | Threshold | Duration | Action |
|-------|-----------|----------|--------|
| APIDown | up == 0 | 1 minute | Page on-call |
| DatabaseConnectionFailure | probe_success == 0 | 2 minutes | Page on-call |
| HighErrorRate | Error rate > 5% | 5 minutes | Page on-call |

#### High Priority Alerts

| Alert | Threshold | Duration | Action |
|-------|-----------|----------|--------|
| HighLatency | P95 > 1s | 10 minutes | Notify team |
| HighAuthenticationFailureRate | > 5 failures/s | 5 minutes | Notify security |
| PotentialDDoS | > 100 rate limits/s | 2 minutes | Notify security |

#### Warning Alerts

| Alert | Threshold | Duration | Action |
|-------|-----------|----------|--------|
| HighCPUUsage | > 80% | 10 minutes | Daily digest |
| HighMemoryUsage | > 85% | 10 minutes | Daily digest |
| DiskSpaceRunningOut | < 15% free | 5 minutes | Daily digest |

### AlertManager Configuration

Configuration in `config/alerts/alertmanager.yml`.

#### Alert Routing

1. **Critical alerts** → PagerDuty + Slack (#critical-alerts) + Email (oncall@)
2. **High priority** → Slack (#alerts) + Email (dev-team@)
3. **Security alerts** → Slack (#security-alerts) + Email (security@)
4. **SLO violations** → Slack (#sre-alerts) + Email (sre@)
5. **Warnings** → Email digest (dev-team@)

#### Inhibition Rules

- If API is down → suppress all other alerts
- If high error rate → suppress latency alerts
- If database down → suppress component alerts

### Setting Up AlertManager

```bash
# Download AlertManager
wget https://github.com/prometheus/alertmanager/releases/download/v0.25.0/alertmanager-0.25.0.linux-amd64.tar.gz

# Extract and run
tar xvfz alertmanager-*.tar.gz
cd alertmanager-*
./alertmanager --config.file=config/alerts/alertmanager.yml
```

### Testing Alerts

```bash
# Send test alert to AlertManager
curl -X POST http://localhost:9093/api/v1/alerts \
  -H 'Content-Type: application/json' \
  -d '[{
    "labels": {
      "alertname": "TestAlert",
      "severity": "warning"
    },
    "annotations": {
      "summary": "Test alert",
      "description": "This is a test"
    }
  }]'
```

## Dashboards

### Grafana Dashboard

Import the dashboard JSON from `config/dashboards/grafana-dashboard.json`.

**Key Panels:**
- Request rate (req/s)
- Error rate (%)
- P50/P95/P99 latency
- Active requests
- Database connection pool
- CPU/Memory usage
- Alert status

### Creating Custom Dashboards

Example Grafana panel for error rate:

```json
{
  "title": "Error Rate",
  "targets": [{
    "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) * 100"
  }],
  "yaxes": [{
    "format": "percent"
  }]
}
```

## Troubleshooting

### High Latency

1. Check P95 latency metric:
   ```promql
   histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
   ```

2. Identify slow endpoints:
   ```promql
   topk(5, histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])))
   ```

3. Check database latency in `/health?detailed=true`

4. Review slow query logs

### High Error Rate

1. Check error breakdown by endpoint:
   ```promql
   sum by (endpoint) (rate(http_requests_total{status=~"5.."}[5m]))
   ```

2. Review error logs:
   ```bash
   grep '"level":"error"' /var/log/estate-agent-crm/app.log | tail -50
   ```

3. Check database connectivity in `/health`

### Memory Leaks

1. Monitor memory over time:
   ```promql
   node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100
   ```

2. Check detailed memory in `/health?detailed=true`

3. Review active requests gauge:
   ```promql
   http_requests_in_progress
   ```

### Rate Limiting Issues

1. Check rate limit violations:
   ```promql
   rate(http_requests_total{status="429"}[5m])
   ```

2. Identify clients hitting limits:
   ```bash
   grep 'Rate limit exceeded' /var/log/estate-agent-crm/app.log
   ```

3. Review security event logs for patterns

## Best Practices

### Monitoring

1. **Monitor the four golden signals**:
   - Latency (P95, P99)
   - Traffic (requests/second)
   - Errors (error rate)
   - Saturation (resource usage)

2. **Set up alerting for SLOs**:
   - 99.9% uptime
   - P95 latency < 500ms
   - Error rate < 0.1%

3. **Use alert fatigue prevention**:
   - Appropriate thresholds
   - Meaningful durations
   - Inhibition rules
   - Alert grouping

### Logging

1. **Use structured logging** for all logs
2. **Include request ID** in all log messages
3. **Log at appropriate levels**:
   - DEBUG: Development only
   - INFO: Normal operations
   - WARNING: Potential issues
   - ERROR: Request failures
   - CRITICAL: System failures

4. **Don't log sensitive data**:
   - Passwords
   - API keys
   - Credit card numbers
   - Personal information

### Tracing

1. **Use `/trace` endpoint** for debugging in development
2. **Include request ID** in error reports
3. **Correlate logs** using request ID
4. **Never enable tracing** in production

## Further Reading

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [ELK Stack Documentation](https://www.elastic.co/guide/)
- [SRE Book - Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- [The Four Golden Signals](https://sre.google/sre-book/monitoring-distributed-systems/#xref_monitoring_golden-signals)
