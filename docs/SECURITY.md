# Keerti Couture — Security & DevSecOps Specification

This document details the security posture, vulnerability management, defensive programming standards, and audit trail for **Keerti Couture**.

---

## 1. Security Architecture Summary

| Defense Domain | Implementation Mechanism | Purpose |
|---|---|---|
| **Input Validation & Typing** | Explicit type guards (`typeof x !== 'string'`) | Mitigates NoSQL injection, prototype pollution, and type confusion |
| **Authentication & Tokens** | Short-lived JWTs + HttpOnly, SameSite cookies | Eliminates XSS token extraction; prevents CSRF theft |
| **CSRF Defense** | Double Submit Cookie pattern (`csurf` / custom tokens) | Protects mutation endpoints (`POST`, `PUT`, `DELETE`) |
| **Injection Defense** | `express-mongo-sanitize` + Mongoose Schema Typing | Strips `$` and `.` operators from request payloads |
| **HTTP Security Headers** | `helmet` middleware (HSTS, CSP, X-Frame-Options) | Prevents clickjacking, MIME-sniffing, and inline script injection |
| **Rate Limiting** | `express-rate-limit` with Redis/memory backing | Protects against brute-force attacks on auth and quotation routes |
| **Output Encoding** | Custom HTML entity escaping in transactional emails | Prevents stored/reflected HTML injection in client mailboxes |
| **Secrets Management** | Strict `.env` isolation + startup validation gate | Prevents credential leaks in logs, errors, or source control |

---

## 2. SEC-01: NoSQL Operator Injection Remediation

### The Vulnerability
Prior to v1.0.0, endpoints in `backend/controllers/userController.js` called `.toLowerCase()` and `.trim()` directly on incoming email and password fields without verifying data types. An attacker sending a malicious JSON object such as:
```json
{
  "email": { "$gt": "" },
  "password": "123"
}
```
caused unhandled `TypeError` exceptions (HTTP 500) or permitted unintended database query logic.

### The Remediation
Explicit strict type checks were applied across `authUser`, `registerUser`, and profile controllers:
```javascript
// Strict type validation before any string operation
if (typeof email !== 'string' || typeof password !== 'string') {
  return res.status(400).json({
    message: 'Invalid input: Email and password must be valid strings.'
  });
}

const normalizedEmail = email.trim().toLowerCase();
if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
  return res.status(400).json({ message: 'A valid email address is required.' });
}
```

### Verification Evidence
A dedicated 25-assertion test suite ([`backend/tests/sec01_remediation_test.js`](file:///c:/Users/karti/OneDrive/Documents/antigravity/tailor1/backend/tests/sec01_remediation_test.js)) tests all malicious payloads:
- Missing fields (`{}`) -> **HTTP 400**
- Null values (`{"email": null}`) -> **HTTP 400**
- Object operators (`{"email": {"$gt": ""}}`) -> **HTTP 400**
- Array payloads (`{"email": ["test@test.com"]}`) -> **HTTP 400**
- Numeric inputs (`{"email": 12345}`) -> **HTTP 400**
- Whitespace-only strings (`{"email": "   "}`) -> **HTTP 400**
- Non-string phone numbers (`{"phone": {}}`) -> **HTTP 400**

**Result**: 25 / 25 Tests Passing (0 unhandled exceptions, zero stack trace exposure).

---

## 3. Dependency Vulnerability Auditing

Both frontend and backend dependencies undergo regular audits:
- **Backend Audit**: `npm audit` reports **0 vulnerabilities**.
- **Frontend Audit**: Resolved next.js, cross-spawn, and cookie vulnerabilities with zero legacy peer dependency overrides.

---

## 4. Responsible Disclosure

To report a vulnerability or security concern:
- Email: `security@keerticouture.com` (or submit a private GitHub Advisory).
- Do not publicly disclose vulnerabilities before a patch has been released.
