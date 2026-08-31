# Proofsy PDF-to-Template Reconstruction Pipeline

> **Module**: `PDFAnalysisEngine`  
> **Objective**: Ingest arbitrary certificate PDF documents, extract structural design primitives, evaluate fidelity, and construct an editable Proofsy Template.

---

## 1. Multi-Tier Pipeline Flowchart

```
┌──────────────────┐
│ Uploaded PDF File│
└────────┬─────────┘
         │
         ▼
┌───────────────────────────────────────────────┐
│ Stage 1: Validation & PDF Document Loading    │ (Mozilla PDF.js inside Web Worker)
└────────┬──────────────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────────────┐
│ Stage 2: Viewport & Geometry Normalization    │ (Points -> Canvas Pixel Matrix, Landscape/Portrait)
└────────┬──────────────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────────────┐
│ Stage 3: Text Stream Extraction & Clustering  │ (TextItems -> Spatial Words -> Logical Lines)
└────────┬──────────────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────────────┐
│ Stage 4: Typography & Style Decoding          │ (FontDescriptor -> PostScript -> CSS Font Matching)
└────────┬──────────────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────────────┐
│ Stage 5: Asset & Image Stream Extraction      │ (OPS.paintImageXObject -> PNG Asset Blobs)
└────────┬──────────────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────────────┐
│ Stage 6: Structural Fidelity Classification   │ (Calculate Quality %: DETECTED / APPROX / RASTER)
└────────┬───────────────────────┬──────────────┘
         │                       │
     [Structured PDF]       [Flattened / Scanned / Image-Only]
         │                       │
         ▼                       ▼
┌──────────────────┐    ┌─────────────────────────────────────────┐
│ Full Vector/Text │    │ Stage 6B: High-Res Raster Fallback      │
│ Reconstruction   │    │ (Render 300 DPI page -> Background Image│
│                  │    │  + Overlaid Editable Elements)          │
└────────┬─────────┘    └────────┬────────────────────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
┌───────────────────────────────────────────────┐
│ Stage 7: Heuristic Variable Suggestion Engine │ (Regex matching for name/date/course)
└────────┬──────────────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────────────┐
│ Stage 8: Canvas Initialization & Editor Launch│
└───────────────────────────────────────────────┘
```

---

## 2. Detailed Pipeline Stages

### Stage 1: Document Validation & Sandboxing
1. **Magic Bytes Check**: Verifies leading bytes `%PDF-1.x`.
2. **Worker Isolation**: Ingests buffer into an isolated browser Web Worker (`pdfWorker.ts`) via `pdfjsLib.getDocument({ data })`.
3. **Execution Guardrails**: JavaScript execution in PDF streams is disabled (`isEvalSupported: false`, `disableAutoFetch: true`).

### Stage 2: Geometry & Coordinate Normalization
PDFs use bottom-left origin `(0, 0)` in standard PostScript points (1 pt = 1/72 inch). Proofsy uses top-left origin `(0, 0)` in display pixels (default 1056 x 746 px for standard A4 landscape).

#### Transformation Math:
```js
// Scale factor from PDF points to Canvas standard (e.g. 841.89 pt -> 1056 px)
const scaleX = targetCanvasWidth / pdfPageWidthPt;
const scaleY = targetCanvasHeight / pdfPageHeightPt;

// Convert PDF coordinate (x_pdf, y_pdf) to Web Canvas coordinate (x_canvas, y_canvas)
const canvasX = pdfX * scaleX;
const canvasY = (pdfPageHeightPt - pdfY - pdfHeight) * scaleY;
```

### Stage 3: Text Stream Assembly & Spatial Clustering
PDF text operators (`Tj`, `TJ`) emit fragmented glyph streams that often split words or characters. Proofsy implements spatial proximity clustering:
1. **Vertical Sorting**: Group glyphs sharing identical or near-identical baseline Y coordinates ($\Delta Y \le 2\text{pt}$).
2. **Horizontal Word Merging**: Merge contiguous glyphs where spacing $< 0.4 \times \text{fontSize}$.
3. **Alignment Detection**: Calculate line center-of-mass relative to canvas width:
   - If $|\text{midpointX} - \text{pageCenterX}| \le 8\text{px}$ $\rightarrow$ `textAlign: "center"`.
   - If $\text{minX} \le \text{pageLeftMargin} + 10\text{px}$ $\rightarrow$ `textAlign: "left"`.
   - If $\text{maxX} \ge \text{pageRightMargin} - 10\text{px}$ $\rightarrow$ `textAlign: "right"`.

### Stage 4: Typography Decoding & Font Matching
1. **Font Descriptor Extraction**: Reads `FontName`, `FontWeight`, `ItalicAngle`, and font subset tags (e.g. `ABCDE+Cinzel-Bold` $\rightarrow$ `Cinzel`, `weight: bold`).
2. **Color Space Translation**: Parses DeviceRGB, DeviceCMYK, and Gray colors to Hex strings (`#RRGGBB`).
3. **Font Registry Lookup**: Checks if the detected font is available in Google Fonts or Proofsy's server font cache. If not, selects the closest fallback font and logs a warning in the Reconstruction Report.

### Stage 5: Asset & Embedded Image Extraction
1. Intercepts `PDFJS.OPS.paintImageXObject` and `paintInlineImageXObject`.
2. Extracts raw image bytes (JPEG/PNG) or draws image data onto offscreen canvas to produce a high-fidelity PNG blob.
3. Assigns unique asset ID (e.g. `asset_logo_01`) and records dimensions and coordinates.

---

## 3. Structural Fidelity Classification & Quality Scoring

Every analyzed PDF is assigned an objective **Reconstruction Quality Score**:

```
Quality Score = (Text Fidelity * 0.40) + (Font Fidelity * 0.25) + (Layout Fidelity * 0.20) + (Asset Fidelity * 0.15)
```

| Classification Level | Criteria | Recommended UX Action |
|---|---|---|
| **DETECTED** (90%–100%) | Vector text with recognizable fonts, clear coordinates, embedded logos | Full direct vector reconstruction with editable text boxes. |
| **APPROXIMATED** (65%–89%) | Text detected but fonts subsetted/unknown, or complex vector artwork | Vector text with substituted fonts + background raster approximation. |
| **RASTERIZED / FALLBACK** (< 65%) | Scanned paper certificate, flattened raster PDF, outline-only glyphs | **High-Res Locked Background Fallback** (Stage 6B). |

---

## 4. Stage 6B: The High-Res Raster Fallback Engine (Mandatory)

When an uploaded PDF is flattened, scanned, or contains non-extractable outlined fonts:
1. Proofsy renders the entire PDF page at **300 DPI** using `page.render({ canvasContext, viewport: page.getViewport({ scale: 4.16 }) })`.
2. Encodes the high-res rendering into a lossless PNG and sets it as `template.background.url` with `background.type = "image"`.
3. Sets `isLocked: true` on the background.
4. Generates an initial editable overlay template containing standard centered variable placeholders (`{{student_name}}`, `{{course_name}}`, `{{date}}`, and `QR Placeholder`).
5. Allows the customer to position the transparent overlays directly over the scanned document design.

---

## 5. Stage 7: Heuristic & AI-Assisted Variable Suggestion

The engine analyzes text strings with regex and semantic heuristics:
- **Student/Recipient Name**: Text matching `^[A-Z][a-z]+(\s[A-Z][a-z]+)+$` with large font size ($\ge 28\text{pt}$) and centered alignment.
- **Completion / Issue Date**: Strings matching dates (e.g. `August 15, 2026`, `15/08/2026`, `2026-08-15`).
- **Credential ID**: Strings matching `(ID|Code|No|Reg|Cert)[:\s]+[A-Z0-9-]+`.
- **Course / Event Title**: Centered text positioned immediately below "for successfully completing" or "has participated in".

> [!IMPORTANT]
> **Safety Guarantee**: All suggested variable bindings are presented in the **Reconstruction Report** as optional suggestions with checkboxes. No variable is bound automatically without user approval.
