# Keerti Couture — System Architecture

Keerti Couture is an haute couture digital atelier tailored for high-end Indian blouse design, bespoke customization, bridal tailoring, and luxury e-commerce. Built from the ground up to embody royal heritage aesthetics with high-performance modern web architecture.

---

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Client Tier ["Client Tier (Next.js 16 App Router)"]
        UI[Luxury Atelier UI / Responsive Web]
        Tailwind[Tailwind CSS & Editorial Typography]
        Lucide[Lucide Icons & Framer Motion]
    end

    subgraph Reverse Proxy ["Ingress & Routing"]
        Nginx[Nginx Reverse Proxy :80/:443]
    end

    subgraph Application Tier ["Application Tier (Node.js & Express)"]
        Server[Express 4.21 Application Server :5000]
        Auth[JWT Cookie & Session Controller]
        SecMW[Helmet, Rate Limiter, Mongo Sanitize]
        CSRF[CSRF Defense Middleware]
        OutboxWorker[Transactional Outbox Worker :5s Poll]
        CloudinarySVC[Cloudinary Asset Pipeline & Sharp]
        MailerSVC[Nodemailer SMTP Transporter]
    end

    subgraph Data Tier ["Data Tier"]
        MongoDB[(MongoDB 8.0 Primary Store :27017)]
        OutboxCollection[(Outbox Events Collection)]
    end

    subgraph External Services ["External Cloud Infrastructure"]
        CloudinaryCloud[Cloudinary CDN / Asset Storage]
        SMTPServer[Enterprise SMTP Provider / TLS]
        RazorpayGateway[Razorpay Payment Gateway]
    end

    UI -->|HTTPS / REST / JSON| Nginx
    Nginx -->|Proxy Pass /api| Server
    Nginx -->|Static / SSR / Frontend| UI

    Server --> SecMW
    SecMW --> CSRF
    CSRF --> Auth

    Server --> MongoDB
    Server --> CloudinarySVC
    CloudinarySVC -->|Signed Uploads / Transforms| CloudinaryCloud

    Server -->|Transactional Commit| OutboxCollection
    OutboxWorker -->|Atomic Lease & Claim| OutboxCollection
    OutboxWorker --> MailerSVC
    MailerSVC -->|Dual HTML / Plain-text TLS| SMTPServer

    Server -->|Order Creation & Verification| RazorpayGateway
```

---

## 2. Core Architectural Pillars

### A. Modular Full-Stack Decoupling
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, and Framer Motion. All pages are statically optimized or server-rendered with zero horizontal overflow across 8 responsive breakpoints (360px to 1650px).
- **Backend**: Express 4.21 running on Node.js 20+ with ES Modules. Adheres strictly to the Controller-Service-Repository pattern with explicit route isolation.
- **Database**: MongoDB with Mongoose 8.9 ODM. Enforces strict schema validations, unique compound indexing, and atomic concurrency locking.

### B. Transactional Outbox Pattern for Resilient Messaging
Direct asynchronous side-effects (such as email dispatch) during HTTP requests are anti-patterns in mission-critical e-commerce. Keerti Couture guarantees delivery via an **Atomic Outbox Pattern**:
1. When an order is placed, an appointment is scheduled, or a user registers, the database transaction writes an `Outbox` document atomically within the same database write.
2. A background worker periodically claims pending events using atomic database leasing (`findOneAndUpdate` with timestamp locks and instance fencing).
3. Transports dispatch emails using dual HTML and plain-text templates with strict XSS sanitization.
4. Exponential backoff and maximum retry thresholds prevent thundering herds, routing exhausted messages into a Dead-Letter Queue (DLQ).

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer / Client
    participant OrderCtrl as Order Controller
    participant DB as MongoDB (tailor_shop)
    participant OutboxWorker as Outbox Worker Loop
    participant Mailer as SMTP Transporter
    actor Recipient as Customer Inbox

    Customer->>OrderCtrl: POST /api/orders (Create Order)
    OrderCtrl->>DB: Save Order Record
    OrderCtrl->>DB: Save Outbox Event (ORDER_CONFIRMATION) [Atomic]
    OrderCtrl-->>Customer: HTTP 201 Created (Order Response)
    
    loop Every 5 Seconds
        OutboxWorker->>DB: Atomic Lease (Find & Lock Pending Event)
        DB-->>OutboxWorker: Claimed Event
        OutboxWorker->>Mailer: Send Order Confirmation Email
        Mailer->>Recipient: Deliver TLS Signed HTML/Text Email
        OutboxWorker->>DB: Mark Outbox Event PROCESSED
    end
```

### C. Cloudinary Asset Management Pipeline
Product visuals, fabric textures, and embroidery patterns require high fidelity and rapid delivery:
- **Signed Upload Authorization**: Clients request signed parameters from `GET /api/upload/signature` without exposing API secrets.
- **Pre-Upload Validation**: Strict file type inspection (magic byte verification) and payload size clamping.
- **Format & Quality Optimization**: Sharp and Cloudinary transformations dynamically generate web-optimized WebP/AVIF formats and responsive image variants (`thumbnailUrl`, `cardUrl`, `optimizedUrl`).
- **Safe Replacement Protocol**: Old assets are retained until replacement uploads succeed, preventing broken images.
- **Graceful Fallback**: If Cloudinary credentials are unset in local or offline environments, the system returns clean HTTP 503 responses without crashing or polluting logs.

---

## 3. Data Model Overview

| Collection | Description | Primary Indexes |
|---|---|---|
| `users` | Customers, Atelier Staff, and Administrators | `email` (unique, lowercase), `role` |
| `products` | Luxury blouse designs, collections, and pricing | `category`, `isActive`, `slug` |
| `orders` | Placed orders, tailoring specifications, and invoices | `user`, `orderNumber` (unique), `status` |
| `appointments` | In-person and virtual bridal fitting consultations | `user`, `date`, `slot`, `status` |
| `quotations` | Custom bridal and bespoke embroidery quotes | `user`, `status`, `createdAt` |
| `measurements` | Saved customer blouse measurement profiles | `user`, `profileName` |
| `outbox` | Resilient transactional messaging events | `status`, `nextRetryAt`, `leasedUntil` |

---

## 4. Security & Compliance Architecture
1. **SEC-01 Type-Strict Input Defense**: Explicit non-string rejection prevents NoSQL operator injection across all authentication endpoints (`$gt`, `$ne`).
2. **Strict Cookie Session Security**: `httpOnly`, `sameSite: lax`/`strict`, `secure` (in production).
3. **Double Submit CSRF Protection**: Cryptographic tokens for mutation endpoints (`POST`, `PUT`, `DELETE`).
4. **Defense in Depth**: Helmet headers, express-mongo-sanitize, strict CORS origin white-listing, and tiered IP rate limiting.

