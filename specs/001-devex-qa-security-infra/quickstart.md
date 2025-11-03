# Quickstart Guide: DevEx, QA, and Security Infrastructure

**Feature**: 001-devex-qa-security-infra
**Target Setup Time**: <30 minutes
**Prerequisites**: Python 3.10+, Node.js 18+, Git

## 1. Clone and Checkout Feature Branch

```bash
git clone https://github.com/YOUR_ORG/client-management.git
cd client-management
git checkout 001-devex-qa-security-infra
```

## 2. Backend Setup

### Install Dependencies

Using `uv` (recommended):
```bash
cd backend
uv sync
```

Or using `pip`:
```bash
cd backend
pip install -e ".[dev]"
```

### Create Environment Variables

```bash
cp .env.example .env
# Edit .env and fill in required values:
# DATABASE_URL=sqlite:///./test.db
# LOG_LEVEL=INFO
# ENVIRONMENT=development
```

### Run Database Migrations

```bash
# If using Alembic (check backend/alembic/ directory)
alembic upgrade head
```

### Start Backend Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000
OpenAPI docs at: http://localhost:8000/docs

## 3. Frontend Setup

### Install Dependencies

```bash
cd ../frontend
npm install
```

### Configure Environment

```bash
# Create .env.local if needed
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local
```

### Start Development Server

```bash
npm run dev
```

Frontend will be available at: http://localhost:5173

## 4. Verify Observability Endpoints

### Health Check
```bash
curl http://localhost:8000/health | jq
```

Expected output:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-03T14:00:00Z",
  "uptime_seconds": 120,
  "database": {
    "connected": true,
    "latency_ms": 2.5
  },
  "error_budget": {
    "uptime_slo_target": 0.999,
    "current_uptime": 1.0,
    "budget_consumed_pct": 0,
    "remaining_downtime_minutes": 43.8
  }
}
```

### Metrics
```bash
curl http://localhost:8000/metrics
```

Expected output (Prometheus format):
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/health",status="200"} 1
```

### Request Tracing
```bash
curl http://localhost:8000/trace | jq
```

## 5. Run Tests

### Backend Tests
```bash
cd backend
pytest
```

With coverage:
```bash
pytest --cov=app --cov-report=term-missing
```

### Frontend Tests (if vitest configured)
```bash
cd frontend
npm run test
```

## 6. Run Linters and Type Checkers

### Backend Linting
```bash
cd backend
ruff check .
ruff format --check .
```

### Backend Type Checking
```bash
mypy app/
```

### Frontend Linting
```bash
cd frontend
npm run lint
```

### Frontend Type Checking
```bash
npx tsc --noEmit
```

## 7. Verify CI Pipeline Locally

Run all CI steps manually to ensure they pass:

```bash
# Backend
cd backend
ruff check . && \
mypy app/ && \
pytest --cov=app --cov-fail-under=70

# Frontend
cd frontend
npm run lint && \
npx tsc --noEmit && \
npm run build
```

## 8. Verify Security Middleware

### Check Security Headers
```bash
curl -I http://localhost:8000/api/v1/properties
```

Should include:
```
Content-Security-Policy: ...
Strict-Transport-Security: ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

### Test Rate Limiting
```bash
# Send 101 requests rapidly (should get 429 on 101st)
for i in {1..101}; do curl http://localhost:8000/api/v1/properties; done
```

## Troubleshooting

### "Module not found" errors
- Ensure you're in correct directory (backend/ or frontend/)
- Reinstall dependencies: `uv sync` or `npm install`

### Database connection errors
- Verify .env file exists with DATABASE_URL
- Check SQLite file permissions

### Port already in use
- Backend: Change port with `--port 8001`
- Frontend: Vite will auto-increment port (5173 → 5174)

### CI pipeline fails locally
- Ensure all dev dependencies installed
- Check Python version: `python --version` (should be 3.10+)
- Check Node version: `node --version` (should be 18+)

## Next Steps

1. Review [research.md](./research.md) for technology decisions
2. Review [data-model.md](./data-model.md) for entity definitions
3. Review [contracts/](./contracts/) for API specifications
4. Run `/speckit.tasks` to generate implementation tasks
5. Start implementing P1 user stories (CI/CD, security, observability)

**Estimated Setup Time**: 25 minutes (satisfies <30min requirement)
