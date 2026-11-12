# Keerti Couture — Environment Configuration Reference

This guide details all environment variables supported by **Keerti Couture** across the backend API service and the Next.js frontend application.

---

## 1. Backend Environment Variables (`backend/.env`)

| Variable | Type | Required? | Default / Example | Purpose |
|---|---|---|---|---|
| `PORT` | Number | Optional | `5000` | Port on which Express server listens |
| `NODE_ENV` | String | **Required** | `development` / `production` | Environment mode (enables strict validations) |
| `MONGO_URI` | String | **Required** | `mongodb://localhost:27017/tailor_shop` | MongoDB connection connection string |
| `JWT_SECRET` | String | **Required** | *Random 64-char hex string* | Primary signing secret for access tokens |
| `JWT_REFRESH_SECRET` | String | **Required** | *Random 64-char hex string* | Secret for signing refresh tokens |
| `COOKIE_SECRET` | String | **Required** | *Random 64-char hex string* | Secret for signing encrypted cookies |
| `CLIENT_URL` | String | **Required** | `http://localhost:3000` | Whitelisted origin for CORS and cookies |
| `ADMIN_EMAIL` | String | Optional | `admin@keerticouture.com` | Primary notifications address |
| `ADMIN_INITIAL_PASSWORD` | String | Optional | `KeertiAdmin@2025!` | Initial password for demo seed script |
| `CLOUDINARY_CLOUD_NAME` | String | Optional* | `demo_cloud` | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | String | Optional* | `1234567890` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | String | Optional* | `secret_hex` | Cloudinary API Secret |
| `SMTP_HOST` | String | Optional* | `smtp.example.com` | Outbound mail server hostname |
| `SMTP_PORT` | Number | Optional* | `587` | Outbound mail port (587 TLS or 465 SSL) |
| `SMTP_USER` | String | Optional* | `notifications@keerticouture.com` | SMTP authentication user |
| `SMTP_PASS` | String | Optional* | `smtp_password` | SMTP authentication password |
| `SMTP_SECURE` | Boolean | Optional* | `false` | Set `true` for port 465; `false` for STARTTLS |
| `EMAIL_FROM` | String | Optional* | `"Keerti Couture" <noreply@keerticouture.com>` | Sender display name and address |
| `RAZORPAY_KEY_ID` | String | Optional* | `rzp_test_xxxx` | Razorpay public key for test checkout |
| `RAZORPAY_KEY_SECRET` | String | Optional* | `secret_xxxx` | Razorpay secret for HMAC verification |

*\*Note: Marked optional variables enable advanced cloud features. If omitted in local/demo mode, the server boots safely with mock or graceful fallback behavior.*

---

## 2. Frontend Environment Variables (`frontend/.env.local`)

| Variable | Type | Required? | Default / Example | Purpose |
|---|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | String | **Required** | `http://localhost:5000/api` | Base URL for REST API endpoints |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | String | Optional | `demo_cloud` | Cloud name used for client-side image URLs |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | String | Optional | `rzp_test_xxxx` | Client Razorpay checkout script key |

---

## 3. Strict Startup Validation (`backend/config/validateEnv.js`)

When the backend boots, `validateEnv()` runs before server listener binding:
- In `production`: Missing `JWT_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`, or `MONGO_URI` triggers an immediate fatal error (`process.exit(1)`).
- In all environments: Optional services (Cloudinary, SMTP, Razorpay) are inspected and logged with clean informational notices, preventing silent run-time exceptions.

