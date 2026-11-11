# Proofsy — Recruiter Pitch, Resume Bullets & Technical Interview Guide

**Candidate:** Bhaskar Sharma  
**Target Roles:** SDE 1 / Backend Engineer / Full-Stack Engineer  
**Project:** Proofsy ([https://proofsy.tech](https://proofsy.tech))  

---

## 1. 60-Second Recruiter / Pitch Script

> *"Hi, I'm Bhaskar Sharma. I built **Proofsy**—a production digital certificate issuance and public verification platform designed to eliminate credential fraud in student events, hackathons, and corporate workshops.*
> 
> *The problem with traditional certificates is that they are sent as static PDFs with zero cryptographic integrity; anyone can tamper with their name or tier in a browser editor. Enterprise solutions exist, but they charge steep per-certificate fees.*
> 
> *Proofsy solves this with a lightweight, secure architecture: organizers upload an attendee roster via CSV or Excel, where inputs are sanitized against formula injection. The system assigns each certificate an unguessable 128-bit ID and signs a canonical payload using HMAC-SHA256. Anyone scanning the QR code lands on proofsy.tech/verify, where the server verifies the signature in constant time using `crypto.timingSafeEqual` to prevent timing attacks. All of this runs without expensive headless browsers by using native Node canvas and `pdf-lib`, delivering over 35 certificates per second on less than 45MB of RAM.*
> 
> *The live platform is deployed at **proofsy.tech**, with comprehensive Jest test coverage and GitHub Actions CI."*

---

## 2. Three Verified Resume Bullets

### Bullet 1 (Backend / Cryptography Focus):
> **Architected and implemented a tamper-proof digital credential platform (Proofsy)** utilizing canonical byte serialization and HMAC-SHA256 integrity signatures, enabling constant-time verification (`crypto.timingSafeEqual`) to eliminate timing side-channel attacks across public verification endpoints.

### Bullet 2 (Performance & Scalability Focus):
> **Engineered high-throughput in-memory PDF/SVG generation pipeline** leveraging `pdf-lib` and native C++ canvas bindings (`@napi-rs/canvas`), achieving 35+ certificates/sec under 45MB RAM footprint while eliminating 250MB+ headless browser (Puppeteer) overhead.

### Bullet 3 (Security & Ingestion Focus):
> **Built resilient bulk roster ingestion engine** supporting CSV and XLSX formats with automated formula injection sanitization (`=`, `+`, `-`, `@`), row-level validation reporting, 128-bit unguessable ULID generation, and multi-tenant workspace isolation.

---

## 3. Five Likely Technical Interview Questions & Answers

### Q1: Why did you choose HMAC-SHA256 for public verification instead of public-key RSA signatures everywhere?
**Answer:**
> *"I evaluated both symmetric (HMAC-SHA256) and asymmetric (RSA-2048) paradigms. RSA is great for offline verification because anyone with the public key can verify without contacting a server, which is why Proofsy preserves RSA signatures in the PDF metadata for offline drag-and-drop verification.*
> 
> *However, for the high-volume public web endpoint (`/api/verify/:code`), symmetric HMAC-SHA256 with a server-side secret provides major advantages: the verification operation takes less than 0.1ms of CPU time compared to several milliseconds for RSA verification, the secret key never leaves the secure server boundary, and there is zero public-key rotation or trust-store distribution overhead for verifiers.*
> 
> *We canonicalize the payload as `id|recipientName|eventName|organizerName|eventDate` to prevent JSON key-order discrepancies, compute the HMAC digest, and compare it using `crypto.timingSafeEqual`."*

---

### Q2: How do you prevent timing attacks when verifying signatures?
**Answer:**
> *"In JavaScript, standard string comparisons like `sigA === sigB` terminate early at the first mismatched byte. An attacker measuring endpoint response times over millions of requests could statistically infer byte-by-byte matches.*
> 
> *In `backend/src/services/signing/canonicalSerializer.js`, we convert both the recomputed signature hex and the incoming signature hex into `Buffer` instances and verify their lengths match. If they match, we pass them to Node's `crypto.timingSafeEqual(expectedBuf, actualBuf)`. This executes an XOR comparison across all bytes in constant time regardless of where mismatches occur, completely eliminating timing leakage."*

---

### Q3: What is CSV/Excel Formula Injection, and how did you mitigate it?
**Answer:**
> *"CSV/Formula Injection (DDE injection) occurs when untrusted user input—such as an attendee's name—starts with formula control characters like `=`, `+`, `-`, `@`, `\t`, or `\r`. When an organizer downloads the attendee list or exports reports to Microsoft Excel or Google Sheets, the spreadsheet software interprets the cell as a dynamic formula and can execute arbitrary shell commands (e.g., `=cmd|' /C calc'!A0`) or exfiltrate private data via HTTP requests.*
> 
> *In `backend/src/utils/fileParser.js`, we implemented `sanitizeFormulaInjection()`. It inspects each field before parsing: if the raw string begins with any formula character or whitespace delimiter, we prepend a single quote (`'`), which instructs Excel to treat the cell strictly as literal text, neutralising the injection."*

---

### Q4: How did you optimize PDF generation to run efficiently on low-memory containers?
**Answer:**
> *"The standard approach for PDF generation in web apps is running headless Chromium via Puppeteer to convert HTML/CSS to PDF. While flexible, Puppeteer consumes 250MB to 500MB of RAM per browser process, requires Chromium binaries in the Docker image (adding 400MB+ to image size), and has slow cold-start times.*
> 
> *Instead, Proofsy uses `pdf-lib` combined with `@napi-rs/canvas`. Vector drawing, font subsetting, and layout calculations run entirely in-process using native C++ bindings without spawning external child processes. This keeps our Docker image lightweight (`node:22-slim`), keeps peak RAM consumption below 45MB per batch worker, and processes certificates in milliseconds."*

---

### Q5: How do you handle cold starts on free-tier hosting (Render) so users don't see a broken page?
**Answer:**
> *"Render's free tier spins down idle instances after 15 minutes of inactivity. When a recruiter opens the app after dormancy, the backend can take 30 to 45 seconds to spin up.*
> 
> *We implemented a two-part solution:*
> 1. *In the frontend API client (`frontend/src/lib/api.ts`), requests timeout after 60 seconds rather than failing prematurely at 10 seconds. If a request is pending for more than 2.5 seconds, the client dispatches a `proofsy:server-waking` event, triggering the `<ServerWakingBanner>` component to display an informative status bar with an active timer explaining that the server is waking up.*
> 2. *We configured a GitHub Actions cron job (`.github/workflows/keep-warm.yml`) that sends an automated HTTP ping to `/api/health` every 14 minutes, keeping the backend warm during active hours."*
