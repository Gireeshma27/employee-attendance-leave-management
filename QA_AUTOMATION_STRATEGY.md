# QA Automation Architecture — Employee Attendance & Leave Management System

## Table of Contents

1. [Risk Analysis](#1-risk-analysis)
2. [Coverage Matrix](#2-coverage-matrix)
3. [Automation Strategy](#3-automation-strategy)
4. [Test Folder Structure](#4-test-folder-structure)
5. [Sample Code Reference](#5-sample-code-reference)
6. [CI/CD Setup](#6-cicd-setup)
7. [Final QA Checklist](#7-final-qa-checklist)

---

## 1. Risk Analysis

### Critical Risk Areas

| Risk Area | Severity | Likelihood | Impact | Mitigation |
|-----------|----------|------------|--------|------------|
| **Auth token leaks** | Critical | Medium | Full system compromise | JWT expiry tests, token validation on every protected route |
| **RBAC bypass** | Critical | Medium | Unauthorized data access | Exhaustive role-based endpoint testing for all 3 roles |
| **Leave balance miscalculation** | High | Medium | Payroll/HR errors | Unit tests for balance math, integration tests for full flow |
| **Attendance duplication** | High | Medium | Incorrect records | Same-day duplicate check-in/check-out tests |
| **WFH day tracking** | High | Low | Employee policy violations | Boundary tests for WFH day limits |
| **Password reset token reuse** | High | Low | Account takeover | Token expiry + single-use validation |
| **Data exposure in API responses** | High | Medium | Privacy violation | Verify password field never returned |
| **NoSQL injection** | High | Low | Data breach | Injection payload tests on all string inputs |
| **Report data accuracy** | Medium | Medium | Business decision errors | Integration tests with known seed data |
| **Concurrent access conflicts** | Medium | Low | Data corruption | Parallel request testing |

### Risk Priority Matrix

```
CRITICAL: Auth bypass, RBAC enforcement, token security
HIGH:     Leave calculation accuracy, attendance deduplication, injection prevention
MEDIUM:   Dashboard data correctness, notification delivery, report accuracy
LOW:      UI responsiveness, pagination edge cases, office/geofencing (disabled)
```

---

## 2. Coverage Matrix

### API Route Coverage

| Module | Route | Method | Auth | Admin | Manager | Employee | Test File |
|--------|-------|--------|------|-------|---------|----------|-----------|
| **Auth** | `/auth/register` | POST | No | - | - | - | `integration/auth.test.js` |
| | `/auth/login` | POST | No | - | - | - | `integration/auth.test.js` |
| | `/auth/forgot-password` | POST | No | - | - | - | `integration/auth.test.js` |
| | `/auth/reset-password` | POST | No | - | - | - | `integration/auth.test.js` |
| | `/auth/logout` | POST | No | - | - | - | `integration/auth.test.js` |
| **Attendance** | `/attendance/check-in` | POST | Yes | ✅ | ✅ | ✅ | `integration/attendance.test.js` |
| | `/attendance/check-out` | POST | Yes | ✅ | ✅ | ✅ | `integration/attendance.test.js` |
| | `/attendance/my` | GET | Yes | ✅ | ✅ | ✅ | `integration/attendance.test.js` |
| | `/attendance/team` | GET | Yes | ✅ | ✅ | ❌ | `integration/attendance.test.js` |
| | `/attendance/export/excel` | GET | Yes | ✅ | ✅ | ❌ | `integration/attendance.test.js` |
| | `/attendance/:id` | PUT | Yes | ✅ | ❌ | ❌ | `integration/attendance.test.js` |
| **Leave** | `/leaves/apply` | POST | Yes | ✅ | ✅ | ✅ | `integration/leave.test.js` |
| | `/leaves/my` | GET | Yes | ✅ | ✅ | ✅ | `integration/leave.test.js` |
| | `/leaves/:id` | DELETE | Yes | ✅ | ✅ | ✅* | `integration/leave.test.js` |
| | `/leaves/pending` | GET | Yes | ✅ | ✅ | ❌ | `integration/leave.test.js` |
| | `/leaves/admin/all` | GET | Yes | ✅ | ❌ | ❌ | `integration/leave.test.js` |
| | `/leaves/:id/approve` | PATCH | Yes | ✅ | ✅ | ❌ | `integration/leave.test.js` |
| | `/leaves/:id/reject` | PATCH | Yes | ✅ | ✅ | ❌ | `integration/leave.test.js` |
| **Users** | `/users/profile` | GET | Yes | ✅ | ✅ | ✅ | `integration/userDashboard.test.js` |
| | `/users/profile` | PUT | Yes | ✅ | ✅ | ✅ | `integration/userDashboard.test.js` |
| | `/users/profile/change-password` | POST | Yes | ✅ | ✅ | ✅ | `integration/userDashboard.test.js` |
| | `/users` | GET | Yes | ✅ | ✅ | ❌ | `integration/userDashboard.test.js` |
| | `/users` | POST | Yes | ✅ | ❌ | ❌ | `integration/userDashboard.test.js` |
| | `/users/:id` | GET | Yes | ✅ | ✅ | ❌ | `integration/rbac.test.js` |
| | `/users/:id` | PUT | Yes | ✅ | ❌ | ❌ | `integration/rbac.test.js` |
| | `/users/departments` | GET | Yes | ✅ | ✅ | ✅ | `integration/userDashboard.test.js` |
| **Dashboard** | `/dashboard/admin` | GET | Yes | ✅ | ❌ | ❌ | `integration/userDashboard.test.js` |
| | `/dashboard/employee` | GET | Yes | ✅ | ✅ | ✅ | `integration/userDashboard.test.js` |
| | `/dashboard/manager` | GET | Yes | ✅ | ✅ | ✅ | `integration/userDashboard.test.js` |
| **Reports** | `/reports/admin` | GET | Yes | ✅ | ❌ | ❌ | `integration/rbac.test.js` |
| | `/reports/export/excel` | GET | Yes | ✅ | ❌ | ❌ | `integration/rbac.test.js` |
| **Notifications** | `/notifications` | GET | Yes | ✅ | ✅ | ✅ | `integration/userDashboard.test.js` |
| | `/notifications/:id/read` | PATCH | Yes | ✅ | ✅ | ✅ | `integration/userDashboard.test.js` |
| | `/notifications/read-all` | PATCH | Yes | ✅ | ✅ | ✅ | `integration/userDashboard.test.js` |
| | `/notifications/clear-all` | DELETE | Yes | ✅ | ✅ | ✅ | `integration/userDashboard.test.js` |
| **Timings** | `/timings` | GET/POST | Yes | ✅ | ❌ | ❌ | `integration/rbac.test.js` |

> ✅ = Allowed, ❌ = Blocked (403), ✅* = Own records only

### Middleware Coverage

| Middleware | Test File | Coverage |
|-----------|-----------|----------|
| `protectmiddleware.js` | `unit/middlewares/protect.test.js` | Token validation, expired token, missing token, user not found |
| `isadminmiddleware.js` | `unit/middlewares/isAdmin.test.js` | ADMIN pass, MANAGER block, EMPLOYEE block, null user |
| `isadminormanagermiddleware.js` | `unit/middlewares/isAdminOrManager.test.js` | ADMIN pass, MANAGER pass, EMPLOYEE block, case sensitivity |
| `validatemiddleware.js` | `unit/validations/validations.test.js` | All Zod schemas tested |

### Utility Coverage

| Utility | Test File | Coverage |
|---------|-----------|----------|
| `password.js` | `unit/utils/password.test.js` | Hash, compare, error handling |
| `jwt.js` | `unit/utils/jwt.test.js` | Generate, verify, decode, expiry |
| `api_response_fix.js` | `unit/utils/apiResponse.test.js` | Success/error response formats |

---

## 3. Automation Strategy

### Testing Pyramid

```
                    ┌──────────────┐
                    │   E2E (4)    │  ← Playwright: critical user journeys
                    │              │
                ┌───┴──────────────┴───┐
                │  Integration (5)      │  ← Supertest + MongoMemoryServer
                │                       │
            ┌───┴───────────────────────┴───┐
            │      Unit Tests (4)            │  ← Jest: pure logic, middleware, utils
            │                                │
            └────────────────────────────────┘
```

### Technology Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit | Jest + @jest/globals | Pure function testing with ESM mocking |
| Integration | Jest + Supertest + MongoMemoryServer | Full API + DB testing |
| E2E | Playwright | Browser-based user journey testing |
| CI/CD | GitHub Actions | Automated pipeline with coverage gates |
| Coverage | V8 (via Jest) | Code coverage with 80% threshold |
| Fixtures | Custom factories | Consistent test data generation |

### Mocking Strategy

| What | How | Why |
|------|-----|-----|
| MongoDB | `mongodb-memory-server` | Real DB behavior, no external dependency |
| JWT | `jest.unstable_mockModule` | Control token generation in unit tests |
| bcryptjs | `jest.unstable_mockModule` | Fast unit tests, skip actual hashing |
| nodemailer | Not called in tests | Email sending avoided in test env |
| External APIs | Not applicable | No external API deps |

### Test Database Strategy

- **Unit tests**: All dependencies mocked — no DB required
- **Integration tests**: Each test file starts its own `MongoMemoryServer`
- **Cleanup**: `afterEach` clears all collections; `afterAll` drops DB and stops server
- **Isolation**: Each test suite is fully independent — can run in parallel

---

## 4. Test Folder Structure

```
backend/
├── jest.config.js                          # Jest configuration with projects
├── tests/
│   ├── setup/
│   │   ├── globalSetup.js                  # Start MongoMemoryServer
│   │   ├── globalTeardown.js               # Stop MongoMemoryServer
│   │   └── testDb.js                       # DB connection helpers
│   ├── fixtures/
│   │   └── testData.js                     # Factories, seed data, security payloads
│   ├── unit/
│   │   ├── utils/
│   │   │   ├── password.test.js            # hashPassword, comparePassword
│   │   │   ├── jwt.test.js                 # generateToken, verifyToken, decodeToken
│   │   │   └── apiResponse.test.js         # sendSuccess, sendError
│   │   ├── middlewares/
│   │   │   ├── protect.test.js             # JWT auth middleware
│   │   │   ├── isAdmin.test.js             # Admin role check
│   │   │   └── isAdminOrManager.test.js    # Admin/Manager role check
│   │   └── validations/
│   │       └── validations.test.js         # All Zod/Joi schema tests
│   └── integration/
│       ├── auth.test.js                    # Full auth flow + security
│       ├── attendance.test.js              # Check-in/out, team attendance, RBAC
│       ├── leave.test.js                   # Apply, approve, reject, cancel, RBAC
│       ├── userDashboard.test.js           # Users, dashboard, notifications
│       └── rbac.test.js                    # Comprehensive role-based access matrix

e2e/
├── helpers/
│   └── testHelpers.js                      # Page objects, API helpers, auth utils
├── auth.spec.js                            # Login, navigation guards, forgot pw
├── attendance.spec.js                      # Check-in/out UI, admin attendance mgmt
├── leave.spec.js                           # Leave application, approval, admin view
└── dashboard.spec.js                       # Dashboard rendering, reports, responsive

.github/
└── workflows/
    └── ci-cd.yml                           # Full CI/CD pipeline

playwright.config.js                        # Playwright configuration
```

---

## 5. Sample Code Reference

### Test Case Table — Structured

| ID | Category | Test Case | Type | Priority | Expected Result |
|----|----------|-----------|------|----------|-----------------|
| TC-001 | Auth | Valid user registration | Positive | P0 | 201, token returned, password excluded |
| TC-002 | Auth | Duplicate email registration | Negative | P0 | 409 Conflict |
| TC-003 | Auth | Valid login | Positive | P0 | 200, JWT token returned |
| TC-004 | Auth | Wrong password login | Negative | P0 | 401 Unauthorized |
| TC-005 | Auth | Deactivated user login | Negative | P1 | 403 Forbidden |
| TC-006 | Auth | Empty body login | Edge | P1 | 400 Validation error |
| TC-007 | Auth | SQL injection in email | Security | P0 | 400, no data leak |
| TC-008 | Auth | NoSQL injection in email | Security | P0 | Auth failure, no bypass |
| TC-009 | Auth | Expired reset token | Negative | P1 | 400 Bad Request |
| TC-010 | Auth | Token used for protected route | Positive | P0 | 200, profile returned |
| TC-011 | Attendance | Employee check-in | Positive | P0 | 200, status=Present |
| TC-012 | Attendance | Duplicate check-in same day | Negative | P0 | 400, already checked in |
| TC-013 | Attendance | WFH check-in (allowed) | Positive | P1 | 200, status=WFH |
| TC-014 | Attendance | WFH check-in (not allowed) | Negative | P1 | 403, WFH not enabled |
| TC-015 | Attendance | Check-out w/o check-in | Negative | P0 | 404, no record |
| TC-016 | Attendance | Admin update attendance | Positive | P1 | 200, updated |
| TC-017 | Attendance | Employee access team view | RBAC | P0 | 403 Forbidden |
| TC-018 | Leave | Apply for leave | Positive | P0 | 201, status=Pending |
| TC-019 | Leave | From > To date | Negative | P0 | 400, validation error |
| TC-020 | Leave | Leave in the past | Negative | P1 | 400, cannot apply |
| TC-021 | Leave | Manager approves leave | Positive | P0 | 200, status=Approved |
| TC-022 | Leave | Reject with reason | Positive | P0 | 200, status=Rejected |
| TC-023 | Leave | Double approve | Edge | P1 | 400, cannot approve |
| TC-024 | Leave | Cancel own leave | Positive | P1 | 200, deleted |
| TC-025 | Leave | Cancel another's leave | RBAC | P0 | 403, own only |
| TC-026 | Leave | Employee approve leave | RBAC | P0 | 403 Forbidden |
| TC-027 | User | Get profile | Positive | P0 | 200, no password |
| TC-028 | User | Change password (correct old) | Positive | P1 | 200, success |
| TC-029 | User | Change password (wrong old) | Negative | P1 | 401, incorrect |
| TC-030 | User | Same old/new password | Edge | P2 | 400, must differ |
| TC-031 | User | Admin creates user | Positive | P0 | 201, user created |
| TC-032 | User | Employee creates user | RBAC | P0 | 403 Forbidden |
| TC-033 | Dashboard | Admin stats | Positive | P1 | 200, summary data |
| TC-034 | Dashboard | Employee views admin dash | RBAC | P0 | 403 Forbidden |
| TC-035 | RBAC | All admin-only endpoints blocked for employee | RBAC | P0 | All return 403 |
| TC-036 | RBAC | All protected endpoints blocked w/o token | Security | P0 | All return 401 |
| TC-037 | RBAC | Concurrent requests same token | Edge | P2 | All succeed |
| TC-038 | Security | XSS in name field | Security | P1 | Sanitized/rejected |

---

## 6. CI/CD Setup

### Pipeline: `.github/workflows/ci-cd.yml`

**4 parallel jobs:**

1. **`backend-tests`** — Unit + Integration tests with MongoDB service, coverage threshold enforcement (80%)
2. **`frontend-build`** — Lint + Next.js build verification
3. **`e2e-tests`** — Playwright tests against real running servers (depends on 1 & 2)
4. **`security-audit`** — `npm audit` for both backend and frontend

**Pipeline triggers:** Push to `main`/`develop`, all PRs

**Artifacts:** Coverage reports (14 days), Playwright HTML reports (14 days), failure traces (7 days)

**Coverage gate:** Build fails if line/function/branch coverage < 80%

---

## 7. Final QA Checklist

### Pre-Release Checklist

- [ ] All unit tests pass (`npm run test:unit`)
- [ ] All integration tests pass (`npm run test:integration`)
- [ ] Code coverage ≥ 80% lines, functions, branches
- [ ] E2E tests pass on Chromium
- [ ] No high/critical `npm audit` vulnerabilities
- [ ] RBAC matrix fully validated (all 3 roles × all protected endpoints)
- [ ] Password never returned in any API response
- [ ] JWT expiration handled gracefully
- [ ] NoSQL injection payloads blocked
- [ ] XSS payloads not executed in responses
- [ ] Leave balance calculation correct (CL: 12, SL: 8, PL: 18)
- [ ] Attendance duplication prevented (same-day check-in)
- [ ] WFH day limits enforced
- [ ] Error responses follow consistent `{ success, message, data, error }` format
- [ ] 404 handler returns proper response for unknown routes
- [ ] CI/CD pipeline runs all test stages before deploy

### Commands

```bash
# Install test dependencies
cd backend && npm install --save-dev jest @jest/globals supertest mongodb-memory-server

# Run all tests
npm test

# Run by suite
npm run test:unit
npm run test:integration
npm run test:coverage

# E2E (from project root)
npx playwright install
npx playwright test

# Watch mode (development)
npm run test:watch
```

### Test Data Management

- **Factories**: `tests/fixtures/testData.js` — generates unique data per test run (timestamp-based)
- **Cleanup**: Every `afterEach` clears all collections; every `afterAll` drops DB
- **Isolation**: Each integration test file spins up its own MongoMemoryServer
- **Security payloads**: `INJECTION_PAYLOADS` object for SQLi, NoSQLi, XSS, path traversal testing

---

*Generated by QA Automation Architect — February 2026*
