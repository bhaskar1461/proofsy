# Proofsy Investor Demo — Narration Script

**Duration**: ~4 minutes at 130 wpm  
**Audience**: Investors, institutional partners  
**Pacing**: Narrator reads while edited screen footage plays underneath

---

## Scene 1 — Hook (0:00–0:15)

**Visual**: Fast cuts — a stack of forwarded PDF certificates, someone emailing "can you confirm this is real?", a certificate open in an image editor.

> Every year, institutions issue millions of certificates — and almost none of them can be verified in under five minutes. Proofsy fixes that.

---

## Scene 2 — What It Is (0:15–0:35)

**Visual**: Proofsy public landing page hero → login page → dashboard loads with live stats (total events, certificates issued, verified count).

> Proofsy is certificate infrastructure for institutions and event organizers — issue at scale, and every certificate is cryptographically signed and verifiable in seconds.

---

## Scene 3 — Single Issuance (0:35–1:15)

**Visual**: Navigate to "Create New Event" → step through template selection → fill in event details ("National Tech Summit 2026") → add a single recipient → submit → certificate appears in the event table.

> Issuing a single certificate takes under a minute. Create an event, pick a template, fill in the recipient — it's generated, RSA-signed, and ready to send.

---

## Scene 4 — Batch Issuance (1:15–2:00)

**Visual**: From the event detail page → click "Import CSV" → CSV Import Wizard opens → upload a spreadsheet → wizard auto-detects name/email columns → confirm → batch progress bar fills → all 8 certificates show "Generated" status.

> For a graduating class or a conference of a thousand attendees, upload a spreadsheet instead. Every certificate in the batch is generated and signed independently — one bad row never blocks the rest.

---

## Scene 5 — Verification & the Trust Layer (2:00–2:50)

**Visual**: Copy a verification code from the table → navigate to `/verify` → paste code → page loads with a bold "✓ Verified" badge showing recipient name, issuing institution, issue date, and cryptographic signature details.

> This is the part that matters. Every certificate carries an RSA-signed cryptographic signature — not a watermark, not a lookup table. Enter the code, and you're checking the signature itself. It either mathematically matches, or it doesn't. Nothing to fake, nothing to Photoshop convincingly.

---

## Scene 6 — Multi-Tenant Isolation (2:50–3:20)

**Visual**: Demo login as "Demo Eng College 4821" → dashboard shows its events/certs → logout → demo login as "Demo Eng College 7359" → completely different dashboard with different workspace name, zero shared data.

> Proofsy is multi-tenant from the ground up. Every institution's certificates, branding, and data are fully isolated — this is infrastructure for one customer or a thousand, without re-architecting.

---

## Scene 7 — Dashboard & Management (3:20–3:50)

**Visual**: Dashboard overview with stat cards → navigate into an event → certificates table → select a certificate checkbox → click "Revoke Selected" → revocation modal → enter reason → confirm → certificate status changes to "Revoked" in real time.

> Institutions get a full view of everything they've issued — searchable, revocable, and auditable. Certificate lifecycle management is built in.

---

## Scene 8 — Reliability (3:50–4:10)

**Visual**: On-screen graphic overlay — checkmark against "1,325 Test Cases" and "10,000 Certificates Benchmarked at 673/sec (0.00% Failure)".

> Every signing and verification path is tested against 1,325 automated cases, and benchmarked at 10,000-certificate scale at 670-plus certificates per second before it ships.

*Verified via automated correctness suite and multi-tenant load simulation (p50: 42ms, 0 failures).*

---

## Scene 9 — Close (4:10–4:25)

**Visual**: Proofsy logo centered, tagline fades in, CTA appears.

> Proofsy — certificates institutions can issue in seconds, and anyone can trust in one scan. Book a demo at proofsy.tech.

---

## Production Notes

- **Scene 1 / Scene 8 / Scene 9**: These are editorial — stock footage, After Effects motion graphics, or simple logo cards. Not auto-captured.
- **Scenes 2–7**: Auto-captured with the Playwright script at `scripts/demo-capture.ts`.
- **Post-production**: Trim clips to match narration timing, add voiceover track, captions, and transitions in DaVinci Resolve, Premiere Pro, or a scripted ffmpeg pipeline.
- **Data safety**: All footage uses demo-seeded fake data. Never record real customer names or certificates.
