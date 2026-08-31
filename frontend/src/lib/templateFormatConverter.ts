/**
 * Proofsy ↔ Pdfme Template Format Converter
 *
 * Proofsy stores templates in MongoDB with pixel-based coordinates (1056×746),
 * while the pdfme Designer operates in millimeters (297×210 A4 landscape).
 * This module provides bidirectional conversion so templates edited via the AI
 * service can be loaded in the visual Designer and saved back to the database.
 */

/* ───── Proofsy (MongoDB) Types ───── */
export interface ProofsyTextLayer {
  _id?: string;
  variable: string;
  label: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: "normal" | "bold";
  color: string;
  textAlign: "left" | "center" | "right";
  maxWidth: number | null;
  customText: string | null;
}

export interface ProofsyQrCode {
  enabled: boolean;
  x: number;
  y: number;
  size: number;
}

export interface ProofsyTemplate {
  _id?: string;
  id?: string;
  name: string;
  backgroundType: "image" | "pdf";
  backgroundUrl: string;
  width: number;
  height: number;
  textLayers: ProofsyTextLayer[];
  qrCode?: ProofsyQrCode;
  isStarter?: boolean;
}

/* ───── Pdfme Types ───── */
export interface PdfmeSchemaField {
  name?: string;
  type: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  alignment?: string;
  fontSize?: number;
  fontColor?: string;
  fontName?: string;
  content?: string;
}

export interface PdfmeTemplate {
  basePdf: {
    width: number;
    height: number;
    padding: number[];
  };
  schemas: Array<Record<string, PdfmeSchemaField>>;
}

/* ───── Constants ───── */
// Default Proofsy canvas size (pixels)
const PROOFSY_DEFAULT_W = 1056;
const PROOFSY_DEFAULT_H = 746;

// Pdfme page size (millimeters — A4 Landscape)
const PDFME_W = 297;
const PDFME_H = 210;

/* ───── Variable → sample content for pdfme preview ───── */
const SAMPLE_CONTENT: Record<string, string> = {
  recipient_name: "Bhaskar Sharma",
  event_name: "Professional Certification Program",
  date: new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
  verification_code: "PROOF-XXXX-XXXX",
  organizer: "Program Director",
  duration: "40 Hours",
  custom: "Custom Text",
};

/* ───── Helper: Proofsy variable → pdfme schema key ───── */
function variableToKey(variable: string, label: string, index: number): string {
  // Use the variable name if it's a known type, otherwise build from label
  if (variable && variable !== "custom") {
    return variable;
  }
  // For custom layers, sanitize the label into a valid key
  const sanitized = (label || `custom_${index}`)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return sanitized || `custom_${index}`;
}

/* ───── Helper: estimate text height in mm from fontSize ───── */
function estimateTextHeight(fontSize: number, proofsyH: number): number {
  // Rough heuristic: fontSize in px → height in mm, scaled proportionally
  const pxHeight = fontSize * 1.6; // line height ≈ 1.6×fontSize
  return (pxHeight / proofsyH) * PDFME_H;
}

/* ═══════════════════════════════════════════════════════
   Proofsy → Pdfme Conversion
   ═══════════════════════════════════════════════════════ */

/**
 * Convert a Proofsy MongoDB template into a pdfme-compatible template
 * that can be loaded by the @pdfme/ui Designer.
 *
 * @param proofsy  The Proofsy template from the database
 * @param backgroundDataUrl  Optional pre-fetched background image as data URL.
 *                           If not provided, the background is omitted (blank canvas).
 */
export function proofsyToPdfme(
  proofsy: ProofsyTemplate,
  backgroundDataUrl?: string
): PdfmeTemplate {
  const pw = proofsy.width || PROOFSY_DEFAULT_W;
  const ph = proofsy.height || PROOFSY_DEFAULT_H;

  // Conversion factors: pixels → mm
  const scaleX = PDFME_W / pw;
  const scaleY = PDFME_H / ph;

  const schema: Record<string, PdfmeSchemaField> = {};

  // If we have a background image, add it as the first layer
  if (backgroundDataUrl) {
    schema["template_background"] = {
      name: "template_background",
      type: "image",
      position: { x: 0, y: 0 },
      width: PDFME_W,
      height: PDFME_H,
      content: backgroundDataUrl,
    };
  }

  // Convert each text layer
  const usedKeys = new Set<string>();
  (proofsy.textLayers || []).forEach((layer, index) => {
    let key = variableToKey(layer.variable, layer.label, index);
    // Ensure uniqueness
    if (usedKeys.has(key)) {
      key = `${key}_${index}`;
    }
    usedKeys.add(key);

    const mmX = layer.x * scaleX;
    const mmY = layer.y * scaleY;
    const textHeight = estimateTextHeight(layer.fontSize, ph);

    // For center-aligned text, pdfme positions from the left edge of the box,
    // so we need to offset: the Proofsy x is the center point.
    const estimatedWidth = (layer.maxWidth || pw * 0.8) * scaleX;
    let posX = mmX;
    if (layer.textAlign === "center") {
      posX = mmX - estimatedWidth / 2;
    } else if (layer.textAlign === "right") {
      posX = mmX - estimatedWidth;
    }

    // Clamp to page bounds
    posX = Math.max(0, Math.min(posX, PDFME_W - 10));
    const posY = Math.max(0, Math.min(mmY, PDFME_H - textHeight));

    const content =
      layer.customText ||
      SAMPLE_CONTENT[layer.variable] ||
      layer.label ||
      "Text";

    schema[key] = {
      name: key,
      type: "text",
      position: { x: Math.round(posX * 100) / 100, y: Math.round(posY * 100) / 100 },
      width: Math.round(estimatedWidth * 100) / 100,
      height: Math.round(textHeight * 100) / 100,
      alignment: layer.textAlign || "center",
      fontSize: Math.round(layer.fontSize * scaleY),
      fontColor: layer.color || "#000000",
      fontName: layer.fontFamily || "Inter",
      content,
    };
  });

  // Convert QR code
  if (proofsy.qrCode?.enabled) {
    const qr = proofsy.qrCode;
    const qrSizeMm = (qr.size || 120) * Math.min(scaleX, scaleY);
    schema["verification_qrcode"] = {
      name: "verification_qrcode",
      type: "qrcode",
      position: {
        x: Math.round(qr.x * scaleX * 100) / 100,
        y: Math.round(qr.y * scaleY * 100) / 100,
      },
      width: Math.round(qrSizeMm * 100) / 100,
      height: Math.round(qrSizeMm * 100) / 100,
      content: "https://proofsy.tech/verify/SAMPLE",
    };
  }

  return {
    basePdf: {
      width: PDFME_W,
      height: PDFME_H,
      padding: [0, 0, 0, 0],
    },
    schemas: [schema],
  };
}

/* ═══════════════════════════════════════════════════════
   Pdfme → Proofsy Conversion
   ═══════════════════════════════════════════════════════ */

// Known pdfme keys → Proofsy variable mapping
const KEY_TO_VARIABLE: Record<string, string> = {
  recipient_name: "recipient_name",
  event_name: "event_name",
  date: "date",
  verification_code: "verification_code",
  organizer: "organizer",
  duration: "duration",
  certificate_title: "custom",
  presented_to: "custom",
  program_intro: "custom",
  description: "custom",
  signature_left: "custom",
  signature_right: "custom",
  winner_badge: "custom",
  event_track: "custom",
};

/**
 * Convert a pdfme template schema back into Proofsy textLayers format.
 *
 * @param pdfme    The pdfme template from the Designer
 * @param targetW  Target Proofsy canvas width in pixels (default 1056)
 * @param targetH  Target Proofsy canvas height in pixels (default 746)
 */
export function pdfmeToProofsy(
  pdfme: PdfmeTemplate,
  targetW: number = PROOFSY_DEFAULT_W,
  targetH: number = PROOFSY_DEFAULT_H
): { textLayers: ProofsyTextLayer[]; qrCode?: ProofsyQrCode } {
  const pageW = pdfme.basePdf?.width || PDFME_W;
  const pageH = pdfme.basePdf?.height || PDFME_H;

  // Conversion factors: mm → pixels
  const scaleX = targetW / pageW;
  const scaleY = targetH / pageH;

  const textLayers: ProofsyTextLayer[] = [];
  let qrCode: ProofsyQrCode | undefined;

  const schema = pdfme.schemas?.[0] || {};

  for (const [key, field] of Object.entries(schema)) {
    // Skip background images
    if (
      field.type === "image" &&
      (key === "template_background" || key === "inspiration_background")
    ) {
      continue;
    }

    // QR code
    if (field.type === "qrcode") {
      qrCode = {
        enabled: true,
        x: Math.round(field.position.x * scaleX),
        y: Math.round(field.position.y * scaleY),
        size: Math.round(field.width * Math.min(scaleX, scaleY)),
      };
      continue;
    }

    // Text layers
    if (field.type === "text") {
      const variable = KEY_TO_VARIABLE[key] || "custom";
      const alignment = (field.alignment as "left" | "center" | "right") || "center";

      // Convert position: pdfme x is left edge; for centered text, Proofsy x is center
      let pxX = field.position.x * scaleX;
      if (alignment === "center") {
        pxX = pxX + (field.width * scaleX) / 2;
      } else if (alignment === "right") {
        pxX = pxX + field.width * scaleX;
      }

      const pxY = field.position.y * scaleY;
      const fontSize = Math.round((field.fontSize || 16) / scaleY);

      textLayers.push({
        variable,
        label: field.name || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        x: Math.round(pxX),
        y: Math.round(pxY),
        fontSize,
        fontFamily: field.fontName || "Inter",
        fontWeight: "normal",
        color: field.fontColor || "#000000",
        textAlign: alignment,
        maxWidth: Math.round(field.width * scaleX) || null,
        customText: variable === "custom" ? field.content || null : null,
      });
    }
  }

  return { textLayers, qrCode };
}

/**
 * Fetch a background image from a URL and return it as a data URL.
 * Used when loading a Proofsy template into the pdfme Designer.
 */
export async function fetchBackgroundAsDataUrl(
  backgroundUrl: string
): Promise<string | undefined> {
  try {
    const response = await fetch(backgroundUrl);
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}
