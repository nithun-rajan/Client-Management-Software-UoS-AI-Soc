# Feature Specification: DevEx, QA, and Security Infrastructure

**Feature Branch**: `001-devex-qa-security-infra`
**Created**: 2025-11-03
**Status**: Draft
**Input**: Build comprehensive DevEx, QA, and Security infrastructure for Estate Agent CRM

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automated Quality Gates on Every Code Change (Priority: P1)

As a developer, I want every code push to automatically check code quality, run tests, and validate types, so I get immediate feedback on issues before they reach production.

**Why this priority**: This is the foundation that prevents bugs from reaching production. Without automated quality gates, every other feature is at risk. Developers need fast feedback loops to maintain code quality efficiently.

**Independent Test**: Can be fully tested by pushing code to a branch and observing that the pipeline runs linting, type checking, tests, and build steps within 3 minutes, providing clear pass/fail feedback.

**Acceptance Scenarios**:

1. **Given** a developer pushes code with linting violations, **When** the pipeline runs, **Then** the build fails with specific error messages showing which files and lines violate style rules
2. **Given** a developer pushes code with type errors, **When** type checking runs, **Then** the build fails with clear type mismatch messages
3. **Given** a developer pushes code that breaks existing tests, **When** the test suite runs, **Then** the build fails showing which tests failed and why
4. **Given** a developer pushes code that passes all quality gates, **When** the pipeline completes, **Then** all steps show green checkmarks within 3 minutes
5. **Given** test coverage drops below 80% on critical modules, **When** coverage reports are generated, **Then** the build fails with coverage percentage and missing coverage details

---

### User Story 2 - API Contract Protection (Priority: P1)

As a product manager, I want breaking API changes to be caught automatically before merge, so backend changes don't break the frontend or mobile clients without warning.

**Why this priority**: Breaking changes cause production incidents, customer complaints, and emergency hotfixes. Catching them early prevents these costly failures and ensures smooth deployments.

**Independent Test**: Can be fully tested by modifying an API endpoint (remove a field, change a type, delete an endpoint), opening a PR, and observing that the pipeline detects the breaking change and fails with a detailed diff report.

**Acceptance Scenarios**:

1. **Given** a developer removes a required field from an API response, **When** the OpenAPI diff runs, **Then** the build fails showing the removed field as a breaking change
2. **Given** a developer changes a field type (e.g., string to number), **When** the OpenAPI diff runs, **Then** the build fails identifying the type change as breaking
3. **Given** a developer deletes an endpoint used by the frontend, **When** the OpenAPI diff runs, **Then** the build fails showing the removed endpoint
4. **Given** a developer adds a new optional field to a response, **When** the OpenAPI diff runs, **Then** the build passes as this is backward-compatible
5. **Given** a developer adds a new endpoint, **When** the OpenAPI diff runs, **Then** the build passes showing the addition as non-breaking

---

### User Story 3 - Preview Environments for Safe Testing (Priority: P2)

As a QA tester or stakeholder, I want to test changes in an isolated preview environment before they merge to main, so I can validate features without affecting the production or staging systems.

**Why this priority**: Preview environments enable parallel testing of multiple features and reduce the risk of deploying broken changes. They provide confidence before merge and speed up the review cycle.

**Independent Test**: Can be fully tested by opening a PR, waiting for automatic deployment, receiving a comment with the preview URL, testing the feature in the preview environment, and observing that the environment is deleted when the PR closes.

**Acceptance Scenarios**:

1. **Given** a developer opens a PR with frontend changes, **When** the preview deployment runs, **Then** a unique URL (e.g., crm-pr-123.vercel.app) is generated and posted as a PR comment within 5 minutes
2. **Given** a PR has multiple commits, **When** new commits are pushed, **Then** the preview environment updates automatically with the latest changes
3. **Given** a PR is merged or closed, **When** the PR status changes, **Then** the preview environment is automatically deleted to avoid resource costs
4. **Given** multiple PRs are open simultaneously, **When** preview deployments run, **Then** each PR gets an isolated environment with separate configurations

---

### User Story 4 - Security Protection Against Common Attacks (Priority: P1)

As a system administrator, I want the CRM to automatically protect against common web vulnerabilities (XSS, SQL injection, rate limit abuse), so client data remains secure even if developers make mistakes.

**Why this priority**: Estate agents handle highly sensitive data (bank details, access codes, client information). A security breach destroys trust and violates GDPR. Security must be built-in, not bolted-on.

**Independent Test**: Can be fully tested by sending malicious requests (SQL injection attempts, XSS payloads, excessive rapid requests) and verifying that the system rejects them with appropriate error responses.

**Acceptance Scenarios**:

1. **Given** an attacker sends an API request with SQL injection payload, **When** input validation runs, **Then** the request is rejected with 400 Bad Request before reaching the database
2. **Given** an attacker sends a request with XSS script tags, **When** input validation runs, **Then** the payload is rejected or sanitized
3. **Given** a client makes 101 requests in one minute to an endpoint, **When** rate limiting is enforced, **Then** the 101st request returns 429 Too Many Requests with a Retry-After header
4. **Given** a valid request is made, **When** the response is returned, **Then** all security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) are present
5. **Given** authentication endpoints exist, **When** an IP makes 6 failed login attempts in one minute, **Then** further attempts are blocked with 429 status

---

### User Story 5 - System Observability for Debugging and Monitoring (Priority: P2)

As an operations engineer, I want structured logs, performance metrics, and request tracing, so I can quickly diagnose issues, monitor system health, and optimize performance.

**Why this priority**: Without observability, debugging production issues is guesswork. Structured logs and metrics enable rapid incident response and proactive optimization before users experience problems.

**Independent Test**: Can be fully tested by making API requests, checking that logs contain structured JSON with request details, accessing the /metrics endpoint to view performance data, and using request IDs to trace requests across system components.

**Acceptance Scenarios**:

1. **Given** an API request completes successfully, **When** logs are examined, **Then** a structured JSON log entry includes timestamp, method, path, status code, and latency in milliseconds
2. **Given** an API request fails with an error, **When** logs are examined, **Then** the error log includes the stack trace, error type, and request ID for tracing
3. **Given** the system is running, **When** the /metrics endpoint is accessed, **Then** it returns Prometheus-format metrics including request counts, P50/P95/P99 latencies, and error rates per endpoint
4. **Given** a request generates multiple log entries, **When** logs are searched by request ID, **Then** all related log entries can be traced from frontend to API to database
5. **Given** the /health endpoint is accessed, **When** a response is returned, **Then** it shows database connectivity status, system uptime, and remaining error budget

---

### User Story 6 - Reliability Tracking Through Error Budgets (Priority: P3)

As a product manager, I want to track service reliability through error budgets and SLO metrics, so I can make informed decisions about when to focus on reliability vs. new features.

**Why this priority**: Error budgets provide objective criteria for balancing feature velocity with stability. They prevent reliability degradation and guide engineering priorities.

**Independent Test**: Can be fully tested by simulating errors or downtime, running the error budget calculation script, and observing that the /health endpoint shows updated error budget consumption and warns when thresholds are exceeded.

**Acceptance Scenarios**:

1. **Given** the system has 99.9% uptime SLO, **When** 20 minutes of downtime occurs in a month, **Then** the error budget shows 46% consumed (20 of 43.8 minutes used)
2. **Given** the system exceeds 0.1% error rate, **When** the error budget script runs, **Then** it logs a warning that the error rate SLO is breached
3. **Given** P95 response times exceed 500ms, **When** metrics are analyzed, **Then** the system flags this as an SLO violation
4. **Given** the error budget is 50% consumed mid-month, **When** the /health endpoint is checked, **Then** it displays a warning about error budget burn rate
5. **Given** error budget is exhausted, **When** stakeholders review the metrics, **Then** they have clear data to prioritize reliability work over new features

---

### User Story 7 - Secure Secrets Management (Priority: P2)

As a developer, I want secrets (database passwords, API keys) to be managed securely outside the codebase, so credentials never leak into version control and can be rotated without code changes.

**Why this priority**: Committed secrets are the #1 source of security breaches. Proper secrets management prevents credential leaks and enables secure credential rotation.

**Independent Test**: Can be fully tested by attempting to commit a .env file (should be blocked by pre-commit hook), verifying that the application fails to start if required secrets are missing, and confirming that .env.example contains all required variable names without actual secrets.

**Acceptance Scenarios**:

1. **Given** a developer attempts to commit a .env file, **When** the pre-commit hook runs, **Then** the commit is blocked with a warning message
2. **Given** the application starts without a required secret, **When** the startup validation runs, **Then** the application fails immediately with a clear error message listing the missing secret
3. **Given** a new developer clones the repository, **When** they review .env.example, **Then** they see all required environment variables with descriptive comments but no actual secret values
4. **Given** secrets need to be rotated, **When** environment variables are updated, **Then** the application uses the new credentials on next restart without code changes

---

### Edge Cases

- What happens when the CI pipeline exceeds the 3-minute target? (Display warning, investigate slow tests/builds)
- What happens when OpenAPI spec cannot be generated? (Fail the build with clear error, indicating FastAPI configuration issue)
- What happens when preview deployment fails? (Post PR comment with error details, allow manual retry)
- What happens when rate limit storage (Redis/memory) is unavailable? (Gracefully degrade: log warning but allow requests, or use in-memory fallback)
- What happens when structured logging library fails? (Fall back to standard logging to ensure errors are still captured)
- What happens when /metrics endpoint is hammered by scrapers? (Apply rate limiting to metrics endpoint itself)
- What happens when error budget calculation script encounters corrupted logs? (Skip invalid entries, log warning, calculate based on valid data)
- What happens when pre-commit hook is bypassed with --no-verify? (CI pipeline should still catch .env files and fail the build)

## Requirements *(mandatory)*

### Functional Requirements

#### CI/CD Pipeline Requirements

- **FR-001**: System MUST run automated quality checks (linting, type checking, testing, building) on every push and pull request
- **FR-002**: System MUST complete the entire CI pipeline in under 3 minutes to provide fast developer feedback
- **FR-003**: Backend linting MUST use ruff to catch Python style violations
- **FR-004**: Frontend linting MUST use eslint to enforce TypeScript code style
- **FR-005**: Type checking MUST run mypy for Python and tsc for TypeScript
- **FR-006**: System MUST execute all unit tests using pytest for backend and vitest for frontend (when tests exist)
- **FR-007**: System MUST generate test coverage reports and fail if coverage drops below 80% on critical modules (authentication, payment processing, client data handling, property transactions)
- **FR-008**: System MUST build the frontend using vite to catch build-time errors
- **FR-009**: Backend and frontend jobs MUST run in parallel to reduce total pipeline time

#### API Contract Testing Requirements

- **FR-010**: System MUST export the OpenAPI specification from the FastAPI backend at /openapi.json endpoint
- **FR-011**: System MUST store a baseline OpenAPI spec for the main branch
- **FR-012**: System MUST generate the OpenAPI spec for each PR branch
- **FR-013**: System MUST compare main branch spec vs. PR branch spec using openapi-diff tool
- **FR-014**: System MUST fail the CI pipeline if breaking changes are detected (removed endpoints, changed response schemas, removed required fields)
- **FR-015**: System MUST pass the CI pipeline if only backward-compatible changes exist (new optional fields, new endpoints)
- **FR-016**: System MUST display a detailed diff report in the CI logs showing all API changes

#### Preview Deployment Requirements

- **FR-017**: System MUST deploy the frontend to Vercel on every PR with auto-generated URLs (format: project-pr-{number}.vercel.app)
- **FR-018**: System MUST provide documentation for deploying backend to Railway or Render (manual process initially)
- **FR-019**: Each preview deployment MUST use isolated environment variables (separate from production/staging)
- **FR-020**: System MUST post PR comments with links to the preview deployment
- **FR-021**: System MUST automatically delete preview deployments when PR is merged or closed

#### Security Infrastructure Requirements

- **FR-022**: System MUST add security headers to all API responses: Content-Security-Policy, Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options
- **FR-023**: CORS middleware MUST be configured to only allow requests from the frontend domain
- **FR-024**: System MUST implement rate limiting at 100 requests per minute per IP address for all API endpoints
- **FR-025**: System MUST return 429 Too Many Requests when rate limit is exceeded
- **FR-026**: Rate limit responses MUST include Retry-After header indicating when requests can resume
- **FR-027**: Authentication endpoints MUST have stricter rate limiting (5 attempts per minute per IP)
- **FR-028**: System MUST create pytest tests that verify rejection of SQL injection attempts
- **FR-029**: System MUST create pytest tests that verify rejection of XSS payloads
- **FR-030**: System MUST create pytest tests that verify rejection of command injection attempts
- **FR-031**: System MUST verify that Pydantic validation rejects malicious inputs before database operations
- **FR-032**: System MUST test that file upload endpoints (if any) reject executable files
- **FR-033**: System MUST create RBAC test scaffolding with test cases for Property Manager, Branch Manager, and Lettings Negotiator roles (tests skipped until auth is implemented)
- **FR-034**: RBAC tests MUST document expected permissions matrix in docstrings

#### Observability Requirements

- **FR-035**: System MUST add logging middleware to FastAPI that captures request method, path, status code, and latency
- **FR-036**: System MUST use structlog for JSON-formatted logs
- **FR-037**: Logs MUST include timestamp, method, path, status, latency_ms fields for all requests
- **FR-038**: Logs MUST include user_id field (placeholder for when authentication is added)
- **FR-039**: Error logs (5xx responses) MUST include error type and stack trace
- **FR-040**: Log levels MUST be: INFO for requests, ERROR for failures, DEBUG for detailed debugging
- **FR-041**: System MUST integrate prometheus-fastapi-instrumentator for metrics collection
- **FR-042**: System MUST expose metrics at /metrics endpoint in Prometheus format
- **FR-043**: Metrics MUST track request count, request duration (P50/P95/P99), error rate, and active requests per endpoint
- **FR-044**: System MUST provide Grafana-compatible dashboard configuration or documentation for visualizing metrics
- **FR-045**: System MUST generate a unique request ID (UUID) for each incoming request
- **FR-046**: Request ID MUST be propagated across all function calls using context variables
- **FR-047**: Request ID MUST be included in all log entries for that request
- **FR-048**: Request ID MUST be logged in all error messages to enable tracing
- **FR-049**: System MUST provide a /trace endpoint demonstrating request tracing from frontend to API to database

#### SLO and Error Budget Requirements

- **FR-050**: System MUST define SLO for 99.9% uptime (43 minutes downtime/month allowed)
- **FR-051**: System MUST define SLO for P95 response time < 500ms
- **FR-052**: System MUST define SLO for error rate < 0.1%
- **FR-053**: System MUST provide a script that calculates error budget burn rate from logs
- **FR-054**: The /health endpoint MUST display remaining error budget
- **FR-055**: System MUST log warnings when error budget is 50% consumed
- **FR-056**: System MUST log critical alerts when error budget is exhausted

#### Secrets Management Requirements

- **FR-057**: System MUST provide .env.example file with all required environment variables (without actual secret values)
- **FR-058**: System MUST document the process for rotating secrets (database passwords, API keys)
- **FR-059**: System MUST include a pre-commit hook that prevents committing .env files
- **FR-060**: System MUST validate on startup that all required secrets are present
- **FR-061**: System MUST fail startup with clear error messages if any required secret is missing

### Key Entities *(include if feature involves data)*

- **Pipeline Job**: Represents a CI/CD pipeline execution with status (pending, running, success, failure), start time, end time, duration, and logs
- **API Contract**: Represents the OpenAPI specification snapshot with version, timestamp, endpoint definitions, schema definitions, and breaking change flags
- **Preview Deployment**: Represents an ephemeral environment with unique URL, PR number, deployment status, creation timestamp, and cleanup timestamp
- **Security Event**: Represents blocked malicious requests with timestamp, IP address, attack type (SQL injection, XSS, rate limit), blocked payload, and endpoint targeted
- **Log Entry**: Represents structured log records with timestamp, request ID, log level, method, path, status code, latency, user ID, and error details (if applicable)
- **Metric Data Point**: Represents performance measurements with timestamp, endpoint, metric type (request count, latency, error rate), value, and percentile (P50/P95/P99)
- **Error Budget**: Represents reliability tracking with SLO targets (uptime %, latency threshold, error rate threshold), current consumption percentage, remaining budget, and burn rate
- **Secret Configuration**: Represents environment variable requirements with variable name, description, whether required or optional, and rotation frequency guidance

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers receive code quality feedback within 3 minutes of pushing code
- **SC-002**: 100% of breaking API changes are caught before merge to main branch
- **SC-003**: Every PR automatically generates a preview environment within 5 minutes
- **SC-004**: 100% of malicious input attempts (SQL injection, XSS, command injection) are rejected with appropriate error responses
- **SC-005**: Rate limiting prevents any IP from exceeding 100 requests per minute per endpoint
- **SC-006**: All API responses include required security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- **SC-007**: Every API request generates a structured JSON log entry with timestamp, method, path, status, and latency
- **SC-008**: System performance metrics (P50/P95/P99 latency, error rate, request count) are accessible via /metrics endpoint
- **SC-009**: Request IDs enable tracing of any request from frontend through API to database
- **SC-010**: Error budget consumption is visible in /health endpoint and warns when 50% consumed
- **SC-011**: Zero secrets are committed to version control (validated by pre-commit hooks and CI checks)
- **SC-012**: Application fails fast on startup if any required secret is missing, with clear error message
- **SC-013**: Test coverage remains above 80% for all critical modules (authentication, payments, client data, property transactions)
- **SC-014**: System maintains 99.9% uptime SLO (less than 43 minutes downtime per month)
- **SC-015**: 95% of API requests complete in under 500ms (P95 latency target)

## Assumptions *(optional)*

- **Assumption 1**: The existing codebase already has pytest configured for backend and package.json configured for frontend
- **Assumption 2**: Developers have GitHub accounts and PRs are created against the main branch in a GitHub repository
- **Assumption 3**: Vercel account is available for frontend preview deployments (free tier supports the expected PR volume)
- **Assumption 4**: The FastAPI application already generates OpenAPI spec at /openapi.json endpoint (standard FastAPI behavior)
- **Assumption 5**: Critical modules are defined as: authentication, payment processing, client data handling, and property transactions (these require ≥80% test coverage)
- **Assumption 6**: The frontend is already configured to build with Vite (package.json contains vite build script)
- **Assumption 7**: Developers are comfortable with YAML syntax for GitHub Actions workflows
- **Assumption 8**: The existing SQLite database does not require separate observability (focus on API layer metrics)
- **Assumption 9**: Initial observability uses simple JSON logs and Prometheus metrics (not enterprise solutions like Datadog or New Relic)
- **Assumption 10**: RBAC implementation will come in a future feature (this feature only prepares test scaffolding)

## Dependencies *(optional)*

- **Dependency 1**: GitHub repository with Actions enabled (required for CI/CD pipeline)
- **Dependency 2**: Vercel account and project configured (required for frontend preview deployments)
- **Dependency 3**: OpenAPI specification generation working in FastAPI (standard FastAPI feature)
- **Dependency 4**: Existing test suite with 6 pytest files (will be extended, not replaced)
- **Dependency 5**: Python package manager (pip or uv) for installing new dependencies (ruff, mypy, structlog, prometheus-fastapi-instrumentator, slowapi)
- **Dependency 6**: Node.js package manager (npm or yarn) for installing frontend dev dependencies (eslint, vitest if not present)
- **Dependency 7**: Git pre-commit hooks framework (or manual hook installation)

## Out of Scope *(optional)*

- Full authentication and authorization implementation (only RBAC test scaffolding included)
- Production deployment automation to AWS, Azure, or GCP (focus is on preview environments)
- Advanced distributed tracing with Jaeger, Zipkin, or OpenTelemetry collectors (using simple request ID propagation instead)
- Automated backend preview deployments (documentation only for Railway/Render)
- Enterprise observability platforms (Datadog, New Relic, Splunk) - using open-source alternatives
- Load testing and performance testing automation (metrics enable manual performance analysis)
- Automated secret rotation (documentation only)
- Advanced security features (WAF, DDoS protection, encryption at rest) - covered in future features
- Frontend observability and error tracking (focus is backend observability)
- Custom alerting integrations (Slack, PagerDuty) - using log-based warnings
