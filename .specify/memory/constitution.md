<!--
Sync Impact Report
==================
Version Change: 0.0.0 → 1.0.0
Rationale: Initial constitution establishment with comprehensive DevEx/QA/Security principles

Modified Principles:
- New: Code Quality & Testing Standards
- New: Security & Compliance
- New: Observability & Reliability
- New: CI/CD & Deployment
- New: Developer Experience

Added Sections:
- Core Principles (5 principle sections)
- Enforcement & Compliance
- Governance

Templates Requiring Updates:
✅ plan-template.md - Constitution Check section validated
✅ spec-template.md - Requirements alignment verified
✅ tasks-template.md - Task categorization aligned
✅ checklist-template.md - No changes required (generic structure)
✅ agent-file-template.md - No changes required (auto-generated)

Follow-up TODOs:
- None - all placeholders resolved
-->

# Estate Agent CRM Constitution

## Core Principles

### I. Code Quality & Testing Standards

All code changes MUST maintain the following quality gates:

- **Linting**: Python code MUST pass `ruff` checks; TypeScript code MUST pass `eslint` checks
- **Test Coverage**: Critical paths (authentication, payment processing, client data handling, property transactions) MUST maintain ≥80% test coverage
- **API Testing**: Every API endpoint MUST have corresponding unit tests covering success cases, validation failures, and error conditions
- **Contract Stability**: Contract tests MUST validate API stability; breaking changes require major version bump per semantic versioning
- **Type Safety**: Backend MUST use Pydantic models for all data validation; frontend MUST use TypeScript strict mode with no `any` types in production code

**Rationale**: Estate agent CRMs handle sensitive financial data (bank details, commission amounts) and mission-critical workflows (property listings, tenant management). Quality gates prevent data corruption, security vulnerabilities, and production incidents that erode client trust.

### II. Security & Compliance

Security MUST be enforced at every layer:

- **Least Privilege**: Users access only data required for their role (e.g., junior agents cannot view commission rates; property managers cannot access sales data)
- **Data Masking**: Sensitive data (bank account numbers, property access codes, landlord contact details) MUST be masked by default in UI and logs; full access requires explicit permission and audit logging
- **Security Headers**: All HTTP responses MUST include:
  - `Content-Security-Policy`: strict CSP preventing XSS
  - `Strict-Transport-Security`: HSTS enforcing HTTPS
  - `X-Frame-Options: DENY`: preventing clickjacking
  - `X-Content-Type-Options: nosniff`: preventing MIME sniffing
- **Rate Limiting**: Every endpoint MUST enforce rate limits (100 requests/minute per IP); authentication endpoints limited to 5 attempts/minute
- **Input Validation**: All user input MUST be validated server-side using Pydantic schemas; reject malicious payloads (SQL injection, XSS, path traversal) before processing

**Rationale**: Estate agents handle highly sensitive data (landlord financial details, tenant references, property access codes). A data breach destroys client trust and violates GDPR. Defense-in-depth architecture prevents single points of failure.

### III. Observability & Reliability

Production systems MUST provide complete visibility:

- **Structured Logging**: All critical events MUST be logged with structured fields (timestamp, user_id, request_id, action, outcome):
  - Request start/end (method, path, duration, status)
  - Authentication events (login, logout, failed attempts)
  - Business events (property listed, offer accepted, tenant assigned)
  - Errors (exception type, stack trace, context)
- **Performance Metrics**: System MUST expose metrics tracking:
  - Latency: P95 and P99 response times per endpoint
  - Error rates: 4xx and 5xx responses per endpoint per minute
  - Active sessions: concurrent authenticated users
- **Distributed Tracing**: Requests spanning multiple services (frontend → backend → database) MUST propagate trace IDs for end-to-end visibility
- **Health Checks**: System MUST expose `/health` endpoint reporting database connectivity, external API status, and system resources
- **Error Budgets**: Services MUST maintain 99.9% uptime (43.8 minutes downtime/month allowed); breaches trigger incident review and reliability improvements

**Rationale**: Estate agents operate on tight margins; downtime directly loses revenue. Observability enables rapid incident response, capacity planning, and proactive optimization before users experience degradation.

### IV. CI/CD & Deployment

Every code change MUST pass automated quality gates:

- **PR Pipeline**: Every pull request MUST trigger sequential pipeline:
  1. Lint (ruff for Python, eslint for TypeScript)
  2. Type check (mypy for Python, tsc for TypeScript)
  3. Test (pytest for backend, jest for frontend; all tests MUST pass)
  4. Build (successful compilation/bundling required)
- **Preview Deployments**: Every PR MUST deploy to ephemeral preview environment for manual testing before merge
- **API Stability**: OpenAPI schema diff checker MUST run on every PR; breaking changes (removed endpoints, changed request/response schemas) fail the build unless version bumped to next major
- **Zero-Downtime Deployments**: Production deployments MUST use rolling updates or blue-green strategy; no user-facing downtime allowed
- **Secrets Management**: Secrets (database passwords, API keys, encryption keys) MUST NEVER be committed to git; use environment variables injected at runtime

**Rationale**: Estate agents cannot afford deployment failures during peak hours (evenings/weekends when viewings occur). Automated gates catch issues before production; preview environments enable stakeholder validation; zero-downtime deployments maintain service availability.

### V. Developer Experience

Development workflow MUST enable rapid iteration:

- **Fast Feedback**: Test suite MUST complete in <2 minutes; developers get immediate feedback on code quality
- **Clear Error Messages**: Validation errors MUST specify field name, invalid value, and expected format (e.g., "email: 'invalid@' must match format user@domain.com")
- **Living Documentation**: API documentation MUST be auto-generated from OpenAPI spec; frontend types MUST be auto-generated from backend Pydantic models; documentation stays in sync with code by construction
- **Local Development Parity**: Local development environment MUST mirror production (same PostgreSQL version, same environment variables, same security headers); "works on my machine" issues eliminated
- **Onboarding Speed**: New developers MUST complete setup and run full test suite in <30 minutes; automated setup script provisions database, installs dependencies, runs migrations, and executes tests

**Rationale**: Estate agent CRMs evolve rapidly (new regulations, competitor features, client requests). Fast feedback loops enable multiple iterations per day; clear errors reduce debugging time; living documentation prevents drift; production parity prevents environment-specific bugs; fast onboarding enables rapid team scaling.

## Enforcement & Compliance

### Constitution Gates

All feature specifications (`spec.md`) and implementation plans (`plan.md`) MUST verify compliance with all five core principles before Phase 0 research begins. Re-check after Phase 1 design.

**Violations require explicit justification**: If a feature cannot satisfy a principle (e.g., complex data migration requires >2 minute test suite), the violation MUST be documented in plan.md Complexity Tracking table with:
- Which principle violated
- Why violation necessary
- What simpler alternative was rejected and why

### Review Process

**Code Reviews** MUST verify:
- ✅ Linting passes (ruff/eslint)
- ✅ Type checks pass (mypy/tsc strict mode)
- ✅ Tests added for new functionality (≥80% coverage maintained)
- ✅ Sensitive data masked in UI/logs
- ✅ Security headers present on new endpoints
- ✅ Rate limiting configured for new endpoints
- ✅ Structured logging added for new business logic
- ✅ API changes validated with OpenAPI diff
- ✅ Error messages are clear and actionable

**Deployment Approvals**:
- Preview environment MUST be validated before merge
- Staging deployment MUST complete successfully before production
- Production deployment requires approval from tech lead

### Compliance Monitoring

**Weekly metrics review**:
- Test coverage percentage (target: ≥80% critical paths)
- Build pipeline success rate (target: ≥95%)
- P95/P99 latency trends (alert if >10% regression)
- Error budget consumption (alert if >50% spent mid-month)

**Quarterly security audit**:
- Penetration testing of authentication/authorization
- Review of sensitive data handling (masking, access logs)
- Dependency vulnerability scanning (OWASP Top 10)
- Access control verification (least privilege enforcement)

## Governance

### Amendment Procedure

Constitution changes require:
1. **Proposal**: Document proposed change with rationale and impact analysis
2. **Review**: Tech lead and product owner review for alignment with business goals
3. **Approval**: Majority approval from engineering team (voting in sprint retrospective)
4. **Migration Plan**: Document how existing code will be brought into compliance (if applicable)
5. **Version Bump**: Increment CONSTITUTION_VERSION per semantic versioning (see below)
6. **Template Sync**: Update all dependent templates (plan, spec, tasks) to reflect new principles

### Versioning Policy

**MAJOR** (X.0.0): Backward incompatible changes
- Removing or redefining a core principle (e.g., lowering test coverage requirement from 80% to 60%)
- Adding mandatory gates that fail existing features (e.g., requiring 90% coverage when current is 70%)

**MINOR** (1.X.0): Backward compatible additions
- Adding a new principle section (e.g., VI. Accessibility Standards)
- Materially expanding guidance (e.g., adding specific OWASP Top 10 checklist to Security principle)

**PATCH** (1.0.X): Non-semantic refinements
- Clarifying wording without changing requirements (e.g., "API tests recommended" → "API tests required")
- Fixing typos or formatting
- Adding examples that don't change the rules

### Compliance Review

**Pre-merge**: Constitution Check in plan.md MUST be completed and approved before any feature implementation begins

**Monthly**: Engineering lead reviews metrics (test coverage, build success rate, P95 latency, error budget) and flags teams violating targets

**Quarterly**: Security audit reviews compliance with Principle II (Security & Compliance) and generates remediation tasks for violations

**Constitution supersedes all other practices**: In case of conflict between this constitution and other documentation (README, wiki, tribal knowledge), the constitution takes precedence. When in doubt, consult `.specify/memory/constitution.md`.

---

**Version**: 1.0.0 | **Ratified**: 2025-11-03 | **Last Amended**: 2025-11-03
