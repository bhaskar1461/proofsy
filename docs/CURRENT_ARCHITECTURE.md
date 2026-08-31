# Proofsy — Current Architecture Documentation

> **Document purpose**: Complete technical reference for the Proofsy certificate generation system, reverse-engineered from direct source code inspection and updated following the Institutional Cryptographic Signing & Production Hardening upgrade.
>
> **Accuracy classification legend**: Each section is tagged with one of:
> - **VERIFIED** — Confirmed directly from source code or configuration files
> - **INFERRED** — Strongly implied by implementation patterns
> - **UNKNOWN** — Cannot be determined from the repository alone

---

## 1. System Overview [VERIFIED]

Proofsy is a **multi-tenant digital certificate generation SaaS platform** designed for educational institutions (colleges, universities) and event organisers. It allows organisations to create events, upload recipient lists via CSV, generate branded PDF/PNG/SVG certificates with embedded QR codes and cryptographic signatures, deliver them by email, and provide a public verification portal.

```
+-----------------------------------------------------+
|                     USER / BROWSER                   |
+------------------------+----------------------------+
                         | HTTPS (TLS 1.2+)
                         v
                +----------------+
                |  Nginx Reverse |  (Port 80->301->443)
                |     Proxy      |
                +---+--------+---+
           /api/*   |        |  /*
           /storage |        |
                    v        v
            +----------+  +----------+
            |  Backend  |  | Frontend |
            |  Express  |  | Next.js  |
            |  :5000    |  |  :3000   |
            +--+---+----+  +----------+
               |   |
       +-------+   +--------+
       v                    v
  +----------+     +--------------+
  | MongoDB  |     |    Redis     |
  |  (Mongo  |     |  (Bull Queue |
  |   7)     |     |   Broker)    |
  +----------+     +------+-------+
                          |
                          v
                +------------------+
                |   Worker Process |
                |  (Bull Consumer) |
                |   PDF/PNG/SVG    |
                |   Generation     |
                +--------+---------+
                         |
                         v
                +------------------+
                |  File Storage    |
                |  (Local / S3 /   |
                |   GCS)           |
                +------------------+
```

---

## 2. Technology Stack [VERIFIED]

| Technology | Version | Purpose | Where Used | Critical? |
|---|---|---|---|---|
| **Node.js** | 22 (Docker image `node:22-slim/alpine`) | Runtime for backend and frontend | Backend, Worker, Frontend build | Critical |
| **Express** | ^5.2.1 | HTTP API framework | Backend API server | Critical |
| **Next.js** | ^15.2.0 | React SSR/SSG framework | Frontend | Critical |
| **React** | 19.2.4 | UI library | Frontend | Critical |
| **MongoDB** | 7 (Docker image `mongo:7`) | Primary database | All data persistence | Critical |
| **Mongoose** | ^9.6.1 | MongoDB ODM | Backend models and queries | Critical |
| **Redis** | 7-alpine (Docker) | Message broker for Bull queue | Certificate job queue, expiry checker | Replaceable (fallback exists) |
| **Bull** | ^4.16.5 | Job queue library | Certificate generation queue, expiry scheduling | Replaceable (sync fallback) |
| **pdf-lib** | ^1.17.1 | PDF generation and manipulation | Certificate PDF rendering | Critical |
| **@pdf-lib/fontkit** | ^1.1.1 | Custom font embedding in PDFs | PDF text rendering with custom fonts | Critical |
| **@napi-rs/canvas** | ^1.0.0 | Server-side canvas rendering | PNG certificate generation, QR code rendering | Critical |
| **qrcode** | ^1.5.4 | QR code matrix generation | QR data encoding (then rendered via canvas) | Critical |
| **jsonwebtoken** | ^9.0.3 | JWT token creation/verification | Authentication (admin and recipient) | Critical |
| **bcryptjs** | ^3.0.3 | Password hashing | TeamMember password storage | Critical |
| **nodemailer** | ^8.0.7 | Email transport | Certificate delivery and OTP emails | Critical |
| **multer** | ^2.1.1 | File upload handling | CSV upload for bulk generation | Critical |
| **csv-parser** | ^3.2.0 | CSV stream parsing | Bulk recipient processing | Critical |
| **cors** | ^2.8.6 | CORS middleware | API cross-origin access | Critical |
| **helmet** | ^8.1.0 | HTTP security headers | Server hardening | Important |
| **express-rate-limit** | ^7.3.0 | Rate limiting | API abuse prevention | Important |
| **compression** | ^1.7.4 | Response compression | Performance | Replaceable |
| **cookie-parser** | ^1.4.7 | Cookie parsing | JWT cookie extraction | Important |
| **winston** | ^3.14.2 | Structured logging | Application and error logs | Important |
| **morgan** | ^1.10.1 | HTTP request logging | Access logs | Replaceable |
| **joi** | ^17.13.3 | Schema validation | Listed in deps | Replaceable |
| **uuid** | ^14.0.0 | UUID generation | Job IDs, transaction IDs | Critical |
| **Tailwind CSS** | ^4 | Utility-first CSS framework | Frontend styling | Critical |
| **Framer Motion** | ^12.38.0 | Animation library | Frontend animations | Replaceable |
| **axios** | ^1.7.7 | HTTP client | Frontend API calls | Critical |
| **Nginx** | Alpine (Docker) | Reverse proxy, TLS termination | Edge routing | Critical (production) |
| **Docker / Docker Compose** | 3.9 spec | Containerization and orchestration | Deployment | Critical (production) |
| **Jest** | ^30.3.0 | Testing framework | Backend unit/integration tests | Tooling |
| **Supertest** | ^7.2.2 | HTTP assertion library | API endpoint tests | Tooling |
| **mongodb-memory-server** | ^11.1.0 | In-memory MongoDB for tests | Test environment and dev fallback | Tooling |

---

## 3. Repository Structure [VERIFIED]

```
proofsy-fresh/
|-- backend/                         # Express API + Worker
|   |-- Dockerfile                   # node:22-slim, npm ci --omit=dev
|   |-- package.json
|   |-- .env / .env.example          # Environment configuration
|   |-- nixpacks.toml                # PaaS deployment (Render/Railway)
|   |-- src/
|   |   |-- server.js                # Express app entry point
|   |   |-- worker.js                # Standalone Bull worker process
|   |   |-- controllers/             # Route handlers
|   |   |   |-- certificateController.js   # Bulk gen, batch status, list, stats, retry
|   |   |   |-- lifecycleController.js     # Revoke, suspend, reinstate, renew, expiry
|   |   |   |-- verifyController.js        # Public verification & public key discovery
|   |   |   |-- eventController.js         # Event CRUD
|   |   |   |-- templateController.js      # Template CRUD + starter seeding
|   |   |   |-- billingController.js       # PhonePe payment integration
|   |   |   |-- workspaceController.js     # Workspace management
|   |   |   |-- userController.js          # User listing
|   |   |   |-- auditController.js         # Audit log retrieval
|   |   |   +-- customFontController.js    # Font upload management
|   |   |-- models/                  # Mongoose schemas
|   |   |   |-- Certificate.js             # With signingProvider, keyId, batchId
|   |   |   |-- IssuanceBatch.js           # Real-time bulk issuance tracking
|   |   |   |-- SigningKeyRegistry.js      # Public key metadata registry
|   |   |   |-- User.js                    # Recipients
|   |   |   |-- TeamMember.js              # Admin accounts with reset password fields
|   |   |   |-- Organization.js            # Multi-tenant root entity
|   |   |   |-- Workspace.js               # Sub-tenant (dept/club)
|   |   |   |-- Event.js                   # Certificate-issuing events
|   |   |   |-- Template.js                # Certificate design templates
|   |   |   |-- AuditLog.js                # Administrative audit trail
|   |   |   |-- VerificationAudit.js       # Public verification analytics
|   |   |   |-- Transaction.js             # Payment records
|   |   |   +-- CustomFont.js             # User-uploaded fonts
|   |   |-- routes/                  # Express routers
|   |   |   |-- auth.js                    # Admin + recipient OTP + password reset
|   |   |   |-- certificates.js            # Includes GET /batch/:batchId
|   |   |   |-- events.js
|   |   |   |-- templates.js
|   |   |   |-- verify.js                  # Public verification & public key query
|   |   |   |-- v1.js                      # Developer REST API (API key auth)
|   |   |   |-- workspaces.js
|   |   |   |-- billing.js
|   |   |   |-- integrations.js
|   |   |   |-- customFonts.js
|   |   |   |-- auditLogs.js
|   |   |   |-- branding.js
|   |   |   +-- users.js
|   |   |-- middleware/
|   |   |   |-- auth.js                    # protect, authorize, protectRecipient, protectApiKey
|   |   |   |-- tenantProtect.js           # Workspace-level tenant isolation
|   |   |   |-- errorHandler.js            # Global error handler
|   |   |   |-- sanitize.js                # NoSQL injection, XSS, HPP protection
|   |   |   |-- correlationMiddleware.js   # Request correlation IDs
|   |   |   +-- validation.js              # Joi validation helper
|   |   |-- services/
|   |   |   |-- signing/                   # Cryptographic signing subsystem
|   |   |   |   |-- signingProvider.js     # Abstract base provider
|   |   |   |   |-- institutionSigningProvider.js # Persistent RSA provider
|   |   |   |   |-- canonicalSerializer.js # Deterministic canonical serializer
|   |   |   |   +-- index.js               # Singleton & provider registry
|   |   |   |-- signatureService.js        # Backward-compatible façade
|   |   |   |-- storageService.js          # Abstracted local/S3/GCS storage
|   |   |   |-- emailService.js            # Nodemailer SMTP/SendGrid/Ethereal
|   |   |   |-- certificateQueue.js        # Bull queue singleton
|   |   |   |-- fontService.js             # Google Fonts download and cache
|   |   |   +-- auditService.js            # Centralised audit logging
|   |   |-- workers/
|   |   |   |-- certificateWorker.js       # PDF/PNG/SVG generation engine (with batch updates)
|   |   |   +-- startWorker.js
|   |   |-- jobs/
|   |   |   +-- expiryChecker.js           # Daily cron for certificate expiration
|   |   |-- utils/
|   |   |   |-- logger.js                  # Winston logger config
|   |   |   |-- envValidator.js            # Startup env validation
|   |   |   |-- templateSetup.js           # Starter template asset sync
|   |   |   +-- linkedinBadge.js           # LinkedIn "Add to Profile" URL builder
|   |   |-- assets/templates/              # Starter template background images
|   |   +-- templates/                     # Legacy HTML certificate templates
|   |-- storage/                     # Local file storage root
|   |   |-- keys/                    # Persistent RSA signing keys (gitignored)
|   |   |-- pdfs/                    # Generated certificate PDFs
|   |   |-- pngs/                    # Generated certificate PNGs
|   |   |-- svgs/                    # Generated certificate SVGs
|   |   |-- templates/               # Template background images
|   |   +-- fonts/                   # Downloaded and cached font files
|   |-- uploads/                     # Temporary CSV upload directory
|   |-- logs/                        # Winston log files
|   +-- tests/                       # Complete Jest test suite (6 suites, 20+ tests)
|-- frontend/                        # Next.js 15 application
|-- nginx/
|   +-- nginx.conf                   # Reverse proxy config, TLS, routing
|-- docker-compose.yml               # Primary deployment (5 services)
+-- docs/                            # Documentation
    |-- CURRENT_ARCHITECTURE.md
    |-- INSTITUTIONAL_SIGNING.md
    +-- SIGNING_KEY_OPERATIONS.md
```

---

## 4. Complete Request Flow: Admin Login [VERIFIED]

```
Browser -> POST /api/auth/login {email, password}
  -> Express sanitize -> authLimiter (100/15min)
  -> TeamMember.findOne({email}).select("+password")
  -> bcrypt.compare(password, hash)
  -> jwt.sign({id}, JWT_SECRET, {expiresIn: "30d"})
  -> Set httpOnly cookie `token`
  -> 200 {success, token, data}
```

### Password Reset Flow [VERIFIED]
1. `POST /api/auth/forgot-password {email}` -> Generates 32-byte secure token, stores SHA-256 hash in `resetPasswordToken` (1h expiry). Returns generic success to prevent email enumeration.
2. `POST /api/auth/reset-password {token, newPassword}` -> Hashes token, finds member, updates password, clears reset token.

---

## 5. Certificate Creation Flow (Bulk) [VERIFIED]

1. Admin uploads CSV + selects event. Optional `x-idempotency-key` header provided.
2. If `idempotencyKey` provided and `IssuanceBatch` exists, returns `200` with existing batch info.
3. If new request: creates `IssuanceBatch` record in MongoDB.
4. Generates unique `verificationCode` per certificate and sets `batchId: batch._id`.
5. Queues background job via Bull queue.
6. Worker process:
   - Sets batch status to `processing`.
   - Generates PDF, PNG, SVG with institutional RSA signature.
   - Embeds canonical payload JSON in PDF metadata Subject and signature/keyId in Keywords.
   - Updates `batch.completedCount` and `batch.failedCount` in real time.
   - Marks batch `completed` or `partially_failed`.

---

## 6. QR Code Architecture [VERIFIED]

- Encodes verification URL: `{FRONTEND_BASE_URL}/verify/{workspaceSlug}/{verificationCode}?ref=qr`
- High error correction level ('H')
- Rendered with custom canvas elements (circular border, rounded data modules, brand badge)
- Embedded in PDF, PNG, and SVG outputs.

---

## 7. Certificate Verification & Privacy [VERIFIED]

1. Verifier scans QR or visits `/verify/:code`.
2. `Certificate.findOne({ verificationCode })` + populate event & user.
3. Status check: revoked -> invalid with reason; suspended -> invalid; expired -> invalid.
4. Cryptographic signature verification:
   - Retrieves `signingKeyId` from certificate.
   - Resolves public key from `InstitutionSigningProvider`.
   - Constructs canonical payload and verifies signature using `crypto.createVerify("SHA256")`.
   - Backward compatibility: If legacy certificate without `signingKeyId`, verifies against legacy payload.
5. **Privacy Protection**: Recipient email is masked on the public endpoint (e.g. `j***e@example.com`).
6. Asynchronously records `VerificationAudit` analytics event.

---

## 8. Certificate Data Model [VERIFIED]

### Key Collections

#### `Certificate`
- `userId`: ObjectId -> User
- `eventId`: ObjectId -> Event
- `organizationId`, `workspaceId`: ObjectId
- `batchId`: ObjectId -> IssuanceBatch
- `verificationCode`: String, unique
- `status`: enum `["pending", "generated", "failed", "revoked", "expired", "suspended"]`
- `signingProvider`: String (default `"institution"`)
- `signingKeyId`: String (e.g. `"inst-rsa-2026-v1"`)
- `signatureAlgorithm`: String (default `"RSA-SHA256"`)
- `signedAt`: Date
- `cryptographicSignature`: String
- `pdfUrl`, `pngUrl`, `svgUrl`: String
- `idempotencyKey`: String, unique, sparse

#### `IssuanceBatch`
- `workspaceId`, `organizationId`, `eventId`, `createdBy`: ObjectId
- `idempotencyKey`: String, unique, sparse
- `totalCount`, `pendingCount`, `processingCount`, `completedCount`, `failedCount`: Number
- `status`: enum `["queued", "processing", "completed", "failed", "partially_failed"]`
- `errors`: `[{ certificateId, recipientEmail, error, timestamp }]`
- `startedAt`, `completedAt`: Date

#### `SigningKeyRegistry`
- `organizationId`: ObjectId
- `keyId`: String, unique (e.g. `"inst-rsa-2026-v1"`)
- `algorithm`: String (`"RSA-SHA256"`)
- `keySize`: Number (2048)
- `fingerprint`: String (SHA-256 hex)
- `publicKeyPem`: String
- `status`: enum `["active", "retired", "compromised"]`
- `activatedAt`, `retiredAt`: Date

---

## 9. Digital Signature Architecture [VERIFIED]

### Implementation: `SigningProvider` Abstraction

1. **`SigningProvider`**: Abstract interface defining `sign()`, `verify()`, `getActiveKeyId()`, `getPublicKey()`, `rotateKey()`, `listPublicKeys()`.
2. **`InstitutionSigningProvider`**: Concrete RSA-SHA256 provider.
   - Persistent storage in `storage/keys/` or via environment variables.
   - Auto-initializes persistent 2048-bit RSA keypair on first boot so API and worker share the same key.
   - Supports key rotation: retiring old active keys and generating new versions while keeping past public keys verifiable.
3. **`canonicalSerializer`**: Deterministic serialization with normalized UTC dates, Unicode NFC, and alphabetical key sorting.

---

## 10. API Inventory [VERIFIED]

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Register organization + owner |
| `POST` | `/api/auth/login` | None | Admin login |
| `POST` | `/api/auth/forgot-password` | None | Request password reset token |
| `POST` | `/api/auth/reset-password` | None | Reset password with token |
| `POST` | `/api/auth/recipient/login` | None | Request OTP (enumeration protected) |
| `POST` | `/api/auth/recipient/verify` | None | Verify OTP |
| `POST` | `/api/certificates/generate` | `protect` + `tenantProtect` | Bulk generate from CSV (idempotency supported) |
| `GET` | `/api/certificates/batch/:batchId` | `protect` + `tenantProtect` | Real-time batch issuance progress |
| `GET` | `/api/verify/:code` | None | Public certificate verification (masked email) |
| `GET` | `/api/verify/public-key` | None | Get public key PEM (optional `?keyId=`) |
| `GET` | `/api/verify/public-keys` | None | List all active and retired public keys |

---

## 11. Security Model Status [VERIFIED]

| Control | Status | Detail |
|---|---|---|
| **Cryptographic Signing** | UPGRADED & HARDENED | Persistent RSA keypairs, versioned key IDs (`signingKeyId`), key rotation, canonical payload serialization. |
| **Password Reset** | IMPLEMENTED | Single-use 32-byte secure token with 1-hour expiry. |
| **Email Enumeration Prevention** | IMPLEMENTED | Recipient and admin auth return generic responses. |
| **OTP Protection** | HARDENED | `debugOtp` stripped in staging/production. |
| **Idempotency** | IMPLEMENTED | Database-level unique constraint on `idempotencyKey` prevents duplicate issuance batches. |
| **Public Output Privacy** | IMPLEMENTED | Recipient email masked on public verification page. |

---

*Document updated on 2026-08-15 following the Institutional Cryptographic Signing Upgrade & Production Hardening.*
