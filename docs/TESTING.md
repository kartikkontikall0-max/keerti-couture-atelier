# Keerti Couture — Comprehensive Quality Assurance & Test Suite

Keerti Couture maintains an exhaustive automated testing suite covering unit validation, integration flows, concurrent race conditions, security defense, and staging readiness.

---

## 1. Test Suite Summary (301 / 301 Tests Passing)

All tests can be executed via the unified runner:
```bash
cd backend
npm run test:all
```

| Suite Name | Test File | Assertions | Focus Area | Status |
|---|---|---|---|---|
| **Phase 2 Security** | `tests/phase2_security_test.js` | 44 | JWT cookies, CSRF protection, rate limits, NoSQL sanitize | **PASS (44/44)** |
| **Phase 4 Workflows** | `tests/phase4_workflows_test.js` | 83 | Appointments, Orders, Quotations, Measurements, Status lifecycle | **PASS (83/83)** |
| **Phase 5 Concurrency** | `tests/phase5_concurrency_test.js` | 34 | Race conditions, double-booking prevention, appointment slots | **PASS (34/34)** |
| **Staging Readiness** | `tests/staging_readiness_test.js` | 73 | End-to-end integration, Razorpay mock flows, database integrity | **PASS (73/73)** |
| **SEC-01 Input Defense** | `tests/sec01_remediation_test.js` | 25 | Malicious input payloads, operator injections, type guards | **PASS (25/25)** |
| **Cloudinary Infrastructure** | `tests/cloudinary_infrastructure_test.js` | 15 | Signed upload params, Sharp transformations, safe replacement | **PASS (15/15)** |
| **SMTP & Outbox Infrastructure** | `tests/smtp_infrastructure_test.js` | 27 | Outbox worker leasing, HTML XSS escaping, DLQ backoff | **PASS (27/27)** |
| **TOTAL** | **7 Automated Suites** | **301** | **Comprehensive Full-Stack Coverage** | **100% PASS** |

---

## 2. Running Individual Suites

```bash
# 1. Run SEC-01 Security Input Tests
cd backend && node tests/sec01_remediation_test.js

# 2. Run Cloudinary Image Infrastructure Tests
cd backend && node tests/cloudinary_infrastructure_test.js

# 3. Run Transactional Outbox & SMTP Tests
cd backend && node tests/smtp_infrastructure_test.js

# 4. Run Concurrency & Double-Booking Tests
cd backend && node tests/phase5_concurrency_test.js
```

---

## 3. Responsive Design & Visual Acceptance Audit

In addition to programmatic tests, the visual layout is verified across 8 standardized viewport widths:

```bash
cd backend
node scripts/capture_portfolio_evidence.js
```

### Verified Breakpoint Matrix:
| Viewport | Device Profile | document.scrollWidth | document.clientWidth | Horizontal Overflow | Result |
|---|---|---|---|---|---|
| **360px** | Compact Mobile (Android) | 360px | 360px | **0px** | **PASS** |
| **375px** | iPhone SE / Standard Mobile | 375px | 375px | **0px** | **PASS** |
| **390px** | iPhone 14 / 15 / Modern Phone | 390px | 390px | **0px** | **PASS** |
| **414px** | iPhone Plus / Max Mobile | 414px | 414px | **0px** | **PASS** |
| **768px** | iPad / Tablet Portrait | 768px | 768px | **0px** | **PASS** |
| **1024px** | iPad Pro / Small Laptop | 1024px | 1024px | **0px** | **PASS** |
| **1440px** | Desktop Display | 1440px | 1440px | **0px** | **PASS** |
| **1650px** | Ultrawide / High-Res Monitor | 1650px | 1650px | **0px** | **PASS** |

Visual evidence screenshots are saved to [`docs/evidence/`](file:///c:/Users/karti/OneDrive/Documents/antigravity/tailor1/docs/evidence/).
