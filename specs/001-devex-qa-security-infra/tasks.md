# Tasks: DevEx, QA, and Security Infrastructure

**Input**: Design documents from `/specs/001-devex-qa-security-infra/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/app/`, `backend/tests/` at repository root
- **Frontend**: `frontend/src/` at repository root
- **CI/CD**: `.github/workflows/` at repository root
- **Scripts**: `scripts/` at repository root
- **Docs**: `docs/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and configuration

- [ ] T001 Create backend dev dependencies in backend/pyproject.toml (add ruff, mypy, pytest-cov, slowapi, structlog, prometheus-fastapi-instrumentator)
- [ ] T002 Create backend linting configuration in backend/ruff.toml
- [ ] T003 Create backend type checking configuration in backend/mypy.ini
- [ ] T004 Create backend pytest configuration in backend/pytest.ini (coverage thresholds: critical modules ≥80%, others ≥60%)
- [ ] T005 [P] Create frontend dev dependencies in frontend/package.json (add @typescript-eslint/parser, @typescript-eslint/eslint-plugin, prettier, prettier-plugin-tailwindcss)
- [ ] T006 [P] Create frontend prettier configuration in frontend/.prettierrc
- [ ] T007 [P] Create frontend prettier ignore patterns in frontend/.prettierignore
- [ ] T008 [P] Install husky for pre-commit hooks (run: npx husky-init)
- [ ] T009 [P] Create environment variable example file in backend/.env.example (DATABASE_URL, LOG_LEVEL, ENVIRONMENT)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Create middleware package initialization in backend/app/middleware/__init__.py
- [ ] T011 Create request context module for request ID propagation in backend/app/middleware/request_context.py (use contextvars)
- [ ] T012 Create security headers middleware in backend/app/middleware/security.py (CSP, HSTS, X-Frame-Options, X-Content-Type-Options with dev/prod toggle)
- [ ] T013 Create rate limiting configuration in backend/app/core/rate_limit.py (slowapi limiter with 100 req/min default, 5 req/min for auth endpoints)
- [ ] T014 Create structured logging middleware in backend/app/middleware/logging.py (structlog with JSON renderer, ECS-inspired schema)
- [ ] T015 Create prometheus metrics middleware in backend/app/middleware/metrics.py (prometheus-fastapi-instrumentator setup)
- [ ] T016 Update FastAPI app in backend/app/main.py to register all middleware (security, logging, metrics, request context)
- [ ] T017 Create test fixtures for middleware in backend/tests/conftest.py (test client with middleware enabled)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Automated Quality Gates (Priority: P1) 🎯 MVP

**Goal**: CI/CD pipeline with linting, type checking, tests, coverage, and build validation completing in <3 minutes

**Independent Test**: Push code with linting violations, type errors, or test failures → CI fails with clear error messages. Push clean code → CI passes within 3 minutes.

### Implementation for User Story 1

- [ ] T018 [P] [US1] Create GitHub Actions CI workflow in .github/workflows/ci.yml with backend and frontend jobs running in parallel
- [ ] T019 [P] [US1] Add backend lint job to .github/workflows/ci.yml (ruff check + ruff format --check)
- [ ] T020 [P] [US1] Add backend type check job to .github/workflows/ci.yml (mypy app/)
- [ ] T021 [P] [US1] Add backend test job with coverage to .github/workflows/ci.yml (pytest --cov=app --cov-fail-under=70)
- [ ] T022 [P] [US1] Add frontend lint job to .github/workflows/ci.yml (npm run lint)
- [ ] T023 [P] [US1] Add frontend type check job to .github/workflows/ci.yml (tsc --noEmit)
- [ ] T024 [P] [US1] Add frontend build job to .github/workflows/ci.yml (npm run build)
- [ ] T025 [P] [US1] Configure CI job timeout to ensure <3 minute completion
- [ ] T026 [US1] Test CI pipeline by pushing code with intentional linting violation
- [ ] T027 [US1] Test CI pipeline by pushing code with intentional type error
- [ ] T028 [US1] Test CI pipeline by pushing code that breaks existing test
- [ ] T029 [US1] Test CI pipeline with clean code (all checks should pass)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - API Contract Protection (Priority: P1)

**Goal**: OpenAPI diff checking to prevent breaking API changes before merge

**Independent Test**: Modify API endpoint (remove field, change type) → OpenAPI diff detects breaking change and fails build with detailed report. Add optional field → build passes.

### Implementation for User Story 2

- [ ] T030 [P] [US2] Create script to export OpenAPI spec in scripts/export-openapi-spec.sh (curl http://localhost:8000/openapi.json > baseline.json)
- [ ] T031 [US2] Generate baseline OpenAPI spec for main branch in specs/001-devex-qa-security-infra/contracts/openapi-baseline.json (run export script)
- [ ] T032 [P] [US2] Add OpenAPI diff check job to .github/workflows/ci.yml (npx openapi-diff baseline.json pr-spec.json --fail-on-incompatible)
- [ ] T033 [P] [US2] Create contract test for OpenAPI spec stability in backend/tests/contract/__init__.py
- [ ] T034 [P] [US2] Create contract test for OpenAPI spec regression in backend/tests/contract/test_openapi_stability.py (validate spec structure)
- [ ] T035 [US2] Test OpenAPI diff by removing required field from existing endpoint
- [ ] T036 [US2] Test OpenAPI diff by changing field type (string → number)
- [ ] T037 [US2] Test OpenAPI diff by deleting existing endpoint
- [ ] T038 [US2] Test OpenAPI diff by adding optional field (should pass)
- [ ] T039 [US2] Test OpenAPI diff by adding new endpoint (should pass)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 4 - Security Protection (Priority: P1)

**Goal**: Security middleware (headers, rate limiting, input validation) to protect against common attacks

**Independent Test**: Send SQL injection payload → rejected with 400. Send 101 requests/minute → 101st rejected with 429. Verify security headers present on all responses.

### Implementation for User Story 4

- [ ] T040 [P] [US4] Create security test package in backend/tests/security/__init__.py
- [ ] T041 [P] [US4] Create SQL injection tests in backend/tests/security/test_injection.py (test property/landlord/applicant endpoints with SQL payloads)
- [ ] T042 [P] [US4] Create XSS payload tests in backend/tests/security/test_injection.py (test form inputs with <script> tags)
- [ ] T043 [P] [US4] Create command injection tests in backend/tests/security/test_injection.py (test file upload endpoints with shell commands)
- [ ] T044 [P] [US4] Create rate limiting tests in backend/tests/security/test_rate_limiting.py (send 101 requests, verify 429 on 101st)
- [ ] T045 [P] [US4] Create security headers tests in backend/tests/security/test_security_headers.py (verify CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- [ ] T046 [P] [US4] Create RBAC test scaffolding in backend/tests/security/test_rbac_scaffold.py (Property Manager, Branch Manager, Lettings Negotiator roles with pytest.skip decorators)
- [ ] T047 [US4] Verify security middleware prevents SQL injection (run test_injection.py)
- [ ] T048 [US4] Verify security middleware prevents XSS attacks (run test_injection.py)
- [ ] T049 [US4] Verify rate limiting enforces 100 req/min limit (run test_rate_limiting.py)
- [ ] T050 [US4] Verify security headers present on all responses (run test_security_headers.py)

**Checkpoint**: At this point, User Stories 1, 2, AND 4 should all work independently

---

## Phase 6: User Story 5 - System Observability (Priority: P2)

**Goal**: Structured logging, Prometheus metrics, and request tracing for debugging and monitoring

**Independent Test**: Make API request → check logs contain structured JSON with request details. Access /metrics → verify Prometheus metrics. Search logs by request ID → trace request across components.

### Implementation for User Story 5

- [ ] T051 [P] [US5] Create monitoring API endpoints module in backend/app/api/v1/monitoring.py
- [ ] T052 [P] [US5] Implement /health endpoint in backend/app/api/v1/monitoring.py (database connectivity, uptime, error budget)
- [ ] T053 [P] [US5] Implement /metrics endpoint in backend/app/api/v1/monitoring.py (expose prometheus-fastapi-instrumentator metrics)
- [ ] T054 [P] [US5] Implement /trace endpoint in backend/app/api/v1/monitoring.py (demonstrate request ID propagation with trace log)
- [ ] T055 [P] [US5] Register monitoring endpoints in FastAPI router in backend/app/main.py
- [ ] T056 [P] [US5] Create observability test package in backend/tests/observability/__init__.py
- [ ] T057 [P] [US5] Create structured logging tests in backend/tests/observability/test_logging.py (verify JSON format, required fields, request ID)
- [ ] T058 [P] [US5] Create metrics tests in backend/tests/observability/test_metrics.py (verify /metrics endpoint returns Prometheus format)
- [ ] T059 [P] [US5] Create tracing tests in backend/tests/observability/test_tracing.py (verify request ID propagation across middleware and endpoints)
- [ ] T060 [US5] Verify structured logs contain timestamp, method, path, status, latency (run test_logging.py)
- [ ] T061 [US5] Verify error logs include stack trace and request ID (run test_logging.py with intentional error)
- [ ] T062 [US5] Verify /metrics endpoint returns request counts and latency histograms (run test_metrics.py)
- [ ] T063 [US5] Verify request ID propagates across system components (run test_tracing.py)
- [ ] T064 [US5] Verify /health endpoint shows database connectivity and uptime (curl http://localhost:8000/health)

**Checkpoint**: At this point, User Stories 1, 2, 4, AND 5 should all work independently

---

## Phase 7: User Story 3 - Preview Deployments (Priority: P2)

**Goal**: Per-PR preview deployments for frontend (Vercel) and backend documentation (Railway)

**Independent Test**: Open PR → unique preview URL generated and posted in PR comment. Close PR → preview environment deleted.

### Implementation for User Story 3

- [ ] T065 [P] [US3] Create Vercel deployment configuration in frontend/vercel.json (auto-deploy on PR, unique URLs per PR)
- [ ] T066 [P] [US3] Create GitHub Actions preview deployment workflow in .github/workflows/preview-deploy.yml (trigger Vercel deployment on PR open/update)
- [ ] T067 [P] [US3] Configure Vercel project settings for preview deployments (environment variables, build command)
- [ ] T068 [P] [US3] Create documentation for Railway backend preview deployments in docs/preview-deployments.md (step-by-step manual process)
- [ ] T069 [P] [US3] Add PR comment action to .github/workflows/preview-deploy.yml (post preview URL to PR comments)
- [ ] T070 [P] [US3] Add preview cleanup action to .github/workflows/preview-deploy.yml (delete preview on PR close/merge)
- [ ] T071 [US3] Test preview deployment by opening PR with frontend changes
- [ ] T072 [US3] Test preview URL generation (verify unique URL posted in PR comment within 5 minutes)
- [ ] T073 [US3] Test preview update by pushing new commits to PR
- [ ] T074 [US3] Test preview deletion by closing/merging PR

**Checkpoint**: At this point, User Stories 1, 2, 3, 4, AND 5 should all work independently

---

## Phase 8: User Story 7 - Secrets Management (Priority: P2)

**Goal**: Secure secrets management with .env.example, pre-commit hooks, and startup validation

**Independent Test**: Attempt to commit .env file → blocked by pre-commit hook. Start app without required secret → fails with clear error message.

### Implementation for User Story 7

- [ ] T075 [P] [US7] Create pre-commit hook to prevent .env commits in .husky/pre-commit (check for .env in staged files)
- [ ] T076 [P] [US7] Create startup secrets validation script in scripts/validate-secrets.sh (check all required env vars present)
- [ ] T077 [P] [US7] Update backend app startup in backend/app/main.py to validate required secrets on launch
- [ ] T078 [P] [US7] Create secrets rotation documentation in docs/secrets-management.md (how to rotate database passwords, API keys)
- [ ] T079 [P] [US7] Add CI check for .env files in .github/workflows/ci.yml (grep for .env in git diff, fail if found)
- [ ] T080 [US7] Test pre-commit hook by attempting to commit .env file (should be blocked)
- [ ] T081 [US7] Test startup validation by removing required secret from .env (app should fail with clear error)
- [ ] T082 [US7] Test that .env.example contains all required variables without actual secrets
- [ ] T083 [US7] Test secrets rotation process using documentation (update .env, restart app, verify new credentials work)

**Checkpoint**: At this point, User Stories 1, 2, 3, 4, 5, AND 7 should all work independently

---

## Phase 9: User Story 6 - Error Budget Tracking (Priority: P3)

**Goal**: Error budget calculation script and SLO monitoring (99.9% uptime, P95<500ms, error rate<0.1%)

**Independent Test**: Simulate errors/downtime → run error budget script → verify /health endpoint shows updated budget consumption and warns at 50% threshold.

### Implementation for User Story 6

- [ ] T084 [P] [US6] Create SLO definitions module in backend/app/core/slo.py (define 99.9% uptime, P95<500ms, error rate<0.1% targets)
- [ ] T085 [P] [US6] Create error budget calculation script in scripts/check-error-budget.py (parse JSON logs, calculate uptime/latency/error rate)
- [ ] T086 [P] [US6] Update /health endpoint in backend/app/api/v1/monitoring.py to display error budget from slo.py
- [ ] T087 [P] [US6] Add error budget warning logic in backend/app/core/slo.py (log warning when 50% consumed, critical alert when exhausted)
- [ ] T088 [P] [US6] Create error budget runbook in docs/error-budget-runbook.md (how to respond to budget exhaustion)
- [ ] T089 [P] [US6] Create Grafana dashboard configuration in docs/observability-dashboard.json (visualize Prometheus metrics)
- [ ] T090 [US6] Test error budget calculation by simulating 20 minutes downtime (should show 46% consumed of 43.8 min/month)
- [ ] T091 [US6] Test P95 latency SLO by simulating slow requests >500ms (should flag SLO violation)
- [ ] T092 [US6] Test error rate SLO by simulating 5xx errors >0.1% (should flag SLO violation)
- [ ] T093 [US6] Test error budget warning at 50% consumption (should log warning)
- [ ] T094 [US6] Verify /health endpoint displays remaining error budget and burn rate

**Checkpoint**: All user stories should now be independently functional

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T095 [P] Create comprehensive security testing documentation in docs/security-testing.md (how to run all security tests, interpret results)
- [ ] T096 [P] Update .gitignore to ensure .env files are never committed (add .env, .env.local, .env.*.local)
- [ ] T097 [P] Create CI/CD pipeline documentation in docs/ci-cd-pipeline.md (workflow diagram, troubleshooting guide)
- [ ] T098 [P] Add code coverage badge to README.md (link to coverage reports from CI)
- [ ] T099 [P] Create developer onboarding checklist in docs/onboarding.md (based on quickstart.md, <30 min target)
- [ ] T100 Run quickstart.md validation end-to-end (new developer setup in <30 minutes)
- [ ] T101 Performance optimization: ensure logging middleware <5ms overhead per request
- [ ] T102 Performance optimization: ensure metrics middleware <2ms overhead per request
- [ ] T103 Performance optimization: ensure CI pipeline completes in <3 minutes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - US1: Automated Quality Gates (P1) - Can start after Foundational - No dependencies on other stories
  - US2: API Contract Protection (P1) - Can start after Foundational - No dependencies on other stories
  - US4: Security Protection (P1) - Can start after Foundational - No dependencies on other stories
  - US5: System Observability (P2) - Can start after Foundational - No dependencies on other stories
  - US3: Preview Deployments (P2) - Can start after Foundational - Benefits from US1 (CI pipeline) but can work independently
  - US7: Secrets Management (P2) - Can start after Foundational - No dependencies on other stories
  - US6: Error Budget Tracking (P3) - Depends on US5 (observability) for log data
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Independent
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent
- **User Story 4 (P1)**: Can start after Foundational (Phase 2) - Independent
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Independent
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent (though US1 CI pipeline is helpful)
- **User Story 7 (P2)**: Can start after Foundational (Phase 2) - Independent
- **User Story 6 (P3)**: Depends on US5 (observability) for structured logs to analyze

### Within Each User Story

- Tests (if included) are not required for this feature (per spec.md, no explicit test request)
- Implementation tasks within a story follow: Infrastructure → Configuration → Integration → Validation
- Tasks marked [P] within a story can run in parallel
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T005-T009)
- All Foundational tasks can run sequentially (T010-T017) as they modify the same app initialization
- Once Foundational phase completes, all P1 user stories can start in parallel (US1, US2, US4 simultaneously)
- Within US1: All CI job tasks (T019-T024) can run in parallel once T018 creates the workflow file
- Within US2: T030-T032 can run in parallel once baseline spec exists
- Within US4: All test creation tasks (T041-T046) can run in parallel
- Within US5: All endpoint tasks (T052-T054) and test tasks (T057-T059) can run in parallel
- Within US3: All config tasks (T065-T070) can run in parallel
- Within US7: All tasks (T075-T079) can run in parallel
- Within US6: All tasks (T084-T089) can run in parallel
- All Polish tasks (T095-T099) can run in parallel

---

## Parallel Example: Multiple User Stories Simultaneously

```bash
# Once Foundational phase (T010-T017) completes, launch P1 stories in parallel:

# Team Member A: User Story 1 (CI/CD)
Task: T018 Create GitHub Actions CI workflow
Task: T019-T024 Add backend/frontend jobs (parallel within story)

# Team Member B: User Story 2 (API Contracts)
Task: T030 Create export script
Task: T031 Generate baseline spec

# Team Member C: User Story 4 (Security)
Task: T041-T046 Create all security tests (parallel within story)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T009)
2. Complete Phase 2: Foundational (T010-T017) - CRITICAL blocking phase
3. Complete Phase 3: User Story 1 (T018-T029)
4. **STOP and VALIDATE**: Test User Story 1 independently (CI pipeline runs on push)
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational (T001-T017) → Foundation ready
2. Add User Story 1 (T018-T029) → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (T030-T039) → Test independently → Deploy/Demo
4. Add User Story 4 (T040-T050) → Test independently → Deploy/Demo
5. Add User Story 5 (T051-T064) → Test independently → Deploy/Demo
6. Add User Story 3 (T065-T074) → Test independently → Deploy/Demo
7. Add User Story 7 (T075-T083) → Test independently → Deploy/Demo
8. Add User Story 6 (T084-T094) → Test independently → Deploy/Demo
9. Add Polish (T095-T103) → Final validation
10. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T017)
2. Once Foundational is done (after T017):
   - Developer A: User Story 1 (T018-T029)
   - Developer B: User Story 2 (T030-T039)
   - Developer C: User Story 4 (T040-T050)
   - Developer D: User Story 5 (T051-T064)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Estimated total time: 8 hours (per plan.md)
  - Setup & Config (T001-T009): 1 hour
  - Foundational (T010-T017): 0.5 hours
  - User Story 1 (T018-T029): 2 hours
  - User Story 2 (T030-T039): 1 hour
  - User Story 4 (T040-T050): 1.5 hours
  - User Story 5 (T051-T064): 2 hours
  - User Story 3 (T065-T074): 1 hour
  - User Story 7 (T075-T083): 0.5 hours
  - User Story 6 (T084-T094): 0.5 hours
  - Polish (T095-T103): 1 hour

**Total Tasks**: 103 tasks
**Tasks per User Story**:
- Setup: 9 tasks
- Foundational: 8 tasks
- User Story 1: 12 tasks
- User Story 2: 10 tasks
- User Story 4: 11 tasks
- User Story 5: 14 tasks
- User Story 3: 10 tasks
- User Story 7: 9 tasks
- User Story 6: 11 tasks
- Polish: 9 tasks

**Suggested MVP Scope**: User Story 1 only (Automated Quality Gates) - establishes foundation for all other stories
