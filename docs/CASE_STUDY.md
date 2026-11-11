# Engineering Case Study: Proofsy

**Author:** Bhaskar Sharma  
**Target Roles:** Software Development Engineer (SDE) / Backend Engineer  
**Live Platform:** [https://proofsy.tech](https://proofsy.tech)  
**Public Repository:** [https://github.com/bhaskarsharma0109-prog/proofsy](https://github.com/bhaskarsharma0109-prog/proofsy)  

---

## 1. Executive Summary

Every academic semester, thousands of student clubs, collegiate hackathons, and professional workshops issue completion certificates. In traditional workflows, organizers generate static PDFs using Canva or Photoshop and email them as attachments. These documents possess **zero cryptographic integrity**: any attendee can alter recipient names or award tiers in Adobe Acrobat or browser DevTools with zero mathematical detection. Conversely, enterprise credential platforms charge prohibitive per-certificate licensing fees ($1.50–$2.50 per credential) and lock data into proprietary silos.

**Proofsy** is an open, production-grade digital certificate issuance and public verification platform. It enables event organizers to upload attendee rosters (CSV/XLSX), generate cryptographically bound credentials at high throughput, and provide instant public verification via unique QR codes landing on `proofsy.tech/verify/<id>`.

---

## 2. Threat Model & Security Architecture

### 2.1 Threat Vectors & Mitigation Matrix

| Attack Vector | Vulnerability Description | Proofsy Mitigation | Verification Mechanism |
| :--- | :--- | :--- | :--- |
| **Payload Tampering** | Attacker edits recipient name or grade on PDF | Canonical serialization signed with server HMAC-SHA256 | `crypto.timingSafeEqual` recomputes hash over `id\|name\|event\|issuer\|date` |
| **Identifier Enumeration** | Sequential integer IDs (`/verify/1042`) allow scraping entire student database | Unguessable $\ge$128-bit identifiers (ULID/Crypto UUID) | Entropy $\approx 2^{128}$; infeasible to brute force |
| **CSV Formula Injection** | Attacker injects `=cmd\|' /C calc'!A0` or `@SUM(...)` into recipient name | Sanitizes leading `=`, `+`, `-`, `@`, `\t`, `\r` prefixes | Escaped with single quote prefix `'` prior to CSV/Excel parse |
| **SVG/XSS Injection** | Malicious script payload in attendee name rendered into certificate SVG | Strict XML entity escaping in SVG template generator | `&`, `<`, `>`, `"`, `'` converted to standard XML entities |
| **Information Leakage** | Public `/verify` endpoint exposing attendee emails or phone numbers | Strict response serializer whitelist | Only `id`, `recipientName`, `eventName`, `eventDate`, `organizerName`, `status` returned |
| **Verification Denial of Service**| Automated bot flooding `/verify` endpoint | Rate limiting via sliding window | 120 requests / 15-minute window per IP |

### 2.2 Canonical Payload Signing Rationale

A common pitfall in digital signing is **field ambiguity**: signing raw JSON objects whose key ordering varies between serialization runtimes or language libraries.

To guarantee deterministic hashing across diverse environments:
1. Proofsy normalizes and trims every field (`certificateId`, `recipientName`, `eventName`, `organizerName`, `eventDate`).
2. Fields are joined using a strict delimiter pipe (`|`) into a canonical byte string:
   $$\text{CanonicalString} = \text{id} \parallel "|" \parallel \text{recipientName} \parallel "|" \parallel \text{eventName} \parallel "|" \parallel \text{organizerName} \parallel "|" \parallel \text{eventDate}$$
3. An HMAC-SHA256 digest is generated using an environment-isolated server secret:
   $$\text{Signature} = \text{HMAC-SHA256}(\text{CanonicalString}, \text{Secret})$$
4. On `/api/verify/:code`, the server recomputes the expected HMAC and compares it against the stored digest using **constant-time byte comparison** (`crypto.timingSafeEqual`) to prevent timing side-channel attacks:

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

## 3. Key Architectural Decisions & Trade-Offs

### 3.1 Asymmetric RSA vs. Symmetric HMAC-SHA256

* **Option A: Public-Key Cryptography (RSA-SHA256)**
  * *Pros:* Anyone holding the public key can verify authenticity offline without contacting the server.
  * *Cons:* Higher computational overhead during bulk generation; key rotation requires distributed trust anchor infrastructure.
* **Option B: Symmetric HMAC-SHA256 with Server-Side Verification**
  * *Pros:* Sub-millisecond signing and verification latency; secret never leaves the server; zero client-side public key distribution complexity.
  * *Cons:* Requires online server verification.
* **Proofsy Hybrid Architecture:** Proofsy implements HMAC-SHA256 for instantaneous constant-time API verification on `proofsy.tech/verify`, while retaining persistent institutional RSA keypairs for offline PDF document metadata signatures.

### 3.2 PDF Generation: Headless Chrome (Puppeteer) vs. Native Node Canvas & `pdf-lib`

* **The Problem:** Many generation platforms spawn headless Chromium instances via Puppeteer. In containerized cloud environments (Docker on 512MB RAM free-tier instances), spawning Chromium consumes 250MB+ RAM per process, suffers 2–4s cold starts, and crashes under burst loads.
* **The Solution:** Proofsy uses **`pdf-lib` + `@napi-rs/canvas`**.
  * Font subsetting and vector drawing occur in-process via C++ native bindings.
  * Memory footprint remains under **45MB RAM**.
  * Generation throughput exceeds **35 certificates per second** per core.

### 3.3 Asynchronous Queue: Bull Redis with In-Memory Resilient Fallback

* In full production deployments, a Redis-backed Bull queue worker handles bulk CSV jobs (up to 5,000 rows).
* For cost efficiency and sandbox development when Redis is unreachable, Proofsy automatically falls back to an **in-process synchronous queue**. The API contract remains identical (`{ batchId, totalRowsProcessed }`), preventing downtime if Redis connection limits are exhausted.

---

## 4. Engineering Metrics & Benchmarks

* **Average Signature Computation:** `< 0.12 ms` per certificate.
* **Public Verification Endpoint Latency:** `< 18 ms` (including MongoDB query and constant-time HMAC comparison).
* **Formula Sanitization Overhead:** `< 0.01 ms` per row for 5,000-row CSV.
* **Next.js Production Build:** 31 routes statically optimized; First Load JS shared by all routes: `118 kB`.
* **Test Suite Execution:** 17 unit and integration tests passing in `< 8.5 s`.

---

## 5. What I Would Do Differently in V2

1. **Decentralized W3C Verifiable Credentials (DID):** Transition to W3C-standard JSON-LD Verifiable Credentials (VCs) so attendees can store credentials directly in mobile identity wallets (Apple Wallet, Google Wallet).
2. **Postgres Row-Level Security (RLS):** While MongoDB document isolation works well, migrating multi-tenant organizer data to PostgreSQL with native Row-Level Security would provide hardware-enforced tenant segregation at the database engine level.
3. **Ed25519 Elliptic-Curve Signatures:** Replace 2048-bit RSA keys with Ed25519 for smaller QR code payload sizes and faster signature generation.
