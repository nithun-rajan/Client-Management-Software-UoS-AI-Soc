# 🔐 Secrets Configuration Guide

This document lists all required secrets for preview deployments and production environments.

## Table of Contents

- [GitHub Secrets](#github-secrets)
- [Vercel Configuration](#vercel-configuration)
- [Railway Configuration](#railway-configuration)
- [Secret Generation](#secret-generation)
- [Security Best Practices](#security-best-practices)

---

## GitHub Secrets

Configure these secrets in your GitHub repository settings:
`Settings → Secrets and variables → Actions → New repository secret`

### Required GitHub Secrets

| Secret Name | Description | How to Obtain | Example |
|-------------|-------------|---------------|---------|
| `VERCEL_TOKEN` | Vercel deployment token | Vercel → Settings → Tokens → Create Token | `vercel_xxx...` |
| `VERCEL_ORG_ID` | Vercel organization ID | Vercel → Settings → General → Organization ID | `team_xxx...` |
| `VERCEL_PROJECT_ID` | Vercel project ID | Vercel → Project Settings → General → Project ID | `prj_xxx...` |
| `RAILWAY_TOKEN` | Railway API token | Railway → Account Settings → Tokens | `railway_xxx...` |
| `RAILWAY_PROJECT_ID` | Railway project ID | Railway → Project Settings → General | `abc123...` |

### Optional GitHub Secrets

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `SLACK_WEBHOOK_URL` | Slack notifications for deployments | Team notifications |
| `SENTRY_AUTH_TOKEN` | Sentry release tracking | Error monitoring |
| `CODECOV_TOKEN` | Code coverage reporting | Coverage tracking |

---

## Vercel Configuration

### Setting up Vercel

1. **Create Vercel Account**
   - Sign up at [vercel.com](https://vercel.com)
   - Connect your GitHub account

2. **Create New Project**
   - Import your repository
   - Select `frontend` as the root directory
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

3. **Get Vercel Credentials**

   ```bash
   # Install Vercel CLI
   npm install -g vercel@latest

   # Login to Vercel
   vercel login

   # Link project and get IDs
   cd frontend
   vercel link

   # Get Organization ID
   vercel whoami
   # Outputs: > Your Vercel scope: team_XXX (Organization ID)

   # Get Project ID
   vercel project ls
   # Find your project and note the ID

   # Create deployment token
   # Go to: https://vercel.com/account/tokens
   # Click "Create" and name it "GitHub Actions"
   ```

### Vercel Environment Variables

Configure these in Vercel Dashboard → Project Settings → Environment Variables:

#### Production Environment

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_API_URL` | `https://your-backend.railway.app` | Production |
| `VITE_ENVIRONMENT` | `production` | Production |

#### Preview Environment

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_API_URL` | Auto-populated by Railway preview URL | Preview |
| `VITE_ENVIRONMENT` | `preview` | Preview |
| `VITE_SHOW_PREVIEW_BANNER` | `true` | Preview |

---

## Railway Configuration

### Setting up Railway

1. **Create Railway Account**
   - Sign up at [railway.app](https://railway.app)
   - Connect your GitHub account

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select `backend` as the root directory

3. **Add PostgreSQL Plugin**
   - In your project, click "New"
   - Select "Database" → "PostgreSQL"
   - Railway automatically sets `DATABASE_URL` variable

4. **Get Railway Credentials**

   ```bash
   # Install Railway CLI
   curl -fsSL https://railway.app/install.sh | sh

   # Login to Railway
   railway login

   # Link project
   cd backend
   railway link

   # Get project ID
   railway status
   # Note the Project ID

   # Create API token
   # Go to: https://railway.app/account/tokens
   # Click "Create Token" and name it "GitHub Actions"
   ```

### Railway Environment Variables

Configure these in Railway Dashboard → Project → Variables:

#### Production Environment

| Variable | Value | Required |
|----------|-------|----------|
| `SECRET_KEY` | Random 64-char hex string | ✅ Yes |
| `ENVIRONMENT` | `production` | ✅ Yes |
| `DATABASE_URL` | Auto-set by PostgreSQL plugin | ✅ Yes |
| `CORS_ORIGINS` | `https://your-frontend.vercel.app` | ✅ Yes |
| `DEBUG` | `false` | ✅ Yes |
| `FORCE_HTTPS` | `true` | ✅ Yes |
| `RATE_LIMIT_DEFAULT` | `100/minute` | ⚠️  Optional |
| `RATE_LIMIT_STORAGE_URI` | `memory://` or Redis URL | ⚠️  Optional |

#### Preview Environment

| Variable | Value | Required |
|----------|-------|----------|
| `SECRET_KEY` | Shared preview secret key | ✅ Yes |
| `ENVIRONMENT` | `preview` | ✅ Yes |
| `DATABASE_URL` | Auto-set by PostgreSQL plugin | ✅ Yes |
| `CORS_ORIGINS` | `https://*.vercel.app` | ✅ Yes |
| `DEBUG` | `false` | ✅ Yes |
| `RATE_LIMIT_DEFAULT` | `1000/minute` (more lenient) | ⚠️  Optional |

---

## Secret Generation

### Generate Secure Random Secrets

```bash
# SECRET_KEY (64 characters)
openssl rand -hex 32

# Alternative using Python
python3 -c "import secrets; print(secrets.token_hex(32))"

# Alternative using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Example Secrets (DO NOT USE IN PRODUCTION)

```bash
# Example SECRET_KEY (GENERATE YOUR OWN!)
# Example: f4e9c8d2a1b5c3e7d8f9a2b1c4d5e6f7a8b9c1d2e3f4a5b6c7d8e9f1a2b3c4d5

# Example JWT Secret
# Example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

---

## Security Best Practices

### 🔒 Secret Management

1. **Never Commit Secrets**
   - Always use `.env` files listed in `.gitignore`
   - Use platform-specific secret management (Vercel/Railway)
   - Never hardcode secrets in source code

2. **Rotate Secrets Regularly**
   - Production secrets: Rotate every 90 days
   - Preview secrets: Can be shared across preview environments
   - API tokens: Rotate after team member changes

3. **Use Different Secrets Per Environment**
   - Development: Local `.env` file
   - Preview: Shared preview secrets
   - Production: Unique production secrets

4. **Least Privilege Access**
   - Grant minimal permissions to API tokens
   - Use read-only tokens where possible
   - Limit token scope to specific projects

### 🚨 Secret Leakage Prevention

1. **Enable Secret Scanning**
   - GitHub automatically scans for leaked secrets
   - Enable push protection in repository settings
   - Use `.gitignore` to exclude `.env` files

2. **Audit Secret Access**
   - Review who has access to production secrets
   - Monitor secret usage via platform logs
   - Remove access for former team members

3. **Use Secret Scanning Tools**
   ```bash
   # Install git-secrets
   brew install git-secrets

   # Configure for repository
   git secrets --install
   git secrets --register-aws
   ```

### 📋 Secret Rotation Checklist

When rotating secrets:

- [ ] Generate new secret using secure method
- [ ] Update production environment variables
- [ ] Deploy application with new secret
- [ ] Verify application works correctly
- [ ] Update preview environment secrets (if needed)
- [ ] Revoke old secret
- [ ] Update team documentation
- [ ] Document rotation in change log

---

## Troubleshooting

### Common Issues

**Issue: Vercel deployment fails with "Missing VITE_API_URL"**
- Solution: Configure environment variable in Vercel project settings
- Check: Ensure variable is set for correct environment (preview/production)

**Issue: Railway deployment fails with database connection error**
- Solution: Ensure PostgreSQL plugin is added to project
- Check: Verify `DATABASE_URL` is automatically set

**Issue: CORS errors in preview environment**
- Solution: Update `CORS_ORIGINS` to include Vercel preview URL pattern
- Use wildcard: `https://*.vercel.app` for all Vercel previews

**Issue: GitHub Actions workflow can't deploy to Vercel**
- Solution: Check that `VERCEL_TOKEN` has not expired
- Verify: `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are correct

### Verification Commands

```bash
# Test Vercel authentication
vercel whoami

# Test Railway authentication
railway whoami

# List Vercel deployments
vercel list

# Check Railway project status
railway status

# View Railway logs
railway logs
```

---

## Support

For assistance with secrets configuration:

1. Check platform documentation:
   - [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
   - [Railway Environment Variables](https://docs.railway.app/develop/variables)

2. Contact team lead or DevOps engineer

3. Review security documentation in `/docs/SECURITY.md`

---

**Last Updated:** 2025-11-03
**Maintained By:** Team 67 DevOps
