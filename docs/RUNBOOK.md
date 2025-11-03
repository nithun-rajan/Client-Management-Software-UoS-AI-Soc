# 🚨 Operations Runbook

Comprehensive operational guide for the Estate Agent CRM system. This runbook covers deployment, monitoring, incident response, troubleshooting, and maintenance procedures.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Deployment Procedures](#deployment-procedures)
- [Monitoring & Alerts](#monitoring--alerts)
- [Incident Response](#incident-response)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Maintenance Procedures](#maintenance-procedures)
- [Rollback Procedures](#rollback-procedures)
- [Disaster Recovery](#disaster-recovery)
- [Escalation Paths](#escalation-paths)
- [Runbook Updates](#runbook-updates)

---

## Overview

### System Information

- **Application**: Estate Agent CRM
- **Team**: Team 67
- **Contact**: ali.marzooq13@outlook.com
- **Repository**: [GitHub](https://github.com/your-org/client-management)
- **Documentation**: [README.md](../README.md)

### Service Level Objectives (SLOs)

| Metric | Target | Measurement Window |
|--------|--------|-------------------|
| API Availability | 99.9% | 30 days |
| P95 Latency | 500ms | 30 days |
| Error Rate | <0.1% | 30 days |

### Key URLs

| Environment | URL | Purpose |
|-------------|-----|---------|
| Production | https://your-domain.railway.app | Production API |
| Staging | https://staging-your-domain.railway.app | Pre-production testing |
| Monitoring | https://grafana.example.com | Metrics and dashboards |
| Alerts | https://prometheus.example.com/alerts | Alert status |

---

## System Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Load Balancer                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Application                      │
│  - Rate Limiting (slowapi)                                  │
│  - CSRF Protection                                          │
│  - Security Headers                                         │
│  - Structured Logging                                       │
│  - Metrics Collection                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
        ┌──────────────────┐   ┌──────────────────┐
        │   PostgreSQL     │   │      Redis       │
        │    Database      │   │   (Rate Limit)   │
        └──────────────────┘   └──────────────────┘
                    │
                    ▼
        ┌──────────────────────────────────────┐
        │    Monitoring Infrastructure         │
        │  - Prometheus (Metrics)              │
        │  - Grafana (Dashboards)              │
        │  - AlertManager (Alerts)             │
        └──────────────────────────────────────┘
```

### Technology Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy
- **Database**: PostgreSQL 14+ (production), SQLite (dev)
- **Cache/Rate Limit**: Redis (optional)
- **Monitoring**: Prometheus, Grafana, AlertManager
- **Secrets**: HashiCorp Vault (production)
- **Deployment**: Railway / Docker

---

## Deployment Procedures

### Pre-Deployment Checklist

- [ ] All tests pass (`pytest --cov`)
- [ ] Code reviewed and approved
- [ ] Error budget healthy (>20% remaining)
- [ ] Database migrations tested
- [ ] Environment variables updated
- [ ] Secrets rotated if needed
- [ ] Monitoring dashboards checked
- [ ] Rollback plan prepared
- [ ] Stakeholders notified
- [ ] Deployment window scheduled

### Standard Deployment (Blue-Green)

#### 1. Pre-Deploy Validation

```bash
# Check error budget status
python scripts/check-slo.py

# If error budget critical, defer deployment
if [ $? -eq 2 ]; then
    echo "Error budget critical. Deployment blocked."
    exit 1
fi

# Run full test suite
pytest --cov --verbose

# Verify staging environment
curl -f https://staging-api.railway.app/health || exit 1
```

#### 2. Database Migration (if needed)

```bash
# Backup database first
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
alembic upgrade head

# Verify migration success
alembic current
```

#### 3. Deploy to Green Environment

```bash
# Deploy via Railway CLI
railway up --environment production

# Or via Docker
docker build -t estate-crm:latest .
docker tag estate-crm:latest estate-crm:green
docker push estate-crm:green

# Deploy green
kubectl set image deployment/estate-crm app=estate-crm:green
```

#### 4. Health Check & Validation

```bash
# Wait for green to be healthy
for i in {1..30}; do
    if curl -f https://green.your-domain.railway.app/health; then
        echo "Green environment healthy"
        break
    fi
    sleep 10
done

# Run smoke tests
pytest tests/smoke/ --base-url=https://green.your-domain.railway.app

# Check key metrics
curl https://green.your-domain.railway.app/metrics | grep http_requests_total
```

#### 5. Traffic Cutover

```bash
# Gradually shift traffic: 10% → 50% → 100%
# Monitor error rates and latency during cutover

# 10% traffic to green
railway lb set-weight green 10

# Wait 5 minutes, monitor metrics
sleep 300

# If metrics healthy, increase to 50%
railway lb set-weight green 50
sleep 300

# If still healthy, full cutover
railway lb set-weight green 100
```

#### 6. Post-Deployment Validation

```bash
# Check health
curl https://your-domain.railway.app/health?detailed=true

# Check error budget
curl https://your-domain.railway.app/error-budget

# Verify key endpoints
curl https://your-domain.railway.app/api/v1/properties

# Check logs for errors
railway logs --tail 100 | grep -i error
```

#### 7. Keep Blue as Standby

```bash
# Keep blue environment running for 1 hour
# Monitor for issues
# If issues occur, immediate rollback to blue

# After 1 hour of stability, decommission blue
railway env remove blue
```

### Hotfix Deployment

For critical bugs in production:

1. **Create hotfix branch from production tag**
```bash
git checkout -b hotfix/critical-fix production-v1.0.0
```

2. **Make minimal fix**
```bash
# Fix only the critical issue
# Add regression test
# Commit with clear message
git commit -m "hotfix: Fix critical issue with..."
```

3. **Fast-track testing**
```bash
pytest tests/unit/ tests/integration/
```

4. **Deploy immediately**
```bash
railway up --environment production --fast
```

5. **Monitor closely**
```bash
# Watch logs for 15 minutes
railway logs --follow

# Check error budget
python scripts/check-slo.py
```

6. **Merge back to main**
```bash
git checkout main
git merge hotfix/critical-fix
git push origin main
```

### Rollback Procedures

#### Immediate Rollback (Traffic Shift)

```bash
# Shift all traffic back to blue (previous version)
railway lb set-weight blue 100 green 0

# Verify blue is serving traffic
curl https://your-domain.railway.app/health

# Check metrics stabilize
python scripts/check-slo.py
```

#### Full Rollback (Revert Deployment)

```bash
# Get previous version tag
git tag --list | tail -2

# Rollback to previous version
railway rollback --to-version v1.0.0

# If database migration occurred, rollback migration
alembic downgrade -1

# Verify health
curl https://your-domain.railway.app/health?detailed=true
```

#### Emergency Rollback Criteria

Rollback immediately if:
- Error rate > 5% for 5 minutes
- P95 latency > 2 seconds for 5 minutes
- Database connection failures
- Critical bug discovered
- Error budget burn rate > 14.4x
- Manual rollback requested by on-call

---

## Monitoring & Alerts

### Key Metrics

#### Application Metrics

| Metric | Normal Range | Warning | Critical |
|--------|--------------|---------|----------|
| Request Rate | 10-100 req/s | >200 req/s | >500 req/s |
| P95 Latency | <500ms | 500-1000ms | >1000ms |
| Error Rate | <0.1% | 0.1-1% | >1% |
| CPU Usage | <60% | 60-80% | >80% |
| Memory Usage | <70% | 70-85% | >85% |
| DB Connection Pool | 3-5 available | 1-2 available | 0 available |

#### Health Check Endpoints

```bash
# Basic health
curl https://your-domain.railway.app/health

# Detailed health (includes component checks)
curl https://your-domain.railway.app/health?detailed=true

# Error budget status
curl https://your-domain.railway.app/error-budget

# Prometheus metrics
curl https://your-domain.railway.app/metrics
```

### Alert Response Procedures

#### Critical Alerts

**1. API Down**
- **Alert**: `APIDown`
- **Severity**: Critical
- **Response Time**: Immediate (5 minutes)

**Response Procedure:**
```bash
# 1. Check service status
railway status

# 2. Check recent deployments
git log --oneline -5

# 3. Check logs for errors
railway logs --tail 100

# 4. If recent deployment, rollback
railway rollback --to-previous

# 5. If not deployment-related, check infrastructure
railway ps
railway db status

# 6. Restart service if needed
railway restart

# 7. Notify stakeholders
# Post in #incidents channel
```

**2. High Error Rate**
- **Alert**: `HighErrorRate`
- **Severity**: High
- **Response Time**: 15 minutes

**Response Procedure:**
```bash
# 1. Check error breakdown
railway logs | grep -i error | tail -50

# 2. Identify error pattern
# - Specific endpoint?
# - Specific error type?
# - Recent code change?

# 3. Check error budget impact
python scripts/check-slo.py

# 4. If deployment-related, rollback
railway rollback --to-previous

# 5. If external dependency, check status
# - Database: pg_isready
# - Redis: redis-cli ping
# - External APIs: curl health endpoints

# 6. Implement mitigation
# - Increase timeout
# - Add circuit breaker
# - Disable problematic feature flag
```

**3. Error Budget Burn Rate Critical**
- **Alert**: `ErrorBudgetBurnRateCritical`
- **Severity**: Critical
- **Response Time**: Immediate (2 minutes)

**Response Procedure:**
```bash
# 1. Check current burn rate
curl https://your-domain.railway.app/error-budget

# 2. Time to budget exhaustion
python scripts/check-slo.py

# 3. Identify cause
railway logs --since 1h | grep -E "(error|5[0-9]{2})"

# 4. If deployment-related (last 1h), immediate rollback
git log --since="1 hour ago" --oneline
railway rollback --to-previous

# 5. If not deployment, find and fix root cause
# - Database issues?
# - External dependency down?
# - Traffic spike/DDoS?

# 6. Implement immediate mitigation
# - Enable rate limiting
# - Add caching
# - Scale up resources
# - Redirect traffic

# 7. Halt non-critical deployments
# Update deployment gate in CI/CD
```

**4. Database Connection Failure**
- **Alert**: `DatabaseConnectionFailure`
- **Severity**: Critical
- **Response Time**: Immediate (5 minutes)

**Response Procedure:**
```bash
# 1. Check database status
railway db status

# 2. Check connection pool
curl https://your-domain.railway.app/health?detailed=true

# 3. Test direct connection
psql $DATABASE_URL -c "SELECT 1;"

# 4. Check for connection leaks
# Review recent code changes for missing connection closes

# 5. Restart database connection pool
railway restart

# 6. If database unresponsive, contact Railway support
# Or restore from backup

# 7. Update connection pool settings if needed
# Increase pool size or timeout
```

#### Warning Alerts

**5. High Latency**
- **Alert**: `HighLatency`
- **Severity**: Warning
- **Response Time**: 30 minutes

**Response Procedure:**
```bash
# 1. Check current latency metrics
curl https://your-domain.railway.app/metrics | grep duration

# 2. Identify slow endpoints
railway logs | grep "duration_ms" | sort -k2 -nr | head -20

# 3. Check database query performance
# Look for N+1 queries, missing indexes, slow queries

# 4. Check external API calls
# Implement timeouts, caching, circuit breakers

# 5. Profile slow requests
# Enable detailed tracing in staging

# 6. Implement optimizations
# - Add database indexes
# - Add caching layer
# - Optimize queries
# - Implement pagination
```

---

## Incident Response

### Incident Classification

| Severity | Definition | Response Time | Example |
|----------|------------|---------------|---------|
| **P0** | Total service outage | <5 minutes | API completely down |
| **P1** | Major functionality broken | <15 minutes | Database connection failures |
| **P2** | Significant degradation | <30 minutes | High error rate, slow performance |
| **P3** | Minor issue | <2 hours | Single non-critical endpoint failing |
| **P4** | Cosmetic issue | Next business day | Logging issue, minor UI bug |

### Incident Response Process

#### 1. Detection & Alert (0-5 minutes)

```bash
# Receive alert via:
# - PagerDuty page
# - Email
# - Slack notification
# - Monitoring dashboard

# Acknowledge incident
pagerduty incident acknowledge <incident_id>

# Post in #incidents channel
"🚨 P1 Incident: High error rate detected
Status: Investigating
Incident Commander: @your-name
Started: 2025-11-03 12:34 UTC"
```

#### 2. Assess & Triage (5-10 minutes)

```bash
# Run assessment checklist

# Check service health
curl https://your-domain.railway.app/health?detailed=true

# Check error budget
python scripts/check-slo.py

# Check recent deployments
git log --since="2 hours ago" --oneline

# Check metrics for anomalies
# - Open Grafana dashboard
# - Check Prometheus alerts
# - Review recent traffic patterns

# Determine severity and escalate if needed
```

#### 3. Mitigate (10-30 minutes)

```bash
# Immediate mitigation options:

# Option 1: Rollback recent deployment
railway rollback --to-previous

# Option 2: Scale up resources
railway scale --replicas 4

# Option 3: Enable circuit breaker
# Update feature flags

# Option 4: Rate limit aggressive traffic
# Update rate limit rules

# Option 5: Fail over to backup region
# Update DNS / load balancer

# Monitor impact of mitigation
railway logs --follow
python scripts/check-slo.py
```

#### 4. Resolve (Variable)

```bash
# Implement permanent fix

# 1. Create hotfix branch
git checkout -b hotfix/incident-<id>

# 2. Implement fix with tests
# Add regression test
pytest tests/

# 3. Deploy hotfix
railway up --environment production

# 4. Verify fix
curl https://your-domain.railway.app/health
python scripts/check-slo.py

# 5. Monitor for 15 minutes
railway logs --follow

# 6. Close incident if stable
pagerduty incident resolve <incident_id>
```

#### 5. Post-Mortem (Within 48 hours)

Template: `docs/post-mortems/YYYY-MM-DD-incident-title.md`

```markdown
# Incident Post-Mortem: [Date] - [Title]

## Summary
Brief description of what happened.

## Timeline
- **12:00 UTC**: Incident began
- **12:05 UTC**: Alert fired
- **12:10 UTC**: Investigation started
- **12:30 UTC**: Mitigation applied
- **13:00 UTC**: Incident resolved

## Root Cause
Detailed explanation of what caused the issue.

## Impact
- Duration: 1 hour
- Affected users: ~50% of traffic
- Error budget consumed: 5%
- Revenue impact: Estimated £X

## What Went Well
- Alert fired promptly
- Team responded quickly
- Rollback successful

## What Went Wrong
- Lack of proper testing in staging
- No circuit breaker in place
- Monitoring gap identified

## Action Items
- [ ] Add integration test for this scenario
- [ ] Implement circuit breaker (#123)
- [ ] Add monitoring for X metric (#124)
- [ ] Update runbook with new procedure (#125)
- [ ] Schedule training on X (#126)

## Lessons Learned
Key takeaways for future prevention.
```

---

## Troubleshooting Guide

### Common Issues

#### Issue: High Memory Usage

**Symptoms:**
- Memory usage >85%
- Slow response times
- OOM (Out of Memory) errors

**Diagnosis:**
```bash
# Check memory metrics
curl https://your-domain.railway.app/health?detailed=true

# Check for memory leaks in logs
railway logs | grep -i "memory"

# Profile memory usage
memory_profiler python -m app.main
```

**Resolution:**
```bash
# Immediate: Restart application
railway restart

# Short-term: Scale up
railway scale --memory 2GB

# Long-term: Investigate and fix
# - Review code for circular references
# - Check for unclosed connections
# - Optimize data structures
# - Implement garbage collection tuning
```

#### Issue: Database Connection Pool Exhausted

**Symptoms:**
- "No connections available" errors
- Timeouts on database queries
- Health check failures

**Diagnosis:**
```bash
# Check pool status
curl https://your-domain.railway.app/health?detailed=true | jq '.checks.database'

# Check for connection leaks
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

**Resolution:**
```bash
# Immediate: Restart application
railway restart

# Short-term: Increase pool size
# Update SQLAlchemy pool settings:
# pool_size=10, max_overflow=20

# Long-term: Fix connection leaks
# Review code for:
# - Missing session.close()
# - Missing context manager usage
# - Long-running queries
```

#### Issue: Rate Limit Issues

**Symptoms:**
- 429 errors
- Clients complaining about rate limits
- Legitimate traffic being blocked

**Diagnosis:**
```bash
# Check rate limit violations
railway logs | grep "429"

# Check metrics
curl https://your-domain.railway.app/metrics | grep rate_limit_exceeded

# Identify source IPs
railway logs | grep "429" | awk '{print $NF}' | sort | uniq -c | sort -rn
```

**Resolution:**
```bash
# If legitimate traffic spike:
# 1. Temporarily increase limits
# Update rate_limit.py: default_limits="200/minute"

# 2. Add IP whitelist for known good actors
# Update rate_limit.py: exempt_ips=[...]

# If attack/abuse:
# 1. Block abusive IPs
# Update security rules

# 2. Enable stricter rate limiting
# Update rate_limit.py: default_limits="50/minute"

# 3. Enable CAPTCHA for suspicious traffic
```

#### Issue: Slow Database Queries

**Symptoms:**
- High P95 latency
- Database timeout errors
- Slow health checks

**Diagnosis:**
```bash
# Check slow queries
psql $DATABASE_URL -c "
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
"

# Check for missing indexes
psql $DATABASE_URL -c "
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public';
"

# Analyze query plan
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT * FROM properties WHERE city = 'London';"
```

**Resolution:**
```bash
# Add missing indexes
psql $DATABASE_URL -c "
CREATE INDEX CONCURRENTLY idx_properties_city ON properties(city);
CREATE INDEX CONCURRENTLY idx_properties_status ON properties(status);
"

# Optimize queries
# - Add SELECT specific columns
# - Use JOINs instead of multiple queries
# - Implement pagination
# - Add query result caching

# Update statistics
psql $DATABASE_URL -c "ANALYZE;"
```

#### Issue: CSRF Token Issues

**Symptoms:**
- 403 Forbidden errors
- "CSRF validation failed" messages
- Frontend unable to submit forms

**Diagnosis:**
```bash
# Check CSRF logs
railway logs | grep -i csrf

# Test CSRF token generation
curl http://localhost:8000/csrf-token

# Verify cookie is being set
curl -v http://localhost:8000/csrf-token | grep -i "set-cookie"
```

**Resolution:**
```bash
# Check frontend is:
# 1. Fetching token from /csrf-token
# 2. Including token in X-CSRF-Token header
# 3. Including cookie in requests
# 4. Using credentials: 'include' in fetch

# Check backend configuration:
# - SECRET_KEY is set
# - CORS allows credentials
# - Cookie domain matches frontend domain

# Verify secure cookie settings in production
# - secure=True in production
# - samesite='strict' or 'lax'
```

---

## Maintenance Procedures

### Weekly Maintenance

#### Monday: Metrics Review
```bash
# Review past week's metrics
python scripts/check-slo.py

# Check error budget status
curl https://your-domain.railway.app/error-budget

# Review incident log
cat docs/incidents/2025-W44.md

# Update team on status
```

#### Wednesday: Dependency Updates
```bash
# Check for security updates
pip list --outdated
npm audit

# Update non-breaking dependencies
pip install --upgrade pip
pre-commit autoupdate

# Run tests
pytest --cov

# Deploy to staging for validation
railway up --environment staging
```

#### Friday: Cleanup
```bash
# Clean up old logs
railway logs cleanup --older-than 30d

# Clean up old preview environments
railway env list | grep preview | xargs railway env remove

# Review and close stale incidents
# Update documentation
```

### Monthly Maintenance

#### Error Budget Review
```bash
# Generate monthly report
python scripts/check-slo.py --json > reports/slo-$(date +%Y-%m).json

# Calculate budget consumption by service
# Identify trends and patterns
# Adjust SLO targets if needed
```

#### Security Updates
```bash
# Rotate secrets
python scripts/rotate-secrets.py

# Review security scan results
gitleaks detect --source . --verbose

# Update security dependencies
pip install --upgrade cryptography

# Review access controls
# Audit user permissions
```

#### Capacity Planning
```bash
# Review resource usage trends
# Forecast next month's needs
# Plan for scaling
# Budget for infrastructure
```

### Quarterly Maintenance

#### Disaster Recovery Drill
```bash
# Simulate database failure
# Test backup restore procedure
# Validate recovery time objectives (RTO)
# Document lessons learned
```

#### Architecture Review
```bash
# Review system design
# Identify technical debt
# Plan refactoring initiatives
# Update architecture diagrams
```

---

## Disaster Recovery

### Backup Procedures

#### Database Backups

**Automated Daily Backups:**
```bash
# Configured in Railway
# - Daily backups at 02:00 UTC
# - Retention: 30 days
# - Stored in S3

# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
gzip backup_*.sql

# Upload to S3
aws s3 cp backup_*.sql.gz s3://backups/database/
```

**Backup Verification:**
```bash
# Weekly: Restore backup to staging
pg_restore --clean --if-exists -d $STAGING_DATABASE_URL backup_latest.sql

# Verify data integrity
psql $STAGING_DATABASE_URL -c "SELECT COUNT(*) FROM properties;"
```

#### Code Backups

```bash
# Git repository is source of truth
# Backed up to GitHub
# Additional mirror to GitLab (optional)

# Create release tags for rollback
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

### Recovery Procedures

#### Recover from Database Failure

**RTO:** 30 minutes
**RPO:** 24 hours (daily backup)

```bash
# 1. Provision new database
railway db create postgres-14

# 2. Get latest backup
aws s3 cp s3://backups/database/latest.sql.gz .
gunzip latest.sql.gz

# 3. Restore backup
psql $NEW_DATABASE_URL < latest.sql

# 4. Verify restore
psql $NEW_DATABASE_URL -c "SELECT COUNT(*) FROM properties;"

# 5. Update DATABASE_URL
railway env set DATABASE_URL=$NEW_DATABASE_URL

# 6. Restart application
railway restart

# 7. Verify health
curl https://your-domain.railway.app/health?detailed=true
```

#### Recover from Complete Service Failure

**RTO:** 1 hour
**RPO:** Last git commit

```bash
# 1. Provision new Railway project
railway init

# 2. Deploy from git
railway up

# 3. Restore database from backup
# (See database recovery above)

# 4. Configure environment variables
railway env set SECRET_KEY=...
railway env set DATABASE_URL=...

# 5. Run database migrations
railway run alembic upgrade head

# 6. Update DNS to point to new service
# Update A record to new IP

# 7. Verify health
curl https://your-domain.railway.app/health
```

---

## Escalation Paths

### On-Call Rotation

| Role | Primary | Secondary | Escalation |
|------|---------|-----------|------------|
| **Engineer** | On-call engineer | Backup engineer | Team Lead |
| **Team Lead** | Engineering Manager | CTO | CEO |
| **Database** | DBA | Senior Engineer | Infrastructure Team |

### Contact Information

**Team 67:**
- Email: ali.marzooq13@outlook.com
- Slack: #team67-alerts
- PagerDuty: [Your PagerDuty integration]

**External Vendors:**
- Railway Support: support@railway.app
- Vault Support: vault-support@hashicorp.com

### Escalation Criteria

**Escalate to Team Lead if:**
- Incident >1 hour without resolution
- Error budget will be exhausted within 4 hours
- Multiple services affected
- Data loss suspected
- Security incident

**Escalate to CTO if:**
- Incident >4 hours
- Major data loss confirmed
- Security breach
- Regulatory compliance issue
- Business-critical impact

---

## Runbook Updates

### Update Process

1. **Identify gap**: During incident or routine review
2. **Document change**: Update relevant section
3. **Review**: Get approval from team lead
4. **Test**: Validate new procedure
5. **Communicate**: Notify team of changes
6. **Version**: Commit to git with clear message

### Review Schedule

- **Weekly**: Review recent incidents, update procedures
- **Monthly**: Full runbook review, remove outdated sections
- **Quarterly**: Major review, restructure if needed

### Change Log

| Date | Section | Change | Author |
|------|---------|--------|--------|
| 2025-11-03 | All | Initial runbook creation | Team 67 |

---

## Quick Reference

### Emergency Commands

```bash
# Rollback deployment
railway rollback --to-previous

# Check service status
railway status

# View logs
railway logs --tail 100 --follow

# Restart service
railway restart

# Check error budget
python scripts/check-slo.py --alert

# Database backup
pg_dump $DATABASE_URL > emergency_backup.sql
```

### Key Log Locations

- **Application Logs**: `railway logs`
- **Prometheus Metrics**: `https://your-domain.railway.app/metrics`
- **Health Check**: `https://your-domain.railway.app/health?detailed=true`
- **Error Budget**: `https://your-domain.railway.app/error-budget`

### Useful Commands

```bash
# Check all health indicators
curl -s https://your-domain.railway.app/health?detailed=true | jq

# Monitor error budget in real-time
watch -n 60 'python scripts/check-slo.py'

# Follow logs with error filtering
railway logs --follow | grep -E "(error|ERROR|Error)"

# Check recent deployments
git log --since="24 hours ago" --oneline

# Count errors by type
railway logs --since 1h | grep error | awk '{print $5}' | sort | uniq -c | sort -rn
```

---

**Last Updated**: 2025-11-03
**Maintained By**: Team 67
**Review Cycle**: Monthly
**Next Review**: 2025-12-03

For questions or updates to this runbook, please contact ali.marzooq13@outlook.com or create a pull request.
