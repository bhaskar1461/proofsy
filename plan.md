# 🗺️ Development Plan (plan.md)

## 📌 Project Name

Proofsy

---

## 🎯 Goal

Build a production-ready MVP of Proofsy that supports:

* Multi-event certificate generation
* Participant tracking across events
* Dynamic certificate rendering (HTML → PDF with auto-fit text)
* Verification system

---

## ⏳ Timeline (Recommended: 3–4 Weeks)

### Week 1 → Foundation + Core Backend

### Week 2 → Certificate Engine + PDF Rendering

### Week 3 → Frontend + Integration

### Week 4 → Polish + Advanced Features

---

## 🧱 Phase 1: Project Setup

### Tasks

* Initialize Git repo
* Setup backend (Node.js + Express)
* Setup frontend (React / Next.js)
* Setup database (MongoDB / PostgreSQL)

### Deliverables

* Running backend server
* Basic frontend UI
* Database connected

---

## 🗃️ Phase 2: Database Design

### Collections / Tables

#### Users

* id
* name
* email (unique)

#### Events

* id
* name
* date

#### Certificates

* id
* user_id
* event_id
* certificate_url
* verification_code

---

## 🔧 Phase 3: Core Backend APIs

### Auth (optional for MVP)

* Admin login/signup

---

### Event APIs

* POST /events → create event
* GET /events → list events
* DELETE /events/:id

---

### User APIs

* POST /users (auto-create from CSV)
* GET /users/:email

---

### Certificate APIs

* POST /certificates/generate
* GET /certificates/:id
* GET /users/:email/certificates

---

### Verification API

* GET /verify/:code

---

## 📄 Phase 4: Certificate Rendering Engine (CRITICAL)

### Approach

Use:

* HTML + CSS templates
* Convert to PDF using Puppeteer

---

### Steps

#### 1. Create HTML Template

* Static certificate design
* Placeholders:

  * {{name}}
  * {{event}}
  * {{date}}

---

#### 2. Implement Dynamic Injection

* Replace placeholders with real data

---

#### 3. Adaptive Text Fitting

* Define bounding box for text
* Measure overflow
* Reduce font size dynamically

---

#### 4. Generate PDF

* Render HTML in headless browser
* Export as PDF

---

### Deliverable

* PDF certificates with perfect layout (no overflow / no extra spacing)

---

## 📤 Phase 5: Bulk Upload System

### Tasks

* Upload CSV file
* Parse using `csv-parser`
* Loop through entries:

  * Create user (if not exists)
  * Generate certificate

---

### Deliverable

* Upload 100+ users → certificates generated automatically

---

## 📧 Phase 6: Email System

### Tools

* Nodemailer / SendGrid

### Tasks

* Send certificate link via email
* Retry failed emails

---

## 🔍 Phase 7: Verification System

### Tasks

* Generate unique verification code
* Create public verification page

### Output

* Shows:

  * Name
  * Event
  * Valid / Invalid status

---

## 👤 Phase 8: Participant Tracking System

### Core Logic

* Use email as unique identifier
* Link all certificates to user

### Features

* View all certificates per user
* Count number of events attended

---

## 🖥️ Phase 9: Frontend UI

### Pages

#### Admin Dashboard

* Create event
* Upload CSV
* View stats

---

#### Participant Page

* View certificates
* Download PDF

---

#### Verification Page

* Input code / scan QR
* Show result

---

## 📊 Phase 10: Analytics Dashboard

### Metrics

* Total certificates
* Total events
* Top participants

---

## 🧪 Phase 11: Testing

### Test Cases

* Long names (fit correctly)
* Duplicate users
* Invalid verification codes
* Bulk upload edge cases

---

## 🚀 Phase 12: Deployment

### Backend

* Render / Railway / VPS

### Frontend

* Vercel / Netlify

### Database

* MongoDB Atlas / Supabase

---

## ⚡ Phase 13: Optimization

* Cache templates
* Optimize PDF generation
* Batch processing

---

## 🔮 Phase 14: Advanced Features (Optional)

* QR code on certificates
* Leaderboard system
* “Proofsy Score” (engagement metric)
* Public user profiles

---

## 📏 Success Criteria

* Generate 500+ certificates without failure
* No layout issues in PDFs
* Accurate tracking per participant
* Verification works instantly

---

## ⚠️ Risks & Mitigation

### Risk

Duplicate users

### Solution

* Enforce unique email

---

### Risk

PDF rendering slow

### Solution

* Queue system (Bull.js)

---

### Risk

Broken layouts

### Solution

* Strict bounding boxes + font scaling

---

## 🧠 Final Strategy

Focus order:

1. Backend + DB
2. Certificate rendering engine
3. Tracking system
4. Frontend

---

## 🏁 MVP Definition

A working Proofsy MVP must:

* Generate certificates from CSV
* Track users across events
* Provide verification link
* Maintain perfect certificate layout

---

## 🚀 Execution Advice

Do NOT:

* Start with frontend
* Over-design UI early

Do:

* Build backend + rendering first
* Test with real data early

---

## 🧠 Key Insight

The hardest and most important part is NOT CRUD —
it is:

* **Rendering engine (text fitting)**
* **User tracking across events**

If you nail these two, the rest is straightforward.
