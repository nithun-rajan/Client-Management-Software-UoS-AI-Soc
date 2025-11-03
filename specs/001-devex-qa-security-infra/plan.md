# Implementation Plan: DevEx, QA, and Security Infrastructure

**Branch**: `001-devex-qa-security-infra` | **Date**: 2025-11-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-devex-qa-security-infra/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature adds comprehensive DevEx, QA, and Security infrastructure to the existing Estate Agent CRM system. The primary requirements are: (1) automated CI/CD pipeline with quality gates (linting, type checking, testing, coverage) completing in <3 minutes, (2) API contract testing to prevent breaking changes, (3) per-PR preview deployments, (4) security middleware (headers, rate limiting, input validation), (5) observability stack (structured logging, Prometheus metrics, request tracing), (6) error budget and SLO monitoring (99.9% uptime, P95<500ms), and (7) secure secrets management.

**Technical Approach**: Build on existing FastAPI/React stack by adding middleware layers for security and observability, GitHub Actions for CI/CD, Vercel for preview deployments, and pytest-based security validation tests. All infrastructure components are designed to be non-invasive to existing business logic while providing comprehensive monitoring and protection.

## Technical Context

**Language/Version**: Python 3.10+, TypeScript 5.8.3

**Primary Dependencies**:
- Backend: FastAPI 0.120.4, SQLAlchemy 2.0.44, Pydantic 2.12.3, pytest 8.4.2
- Frontend: React 18.3.1, Vite 5.4.19, TailwindCSS 3.4.17, @tanstack/react-query 5.83.0

**New Dependencies**:
- Backend DevEx: ruff (linting), mypy (type checking), pytest-cov (coverage reporting)
- Backend Security: slowapi (rate limiting), python-multipart (if not present, for request parsing)
- Backend Observability: structlog (structured logging), prometheus-fastapi-instrumentator (metrics)
- Backend Testing: openapi-diff (CLI tool for contract validation, npm package)
- Frontend DevEx: @typescript-eslint/parser, @typescript-eslint/eslint-plugin, prettier, prettier-plugin-tailwindcss

**Storage**: SQLite database (test.db) - existing, no changes required for this feature

**Testing**: pytest 8.4.2 (backend), vitest (frontend - to be added if not present)

**Target Platform**:
- Backend: Linux/macOS servers (development and preview), containerizable for production
- Frontend: Modern browsers (Chrome, Firefox, Safari, Edge), deployed to Vercel CDN

**Project Type**: Web application (separate backend/frontend with REST API communication)

**Performance Goals**:
- CI pipeline completes in <3 minutes
- API endpoints P95 latency <500ms
- Rate limiting: 100 req/min per IP (standard endpoints), 5 req/min (auth endpoints)
- Structured logs: <5ms overhead per request
- Metrics collection: <2ms overhead per request

**Constraints**:
- Zero downtime during deployments (rolling updates, blue-green strategy)
- Preview deployments must be isolated (separate env vars per PR)
- Secrets never committed to git (pre-commit hooks + CI validation)
- Test coverage ≥80% on critical modules (auth, payments, client data, property transactions)
- Local development must mirror production (same DB version, same security headers, same logging)

**Scale/Scope**:
- Expected load: 10-100 concurrent users during development/testing, 1000+ in production
- API endpoints: ~20 existing + 3 new monitoring endpoints (/health, /metrics, /trace)
- Preview deployments: 5-10 active PRs simultaneously
- Log volume: ~1000 requests/day in development, 100K+ in production
- Metrics retention: 30 days (Prometheus default)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with all principles in `.specify/memory/constitution.md`:

- [x] **Code Quality & Testing**: ✅ Adds ruff/eslint linting, pytest-cov for ≥80% coverage tracking, OpenAPI contract tests, mypy/tsc for type safety (Pydantic already used, TypeScript strict mode enforced)
- [x] **Security & Compliance**: ✅ Implements security headers middleware (CSP/HSTS/X-Frame-Options/X-Content-Type-Options), slowapi rate limiting (100 req/min), Pydantic input validation tests, RBAC test scaffolding (no actual auth yet, just test framework)
- [x] **Observability & Reliability**: ✅ Adds structlog for JSON-formatted structured logging (requests/errors/latency), prometheus-fastapi-instrumentator for P50/P95/P99 metrics, request ID propagation for tracing, /health endpoint with error budget display, 99.9% uptime SLO tracking
- [x] **CI/CD & Deployment**: ✅ Creates GitHub Actions workflow (lint→type check→test→build), Vercel preview deployments for frontend, OpenAPI diff checker for contract validation, secrets managed via environment variables only (pre-commit hook prevents .env commits)
- [x] **Developer Experience**: ✅ CI pipeline parallelized to complete <3min, clear error messages from linting/type checking, auto-generated OpenAPI docs (FastAPI default), local dev mirrors production (same middleware stack), onboarding via quickstart.md (<30min setup)

**Violations**: None - all constitution principles are satisfied by this feature.

## Project Structure

### Documentation (this feature)

```text
specs/001-devex-qa-security-infra/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── monitoring-endpoints.yaml     # /health, /metrics, /trace OpenAPI specs
│   └── openapi-baseline.json         # Baseline spec for main branch (generated)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
client-management/
├── .github/
│   └── workflows/
│       ├── ci.yml                            # NEW: CI/CD pipeline (lint, type check, test, build, contract check)
│       └── preview-deploy.yml                # NEW: Vercel preview deployment trigger
├── .husky/
│   └── pre-commit                            # NEW: Pre-commit hook preventing .env commits
├── backend/
│   ├── app/
│   │   ├── middleware/
│   │   │   ├── __init__.py                   # NEW: Middleware exports
│   │   │   ├── logging.py                    # NEW: Structured logging middleware (structlog)
│   │   │   ├── security.py                   # NEW: Security headers middleware (CSP, HSTS, etc.)
│   │   │   ├── metrics.py                    # NEW: Prometheus instrumentation middleware
│   │   │   └── request_context.py            # NEW: Request ID propagation using contextvars
│   │   ├── api/v1/
│   │   │   ├── monitoring.py                 # NEW: /health, /metrics, /trace endpoints
│   │   │   ├── properties.py                 # EXISTING: Property CRUD endpoints
│   │   │   ├── landlords.py                  # EXISTING: Landlord CRUD endpoints (inferred)
│   │   │   └── applicants.py                 # EXISTING: Applicant CRUD endpoints (inferred)
│   │   ├── core/
│   │   │   ├── rate_limit.py                 # NEW: Rate limiting configuration (slowapi)
│   │   │   ├── config.py                     # EXISTING: App configuration
│   │   │   ├── database.py                   # EXISTING: Database setup
│   │   │   └── slo.py                        # NEW: SLO definitions and error budget tracking
│   │   ├── models/                           # EXISTING: SQLAlchemy models (property, landlord, applicant, etc.)
│   │   ├── schemas/                          # EXISTING: Pydantic schemas
│   │   └── main.py                           # EXISTING: FastAPI app entry point (will be modified to add middleware)
│   ├── tests/
│   │   ├── security/
│   │   │   ├── __init__.py                   # NEW: Security test package
│   │   │   ├── test_injection.py             # NEW: SQL injection, XSS, command injection tests
│   │   │   ├── test_rate_limiting.py         # NEW: Rate limit enforcement tests
│   │   │   ├── test_security_headers.py      # NEW: Security headers presence tests
│   │   │   └── test_rbac_scaffold.py         # NEW: RBAC test scaffolding (skipped until auth implemented)
│   │   ├── contract/
│   │   │   ├── __init__.py                   # NEW: Contract test package
│   │   │   └── test_openapi_stability.py     # NEW: OpenAPI spec regression tests
│   │   ├── observability/
│   │   │   ├── __init__.py                   # NEW: Observability test package
│   │   │   ├── test_logging.py               # NEW: Structured logging tests
│   │   │   ├── test_metrics.py               # NEW: Prometheus metrics tests
│   │   │   └── test_tracing.py               # NEW: Request ID propagation tests
│   │   ├── test_properties.py                # EXISTING: Property endpoint tests
│   │   ├── test_landlords.py                 # EXISTING: Landlord endpoint tests
│   │   ├── test_applicants.py                # EXISTING: Applicant endpoint tests
│   │   ├── test_kpis.py                      # EXISTING: KPI endpoint tests
│   │   ├── test_health.py                    # EXISTING: Health check tests
│   │   ├── test_search.py                    # EXISTING: Search endpoint tests
│   │   └── conftest.py                       # EXISTING: Pytest fixtures (will be extended)
│   ├── pyproject.toml                        # EXISTING: Will be modified to add new dependencies
│   ├── ruff.toml                             # NEW: Ruff linting configuration
│   ├── mypy.ini                              # NEW: Mypy type checking configuration
│   ├── pytest.ini                            # NEW: Pytest configuration (coverage thresholds)
│   └── .env.example                          # NEW: Example environment variables (no secrets)
├── frontend/
│   ├── src/
│   │   ├── components/                       # EXISTING: React components
│   │   ├── pages/                            # EXISTING: Page components
│   │   └── lib/                              # EXISTING: Utilities
│   ├── .eslintrc.json                        # EXISTING: ESLint config (will be enhanced for TypeScript strict mode)
│   ├── .prettierrc                           # NEW: Prettier formatting config
│   ├── .prettierignore                       # NEW: Prettier ignore patterns
│   ├── tsconfig.json                         # EXISTING: TypeScript config (already strict mode)
│   ├── vite.config.ts                        # EXISTING: Vite build config
│   ├── vercel.json                           # NEW: Vercel deployment configuration
│   └── package.json                          # EXISTING: Will be modified to add new dev dependencies
├── scripts/
│   ├── export-openapi-spec.sh                # NEW: Script to export OpenAPI spec to baseline file
│   ├── check-error-budget.py                 # NEW: Python script to calculate error budget from logs
│   └── validate-secrets.sh                   # NEW: Startup script to validate required env vars
├── docs/
│   ├── observability-dashboard.json          # NEW: Grafana dashboard config for visualizing Prometheus metrics
│   ├── security-testing.md                   # NEW: Documentation for running security tests
│   ├── preview-deployments.md                # NEW: Instructions for backend preview deployments (Railway/Render)
│   └── error-budget-runbook.md               # NEW: Runbook for responding to error budget exhaustion
└── .gitignore                                # EXISTING: Will be updated to ensure .env is ignored
```

**Structure Decision**: This is a Web application (Option 2) with separate `backend/` and `frontend/` directories. The existing structure is well-organized with FastAPI backend using layered architecture (api/models/schemas/core) and React frontend using component-based architecture. The new infrastructure code is added as middleware layers and new test directories to avoid disrupting existing business logic. All new files follow the existing project conventions (Python packages with `__init__.py`, TypeScript modules with ESM imports).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - table intentionally left empty. All constitution principles are satisfied.

## Phase 0: Research & Technology Decisions

### Research Areas

1. **Rate Limiting Strategy**: Evaluate slowapi vs. redis-based rate limiting
2. **Structured Logging Format**: Determine JSON schema for logs (ECS, OTEL, custom)
3. **Metrics Cardinality**: Decide which labels to include in Prometheus metrics (endpoint, method, status code)
4. **OpenAPI Diff Tool**: Evaluate openapi-diff vs. oasdiff vs. custom script
5. **Preview Deployment Backend**: Compare Railway vs. Render for backend preview deployments
6. **Pre-commit Hook Framework**: Evaluate husky vs. pre-commit (Python) vs. manual git hooks
7. **Error Budget Calculation**: Determine algorithm for calculating uptime/latency/error rate SLOs from logs
8. **Security Header CSP**: Define Content-Security-Policy that allows TailwindCSS inline styles
9. **Request ID Propagation**: Choose between contextvars vs. thread-local vs. passing through function args
10. **Test Coverage Thresholds**: Decide granular thresholds (per-module vs. per-file vs. global)

### Technology Decisions

See [research.md](./research.md) for full rationale. Summary:

- **Rate Limiting**: slowapi (in-memory, no Redis dependency, sufficient for MVP)
- **Structured Logging**: structlog with custom JSON renderer (ECS-inspired schema)
- **Metrics**: prometheus-fastapi-instrumentator with endpoint+method+status labels
- **OpenAPI Diff**: openapi-diff npm package (simple CLI, no Python dependency conflicts)
- **Preview Backend**: Railway (better free tier, simpler GitHub integration than Render)
- **Pre-commit Hooks**: husky (already Node.js in project, simpler than Python pre-commit)
- **Error Budget**: Calculate from structured logs with Python script (simple, no external DB)
- **CSP**: Permissive for development (`unsafe-inline` allowed), strict for production
- **Request ID**: contextvars (Python 3.7+ standard, thread-safe, no manual passing)
- **Coverage Thresholds**: Per-module with critical modules at ≥80%, others at ≥60%

## Phase 1: Design Artifacts

### Data Model

See [data-model.md](./data-model.md) for complete entity definitions. Key entities for this feature:

- **LogEntry**: Structured log record (timestamp, request_id, level, method, path, status_code, latency_ms, user_id, error_details)
- **MetricDataPoint**: Performance measurement (timestamp, endpoint, method, metric_type, value, percentile)
- **SecurityEvent**: Blocked malicious request (timestamp, ip_address, attack_type, blocked_payload, endpoint_targeted)
- **ErrorBudget**: SLO tracking (slo_target_uptime, slo_target_latency_p95, slo_target_error_rate, current_uptime, current_latency_p95, current_error_rate, budget_consumed_pct, burn_rate)
- **PipelineJob**: CI/CD execution (branch, commit_sha, status, started_at, completed_at, duration_seconds, logs_url)
- **PreviewDeployment**: Ephemeral environment (pr_number, frontend_url, backend_url, created_at, deleted_at, status)

### API Contracts

See [contracts/](./contracts/) for OpenAPI specifications. New endpoints:

- `GET /health` - Health check with error budget status
- `GET /metrics` - Prometheus metrics in text format
- `GET /trace` - Demonstrate request tracing (debug endpoint)

Existing endpoints remain unchanged (no breaking changes to properties, landlords, applicants APIs).

### Quickstart Guide

See [quickstart.md](./quickstart.md) for complete local development setup. Steps:

1. Clone repository and checkout feature branch
2. Install backend dependencies (`uv sync` or `pip install -e ".[dev]"`)
3. Install frontend dependencies (`npm install`)
4. Copy `.env.example` to `.env` and fill required secrets
5. Run database migrations (if any)
6. Start backend (`uvicorn app.main:app --reload`)
7. Start frontend (`npm run dev`)
8. Verify observability endpoints (`curl http://localhost:8000/health`)
9. Run tests (`pytest` for backend, `npm run test` for frontend)
10. Verify CI pipeline locally (run linters, type checkers, tests manually)

Total setup time: <30 minutes (satisfies Developer Experience principle).

## Phase 2: Implementation Planning

**Note**: Phase 2 planning (task generation) is handled by the `/speckit.tasks` command, not by this plan document. This plan document stops after Phase 1 design artifacts are generated.

## Next Steps

1. Run `/speckit.tasks` to generate task breakdown with dependencies
2. Implement tasks in priority order (P1 stories first: CI/CD, API contracts, security)
3. Validate each user story independently using acceptance scenarios
4. Re-run constitution check after implementation to verify compliance
5. Deploy to preview environment for stakeholder validation

**Estimated Implementation Time**: 8 hours of focused development work, distributed as:
- Setup & Configuration (ruff, mypy, eslint, prettier): 1 hour
- CI/CD Pipeline (GitHub Actions workflow): 2 hours
- Security Middleware (headers, rate limiting, validation tests): 1.5 hours
- Observability Stack (logging, metrics, tracing): 2 hours
- Preview Deployments (Vercel config, Railway docs): 1 hour
- Error Budget & SLO Monitoring (scripts, /health endpoint): 0.5 hours

**Critical Path**: CI/CD pipeline → Security middleware → Observability → Preview deployments (sequential dependencies). Error budget monitoring can be implemented in parallel.
