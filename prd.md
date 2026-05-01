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
# 📄 Product Requirements Document (PRD)

## 🧩 Product Name

Proofsy

---

## 🎯 Product Summary

Proofsy is a web platform that enables organizations to:

* Generate certificates in bulk from CSV data
* Render certificates using HTML templates → convert to PDF
* Track participant activity across multiple events
* Provide verifiable certificates via unique public links

---

## 🧠 Core Differentiators

1. Cross-event participant tracking (email-based identity)
2. Adaptive certificate rendering (auto-fit text, no layout breaks)
3. Scalable batch generation using background jobs

---

## 🏗️ System Architecture (High-Level)

Frontend (Next.js)
→ Backend API (Node.js + Express)
→ Database (MongoDB)
→ Queue (Bull.js + Redis)
→ Worker (PDF generation via Puppeteer
→ Storage (S3 / Cloudinary)
→ Email Service

---

# 👥 Development Responsibility Split

## 🎨 Frontend Agent (Primary Phase 1 Owner)

Responsible for:

* UI/UX design
* User flows
* API contract definitions
* Frontend implementation

---

## ⚙️ Backend Agent (Primary Phase 2 Owner)

Responsible for:

* API implementation
* Database design
* Queue + PDF generation
* Storage + email integration

---

# ⏳ Development Phases (UPDATED)

## 🟢 Phase 1: UI/UX Design + API Contracts (Frontend First)

### Goals

* Finalize complete UI before backend starts
* Define exact API contracts

---

### Tasks (Frontend Agent)

#### 1. Wireframes

* Admin dashboard
* CSV upload flow
* Certificate preview page
* Verification page

---

#### 2. UI Implementation (Static / Mock Data)

* Build all pages using mock data
* No backend integration yet

---

#### 3. API Contract Definition (CRITICAL)

Define:

* endpoints
* request body
* response format
* error handling

Example:

```json id="xk3l9p"
POST /api/certificates/generate
{
  "eventId": "string",
  "file": "csv"
}
```

---

### Deliverables

* Fully functional UI (mock data)
* Final API contract document
* Component structure

---

## 🟡 Phase 2: Backend Development (Based on Contracts)

### Tasks (Backend Agent)

#### 1. Setup

* Express server
* MongoDB connection

---

#### 2. Implement APIs

* Events
* Users
* Certificates
* Verification

---

#### 3. Queue System

* Bull.js + Redis
* Background job processing

---

#### 4. Certificate Rendering Engine

* HTML templates
* Dynamic data injection
* PDF generation via Puppeteer

---

#### 5. Storage + Email

* Upload PDFs
* Send certificate emails

---

### Deliverables

* Fully working backend APIs
* Queue + worker system
* PDF generation pipeline

---

## 🔵 Phase 3: Integration

### Tasks

* Connect frontend to backend APIs
* Replace mock data with real data
* Handle loading + error states

---

### Deliverables

* End-to-end working system

---

## 🟣 Phase 4: Testing & Optimization

### Tasks

* Test with large CSV files
* Validate text fitting logic
* Optimize PDF generation

---

### Deliverables

* Stable system
* No layout issues
* No performance bottlenecks

---

# 🔌 API CONTRACTS (Defined by Frontend, Implemented by Backend)

### Create Event

POST /api/events

---

### Generate Certificates

POST /api/certificates/generate

---

### Get User Certificates

GET /api/users/:email/certificates

---

### Verify Certificate

GET /api/verify/:code

---

# 🗃️ DATA MODELS (Backend Responsibility)

### User

* name
* email (unique)

---

### Event

* name
* date

---

### Certificate

* userId
* eventId
* verificationCode
* pdfUrl

---

# 📄 CERTIFICATE RENDERING REQUIREMENTS

### Template System

* HTML + CSS templates

---

### Text Fitting Rules (MANDATORY)

* Fixed container width
* No line breaks
* Auto font scaling
* Center alignment

---

# ⚙️ BACKGROUND JOB SYSTEM

* Required for bulk PDF generation
* Must not block API

---

# 🔐 SECURITY

* JWT authentication
* Rate limiting
* Secure verification codes

---

# 🚀 MVP DEFINITION

* UI fully functional
* Backend APIs working
* CSV → PDF pipeline works
* Certificates verifiable
* Users tracked across events

---

# ⚠️ IMPORTANT CONSTRAINT

Backend development MUST strictly follow:

> API contracts defined in Phase 1

No deviation without updating frontend contract.

---

# 🧠 KEY INSIGHT

Frontend-first approach ensures:

* Better UX
* Clear API design
* Faster development coordination

But success still depends on:

* Rendering engine
* Tracking logic
