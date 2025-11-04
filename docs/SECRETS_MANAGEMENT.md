# 🔐 Secrets Management Guide

Comprehensive guide to managing secrets, credentials, and sensitive configuration in the Estate Agent CRM.

## Table of Contents

- [Overview](#overview)
- [Secret Detection Tools](#secret-detection-tools)
- [Pre-commit Hooks](#pre-commit-hooks)
- [CI/CD Secret Scanning](#cicd-secret-scanning)
- [Environment Variables](#environment-variables)
- [Secrets Rotation](#secrets-rotation)
- [Audit Logging](#audit-logging)
- [Best Practices](#best-practices)
- [Emergency Procedures](#emergency-procedures)
- [Troubleshooting](#troubleshooting)

---

## Overview

This project implements multiple layers of secret protection:

```
┌─────────────────────────────────────────────────────────┐
│                   Developer Workstation                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Pre-commit   │  │  Gitleaks    │  │ detect-      │  │
│  │ Hooks        │─▶│  Scanner     │─▶│ secrets      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Git Repository                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ GitHub       │  │  .gitignore  │  │ .secrets.    │  │
│  │ Secret Scan  │  │  Protection  │  │  baseline    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                      CI/CD Pipeline                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ TruffleHog   │  │  Gitleaks    │  │ Custom       │  │
│  │ Scan         │─▶│  Action      │─▶│ Checks       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 Deployment Platforms                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Vercel       │  │  Railway     │  │ Environment  │  │
│  │ Secrets      │  │  Variables   │  │ Isolation    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Defense in Depth

1. **Prevention**: Pre-commit hooks block commits with secrets
2. **Detection**: CI/CD scanning catches any that slip through
3. **Protection**: Platform secrets never exposed in code
4. **Rotation**: Regular rotation minimizes exposure window
5. **Audit**: Comprehensive logging tracks secret access

---

## Secret Detection Tools

### Gitleaks

Industry-standard tool for detecting hardcoded secrets, passwords, and credentials.

**Installation**:
```bash
# macOS
brew install gitleaks

# Linux
wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.2/gitleaks_8.18.2_linux_x64.tar.gz
tar -xzf gitleaks_8.18.2_linux_x64.tar.gz
sudo mv gitleaks /usr/local/bin/

# Verify
gitleaks version
```

**Usage**:
```bash
# Scan entire repository
gitleaks detect --verbose

# Scan specific files
gitleaks detect --source backend/

# Scan staged changes (pre-commit)
gitleaks protect --staged

# Generate report
gitleaks detect --report-format json --report-path gitleaks-report.json
```

**Configuration**: `.gitleaks.toml`
- Custom rules for Railway, Vercel tokens
- Allowlist for false positives
- Exclude patterns for test files

### detect-secrets

Yelp's tool for preventing secrets from entering your codebase.

**Installation**:
```bash
pip install detect-secrets
```

**Usage**:
```bash
# Create baseline (first time)
detect-secrets scan --baseline .secrets.baseline

# Scan for new secrets
detect-secrets scan --baseline .secrets.baseline

# Audit findings
detect-secrets audit .secrets.baseline

# Update baseline
detect-secrets scan --baseline .secrets.baseline --exclude-files '.*\.lock$'
```

**Baseline Management**:
- `.secrets.baseline` tracked in git
- Contains known false positives
- Updated when legitimate secrets-like patterns added
- Reviewed during code review

### TruffleHog

High-entropy string detector, finds secrets based on randomness.

**Usage** (in CI/CD):
```yaml
- name: TruffleHog Scan
  uses: trufflesecurity/trufflehog@main
  with:
    path: ./
    base: main
    head: HEAD
```

---

## Pre-commit Hooks

### Setup

```bash
# Automated setup
./scripts/setup-pre-commit.sh

# Manual setup
pip install pre-commit detect-secrets
brew install gitleaks  # or platform equivalent
pre-commit install
```

### Configuration

**File**: `.pre-commit-config.yaml`

**Hooks**:
1. **Gitleaks** - Scan staged files for secrets
2. **detect-secrets** - Check against baseline
3. **detect-private-key** - Catch SSH/TLS keys
4. **check-env-files** - Prevent .env file commits
5. **Custom checks** - AWS keys, database URLs, tokens

### Usage

```bash
# Hooks run automatically on commit
git add .
git commit -m "feat: add feature"  # Hooks run here

# Run manually on all files
pre-commit run --all-files

# Run specific hook
pre-commit run gitleaks --all-files

# Skip hooks (NOT RECOMMENDED)
git commit --no-verify

# Update hooks
pre-commit autoupdate
```

### False Positives

If a hook incorrectly flags safe content:

1. **Verify** it's actually safe (no real secrets)
2. **Update** `.gitleaks.toml` allowlist
3. **Update** `.secrets.baseline`:
   ```bash
   detect-secrets scan --baseline .secrets.baseline
   detect-secrets audit .secrets.baseline
   ```
4. **Commit** the updated configuration

---

## CI/CD Secret Scanning

### GitHub Actions Workflow

**File**: `.github/workflows/secret-scan.yml`

**Triggered by**:
- Push to main/develop/feature branches
- Pull requests
- Daily schedule (2 AM UTC)

**Scanners**:
1. **Gitleaks** - Full repository history scan
2. **TruffleHog** - Entropy-based detection
3. **detect-secrets** - Baseline comparison
4. **Custom checks** - .env files, AWS keys, private keys

### Workflow Behavior

**On PR**:
- All scanners run
- Results commented on PR
- Build blocks if secrets found
- Artifacts uploaded for investigation

**On Push**:
- Scans run in background
- Notifications sent if secrets found
- Security team alerted for confirmed leaks

**Scheduled**:
- Full repository audit daily
- Catches secrets in old commits
- Identifies stale/rotatable secrets

### Reviewing Scan Results

1. **Check GitHub Actions**:
   - Go to Actions tab
   - Find "Secret Scanning" workflow
   - Review failed jobs

2. **Download artifacts**:
   - Click on failed job
   - Download `gitleaks-report` or `trufflehog-report`
   - Review JSON for details

3. **Investigate findings**:
   ```bash
   # View specific finding
   cat gitleaks-report.json | jq '.[] | select(.RuleID == "aws-access-key")'

   # Check commit history
   git log --all --oneline -- path/to/file
   ```

4. **Remediate**:
   - Remove secret from code
   - Rotate the exposed secret immediately
   - Update `.gitleaks.toml` if false positive

---

## Environment Variables

### File Structure

```
.
├── .env                          # Local development (gitignored)
├── .env.example                  # Template with placeholders
├── .env.preview.example          # Preview environment template
└── .env.local                    # Local overrides (gitignored)
```

### Required vs. Optional

**Required** (`.env.example`):
- `ENVIRONMENT` - deployment environment
- `DATABASE_URL` - database connection
- `SECRET_KEY` - encryption/signing key
- `CORS_ORIGINS` - allowed CORS origins

**Optional**:
- `RATE_LIMIT_DEFAULT` - rate limiting config
- `LOG_LEVEL` - logging verbosity
- `ENABLE_METRICS` - observability flags

### Placeholder Values

Always use obvious placeholders in example files:

```bash
# ✅ Good - Obviously a placeholder
SECRET_KEY=your-secret-key-here-replace-in-production
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here

# ❌ Bad - Could be real
SECRET_KEY=a1b2c3d4e5f6g7h8
DATABASE_URL=postgresql://admin:P@ssw0rd@prod-db:5432/crm
SENDGRID_API_KEY=SG.real_looking_key_here
```

### Validation

```bash
# Validate all .env files
python scripts/validate-env.py

# Validate specific environment
python scripts/validate-env.py --env backend

# Strict mode (warnings = errors)
python scripts/validate-env.py --strict
```

**Validation checks**:
- Required variables present
- Placeholder values (not real secrets)
- No hardcoded credentials
- Proper formatting
- No dangerous patterns

---

## Secrets Rotation

### Rotation Schedule

| Secret Type | Rotation Frequency | Priority |
|-------------|-------------------|----------|
| Production DB passwords | 90 days | Critical |
| API keys (external) | 90 days | High |
| SECRET_KEY | 90 days | High |
| Preview environment secrets | 180 days | Medium |
| Development secrets | On compromise | Low |

### Rotation Procedure

#### 1. Generate New Secret

```bash
# Generate strong random secret
openssl rand -hex 32

# Alternative with Python
python3 -c "import secrets; print(secrets.token_hex(32))"

# Alternative with Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 2. Update Platform Secrets

**Vercel**:
```bash
# Via CLI
vercel env add SECRET_KEY production
# Paste new value when prompted

# Via Dashboard
# Vercel → Project → Settings → Environment Variables
# Edit SECRET_KEY → Update value → Save
```

**Railway**:
```bash
# Via CLI
railway variables set SECRET_KEY=<new-value>

# Via Dashboard
# Railway → Project → Variables
# Edit SECRET_KEY → Update → Deploy
```

**GitHub Actions**:
```bash
# Via Web UI only
# GitHub → Repo → Settings → Secrets → Actions
# Update repository secret
```

#### 3. Deploy with New Secret

```bash
# Vercel (automatic on variable update)
vercel --prod

# Railway (automatic on variable update)
railway up

# Or trigger via git push
git commit --allow-empty -m "chore: rotate secrets"
git push
```

#### 4. Verify Deployment

```bash
# Check health endpoint
curl https://your-app.railway.app/health

# Check logs for errors
railway logs
vercel logs

# Test authentication
curl -X POST https://your-app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

#### 5. Revoke Old Secret

- Remove from password manager
- Delete from local `.env` files
- Clear from browser cache if applicable
- Confirm no services using old value

#### 6. Document Rotation

```bash
# Update rotation log
echo "$(date -u +%Y-%m-%d) - Rotated SECRET_KEY" >> docs/rotation-log.md

# Commit rotation record
git add docs/rotation-log.md
git commit -m "docs: record secret rotation"
git push
```

### Automation

**Setup automatic reminders**:

```yaml
# .github/workflows/secret-rotation-reminder.yml
name: Secret Rotation Reminder
on:
  schedule:
    - cron: '0 9 1 */3 *'  # First day of quarter at 9 AM

jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - name: Create issue
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🔄 Quarterly Secret Rotation Reminder',
              body: `It's time to rotate production secrets!

              See: docs/SECRETS_MANAGEMENT.md#secrets-rotation

              Checklist:
              - [ ] Production DATABASE_URL password
              - [ ] SECRET_KEY
              - [ ] External API keys
              - [ ] Update rotation log
              `,
              labels: ['security', 'maintenance']
            })
```

---

## Audit Logging

### What to Log

**Secret Access Events**:
- Secret retrieval from vault
- Environment variable reads
- Configuration changes
- Authentication attempts with credentials

**DO NOT LOG**:
- ❌ The actual secret values
- ❌ Sensitive portions of tokens
- ❌ Passwords (even hashed in logs)
- ❌ Credit card numbers

### Logging Implementation

**Python (Backend)**:
```python
import logging
from app.security.events import log_security_event, SecurityEventType, SecurityEventSeverity

# Log secret usage (WITHOUT the value)
def load_secret(key: str) -> str:
    value = os.getenv(key)

    if value:
        log_security_event(
            event_type=SecurityEventType.SECRET_ACCESS,
            severity=SecurityEventSeverity.LOW,
            message=f"Secret accessed: {key}",
            additional_data={
                "secret_key": key,
                "source": "environment",
                "has_value": bool(value),
                # Never log: "value": value  ❌
            }
        )

    return value
```

**Audit Log Format**:
```json
{
  "timestamp": "2025-11-03T12:34:56.789Z",
  "event_type": "secret_access",
  "severity": "low",
  "user_id": "system",
  "secret_key": "DATABASE_URL",
  "source": "environment",
  "has_value": true,
  "request_id": "req_abc123",
  "ip_address": "10.0.1.42"
}
```

### Accessing Audit Logs

**Railway Logs**:
```bash
# View recent logs
railway logs

# Filter for security events
railway logs | grep "secret_access"

# Export logs
railway logs > audit-logs-$(date +%Y%m%d).log
```

**Vercel Logs**:
```bash
# View logs
vercel logs

# Filter by time range
vercel logs --since 1h
```

### Log Retention

- **Development**: 7 days
- **Preview**: 30 days
- **Production**: 90 days minimum (regulatory requirement)

Configure in platform settings:
- Railway → Project → Settings → Log Retention
- Vercel → Project → Settings → Log Drains (for long-term storage)

---

## Best Practices

### 1. Never Commit Secrets

```bash
# ✅ Use environment variables
SECRET_KEY = os.getenv("SECRET_KEY")

# ❌ Never hardcode
SECRET_KEY = "a1b2c3d4e5f6g7h8..."
```

### 2. Use Different Secrets Per Environment

```
Development:  dev_secret_123
Preview:      preview_secret_456
Production:   prod_secret_789
```

Never reuse production secrets in other environments.

### 3. Principle of Least Privilege

Grant minimal permissions:
- Read-only tokens where possible
- Scope tokens to specific projects
- Time-limited tokens for temporary access

### 4. Secret Scanning in Code Review

Reviewers should:
- Check for hardcoded values
- Verify secrets use environment variables
- Confirm .env.example updated
- Check secret scanning results

### 5. Education

- Train team on secret management
- Document in onboarding
- Regular security awareness sessions
- Share this guide with new developers

### 6. Use Secret Managers (Production)

For production at scale, consider:
- HashiCorp Vault
- AWS Secrets Manager
- Google Secret Manager
- Azure Key Vault

### 7. Emergency Contacts

**If secrets are compromised**:
1. Security Team Lead: [contact info]
2. DevOps On-call: [contact info]
3. CTO: [contact info]

---

## Emergency Procedures

### Secret Exposure Response

**Immediate Actions** (within 1 hour):

1. **Confirm Exposure**:
   - Review the commit/PR
   - Identify what was exposed
   - Determine exposure duration

2. **Rotate Immediately**:
   ```bash
   # Generate new secret
   NEW_SECRET=$(openssl rand -hex 32)

   # Update in platforms
   railway variables set SECRET_KEY=$NEW_SECRET
   vercel env add SECRET_KEY production

   # Deploy
   git push
   ```

3. **Revoke Old Secret**:
   - API keys: Revoke in provider dashboard
   - Database: Change password
   - Tokens: Invalidate all sessions

4. **Assess Impact**:
   - Check logs for unauthorized access
   - Review audit trails
   - Identify compromised systems

**Documentation** (within 24 hours):

1. **Incident Report**:
   - What was exposed
   - When it was exposed
   - How it was discovered
   - What was impacted
   - Resolution steps taken

2. **Lessons Learned**:
   - How did it happen?
   - What controls failed?
   - How to prevent recurrence?

3. **Update Processes**:
   - Improve pre-commit hooks
   - Add new detection rules
   - Enhance training

### Example Incident Report Template

```markdown
## Secret Exposure Incident Report

**Date**: 2025-11-03
**Severity**: High
**Status**: Resolved

### Summary
[Brief description of what happened]

### Timeline
- 10:00 UTC - Secret committed to repository
- 10:15 UTC - CI/CD scan detected exposure
- 10:20 UTC - Engineer notified via GitHub
- 10:25 UTC - Secret rotated
- 10:30 UTC - Incident resolved

### Impact
- Exposure duration: 30 minutes
- Affected systems: Production API
- Data accessed: None (detected before exploitation)

### Root Cause
- Developer bypassed pre-commit hooks with --no-verify
- CI/CD scan caught it, but 30-minute window existed

### Resolution
1. Rotated SECRET_KEY in production
2. Reviewed logs - no unauthorized access
3. Confirmed all services functioning with new secret

### Prevention
1. Add git hook to prevent --no-verify
2. Reduce CI/CD scan time to 5 minutes
3. Additional training on secret management

### Action Items
- [ ] Implement --no-verify prevention (#123)
- [ ] Optimize CI/CD pipeline (#124)
- [ ] Schedule security training (#125)
```

---

## Troubleshooting

### Pre-commit Hooks Not Running

**Problem**: Hooks don't run on commit

**Solutions**:
```bash
# Reinstall hooks
pre-commit uninstall
pre-commit install

# Check hook installation
ls -la .git/hooks/pre-commit

# Verify configuration
pre-commit run --all-files --verbose
```

### False Positive in Secret Scanner

**Problem**: Scanner flags safe content as secret

**Solutions**:

1. **Update Gitleaks allowlist**:
   ```toml
   # .gitleaks.toml
   [[allowlist.regexTarget]]
   regex = '''your-pattern-here'''
   description = "Reason it's safe"
   ```

2. **Update detect-secrets baseline**:
   ```bash
   detect-secrets audit .secrets.baseline
   # Mark as false positive
   detect-secrets scan --baseline .secrets.baseline
   ```

3. **Use inline comments** (last resort):
   ```python
   # gitleaks:allow
   TEST_KEY = "test_1234567890"
   ```

### Secret Scanner Performance

**Problem**: Scans taking too long

**Solutions**:
- Use `--since` flag: `gitleaks detect --since 7d`
- Exclude large binary files
- Run in parallel for different paths
- Cache results between runs

### Rotated Secret Not Working

**Problem**: App broken after secret rotation

**Checklist**:
- [ ] New secret deployed to all environments?
- [ ] All instances restarted?
- [ ] Database connections refreshed?
- [ ] Cache cleared?
- [ ] Health checks passing?

**Rollback**:
```bash
# If critical, rollback to old secret temporarily
railway variables set SECRET_KEY=$OLD_SECRET

# Investigate issue
railway logs | grep -i error

# Fix and retry rotation
```

---

## Resources

### Tools

- [Gitleaks](https://github.com/gitleaks/gitleaks) - Secret scanner
- [detect-secrets](https://github.com/Yelp/detect-secrets) - Yelp's scanner
- [TruffleHog](https://github.com/trufflesecurity/trufflehog) - High-entropy scanner
- [pre-commit](https://pre-commit.com/) - Git hook framework

### Documentation

- [OWASP Secret Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [NIST Guidelines on Secrets](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)

### Internal Documentation

- [Deployment Secrets](./.github/SECRETS.md) - Platform setup
- [Preview Deployments](./PREVIEW_DEPLOYMENTS.md) - Preview environment secrets
- [Security Policy](./SECURITY.md) - Overall security practices

---

**Last Updated**: 2025-11-03
**Maintained By**: Team 67 Security Team
**Next Review**: 2026-02-03 (Quarterly)
