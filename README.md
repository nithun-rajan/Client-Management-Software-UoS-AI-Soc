# 🏢 Estate Agent CRM

[![CI/CD](https://github.com/your-org/client-management/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/client-management/actions)
[![Security Scan](https://github.com/your-org/client-management/actions/workflows/security.yml/badge.svg)](https://github.com/your-org/client-management/actions)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org)

**Built by Team 67** for the University of Southampton AI Society Hackathon 2025.

A production-grade Estate Agent CRM system with comprehensive property management, tenant tracking, and modern DevOps infrastructure.

---

## 🚀 Features

### 🏠 Business Functionality

#### Property Management
- Complete CRUD operations for property listings
- Property status tracking (Available, Under Offer, Let, Withdrawn)
- Advanced search and filtering (bedrooms, rent range, postcode, type)
- Property photos and descriptions
- Rental pricing and availability dates

#### 👔 Landlord Management
- Landlord registration and profile management
- AML (Anti-Money Laundering) compliance tracking
- Secure banking details storage
- Property portfolio tracking per landlord
- Document management (ID verification, proof of ownership)

#### 👥 Applicant Management
- Tenant applicant registration
- Search criteria and preferences tracking
- Reference checking workflow
- Right-to-rent verification
- Application status management

#### 📊 KPI Dashboard
- Real-time business metrics
- Property availability statistics
- Landlord and applicant counts
- Revenue tracking and forecasts
- Activity timeline

#### 📝 Event System
- Comprehensive event logging
- Activity tracking across all entities
- Audit trail for compliance
- Custom event types

---

## 🛡️ Infrastructure & DevOps

### CI/CD Pipeline
- **Automated Testing**: Unit, integration, and contract tests
- **Multi-Environment**: Development, Staging, Production workflows
- **Quality Gates**: Linting (Ruff), type checking (mypy), security scans
- **Preview Deployments**: Automatic preview environments for PRs
- **Deployment Strategy**: Blue-green with automatic rollback

**GitHub Actions Workflows:**
- `.github/workflows/ci.yml` - Main CI pipeline
- `.github/workflows/deploy-preview.yml` - Preview deployments
- `.github/workflows/security.yml` - Security scanning
- `.github/workflows/contract-tests.yml` - Contract testing

### 🔒 Security Infrastructure

#### Secret Management
- **Vault Integration**: HashiCorp Vault for production secrets
- **Secret Rotation**: Automated 90-day rotation with Vault
- **Encryption**: At-rest encryption with Fernet
- **Secret Scanning**: Pre-commit hooks with gitleaks and detect-secrets
- **Git History**: Automated secret detection in commits

**Tools:**
- GitLeaks for secret pattern detection
- detect-secrets for baseline scanning
- Pre-commit hooks for prevention
- Vault Agent for secret injection

#### Application Security
- **Rate Limiting**: Token bucket algorithm with slowapi
- **CSRF Protection**: Double-submit cookie pattern
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.
- **Input Validation**: Pydantic models with strict validation
- **SQL Injection Prevention**: SQLAlchemy ORM with parameterized queries
- **XSS Protection**: Content Security Policy headers

### 📊 Observability Stack

#### Monitoring & Metrics
- **Prometheus**: Metrics collection and storage
- **Grafana**: Dashboard visualization
- **AlertManager**: Alert routing and notification
- **Custom Metrics**: Request rates, latency, error rates, database health

#### Health Checks
- **Comprehensive Health Endpoint**: `/health` with component checks
- **Database Health**: Connection pool monitoring, query latency
- **System Health**: CPU, memory, disk space
- **Dependency Health**: External service checks

#### Error Budget Tracking
- **SLO Management**: 99.9% availability, 500ms P95 latency, 0.1% error rate
- **Burn Rate Alerts**: Multi-window alerting (14.4x, 6x, 3x)
- **Budget Dashboard**: Real-time budget consumption tracking
- **CLI Monitoring**: `scripts/check-slo.py` for command-line checks

**Endpoints:**
- `/health` - Health check with component status
- `/metrics` - Prometheus metrics
- `/error-budget` - Error budget status and burn rate
- `/trace` - Request tracing (dev/staging only)

#### Structured Logging
- **JSON Logs**: Structured logging with request context
- **Request Tracing**: Correlation IDs across requests
- **Log Levels**: Configurable per environment
- **Security Events**: Dedicated security event logging

### 🧪 Testing Infrastructure

#### Test Types
- **Unit Tests**: Component-level testing with pytest
- **Integration Tests**: API endpoint testing with TestClient
- **Contract Tests**: Pact-based consumer-driven contracts
- **Security Tests**: Automated vulnerability scanning

#### Test Coverage
- **Coverage Tracking**: pytest-cov with 80%+ target
- **CI Integration**: Automated test runs on all PRs
- **Coverage Reports**: HTML and terminal reports

---

## 📋 Prerequisites

- **Python**: 3.12 or higher
- **Node.js**: 18 or higher (for frontend)
- **PostgreSQL**: 14 or higher (production) or SQLite (development)
- **Docker**: For containerized deployments (optional)
- **Git**: For version control

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-org/client-management.git
cd client-management
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3.12 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database
python -m app.main

# Run development server
uvicorn app.main:app --reload --port 8000
```

**API will be available at:** http://localhost:8000
**Interactive docs:** http://localhost:8000/docs

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with backend API URL

# Run development server
npm start
```

**Frontend will be available at:** http://localhost:3000

### 4. Install Pre-commit Hooks (Recommended)

```bash
# From project root
pip install pre-commit
pre-commit install

# Run manually
pre-commit run --all-files
```

---

## 🏗️ Architecture

### Backend Stack

- **Framework**: FastAPI (Python 3.12)
- **Database**: SQLAlchemy ORM with PostgreSQL/SQLite
- **Validation**: Pydantic v2 for data models
- **Authentication**: JWT tokens (ready for implementation)
- **Rate Limiting**: slowapi with Redis backend (optional)

### Frontend Stack

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios with interceptors
- **Routing**: React Router v6

### Middleware Stack (Execution Order)

1. **SecurityHeadersMiddleware**: Security headers (HSTS, CSP, etc.)
2. **CORSMiddleware**: Cross-origin resource sharing
3. **SlowAPIMiddleware**: Rate limiting enforcement
4. **RateLimitMiddleware**: Custom rate limit logic
5. **MetricsMiddleware**: Prometheus metrics collection
6. **StructuredLoggingMiddleware**: JSON logging with context
7. **RequestIDMiddleware**: Request correlation IDs

### Database Schema

**Core Models:**
- `Property`: Property listings with details
- `Landlord`: Property owners with AML compliance
- `Applicant`: Tenant applicants with preferences
- `Event`: Activity and audit logging

---

## 🧪 Testing

### Run Tests

```bash
# Backend tests
cd backend
pytest                          # All tests
pytest --cov                    # With coverage
pytest -v -s                    # Verbose output
pytest tests/unit/              # Unit tests only
pytest tests/integration/       # Integration tests only

# Contract tests
pytest tests/contract/          # Consumer contract tests

# Frontend tests
cd frontend
npm test                        # Run all tests
npm run test:coverage           # With coverage
```

### Test Configuration

**pytest.ini:**
```ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
```

### Coverage Goals

- **Overall**: 80%+ coverage
- **Critical paths**: 95%+ coverage
- **Business logic**: 90%+ coverage

---

## 🚢 Deployment

### Environment Variables

**Required:**
```bash
# Application
ENVIRONMENT=production          # production, staging, or development
SECRET_KEY=your-secret-key      # For CSRF and sessions

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Rate Limiting
REDIS_URL=redis://localhost:6379/0  # Optional, in-memory fallback

# SLO Targets
SLO_UPTIME_TARGET=0.999         # 99.9% availability
SLO_LATENCY_P95_MS=500          # 500ms P95 latency
SLO_ERROR_RATE_TARGET=0.001     # 0.1% error rate
ERROR_BUDGET_PERIOD_DAYS=30     # 30-day window
```

**Optional:**
```bash
# Vault Integration
VAULT_ADDR=https://vault.example.com:8200
VAULT_TOKEN=your-vault-token
VAULT_SECRET_PATH=secret/data/estate-crm

# Monitoring
PROMETHEUS_MULTIPROC_DIR=/tmp/prometheus
GRAFANA_API_URL=https://grafana.example.com

# Logging
LOG_LEVEL=INFO                  # DEBUG, INFO, WARNING, ERROR, CRITICAL
ENABLE_REQUEST_TRACING=false    # Enable in dev/staging only
```

### Deployment Platforms

#### Railway (Recommended for Quick Deploy)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

#### Docker Deployment

```bash
# Build image
docker build -t estate-crm:latest .

# Run container
docker run -d \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  -e SECRET_KEY=... \
  estate-crm:latest
```

#### Manual Deployment

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export ENVIRONMENT=production
export DATABASE_URL=...
export SECRET_KEY=...

# Run with gunicorn
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --graceful-timeout 30
```

---

## 📊 Monitoring

### Health Check

```bash
# Basic health check
curl http://localhost:8000/health

# Detailed health check
curl http://localhost:8000/health?detailed=true
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-03T12:34:56.789Z",
  "version": "1.0.0",
  "environment": "production",
  "uptime_seconds": 3600,
  "checks": {
    "database": {
      "status": "healthy",
      "latency_ms": 2.5,
      "pool_size": 5,
      "pool_available": 3
    },
    "memory": {
      "status": "healthy",
      "used_mb": 256,
      "available_mb": 768
    }
  }
}
```

### Error Budget Status

```bash
# Check error budget
curl http://localhost:8000/error-budget

# CLI tool
python scripts/check-slo.py
python scripts/check-slo.py --alert  # Send alerts if critical
python scripts/check-slo.py --json   # JSON output for automation
```

### Metrics

```bash
# Prometheus metrics
curl http://localhost:8000/metrics
```

**Key Metrics:**
- `http_requests_total` - Total HTTP requests by status, method, path
- `http_request_duration_seconds` - Request latency histogram
- `http_requests_in_progress` - Active requests gauge
- `database_query_duration_seconds` - Database query latency
- `rate_limit_exceeded_total` - Rate limit violations

### Grafana Dashboards

Import pre-built dashboards from `docs/grafana/`:
- API Performance Dashboard
- Error Budget Dashboard
- Security Events Dashboard
- Database Health Dashboard

---

## 🔒 Security

### Secret Scanning

```bash
# Run gitleaks scan
gitleaks detect --source . --verbose

# Run detect-secrets scan
detect-secrets scan > .secrets.baseline

# Audit baseline
detect-secrets audit .secrets.baseline
```

### Security Headers

The application automatically applies security headers:

- **HSTS**: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- **CSP**: `Content-Security-Policy: default-src 'self'; ...`
- **Frame Options**: `X-Frame-Options: DENY`
- **Content Type**: `X-Content-Type-Options: nosniff`
- **XSS Protection**: `X-XSS-Protection: 1; mode=block`

### Rate Limiting

**Default Limits:**
- General API: 100 requests/minute per IP
- Health check: 60 requests/minute
- CSRF token: 10 requests/minute
- Authentication: 5 requests/minute (when implemented)

**Response on rate limit:**
```json
{
  "error": "Rate limit exceeded",
  "retry_after": 42
}
```

### CSRF Protection

1. **Get CSRF Token:**
```bash
curl http://localhost:8000/csrf-token
```

2. **Include in Requests:**
```bash
curl -X POST http://localhost:8000/api/v1/properties \
  -H "X-CSRF-Token: your-token" \
  -H "Content-Type: application/json" \
  -d '{"address": "..."}'
```

---

## 📚 API Documentation

### Interactive Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

### Core Endpoints

#### Properties
- `POST /api/v1/properties` - Create property
- `GET /api/v1/properties` - List properties
- `GET /api/v1/properties/{id}` - Get property
- `PUT /api/v1/properties/{id}` - Update property
- `DELETE /api/v1/properties/{id}` - Delete property

#### Landlords
- `POST /api/v1/landlords` - Create landlord
- `GET /api/v1/landlords` - List landlords
- `GET /api/v1/landlords/{id}` - Get landlord
- `PUT /api/v1/landlords/{id}` - Update landlord
- `DELETE /api/v1/landlords/{id}` - Delete landlord

#### Applicants
- `POST /api/v1/applicants` - Create applicant
- `GET /api/v1/applicants` - List applicants
- `GET /api/v1/applicants/{id}` - Get applicant
- `PUT /api/v1/applicants/{id}` - Update applicant
- `DELETE /api/v1/applicants/{id}` - Delete applicant

#### Search
- `GET /api/v1/search/properties` - Search properties with filters
- `GET /api/v1/search/count` - Get result count for filters

#### KPIs
- `GET /api/v1/kpis/` - Get dashboard metrics

#### Events
- `POST /api/v1/events/` - Log event
- `GET /api/v1/events/` - List events

---

## 📖 Documentation

### Available Guides

- **[ERROR_BUDGET.md](docs/ERROR_BUDGET.md)** - Error budget tracking guide
- **[OBSERVABILITY.md](docs/OBSERVABILITY.md)** - Health checks and monitoring
- **[SECURITY.md](docs/SECURITY.md)** - Security best practices
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment guide
- **[API.md](docs/API.md)** - API reference guide

### Configuration Files

- `.pre-commit-config.yaml` - Pre-commit hooks configuration
- `.gitleaks.toml` - Secret scanning rules
- `.secrets.baseline` - Detect-secrets baseline
- `backend/config/alerts/prometheus-rules.yml` - Prometheus alerting rules

---

## 🤝 Contributing

### Development Workflow

1. **Create Feature Branch:**
```bash
git checkout -b feature/your-feature-name
```

2. **Make Changes:**
```bash
# Code changes
# Add tests
# Update documentation
```

3. **Run Tests and Checks:**
```bash
# Pre-commit checks
pre-commit run --all-files

# Run tests
pytest --cov

# Type checking
mypy app/

# Linting
ruff check .
```

4. **Commit Changes:**
```bash
git add .
git commit -m "feat: Add your feature description"
```

5. **Push and Create PR:**
```bash
git push origin feature/your-feature-name
# Create pull request on GitHub
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test additions/changes
- `refactor:` - Code refactoring
- `chore:` - Build/tooling changes
- `perf:` - Performance improvements
- `ci:` - CI/CD changes

### Code Style

- **Python**: Follow PEP 8, enforced by Ruff
- **TypeScript**: Follow StandardJS, enforced by ESLint
- **Line Length**: 120 characters for Python, 100 for TypeScript
- **Type Hints**: Required for all Python functions
- **Documentation**: Docstrings for all public functions

---

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check PostgreSQL is running
pg_isready

# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

#### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

#### Virtual Environment Issues
```bash
# Recreate virtual environment
rm -rf venv
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Pre-commit Hook Failures
```bash
# Update hooks
pre-commit autoupdate

# Clear cache
pre-commit clean

# Reinstall
pre-commit install --install-hooks
```

---

## 📊 Project Statistics

- **Backend Code**: ~15,000 lines of Python
- **Frontend Code**: ~8,000 lines of TypeScript/React
- **Tests**: ~3,000 lines with 80%+ coverage
- **Documentation**: ~5,000 lines across 10+ guides
- **CI/CD Pipelines**: 5 automated workflows
- **API Endpoints**: 30+ RESTful endpoints
- **Security Features**: Secret scanning, CSRF, rate limiting, security headers
- **Monitoring**: Prometheus metrics, health checks, error budgets, structured logging

---

## 👥 Team

**Team 67** - University of Southampton AI Society Hackathon 2025

- **Contact**: ali.marzooq13@outlook.com
- **GitHub**: [github.com/your-org/client-management](https://github.com/your-org/client-management)

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- University of Southampton AI Society for organizing the hackathon
- FastAPI framework and community
- React and TypeScript ecosystems
- Google SRE practices for error budget patterns
- All open-source contributors whose tools made this possible

---

**Built with ❤️ by Team 67 | Hackathon 2025**
