# 📊 Error Budget Tracking Guide

Comprehensive guide to error budgets, SLO monitoring, and reliability management for the Estate Agent CRM.

## Table of Contents

- [Overview](#overview)
- [What is an Error Budget?](#what-is-an-error-budget)
- [SLO Configuration](#slo-configuration)
- [Error Budget Calculation](#error-budget-calculation)
- [Burn Rate Alerts](#burn-rate-alerts)
- [Monitoring](#monitoring)
- [Error Budget Policy](#error-budget-policy)
- [Incident Response](#incident-response)
- [Best Practices](#best-practices)

---

## Overview

Error budgets provide a quantitative measure of acceptable service unreliability, enabling data-driven decisions about feature velocity vs. reliability.

### Key Concepts

**SLO (Service Level Objective)**: Target level of service reliability (e.g., 99.9% uptime)

**Error Budget**: The allowable amount of unreliability (e.g., 0.1% = 43.8 minutes/month)

**Burn Rate**: The rate at which error budget is being consumed

---

## What is an Error Budget?

### Definition

**Error Budget = 1 - SLO Target**

Example:
- SLO: 99.9% availability
- Error Budget: 0.1% (1 - 0.999)
- Monthly allowance: 43.8 minutes of downtime

### Purpose

1. **Balance innovation and reliability**: Use budget for controlled risk-taking
2. **Objective decision-making**: Data-driven deployment policies
3. **Shared responsibility**: Dev and Ops aligned on reliability targets
4. **Prevent alert fatigue**: Only alert when budget at risk

### Allowed Downtime Table

| SLO Target | Error Budget | Monthly Downtime | Daily Downtime |
|------------|--------------|------------------|----------------|
| 90.0%      | 10.0%        | 3.0 days         | 2.4 hours      |
| 95.0%      | 5.0%         | 1.5 days         | 1.2 hours      |
| 99.0%      | 1.0%         | 7.2 hours        | 14.4 minutes   |
| 99.5%      | 0.5%         | 3.6 hours        | 7.2 minutes    |
| 99.9%      | 0.1%         | 43.8 minutes     | 1.4 minutes    |
| 99.95%     | 0.05%        | 21.9 minutes     | 43 seconds     |
| 99.99%     | 0.01%        | 4.4 minutes      | 8.6 seconds    |

---

## SLO Configuration

### Default SLOs

The Estate Agent CRM tracks three primary SLOs:

#### 1. API Availability
- **Target**: 99.9% (configurable via `SLO_UPTIME_TARGET`)
- **Window**: 30 days
- **Measurement**: `(successful requests) / (total requests)`
- **Error Budget**: 43.8 minutes/month

#### 2. API Latency (P95)
- **Target**: 500ms (configurable via `SLO_LATENCY_P95_MS`)
- **Window**: 30 days
- **Measurement**: 95th percentile response time
- **Error Budget**: 5% of requests may exceed 500ms

#### 3. Error Rate
- **Target**: 0.1% (configurable via `SLO_ERROR_RATE_TARGET`)
- **Window**: 30 days
- **Measurement**: `(5xx errors) / (total requests)`
- **Error Budget**: 1 error per 1,000 requests

### Configuration

**Environment Variables** (`.env`):
```bash
# SLO Targets
SLO_UPTIME_TARGET=0.999           # 99.9%
SLO_LATENCY_P95_MS=500            # 500ms
SLO_ERROR_RATE_TARGET=0.001       # 0.1%

# Measurement Window
ERROR_BUDGET_PERIOD_DAYS=30       # 30-day window
```

---

## Error Budget Calculation

### Formula

```python
# For Availability SLO
actual_uptime = successful_requests / total_requests
budget_consumed = max(0, slo_target - actual_uptime)
budget_remaining = (1 - slo_target) - budget_consumed

# Burn Rate
expected_consumption = error_budget / window_days
actual_consumption = budget_consumed / elapsed_days
burn_rate = actual_consumption / expected_consumption
```

### Status Levels

| Budget Remaining | Status   | Action Required                    |
|------------------|----------|------------------------------------|
| ≥ 50%            | Healthy  | Normal operations                  |
| 20-50%           | Warning  | Review recent changes, monitor closely |
| < 20%            | Critical | Halt non-critical releases, investigate |

### Burn Rate Levels

| Burn Rate | Level    | Time to Exhaustion | Action                          |
|-----------|----------|--------------------|---------------------------------|
| < 1x      | Safe     | > 30 days          | Normal operations               |
| 1-2x      | Elevated | 15-30 days         | Monitor trends                  |
| 2-10x     | High     | 3-15 days          | Investigate and prepare mitigation |
| > 10x     | Critical | < 3 days           | Immediate action required       |

---

## Burn Rate Alerts

### Multi-Window Alerting

We use multi-window, multi-burn-rate alerting based on Google SRE best practices:

#### Critical Burn Rate (14.4x)
- **Detection Windows**: 1 hour AND 5 minutes
- **Alert After**: 2 minutes
- **Time to Exhaustion**: ~2 hours
- **Action**: Immediate investigation, consider rollback
- **Example**: Major outage consuming budget rapidly

**Prometheus Alert**:
```yaml
alert: ErrorBudgetBurnRateCritical
expr: |
  (burn_rate_1h > 14.4) AND (burn_rate_5m > 14.4)
for: 2m
severity: critical
```

#### High Burn Rate (6x)
- **Detection Windows**: 6 hours AND 30 minutes
- **Alert After**: 15 minutes
- **Time to Exhaustion**: ~5 days
- **Action**: Investigation recommended, monitor closely
- **Example**: Elevated error rate from bad deployment

**Prometheus Alert**:
```yaml
alert: ErrorBudgetBurnRateHigh
expr: |
  (burn_rate_6h > 6) AND (burn_rate_30m > 6)
for: 15m
severity: high
```

#### Elevated Burn Rate (3x)
- **Detection Windows**: 24 hours AND 2 hours
- **Alert After**: 1 hour
- **Time to Exhaustion**: ~10 days
- **Action**: Review recent changes, plan corrective actions
- **Example**: Gradual degradation over time

**Prometheus Alert**:
```yaml
alert: ErrorBudgetBurnRateElevated
expr: |
  (burn_rate_24h > 3) AND (burn_rate_2h > 3)
for: 1h
severity: warning
```

### Why Multiple Windows?

- **Short window**: Detects fast-burning incidents quickly
- **Long window**: Reduces false positives from transient issues
- **Both must trigger**: Ensures issue is sustained, not a blip

---

## Monitoring

### API Endpoints

#### `/error-budget`
Real-time error budget status for all SLOs.

**Request**:
```bash
curl https://your-api.railway.app/error-budget
```

**Response**:
```json
{
  "timestamp": "2025-11-03T12:34:56.789Z",
  "overall_status": "healthy",
  "slos": [
    {
      "name": "API Availability",
      "type": "availability",
      "target": "99.90%",
      "actual": "99.95%",
      "status": "healthy",
      "budget": {
        "total": "0.100%",
        "consumed": "0.050%",
        "remaining": "0.050%",
        "remaining_pct": "50.0%"
      },
      "burn_rate": {
        "current": 0.5,
        "level": "safe",
        "time_to_exhaustion": "N/A (budget healthy)"
      },
      "window": {
        "days": 30,
        "start": "2025-10-04T12:34:56.789Z",
        "end": "2025-11-03T12:34:56.789Z"
      }
    }
  ],
  "reference": {
    "99.9% SLO": {
      "seconds": 2628.0,
      "minutes": 43.8,
      "hours": 0.73,
      "days": 0.03,
      "percentage": 0.1
    }
  }
}
```

### Command-Line Monitoring

#### `scripts/check-slo.py`
Monitor SLO compliance from the command line.

**Usage**:
```bash
# Check all SLOs
python scripts/check-slo.py

# Check specific SLO
python scripts/check-slo.py --slo "API Availability"

# Output as JSON
python scripts/check-slo.py --json

# Send alerts if critical
python scripts/check-slo.py --alert
```

**Example Output**:
```
📊 SLO Status Report
Generated: 2025-11-03 12:34:56 UTC

Overall Status: 🟢 HEALTHY

✓ API Availability
  Target: 99.90% | Actual: 99.950%
  Budget Remaining: 50.0%
  Budget Consumed: 0.050%
  Burn Rate: 0.50x (safe)

✓ API Latency P95
  Target: 500ms | Actual: 450.0ms
  Budget Remaining: 100.0%
  Budget Consumed: 0.000%
  Burn Rate: 0.00x (safe)

✓ Error Rate
  Target: 0.10% | Actual: 0.050%
  Budget Remaining: 50.0%
  Budget Consumed: 0.050%
  Burn Rate: 0.50x (safe)
```

### Prometheus Queries

```promql
# Current burn rate (1 hour window)
(
  1 - (sum(rate(http_requests_total{status!~"5.."}[1h])) / sum(rate(http_requests_total[1h])))
) / (1 - 0.999)

# Error budget remaining
(1 - 0.999) - (
  1 - (sum(rate(http_requests_total{status!~"5.."}[30d])) / sum(rate(http_requests_total[30d])))
)

# Days until budget exhaustion (at current burn rate)
(
  (1 - 0.999) - (1 - (sum(rate(http_requests_total{status!~"5.."}[30d])) / sum(rate(http_requests_total[30d]))))
) / (
  1 - (sum(rate(http_requests_total{status!~"5.."}[1d])) / sum(rate(http_requests_total[1d])))
)
```

### Grafana Dashboard

**Panels to include**:
1. **Error Budget Gauge**: Visual indicator of remaining budget
2. **Burn Rate Graph**: Trend over time with thresholds
3. **Time to Exhaustion**: Countdown based on current rate
4. **SLO Compliance**: Per-SLO status and history
5. **Alert Timeline**: Recent burn rate alerts

---

## Error Budget Policy

### Policy Statements

1. **Budget as Permission to Deploy**
   - Deployments allowed when budget > 20%
   - Non-critical deployments paused when budget < 20%
   - All deployments halted when budget exhausted

2. **Budget Review Cadence**
   - Daily check during team standup
   - Weekly review of trends and projections
   - Monthly retrospective on budget usage

3. **Release Frequency**
   - Healthy budget (>50%): Normal release cadence
   - Warning budget (20-50%): Reduce release frequency, increase testing
   - Critical budget (<20%): Emergency fixes only

4. **Incident Response**
   - Critical burn rate (14.4x): Immediate page on-call, all hands
   - High burn rate (6x): Notify team, assign investigator
   - Elevated burn rate (3x): Create ticket, monitor closely

5. **Budget Allocation**
   - 70% allocated to incidents (unplanned)
   - 20% allocated to planned maintenance
   - 10% reserved as safety buffer

### Decision Matrix

| Budget Status | Burn Rate | Feature Releases | Experiments | Maintenance | Incidents |
|---------------|-----------|------------------|-------------|-------------|-----------|
| Healthy (>50%) | Safe (<1x) | ✅ Full speed | ✅ Allowed | ✅ Scheduled | ✅ All fixes |
| Warning (20-50%) | Elevated (1-2x) | ⚠️ Reduced | ❌ Paused | ✅ Critical only | ✅ All fixes |
| Critical (<20%) | High (2-10x) | ❌ Paused | ❌ Paused | ⚠️ Emergency | ✅ All fixes |
| Exhausted (0%) | Critical (>10x) | ❌ Halted | ❌ Halted | ❌ Halted | ✅ Emergency only |

---

## Incident Response

### When Error Budget Burns Fast

#### 1. Assess (First 5 minutes)
```bash
# Check error budget status
curl https://api.example.com/error-budget

# Check recent deployments
git log --oneline -10

# Check Prometheus alerts
# View AlertManager dashboard

# Check application logs
railway logs | tail -100
```

#### 2. Mitigate (Next 15 minutes)
- **Rollback** if recent deployment
- **Scale up** if resource constrained
- **Rate limit** if under attack
- **Fail over** if regional issue

#### 3. Communicate (Throughout)
- Post in incident channel (#incidents)
- Update status page if customer-facing
- Notify stakeholders per severity level

#### 4. Resolve (Within SLA)
- Fix root cause
- Verify metrics improving
- Confirm error budget burn rate normalized

#### 5. Learn (Post-Incident)
- Write incident report
- Update runbooks
- Improve monitoring/alerts
- Schedule reliability work

### Error Budget Incident Template

```markdown
## Error Budget Incident: [Date]

**Severity**: [Critical/High/Warning]
**Burn Rate**: [X]x
**Time to Exhaustion**: [Y] hours/days

### Detection
- Alerted at: [Timestamp]
- Detected by: [Alert name]
- Initial burn rate: [X]x

### Impact
- Affected SLO: [Name]
- Budget consumed: [X]%
- Customer impact: [Description]

### Timeline
- [Time]: Incident began
- [Time]: Alert fired
- [Time]: Investigation started
- [Time]: Mitigation applied
- [Time]: Incident resolved

### Root Cause
[Description of what went wrong]

### Resolution
[What was done to fix it]

### Action Items
- [ ] Update runbook
- [ ] Add monitoring
- [ ] Schedule reliability work
- [ ] Review change process
```

---

## Best Practices

### 1. Treat Error Budget as a Resource
- **Spend wisely**: Use for intentional risk-taking
- **Track carefully**: Monitor daily, not just when alerts fire
- **Plan ahead**: Know your budget trajectory

### 2. Balance Innovation and Reliability
- **Healthy budget**: Take calculated risks, ship faster
- **Low budget**: Focus on stability, slow down releases
- **Exhausted budget**: Reliability work only

### 3. Make Data-Driven Decisions
- **Objective criteria**: Use budget status, not gut feelings
- **Historical trends**: Learn from past budget consumption
- **Predictive modeling**: Project future budget based on trends

### 4. Share Responsibility
- **Developers**: Write reliable code, test thoroughly
- **Operations**: Maintain infrastructure, respond to incidents
- **Product**: Respect budget constraints, prioritize reliability work

### 5. Continuous Improvement
- **Postmortems**: Learn from every budget burn
- **Automation**: Automate responses to common issues
- **Testing**: Invest in chaos engineering and load testing
- **Monitoring**: Improve observability continuously

### 6. Communicate Proactively
- **Daily**: Share budget status in standups
- **Weekly**: Review trends with team
- **Monthly**: Present to leadership with projections
- **Incidents**: Real-time updates to stakeholders

### 7. Balance Different SLOs
- **Don't optimize for one**: Balance availability, latency, error rate
- **Dependencies**: Consider upstream/downstream SLOs
- **User experience**: Align SLOs with user expectations

---

## Integration with Existing Systems

### CI/CD Integration

**GitHub Actions** (`.github/workflows/deploy.yml`):
```yaml
- name: Check Error Budget
  run: |
    BUDGET_STATUS=$(python scripts/check-slo.py --json | jq -r '.slos[].status')

    if echo "$BUDGET_STATUS" | grep -q "critical"; then
      echo "❌ Error budget critical. Deployment blocked."
      exit 1
    fi

    if echo "$BUDGET_STATUS" | grep -q "warning"; then
      echo "⚠️  Error budget low. Proceed with caution."
    fi
```

### Monitoring Integration

**Slack Notifications**:
```bash
# Add webhook to scripts/check-slo.py
# Send alert to #sre-alerts when burn rate high
```

**PagerDuty**:
```yaml
# Configure in AlertManager
routes:
  - match:
      severity: critical
      component: slo
    receiver: pagerduty
```

### Dashboard Links

- **Grafana**: https://grafana.example.com/d/error-budget
- **Prometheus**: https://prometheus.example.com/alerts
- **Status Page**: https://status.example.com

---

## Resources

### Internal Documentation
- [Observability Guide](./OBSERVABILITY.md) - Health checks and monitoring
- [SRE Runbook](./RUNBOOK.md) - Incident response procedures
- [Deployment Guide](./DEPLOYMENT.md) - Release process

### External Resources
- [Google SRE Book - SLOs Chapter](https://sre.google/sre-book/service-level-objectives/)
- [Google SRE Workbook - Implementing SLOs](https://sre.google/workbook/implementing-slos/)
- [Alerting on SLOs (Google)](https://sre.google/workbook/alerting-on-slos/)
- [Error Budget Policy Template](https://sre.google/workbook/error-budget-policy/)

---

**Last Updated**: 2025-11-03
**Maintained By**: Team 67 SRE
**Review Cadence**: Monthly

For questions or feedback on error budget policy, contact the SRE team.
