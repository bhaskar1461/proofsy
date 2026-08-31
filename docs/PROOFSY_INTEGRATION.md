# Proofsy Designer & Issuer Integration Architecture

> **Purpose**: Specification of the interoperability contract between **Proofsy Template Studio** (*Designer*) and the **Proofsy Certificate Issuance Engine** (*Issuer*).

---

## 1. System Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               PROOFSY TEMPLATE STUDIO (DESIGNER)            │
│                                                             │
│  - PDF Analysis & Reconstruction Engine                     │
│  - Interactive Canvas Editor                                │
│  - Variable Mapping & Placeholder Placement                 │
│  - Live Desktop & PDF Preview                               │
│  - Export: `template.json` (Schema v2.0) + Asset Bundles   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ HTTPS POST /api/templates/import
                               │ (or Direct JSON File Export)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 PROOFSY ISSUANCE ENGINE                     │
│                                                             │
│  - Ingests `template.json` & Validates Against Schema       │
│  - Stores Versioned Template Entity (`TemplateVersion`)    │
│  - Synchronizes Background Assets to `/storage/templates/`  │
│  - Registers Missing Google Fonts in Font Cache             │
│  - Event Assignment: Links Template to Event Issuance       │
│  - CertificateWorker: Generates Cryptographically Signed   │
│    PDF + PNG + SVG + Real QR Code                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. API Contract: Template Ingestion

### Endpoint: `POST /api/templates/import`
- **Auth**: `Bearer <admin_jwt>` + `x-workspace-id: <workspaceId>`
- **Content-Type**: `multipart/form-data` or `application/json`

#### Request Payload:
```json
{
  "templateJson": {
    "schemaVersion": "2.0",
    "name": "Annual Convocation Honors Template 2026",
    "page": { "width": 1056, "height": 746, "orientation": "landscape" },
    "background": {
      "type": "image",
      "url": "/storage/templates/uploaded_custom_bg_99.png"
    },
    "elements": [
      {
        "id": "el_1",
        "type": "variable_text",
        "variableKey": "recipient_name",
        "x": 528,
        "y": 360,
        "fontSize": 36,
        "fontFamily": "Inter",
        "fontWeight": "bold",
        "color": "#1E293B",
        "textAlign": "center"
      },
      {
        "id": "el_2",
        "type": "qr_placeholder",
        "x": 880,
        "y": 580,
        "width": 120,
        "height": 120,
        "qrConfig": { "purpose": "certificate_verification" }
      }
    ]
  }
}
```

#### Response (`201 Created`):
```json
{
  "success": true,
  "data": {
    "templateId": "6a804e16329ae1d854364ea1",
    "version": 1,
    "name": "Annual Convocation Honors Template 2026",
    "textLayersCount": 1,
    "qrEnabled": true,
    "previewUrl": "/storage/templates/preview_6a804e16.png"
  }
}
```

---

## 3. Font & Asset Synchronization Policy

1. **Font Synchronization**:
   - When a template references a Google Font (e.g. `Cinzel`, `Playfair Display`), Proofsy's `fontService.js` automatically downloads and caches the `.ttf` binary into `storage/fonts/` during the first issuance pass.
   - For custom institutional fonts, fonts uploaded in the designer are synced to Proofsy via `POST /api/custom-fonts`.

2. **Asset Storage Abstraction**:
   - Template background images extracted or uploaded in the Designer are stored in `storage/templates/` (local development mode) or the corresponding S3/GCS bucket in production.
   - The template JSON stores relative storage URLs (e.g. `/storage/templates/bg_xxx.png`) ensuring portability across environments.

---

## 4. Versioning & Immutability Guarantee

> [!IMPORTANT]
> **Issued Certificate Integrity**:
> Once certificates have been issued using Template Version $N$, Template Version $N$ becomes **immutable**.
> If an administrator modifies the template in Proofsy Template Studio, the system creates **Template Version $N+1$**.
> Previously issued certificates remain forever tied to Version $N$, ensuring their cryptographic verification and reprinted PDFs never experience layout shifts.

---

## 5. End-to-End Acceptance Verification Flow

```
1. [Designer] Customer uploads original PDF (e.g. 'Stanford_Certificate.pdf')
2. [Designer] Pipeline parses PDF -> Reconstructs layout -> Identifies fonts
3. [Designer] Customer sets 'Student Name' -> {{student_name}}, 'Date' -> {{issue_date}}
4. [Designer] Customer drags QR Code Placeholder to bottom right corner
5. [Designer] Customer clicks 'Save & Export to Proofsy' -> Exports template.json
6. [Issuer] Template imported into Proofsy Workspace
7. [Issuer] Event created with newly imported template
8. [Issuer] Customer uploads CSV: 'Bhaskar Sharma, bhaskarsharma0109@gmail.com'
9. [Issuer] Worker executes PDF rendering using template textLayers + background
10. [Issuer] Worker calculates RSA-SHA256 digital signature & embeds branded QR
11. [Verification] Scan QR / visit verify URL -> 100% Valid signature and matched layout!
```
