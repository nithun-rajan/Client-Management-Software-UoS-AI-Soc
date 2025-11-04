# 🚀 Preview Deployments Guide

This document explains how preview deployments work for the Estate Agent CRM application, including setup, usage, and troubleshooting.

## Table of Contents

- [Overview](#overview)
- [How Preview Deployments Work](#how-preview-deployments-work)
- [Setup Instructions](#setup-instructions)
- [Using Preview Deployments](#using-preview-deployments)
- [Preview Environment Architecture](#preview-environment-architecture)
- [Environment Variables](#environment-variables)
- [Database & Data Management](#database--data-management)
- [Monitoring & Debugging](#monitoring--debugging)
- [Cost Management](#cost-management)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Overview

Preview deployments create isolated, temporary environments for every pull request, enabling:

- ✅ **Early feedback** - Stakeholders review changes before merge
- ✅ **Parallel development** - Multiple features tested simultaneously
- ✅ **Zero production risk** - Test risky changes in isolation
- ✅ **Automated QA** - Integration tests run in production-like environment
- ✅ **Client demos** - Share working prototypes instantly

### Architecture Summary

```
┌─────────────────┐
│   GitHub PR     │
│    Opened       │
└────────┬────────┘
         │
         ├──────────────────────┬──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│   Vercel       │    │    Railway     │    │   PostgreSQL   │
│   Frontend     │◄───┤    Backend     │◄───┤    Database    │
│   Deploy       │    │    Deploy      │    │    Instance    │
└────────────────┘    └────────────────┘    └────────────────┘
         │                      │                      │
         └──────────────────────┴──────────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │   PR Comment with   │
                    │   Preview URLs      │
                    └─────────────────────┘
```

---

## How Preview Deployments Work

### Automatic Workflow

1. **Developer opens PR** against `main` or `develop`
2. **GitHub Actions triggers** preview deployment workflow
3. **Frontend deployment**:
   - Vercel builds and deploys React frontend
   - Gets unique preview URL: `https://project-pr-123.vercel.app`
4. **Backend deployment**:
   - Railway builds and deploys FastAPI backend
   - Provisions isolated PostgreSQL database
   - Gets unique API URL: `https://project-pr-123.railway.app`
5. **Integration**:
   - Frontend environment variable updated with backend URL
   - CORS configured to allow preview frontend domain
6. **Notification**:
   - Bot comments on PR with preview URLs
   - Health check confirms backend is operational
7. **Automatic updates**:
   - New commits trigger automatic redeployment
   - Preview URLs remain consistent
8. **Cleanup**:
   - PR merge/close triggers cleanup workflow
   - All preview resources automatically deleted

### Lifecycle Management

```
PR Opened → Deploy Preview → Update on Commits → PR Closed → Cleanup

    ↓             ↓               ↓                    ↓
  Trigger    Build & Test    Auto-Redeploy      Delete Resources
```

---

## Setup Instructions

### Prerequisites

- GitHub repository with admin access
- Vercel account (free tier works)
- Railway account (free tier works)
- Admin access to repository secrets

### Step 1: Vercel Setup

```bash
# Install Vercel CLI
npm install -g vercel@latest

# Login
vercel login

# Link frontend project
cd frontend
vercel link

# Get organization and project IDs
vercel whoami  # Note the org ID
vercel project ls  # Find your project ID

# Create deployment token
# Go to: https://vercel.com/account/tokens
# Create token named "GitHub Actions"
```

### Step 2: Railway Setup

```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Login
railway login

# Link backend project
cd backend
railway link

# Get project ID
railway status  # Note the project ID

# Create API token
# Go to: https://railway.app/account/tokens
# Create token named "GitHub Actions"

# Add PostgreSQL database
# In Railway dashboard:
# 1. Open your project
# 2. Click "New" → "Database" → "PostgreSQL"
# 3. DATABASE_URL will be automatically set
```

### Step 3: Configure GitHub Secrets

Add these secrets in GitHub: `Settings → Secrets → Actions`

| Secret | Where to Find | Required |
|--------|---------------|----------|
| `VERCEL_TOKEN` | Vercel → Account → Tokens | ✅ |
| `VERCEL_ORG_ID` | Vercel → Settings → General | ✅ |
| `VERCEL_PROJECT_ID` | Vercel → Project Settings | ✅ |
| `RAILWAY_TOKEN` | Railway → Account → Tokens | ✅ |
| `RAILWAY_PROJECT_ID` | Railway CLI: `railway status` | ✅ |

See [SECRETS.md](../.github/SECRETS.md) for detailed instructions.

### Step 4: Configure Environment Variables

#### Vercel (Frontend)

In Vercel Dashboard → Project → Settings → Environment Variables:

```bash
# Preview Environment
VITE_ENVIRONMENT=preview
VITE_SHOW_PREVIEW_BANNER=true
VITE_DEBUG_MODE=true

# API URL will be automatically updated by workflow
```

#### Railway (Backend)

In Railway Dashboard → Project → Variables:

```bash
# Required
SECRET_KEY=<generate-with-openssl-rand-hex-32>
ENVIRONMENT=preview
CORS_ORIGINS=https://*.vercel.app

# Optional - More lenient for testing
RATE_LIMIT_DEFAULT=1000/minute
DEBUG=false
```

---

## Using Preview Deployments

### Creating a Preview

1. **Create feature branch**:
   ```bash
   git checkout -b feature/new-feature
   git push origin feature/new-feature
   ```

2. **Open pull request** on GitHub

3. **Wait for deployment** (typically 2-5 minutes)

4. **Check PR comments** for preview URLs:
   ```
   🚀 Preview Deployment Complete

   Frontend: https://crm-frontend-git-pr-123.vercel.app
   Backend: https://crm-backend-pr-123.railway.app
   API Docs: https://crm-backend-pr-123.railway.app/docs
   ```

### Updating a Preview

Simply push new commits to your branch:

```bash
git add .
git commit -m "Update feature"
git push origin feature/new-feature
```

Preview automatically updates (no new comment created).

### Sharing with Stakeholders

Send stakeholders the preview URL from PR comment:

```
Hey team! 👋

Please review the new search feature:
🔗 https://crm-frontend-git-pr-123.vercel.app

Username: demo@example.com
Password: demo123

Looking forward to your feedback!
```

### Testing API Changes

```bash
# Get API URL from PR comment
export API_URL="https://crm-backend-pr-123.railway.app"

# Test health check
curl $API_URL/health

# Test API endpoint
curl $API_URL/api/v1/properties

# View API documentation
open $API_URL/docs
```

---

## Preview Environment Architecture

### Frontend (Vercel)

- **Platform**: Vercel Edge Network
- **Build**: Vite production build
- **CDN**: Global edge network (< 100ms latency)
- **SSL**: Automatic HTTPS with Let's Encrypt
- **URL Pattern**: `https://project-git-branch-user.vercel.app`

### Backend (Railway)

- **Platform**: Railway Cloud
- **Runtime**: Python 3.12 + uvicorn
- **Workers**: 2 workers per preview (configurable)
- **Database**: PostgreSQL (shared or ephemeral)
- **Health Check**: Automatic monitoring at `/health`
- **URL Pattern**: `https://project-pr-123.railway.app`

### Database Strategy

Two approaches (choose based on needs):

**Option 1: Ephemeral Database (Recommended)**
- Each preview gets isolated PostgreSQL instance
- Fresh database with seed data
- Automatically deleted on cleanup
- **Pros**: Complete isolation, realistic testing
- **Cons**: Longer startup time, higher cost

**Option 2: Shared Preview Database**
- Single PostgreSQL instance for all previews
- Schema-per-preview approach
- Persists between deployments
- **Pros**: Faster startup, lower cost
- **Cons**: Less isolation, manual cleanup needed

Current implementation uses **Option 1** (ephemeral).

---

## Environment Variables

### Automatic Variables

These are automatically set by the platform:

| Variable | Set By | Example Value |
|----------|--------|---------------|
| `PORT` | Railway | `8000` |
| `DATABASE_URL` | Railway PostgreSQL | `postgresql://user:pass@host/db` |
| `RAILWAY_ENVIRONMENT` | Railway | `preview` |
| `VERCEL_URL` | Vercel | `project-git-branch.vercel.app` |
| `VERCEL_ENV` | Vercel | `preview` |

### Manual Configuration

Configure these in platform dashboards:

**Frontend (.env.preview)**:
- `VITE_API_URL` - Backend API URL (updated by workflow)
- `VITE_ENVIRONMENT` - Always `preview`
- `VITE_SHOW_PREVIEW_BANNER` - `true` to show "Preview" banner

**Backend (.env.preview)**:
- `SECRET_KEY` - Random secret for CSRF/JWT
- `CORS_ORIGINS` - `https://*.vercel.app`
- `RATE_LIMIT_DEFAULT` - `1000/minute` (lenient for testing)
- `DEBUG` - `false` (security)

See [.env.preview.example](../backend/.env.preview.example) for full list.

---

## Database & Data Management

### Database Provisioning

Railway automatically provisions PostgreSQL when deploying backend:

```bash
# Database is created via Railway PostgreSQL plugin
# DATABASE_URL is automatically injected

# Check database status
railway variables

# Connect to preview database
railway run psutil
```

### Data Seeding

Preview environments can auto-seed with test data:

```python
# backend/app/seed_data.py
if os.getenv("ENABLE_DB_SEED") == "true":
    seed_preview_data()
```

Enable in Railway variables:
```bash
ENABLE_DB_SEED=true
SEED_PRESET=minimal  # Options: minimal, full, demo
```

### Database Migrations

Handled automatically via `Procfile`:

```
release: uv run python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"
web: uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## Monitoring & Debugging

### Health Checks

```bash
# Check backend health
curl https://crm-backend-pr-123.railway.app/health

# Detailed health with system metrics
curl https://crm-backend-pr-123.railway.app/health?detailed=true
```

### Logs

**Railway Logs** (Backend):
```bash
# Via CLI
railway logs

# Or in dashboard
# Railway → Project → Deployments → View Logs
```

**Vercel Logs** (Frontend):
```bash
# Via CLI
vercel logs

# Or in dashboard
# Vercel → Project → Deployments → View Function Logs
```

### Debug Endpoints

Available in preview environments:

- `/health` - Health check with component status
- `/metrics` - Prometheus metrics
- `/trace` - Request tracing (development only)
- `/docs` - Interactive API documentation

### Performance Monitoring

```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://api-url/health

# curl-format.txt:
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_total:  %{time_total}\n
```

---

## Cost Management

### Cost Breakdown

**Vercel (Frontend)**:
- Free tier: Unlimited previews
- Bandwidth: 100GB/month free
- Build time: 6,000 minutes/month free
- **Estimated cost per preview**: $0

**Railway (Backend)**:
- Free tier: $5 credit/month
- Each preview: ~$0.02/hour (~$0.50/day)
- PostgreSQL: ~$0.01/hour (~$0.25/day)
- **Estimated cost per preview**: $0.75/day
- **Monthly cost (10 active previews)**: ~$225

### Cost Optimization Tips

1. **Short-lived previews**: Merge or close PRs quickly
2. **Automatic cleanup**: Ensure cleanup workflow runs
3. **Shared database**: Use shared database for cost-sensitive projects
4. **Preview on-demand**: Add `[preview]` label requirement
5. **Resource limits**: Configure smaller instances for preview

### Cleanup Automation

Preview resources automatically cleaned up when:
- PR is closed
- PR is merged
- After 7 days of inactivity (configurable)

Manual cleanup if needed:
```bash
# Vercel - automatic after 30 days
vercel rm <deployment-url> --yes

# Railway - manual in dashboard
railway service delete <service-id>
```

---

## Troubleshooting

### Common Issues

#### Issue: Frontend can't connect to backend

**Symptoms**: CORS errors, API requests fail

**Solutions**:
1. Verify `VITE_API_URL` points to Railway preview URL
2. Check `CORS_ORIGINS` in Railway includes `*.vercel.app`
3. Ensure backend health check passes

```bash
# Check frontend config
curl https://frontend-url/config.json

# Test backend CORS
curl -H "Origin: https://frontend-url" https://backend-url/health
```

#### Issue: Database connection errors

**Symptoms**: 500 errors, "could not connect to database"

**Solutions**:
1. Verify PostgreSQL plugin is added in Railway
2. Check `DATABASE_URL` is set: `railway variables`
3. Restart deployment: `railway up --detach`

#### Issue: Build failures

**Frontend build fails**:
```bash
# Check Vercel build logs
vercel logs --follow

# Common fix: Clear build cache
vercel --force

# Check Node version
node --version  # Should be 20.x
```

**Backend build fails**:
```bash
# Check Railway build logs
railway logs

# Common fix: Sync dependencies
uv sync --frozen
```

#### Issue: Preview not deploying

**Check workflow status**:
1. Go to GitHub → Actions
2. Find "Preview Deployment" workflow
3. Check for errors in workflow logs

**Common causes**:
- Missing GitHub secrets
- Invalid Vercel/Railway tokens
- PR from forked repository (security)

#### Issue: Slow preview performance

**Solutions**:
1. **Cold starts**: First request may be slow (15-30s)
2. **Database queries**: Check `/health?detailed=true` for query times
3. **Frontend bundle**: Optimize with code splitting
4. **Backend workers**: Increase workers in `railway.toml`

### Debug Checklist

When preview deployment fails:

- [ ] Check GitHub Actions workflow logs
- [ ] Verify all secrets are configured
- [ ] Test Vercel authentication: `vercel whoami`
- [ ] Test Railway authentication: `railway whoami`
- [ ] Check Vercel project settings
- [ ] Check Railway service configuration
- [ ] Verify environment variables
- [ ] Check database connection
- [ ] Review platform status pages

---

## Best Practices

### Development Workflow

1. **Create feature branch** from up-to-date main
2. **Open draft PR** early for visibility
3. **Mark ready for review** when preview should deploy
4. **Test preview** before requesting review
5. **Update based on feedback**
6. **Merge when approved** (triggers cleanup)

### Code Review Process

1. **Reviewer opens preview** from PR comment
2. **Tests feature manually** in preview environment
3. **Checks API documentation** (`/docs`)
4. **Verifies no console errors**
5. **Approves or requests changes**

### Testing Strategy

```bash
# Manual testing checklist
- [ ] Feature works as expected
- [ ] No console errors
- [ ] Mobile responsive
- [ ] API responses correct
- [ ] Authentication works
- [ ] Performance acceptable
- [ ] Error handling works

# Automated tests
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass (Playwright)
- [ ] API contract tests pass
```

### Preview Etiquette

**DO**:
- ✅ Keep previews short-lived (< 7 days)
- ✅ Close/merge PRs promptly
- ✅ Test before requesting review
- ✅ Document known issues in PR
- ✅ Use preview for demos

**DON'T**:
- ❌ Use previews for production testing
- ❌ Share previews with external users
- ❌ Store sensitive data in preview DB
- ❌ Leave previews running indefinitely
- ❌ Manually modify preview infrastructure

### Security Considerations

1. **No production data**: Never sync production data to preview
2. **Environment separation**: Use different secrets per environment
3. **Access control**: Preview URLs are public but obscure
4. **Limited lifetime**: Previews auto-expire
5. **Audit trail**: All deployments logged in GitHub Actions

---

## Advanced Configuration

### Custom Domain for Previews

Add custom preview domain in Vercel:

```bash
# Vercel project settings
# Domains → Add Domain
# Format: previews.yourdomain.com

# Pattern will be: pr-123.previews.yourdomain.com
```

### Database Branching

Use Railway's database branching feature:

```yaml
# railway.toml
[[databases]]
name = "postgres"
plugin = "postgresql"
branch = true  # Creates branch per preview
```

### Custom Preview Workflow

Modify `.github/workflows/preview-deploy.yml`:

```yaml
# Only deploy on label
if: contains(github.event.pull_request.labels.*.name, 'deploy-preview')

# Deploy on specific paths
on:
  pull_request:
    paths:
      - 'frontend/**'
      - 'backend/**'
```

### Integration Tests in Preview

```yaml
# Add to preview-deploy.yml
- name: Run E2E Tests
  run: |
    export FRONTEND_URL="${{ steps.deploy-frontend.outputs.url }}"
    export BACKEND_URL="${{ steps.deploy-backend.outputs.url }}"
    npm run test:e2e
```

---

## Support & Resources

### Documentation Links

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [GitHub Actions Documentation](https://docs.github.com/actions)

### Internal Resources

- [Secrets Configuration](../.github/SECRETS.md)
- [Security Guidelines](./SECURITY.md)
- [Observability Guide](./OBSERVABILITY.md)

### Getting Help

1. Check this documentation
2. Review workflow logs in GitHub Actions
3. Check platform status pages
4. Contact DevOps team
5. Create issue in repository

---

**Last Updated:** 2025-11-03
**Maintained By:** Team 67 DevOps

**Contributors**: Team 67
