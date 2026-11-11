# Proofsy — Tamper-Proof Digital Certificate Issuance & Verification Platform

[![CI/CD](https://github.com/bhaskarsharma0109-prog/proofsy/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/bhaskarsharma0109-prog/proofsy/actions/workflows/ci-cd.yml)
[![Keep Warm](https://github.com/bhaskarsharma0109-prog/proofsy/actions/workflows/keep-warm.yml/badge.svg)](https://github.com/bhaskarsharma0109-prog/proofsy/actions/workflows/keep-warm.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Live Site](https://img.shields.io/badge/Live-proofsy.tech-6366F1)](https://proofsy.tech)

> **Built by Bhaskar Sharma** (Final-year B.Tech CSE, Backend focus)  
> **Live Demo:** [https://proofsy.tech](https://proofsy.tech) • **Public Verifier:** [https://proofsy.tech/verify](https://proofsy.tech/verify)

---

## 1. The Problem & Value Proposition

Every year, thousands of college clubs, hackathons, and professional workshops issue completion certificates as unauthenticated static PDFs. Anyone with basic PDF editing tools can forge recipient names, grades, and dates with **zero cryptographic detection**. Meanwhile, enterprise credential vendors charge steep per-certificate fees ($1.50–$2.50 per credential).

**Proofsy** solves this with an honest, lightweight, high-performance architecture:
- **Bulk Ingestion:** Organizers upload a CSV or XLSX roster with sanitization against CSV formula injection.
- **Cryptographic Signing:** Every certificate is assigned an unguessable $\ge$128-bit ID and signed with a canonical HMAC-SHA256 signature.
- **Sub-Second Public Verification:** Anyone scanning the certificate's unique QR code lands on `proofsy.tech/verify/<id>`, where the server recomputes the HMAC in constant time to guarantee authenticity.

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend (Next.js 15 — proofsy.tech)"]
        Landing["Landing Page / Hero"]
        Dashboard["Organizer Dashboard (CSV/XLSX Upload)"]
        VerifyUI["Public Verification Portal (/verify)"]
        WakingBanner["Render Sleep State Detector"]
    end

    subgraph API["Backend API (Express 5 — api.proofsy.tech)"]
        AuthMiddleware["JWT & Tenant Isolation Guard"]
        RateLimiter["Verify Rate Limiter (120 req / 15 min)"]
        UploadParser["File Parser (Formula Sanitization)"]
        SignerService["Canonical HMAC-SHA256 Signer"]
        WorkerEngine["pdf-lib & Canvas Renderer"]
        VerifyController["Constant-Time Verifier (timingSafeEqual)"]
    end

    subgraph Storage["Data & Cache Layer"]
        MongoDB[(MongoDB Atlas)]
        Redis[(Upstash Redis Queue / Fallback)]
        FS[(Local/S3 Certificate Storage)]
    end

    Dashboard -->|POST /api/events/:id/certificates (multipart)| UploadParser
    UploadParser --> AuthMiddleware
    AuthMiddleware --> SignerService
    SignerService --> WorkerEngine
    WorkerEngine --> FS
    WorkerEngine --> MongoDB

    VerifyUI -->|GET /api/verify/:code| RateLimiter
    RateLimiter --> VerifyController
    VerifyController --> MongoDB
    VerifyController --> SignerService
```

---

## 3. Cryptographic Signing & Verification Design

### Canonical Byte Serialization
To prevent field-ordering discrepancies between JSON parsers, Proofsy serializes fields into a strict deterministic string before hashing:

$$\text{CanonicalString} = \text{id} \parallel "|" \parallel \text{recipientName} \parallel "|" \parallel \text{eventName} \parallel "|" \parallel \text{organizerName} \parallel "|" \parallel \text{eventDate}$$

### Timing-Safe Verification
The `/api/verify/:code` endpoint re-hashes the stored canonical payload using the server's `SIGNING_SECRET` and performs a constant-time comparison using `crypto.timingSafeEqual` to eliminate timing side-channel attacks:

```javascript
// backend/src/services/signing/canonicalSerializer.js
function verifyHmacPayload(payload, signatureHex, secret) {
  const expectedSignatureHex = signHmacPayload(payload, secret);
  const expectedBuf = Buffer.from(expectedSignatureHex, "hex");
  const actualBuf = Buffer.from(signatureHex, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
```

---

## 4. Security Hardening

1. **Unguessable IDs:** IDs follow `CERT-<128-bit-ULID/CryptoUUID>`, preventing sequential ID enumeration.
2. **Formula Injection Sanitization:** Spreadsheet cells starting with `=`, `+`, `-`, `@`, `\t`, or `\r` are automatically escaped with a leading single quote `'` before processing.
3. **Strict Privacy Boundary:** The `/api/verify/:code` response strips all recipient emails and phone numbers, exposing only `id`, `recipientName`, `eventName`, `eventDate`, `organizerName`, and verification status.
4. **SVG/XML Escaping:** All user-injected text (names, titles, issuers) is escaped (`&`, `<`, `>`, `"`, `'`) before template rendering to block XML injection and XSS.
5. **Rate Limiting:** Dedicated sliding-window rate limiters restrict `/api/verify` to 120 requests per 15 minutes per IP.
6. **No College Impersonation:** Verification cards strictly display `"Issued by <Organizer> via Proofsy"`, never claiming institutional accreditation or college endorsement without legal authority.

---

## 5. Quickstart in < 5 Commands

### Prerequisites
- Node.js $\ge$ 20.x
- MongoDB running locally or a free MongoDB Atlas connection string

```bash
# 1. Clone repository
git clone https://github.com/bhaskarsharma0109-prog/proofsy.git && cd proofsy

# 2. Setup backend
cd backend && npm install && cp .env.example .env

# 3. Setup frontend
cd ../frontend && npm install && cp .env.example .env.local

# 4. Run test suite
cd ../backend && npm test -- tests/phase1-core-integrity.test.js

# 5. Start development servers
# Terminal 1: cd backend && npm run dev (runs on port 5000)
# Terminal 2: cd frontend && npm run dev (runs on port 3000)
```

---

## 6. Environment Variables Table

| Variable Name | Purpose | Where Set | Required / Default |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment (`development`, `production`, `test`) | Backend (`.env` / Render) | `development` |
| `PORT` | HTTP port for Express server | Backend (`.env` / Render) | `5000` |
| `MONGODB_URI` | MongoDB Atlas or local MongoDB connection URI | Backend (`.env` / Render) | **Required** |
| `JWT_SECRET` | Secret key for signing organizer authentication JWTs | Backend (`.env` / Render) | **Required** ($\ge$ 32 chars) |
| `SIGNING_SECRET` | Secret key for canonical HMAC-SHA256 certificate signatures | Backend (`.env` / Render) | **Required** ($\ge$ 32 chars) |
| `REDIS_URL` | Redis URL for Bull queue (falls back to in-memory queue if unset) | Backend (`.env` / Render) | Optional (`redis://localhost:6379`) |
| `FRONTEND_BASE_URL` | Public frontend URL for QR codes and password reset links | Backend (`.env` / Render) | `https://proofsy.tech` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | Backend (`.env` / Render) | `https://proofsy.tech,https://www.proofsy.tech` |
| `NEXT_PUBLIC_API_URL` | Base API URL called by frontend client | Frontend (`.env.local` / Vercel) | `https://api.proofsy.tech/api` |
| `NEXT_PUBLIC_BACKEND_URL` | Base URL for static certificate assets (PDF/PNG/SVG) | Frontend (`.env.local` / Vercel) | `https://api.proofsy.tech` |

---

## 7. Test Suite & Verification

The test suite covers signature verification, anti-tampering rejection, CSV formula sanitization, rate limiting, and privacy stripping:

```bash
cd backend
npm test -- tests/phase1-core-integrity.test.js tests/signingProvider.test.js
```

### Verified Test Cases:
- `✓ Validates authentic certificate HMAC-SHA256 signature with constant-time equality`
- `✓ Rejects tampered recipient name with HTTP 200 { isValid: false }`
- `✓ Correctly flags revoked certificate and returns revocation reason`
- `✓ Returns HTTP 404 for non-existent unguessable certificate IDs`
- `✓ Enforces privacy: never leaks recipientEmail in public verification response`
- `✓ Sanitizes CSV formula injection characters (=, +, -, @, \t, \r)`
- `✓ Parses XLSX spreadsheets and validates required columns`
- `✓ Enforces row limits (max 5,000 rows per batch) and reports row-level errors`
- `✓ Streams event certificates as a ZIP archive`
- `✓ Blocks brute-force verification queries via dedicated rate limiting (HTTP 429)`

---

## 8. Honest Limitations & Roadmap

### Current Limitations:
1. **Free-Tier Cold Starts:** On Render's free tier, the backend spins down after 15 minutes of inactivity. We mitigate this with a **waking-server UI banner** and a **14-minute GitHub Actions keep-warm ping**, but first visits after long dormancy may take ~30s.
2. **Local Storage in Dev:** By default, generated certificates are stored on the local filesystem (`backend/storage`). Production requires an S3 or Cloudflare R2 bucket for multi-instance scaling.

### Roadmap:
- [ ] W3C Verifiable Credentials (VC) and Decentralized Identifiers (DID) support.
- [ ] Native Apple Wallet and Google Wallet pass generation (.pkpass).
- [ ] Webhook triggers on certificate verification for organizer CRM integration.

