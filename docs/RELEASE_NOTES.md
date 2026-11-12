# Keerti Couture — Release Notes

## Version 1.0.0-PROD (Portfolio & Production Release)
*Release Date: November 6, 2026*

This milestone marks the official production-grade, portfolio-ready release of **Keerti Couture** — an haute couture Indian blouse atelier and bespoke tailoring platform.

---

### Highlights & Key Accomplishments

#### 1. Complete Cloudinary Asset Pipeline
- Integrated signed client upload authorizations (`GET /api/upload/signature`).
- Built server-side image optimization pipeline using Sharp and Cloudinary transformations (generating `optimizedUrl`, `thumbnailUrl`, `cardUrl`).
- Implemented **Safe Replacement Protocol**: prior cloud assets are preserved until new uploads succeed, eliminating broken links.
- Graceful missing-credentials fallback returning clean HTTP 503 errors without crashing.

#### 2. Resilient SMTP & Transactional Outbox Engine
- Built a transactional outbox queue with atomic database leasing (`findOneAndUpdate` with timestamp fencing).
- Implemented coverage for all 9 key transactional touchpoints:
  1. Welcome & Onboarding
  2. Order Confirmation
  3. Order Status Update
  4. Appointment Request
  5. Appointment Confirmation
  6. Appointment Reschedule
  7. Appointment Cancellation
  8. Custom Quotation Request
  9. Password Reset
- Dual-format HTML and plain-text email templates with royal brand styling and strict HTML entity escaping for XSS prevention.
- Exponential backoff and Dead-Letter Queue (DLQ) for failed dispatches.

#### 3. Production Infrastructure & Dockerization
- Created multi-stage production Dockerfiles for `backend` and `frontend`.
- Added orchestrated `docker-compose.yml` supporting local container spin-up.
- Prepared production Nginx reverse proxy configuration with TLS/HSTS, rate limiting, and gzip compression.
- Created `validateEnv.js` executing strict validation on server startup.
- Added root `/health` and `/ready` endpoints for container orchestration probes.

#### 4. Security Hardening & Zero-Vulnerability Cleanliness
- Remediated **SEC-01**: Implemented strict non-string rejection across authentication and registration endpoints, completely mitigating NoSQL operator injection.
- Zero npm vulnerabilities across backend dependencies (`npm audit` reports 0 vulnerabilities).
- Implemented HttpOnly/SameSite cookie sessions, double-submit CSRF defense, and Helmet HTTP protection.

#### 5. Responsive Design Across 8 Breakpoints
- Eliminated horizontal scrollbar overflow across all tested viewports: 360px, 375px, 390px, 414px, 768px, 1024px, 1440px, and 1650px (**all measuring exactly 0px overflow**).
- Refined luxury typography and navbar spacing for high-density tablets and laptops.
- Automated visual acceptance test capturing 11 full-page screenshots into `docs/evidence/`.

#### 6. Comprehensive Automated Test Suite
- **301 / 301 Tests Passing (100%)** across 7 dedicated test suites:
  - Phase 2 Security: 44/44
  - Phase 4 Workflows: 83/83
  - Phase 5 Concurrency: 34/34
  - Staging Readiness: 73/73
  - SEC-01 Input Defense: 25/25
  - Cloudinary Infrastructure: 15/15
  - SMTP & Outbox Infrastructure: 27/27

