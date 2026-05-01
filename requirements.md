# 📄 Requirements Document (requirements.md)

## 🧩 Project Name

Proofsy

---

## 🎯 Project Goal

Build a scalable web platform that:

* Generates certificates in bulk from CSV uploads
* Converts HTML templates into PDFs
* Tracks participants across multiple events
* Provides certificate verification via unique links

---

## 🧠 Core Features

### 1. Event Management

* Create, delete, and list events
* Each event has:

  * name
  * date

---

### 2. Bulk Certificate Generation

* Upload CSV file containing:

  * Name
  * Email
  * Event
* System processes file and generates certificates

---

### 3. Certificate Rendering System (CRITICAL)

#### Approach

* Use HTML + CSS templates
* Convert to PDF using Puppeteer

---

### Template Requirements

* Placeholders:

  * {{name}}
  * {{event}}
  * {{date}}

---

### Text Fitting Rules (MANDATORY)

* Text must stay inside fixed-width container
* No line breaks allowed
* Font size must shrink dynamically if overflow occurs
* Text must remain center-aligned

---

### Output

* Generate PDF file per participant
* Store file URL

---

## 🔄 Background Processing System

### Requirement

* Use queue system to process certificate generation

### Tools

* Bull.js
* Redis

---

### Flow

1. CSV uploaded
2. Job added to queue
3. Worker processes:

   * parse CSV
   * generate PDFs
   * store data

---

## 🗃️ Database Requirements

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
* verificationCode (unique)
* pdfUrl
* issuedAt

---

## 🔌 API Requirements

### Create Event

POST /api/events

---

### Generate Certificates

POST /api/certificates/generate

* accepts CSV file
* returns jobId

---

### Get User Certificates

GET /api/users/:email/certificates

---

### Verify Certificate

GET /api/verify/:code

Response:

* valid / invalid
* name
* event

---

## 🔐 Security Requirements

* JWT-based admin authentication
* Unique verification codes (UUID)
* Rate limiting on verification endpoint

---

## ☁️ Storage Requirements

* Store PDFs in:

  * AWS S3 OR Cloudinary

---

## 📧 Email Requirements

* Send certificate link via email
* Retry failed emails

---

## 🖥️ Frontend Requirements

### Admin Dashboard

* Create event
* Upload CSV
* View stats

---

### Participant View

* View certificates
* Download PDFs

---

### Verification Page

* Enter code / open link
* Show certificate details

---

## 🧪 Edge Cases

* Long names → auto-fit text
* Duplicate emails → merge users
* Missing fields → fallback values
* Large CSV files

---

## ⚙️ Non-Functional Requirements

* Handle 1000+ certificates per batch
* Fast generation using background jobs
* Responsive UI
* Consistent PDF rendering

---

## 🛠 Tech Stack

### Backend

* Node.js + Express

### Database

* MongoDB

### Rendering

* HTML + CSS + Puppeteer

### Queue

* Bull.js + Redis

### Frontend

* Next.js

---

## 📁 Folder Structure

```
/backend
  /controllers
  /routes
  /models
  /services
  /utils/pdf
  /workers
/frontend
  /components
  /pages
```

---

## ⚠️ Constraints

* No inline styling in templates
* Use modular architecture (MVC)
* No hardcoded values
* PDF generation must not block API

---

## 🚀 MVP Definition

System is complete when:

* CSV upload works
* PDFs are generated correctly
* No layout issues in certificates
* Users tracked across events
* Verification works

---

## 🧠 Key Focus Areas

* Certificate rendering (auto-fit text)
* Background processing (queue system)
* User tracking across events

---

## ❌ Non-Goals

* Blockchain
* AI-based scoring
* Complex animations

---

## 🧭 Development Order

1. Backend setup
2. Database models
3. API endpoints
4. Certificate rendering
5. Queue system
6. Storage + email
7. Frontend

---

## 🧠 Final Note

This system is NOT just a certificate generator.

It is:

* a **tracking system for participant achievements**
* with **accurate rendering and scalable processing**

These are the core priorities.
