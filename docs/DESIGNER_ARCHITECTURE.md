# Proofsy Certificate Designer — System Architecture

> **Product Name**: **Proofsy Template Studio** (*Proofsy Designer*)  
> **Purpose**: A specialized visual design and PDF reconstruction application that ingests existing certificate PDFs, analyzes their typographical and visual layout, reconstructs them into an editable canvas, maps dynamic certificate variables, and exports production-grade templates compatible with the Proofsy Certificate Issuance Engine.

---

## 1. System Overview & Core Philosophy

Proofsy Template Studio is not a general-purpose PDF editor. It is a **domain-specific Certificate Design & Reconstitution Platform**. It bridges the gap between legacy static PDF certificates (created in Illustrator, Canva, InDesign, Word) and Proofsy's automated multi-tenant bulk issuance pipeline.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            CUSTOMER WORKFLOW                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [ Upload PDF / Start Blank ]                                                │
│             │                                                                │
│             ▼                                                                │
│  [ Multi-Tier PDF Analysis Pipeline ]                                        │
│             │                                                                │
│             ├─► Stage 1: Geometry & Viewport Extraction                      │
│             ├─► Stage 2: Typography & Text Stream Assembly                   │
│             ├─► Stage 3: Image & Vector Object Extraction                    │
│             ├─► Stage 4: Structural Fidelity Classification                  │
│             └─► Stage 5: Fallback High-Res Rasterization (if flattened/scan) │
│             │                                                                │
│             ▼                                                                │
│  [ Reconstruction Report (Quality Score & Font Matrix) ]                     │
│             │                                                                │
│             ▼                                                                │
│  [ Proofsy Canvas Editor (Lightweight Figma/Canva for Certificates) ]        │
│             ├─► Visual Element Manipulation (Move, Resize, Rotate, Z-Index)  │
│             ├─► Dynamic Variable Assignment ({{student_name}}, {{date}}, etc)│
│             ├─► Intelligent Placeholders (QR Code, Signature, Seal)          │
│             ├─► Font Management & Substitution Alerts                        │
│             └─► Alignment Guides, Snapping & History (Undo/Redo)             │
│             │                                                                │
│             ▼                                                                │
│  [ Multi-Mode Real-Time Preview (Desktop, Print, Sample Data Injection) ]    │
│             │                                                                │
│             ▼                                                                │
│  [ Versioned Template Export (`template.json`) ]                             │
│             │                                                                │
│             ▼                                                                │
│  [ Seamless Ingestion into Proofsy Certificate Issuer ]                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architectural Boundaries & Responsibility Separation

To maintain system integrity and prevent architectural bloat, Proofsy maintains strict boundaries between **Designer** and **Issuer**:

| Capability Domain | Proofsy Designer (*Template Studio*) | Proofsy Issuer (*Existing Engine*) |
|---|---|---|
| **Primary Goal** | Visual design creation, PDF reconstruction, variable definition | Bulk generation, cryptographic signing, email delivery |
| **Input** | Raw PDF files, images, blank canvas | CSV recipient lists, API payloads, event dates |
| **Output** | Canonical `template.json` + asset bundles + preview renders | Digitally signed PDFs, PNGs, SVGs, QR verification |
| **Placeholders** | Abstract semantic anchors (`type="qr"`, `type="signature"`) | Dynamic real-time rendered cryptographic QR & signatures |
| **Execution Context** | Interactive browser canvas + client/server analysis workers | Background Bull queue workers + Node.js canvas/pdf-lib |

---

## 3. Technology Stack & Component Architecture

### Frontend Application (Client-Side)
- **Framework**: Next.js 15 / React 19 + TypeScript + Tailwind CSS (shared Proofsy design tokens)
- **PDF Extraction Engine**: `pdfjs-dist` (Mozilla PDF.js) executing inside dedicated Web Workers (preventing UI thread blockage)
- **Interactive Canvas Engine**: High-performance HTML5 Canvas & SVG overlay layer with sub-pixel coordinate transform matrix
- **State Management**: Reactive Zustand store with immutable change tracking for linear Undo/Redo history
- **Font Rendering & Measurement**: Browser `FontFaceSet` API with Canvas 2D TextMetrics for exact bounding box calculation
- **Export & Client Preview**: `pdf-lib` for client-side vector preview generation

### Backend Microservices / API Engine
- **Runtime**: Node.js 22 LTS + Express
- **PDF Structural Inspector**: Server-side PDF analysis worker (fallback for large/encrypted files)
- **Font Registry & Cache**: Google Fonts repository cache & OTF/TTF metadata parser
- **Storage Subsystem**: Pluggable storage adapter (`local`, `s3`, `gcs`) inheriting Proofsy's multi-tenant storage hierarchy
- **Template Repository**: REST API for template versioning (`/api/templates`, `/api/templates/:id/versions`)

---

## 4. Layered Subsystems

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PROOFSY TEMPLATE STUDIO UI                         │
├─────────────────────────────────────────────────────────────────────────┤
│  Top Bar: File Ops | Undo/Redo | Zoom | Preview | Export | Save Template│
├─────────────────┬─────────────────────────────────────┬─────────────────┤
│  Left Toolbar   │          Center Stage               │ Right Inspector │
│                 │                                     │                 │
│  - Text Tools   │  ┌───────────────────────────────┐  │ - Element Props │
│  - Variables    │  │                               │  │ - Typography    │
│  - Images/Logos │  │       Certificate Canvas      │  │ - Colors        │
│  - Shapes/Lines │  │        (1056 x 746 px)        │  │ - Variable Bind │
│  - QR Anchor    │  │       Interactive SVG /       │  │ - QR Config     │
│  - Signature    │  │          HTML5 Layer          │  │ - Signature Role│
│  - Seal/Stamp   │  │                               │  │ - Align & Order │
│  - Layers Tree  │  └───────────────────────────────┘  │ - Export Status │
└─────────────────┴─────────────────────────────────────┴─────────────────┘
```

### 1. The Interactive Canvas
- **Coordinate Space**: Normalized Points (`pt`) and Display Pixels (`px`) with standard 72 DPI to 300 DPI conversion pipeline.
- **Transform Gizmo**: 8-point resize handles, rotational anchor, aspect-ratio lock (`Shift`), and center-point drag.
- **Smart Alignment Guides**: Real-time magnetic snapping to canvas center, page margins, and sibling element bounds (edges & midpoints).
- **Z-Index Layer Stack**: Visual layer tree allowing drag-and-drop reordering, locking, hiding, and grouping.

### 2. Typography & Font Subsystem
- **Font Detection**: Scans PDF `FontDescriptor` objects to extract PostScript name, weight, style, and encoding.
- **Font Availability Matrix**: Compares detected fonts against local system fonts, Google Fonts web catalog, and Proofsy server font cache.
- **Substitution Engine**: When an exact font is missing, maps to a visually congruent fallback (e.g. `Baskerville` -> `Playfair Display`) and alerts the user in the Reconstruction Report.

### 3. Dynamic Variable Engine
- **Predefined Institutional Anchors**: `student_name`, `event_name`, `issue_date`, `expiry_date`, `certificate_id`, `organizer_name`, `duration`, `issuer_name`, `issuer_designation`.
- **Custom Variable Support**: Arbitrary mustache tokens (e.g. `{{grade}}`, `{{credits}}`, `{{honors_category}}`).
- **AI/Heuristic Field Suggestion**: Pattern-matching engine that suggests variable bindings based on regex patterns (names, dates, IDs) with mandatory user confirmation.

### 4. Smart Placeholders
- **QR Code Anchor**: Renders a live visual mockup of Proofsy's circular branded QR with adjustable error correction, center badge, and custom sizing.
- **Signature Block**: Represents authorized signer credentials with baseline guide rule, signer name, designation, and optional placeholder signature script.
- **Institutional Seal**: Image placeholder with circular mask and opacity control for embossed or foil stamps.

---

## 5. Security & Isolation Model

1. **Untrusted PDF Handling**:
   - Client-side execution inside Web Workers with strict Content Security Policy (`script-src 'self'`).
   - Server-side analysis in isolated container process with strict memory ceiling (256MB) and execution timeout (15 seconds).
2. **File Validation**:
   - Magic bytes verification (`%PDF-`), MIME-type enforcement (`application/pdf`), and file size limits (max 25MB).
   - Strips embedded JavaScript actions, launch triggers, and URI actions before reconstruction.
3. **Multi-Tenant Isolation**:
   - Template definitions, uploaded background images, and custom fonts are scoped strictly to `organizationId` and `workspaceId`.
