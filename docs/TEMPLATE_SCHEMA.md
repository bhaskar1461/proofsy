# Proofsy Certificate Template Schema Specification (v2.0)

> **Schema Identifier**: `https://schema.proofsy.io/template/v2.0.json`  
> **Compatibility**: Proofsy Template Studio 2026 + Proofsy Certificate Issuance Engine

---

## 1. Specification Overview

The Proofsy Template Schema is a structured, deterministic JSON representation of a certificate's visual and variable layout. It serves as the universal contract between the visual design editor (*Proofsy Template Studio*) and the high-speed background certificate rendering pipeline.

---

## 2. Complete JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ProofsyCertificateTemplate",
  "type": "object",
  "required": [
    "schemaVersion",
    "id",
    "name",
    "page",
    "background",
    "elements",
    "variables",
    "version"
  ],
  "properties": {
    "schemaVersion": {
      "type": "string",
      "enum": ["2.0"]
    },
    "id": {
      "type": "string",
      "description": "Unique template identifier"
    },
    "version": {
      "type": "integer",
      "minimum": 1,
      "description": "Monotonically increasing version number"
    },
    "name": {
      "type": "string",
      "description": "Human-readable template title"
    },
    "description": {
      "type": "string",
      "default": ""
    },
    "organizationId": {
      "type": "string"
    },
    "workspaceId": {
      "type": "string"
    },
    "page": {
      "type": "object",
      "required": ["width", "height", "unit", "orientation"],
      "properties": {
        "width": { "type": "number", "default": 1056 },
        "height": { "type": "number", "default": 746 },
        "unit": { "type": "string", "enum": ["px", "pt", "mm", "in"], "default": "px" },
        "dpi": { "type": "integer", "default": 300 },
        "orientation": { "type": "string", "enum": ["landscape", "portrait"], "default": "landscape" },
        "standardFormat": { "type": "string", "enum": ["A4", "Letter", "Custom"], "default": "A4" }
      }
    },
    "background": {
      "type": "object",
      "required": ["type"],
      "properties": {
        "type": { "type": "string", "enum": ["image", "pdf", "color", "gradient"] },
        "url": { "type": "string" },
        "assetId": { "type": "string" },
        "color": { "type": "string", "default": "#ffffff" },
        "opacity": { "type": "number", "minimum": 0, "maximum": 1, "default": 1.0 }
      }
    },
    "elements": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "type", "x", "y", "width", "height", "zIndex"],
        "properties": {
          "id": { "type": "string" },
          "type": {
            "type": "string",
            "enum": [
              "text",
              "variable_text",
              "image",
              "shape_rect",
              "shape_ellipse",
              "shape_line",
              "qr_placeholder",
              "signature_placeholder",
              "seal_placeholder",
              "svg"
            ]
          },
          "x": { "type": "number" },
          "y": { "type": "number" },
          "width": { "type": "number" },
          "height": { "type": "number" },
          "rotation": { "type": "number", "default": 0 },
          "opacity": { "type": "number", "minimum": 0, "maximum": 1, "default": 1.0 },
          "zIndex": { "type": "integer" },
          "isLocked": { "type": "boolean", "default": false },
          "isHidden": { "type": "boolean", "default": false },

          "text": { "type": "string" },
          "variableKey": { "type": "string" },
          "fallbackText": { "type": "string" },
          "fontFamily": { "type": "string", "default": "Inter" },
          "fontSize": { "type": "number", "default": 24 },
          "fontWeight": { "type": "string", "enum": ["normal", "medium", "bold", "800"], "default": "normal" },
          "fontStyle": { "type": "string", "enum": ["normal", "italic"], "default": "normal" },
          "color": { "type": "string", "default": "#000000" },
          "textAlign": { "type": "string", "enum": ["left", "center", "right", "justify"], "default": "center" },
          "letterSpacing": { "type": "number", "default": 0 },
          "lineHeight": { "type": "number", "default": 1.2 },
          "maxWidth": { "type": ["number", "null"], "default": null },
          "textTransform": { "type": "string", "enum": ["none", "uppercase", "lowercase", "capitalize"], "default": "none" },

          "assetUrl": { "type": "string" },
          "assetId": { "type": "string" },

          "fillColor": { "type": "string", "default": "transparent" },
          "strokeColor": { "type": "string", "default": "#000000" },
          "strokeWidth": { "type": "number", "default": 1 },
          "borderRadius": { "type": "number", "default": 0 },

          "qrConfig": {
            "type": "object",
            "properties": {
              "purpose": { "type": "string", "enum": ["certificate_verification"], "default": "certificate_verification" },
              "errorCorrectionLevel": { "type": "string", "enum": ["L", "M", "Q", "H"], "default": "H" },
              "style": { "type": "string", "enum": ["circular_premium", "standard_square"], "default": "circular_premium" },
              "showCenterLogo": { "type": "boolean", "default": true }
            }
          },

          "signatureConfig": {
            "type": "object",
            "properties": {
              "signerRole": { "type": "string", "default": "Dean / Principal" },
              "signerName": { "type": "string", "default": "Authorized Signatory" },
              "signerDesignation": { "type": "string", "default": "Head of Institution" },
              "showBaseline": { "type": "boolean", "default": true },
              "signatureAssetUrl": { "type": "string" }
            }
          },

          "sealConfig": {
            "type": "object",
            "properties": {
              "sealType": { "type": "string", "enum": ["institutional_emboss", "gold_stamp", "custom_image"], "default": "institutional_emboss" },
              "maskShape": { "type": "string", "enum": ["circle", "none"], "default": "circle" }
            }
          }
        }
      }
    },
    "variables": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["key", "label", "type"],
        "properties": {
          "key": { "type": "string" },
          "label": { "type": "string" },
          "type": { "type": "string", "enum": ["string", "date", "number", "code"] },
          "sampleValue": { "type": "string" },
          "defaultValue": { "type": "string" },
          "required": { "type": "boolean", "default": true }
        }
      }
    },
    "fonts": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["family", "source"],
        "properties": {
          "family": { "type": "string" },
          "source": { "type": "string", "enum": ["google", "system", "custom", "embedded_pdf"] },
          "url": { "type": "string" },
          "fallbackFamily": { "type": "string", "default": "Inter" }
        }
      }
    },
    "assets": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "type", "url"],
        "properties": {
          "id": { "type": "string" },
          "type": { "type": "string", "enum": ["background", "logo", "signature", "seal", "icon"] },
          "url": { "type": "string" },
          "mimeType": { "type": "string" },
          "fileSizeBytes": { "type": "integer" }
        }
      }
    }
  }
}
```

---

## 3. Example Export Payload (`template.json`)

```json
{
  "schemaVersion": "2.0",
  "id": "tpl_honors_cs_2026",
  "version": 1,
  "name": "Faculty of Engineering — Honors Certificate",
  "description": "Gold border institutional template with circular QR and dual signatures",
  "organizationId": "6a005eab11fafa8b22a16e1c",
  "workspaceId": "6a804e16329ae1d854364ec1",
  "page": {
    "width": 1056,
    "height": 746,
    "unit": "px",
    "dpi": 300,
    "orientation": "landscape",
    "standardFormat": "A4"
  },
  "background": {
    "type": "image",
    "url": "/storage/templates/elegant-gold.png",
    "opacity": 1.0
  },
  "elements": [
    {
      "id": "el_title",
      "type": "text",
      "x": 528,
      "y": 140,
      "width": 800,
      "height": 50,
      "zIndex": 1,
      "text": "CERTIFICATE OF EXCELLENCE",
      "fontFamily": "Cinzel",
      "fontSize": 32,
      "fontWeight": "bold",
      "color": "#1E293B",
      "textAlign": "center",
      "letterSpacing": 2
    },
    {
      "id": "el_student_name",
      "type": "variable_text",
      "x": 528,
      "y": 360,
      "width": 700,
      "height": 60,
      "zIndex": 2,
      "variableKey": "student_name",
      "fallbackText": "Recipient Full Name",
      "fontFamily": "Inter",
      "fontSize": 38,
      "fontWeight": "bold",
      "color": "#0F172A",
      "textAlign": "center"
    },
    {
      "id": "el_course_name",
      "type": "variable_text",
      "x": 528,
      "y": 440,
      "width": 850,
      "height": 40,
      "zIndex": 3,
      "variableKey": "course_name",
      "fallbackText": "Advanced Cryptographic Engineering",
      "fontFamily": "Inter",
      "fontSize": 20,
      "fontWeight": "medium",
      "color": "#4F46E5",
      "textAlign": "center"
    },
    {
      "id": "el_qr_anchor",
      "type": "qr_placeholder",
      "x": 880,
      "y": 580,
      "width": 120,
      "height": 120,
      "zIndex": 4,
      "qrConfig": {
        "purpose": "certificate_verification",
        "errorCorrectionLevel": "H",
        "style": "circular_premium",
        "showCenterLogo": true
      }
    },
    {
      "id": "el_sig_dean",
      "type": "signature_placeholder",
      "x": 220,
      "y": 620,
      "width": 200,
      "height": 80,
      "zIndex": 5,
      "signatureConfig": {
        "signerRole": "Dean of Academic Affairs",
        "signerName": "Dr. Sarah Jenkins",
        "signerDesignation": "Dean of Computing",
        "showBaseline": true
      }
    }
  ],
  "variables": [
    { "key": "student_name", "label": "Student Name", "type": "string", "sampleValue": "Bhaskar Sharma" },
    { "key": "course_name", "label": "Course Name", "type": "string", "sampleValue": "Cloud Architecture & Cryptography" },
    { "key": "issue_date", "label": "Issue Date", "type": "date", "sampleValue": "August 15, 2026" },
    { "key": "certificate_id", "label": "Credential ID", "type": "code", "sampleValue": "PROOF-2026-X89K" }
  ],
  "fonts": [
    { "family": "Inter", "source": "google", "fallbackFamily": "sans-serif" },
    { "family": "Cinzel", "source": "google", "fallbackFamily": "serif" }
  ],
  "assets": []
}
```

---

## 4. Converter Adapter for Proofsy Issuer Compatibility

Proofsy's existing issuance engine expects a simplified `Template` Mongoose model containing `textLayers` and `qrCode`. The following deterministic transform converts Schema v2.0 into the existing database format:

```js
function convertV2ToProofsyLegacyTemplate(v2) {
  const textLayers = v2.elements
    .filter(el => el.type === "text" || el.type === "variable_text")
    .map(el => ({
      variable: el.variableKey === "student_name" ? "recipient_name"
              : el.variableKey === "course_name" || el.variableKey === "event_name" ? "event_name"
              : el.variableKey === "issue_date" ? "date"
              : el.variableKey === "certificate_id" ? "verification_code"
              : el.variableKey || "custom",
      label: el.variableKey || el.text || "Text Layer",
      x: el.x,
      y: el.y,
      fontSize: el.fontSize,
      fontFamily: el.fontFamily || "Inter",
      fontWeight: el.fontWeight === "bold" || el.fontWeight === "800" ? "bold" : "normal",
      color: el.color || "#000000",
      textAlign: el.textAlign || "center",
      maxWidth: el.maxWidth || null,
      customText: el.type === "text" ? el.text : null
    }));

  const qrEl = v2.elements.find(el => el.type === "qr_placeholder");

  return {
    name: v2.name,
    backgroundType: v2.background.type === "pdf" ? "pdf" : "image",
    backgroundUrl: v2.background.url,
    width: v2.page.width,
    height: v2.page.height,
    textLayers,
    qrCode: qrEl ? {
      enabled: true,
      x: qrEl.x,
      y: qrEl.y,
      size: qrEl.width
    } : { enabled: false }
  };
}
```
