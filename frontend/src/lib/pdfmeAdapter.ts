import { Template as PdfmeTemplate, Schema as PdfmeSchema } from "@pdfme/common";
import { TextLayer, QrCodeConfig } from "@/lib/api";

// Standard A4 landscape dimensions in mm and px
const A4_WIDTH_MM = 297;
const A4_HEIGHT_MM = 210;
const DEFAULT_WIDTH_PX = 1056;
const DEFAULT_HEIGHT_PX = 746;

export function pxToMmX(px: number, totalPx = DEFAULT_WIDTH_PX): number {
  return Number(((px / totalPx) * A4_WIDTH_MM).toFixed(2));
}

export function pxToMmY(py: number, totalPy = DEFAULT_HEIGHT_PX): number {
  return Number(((py / totalPy) * A4_HEIGHT_MM).toFixed(2));
}

export function mmToPxX(mm: number, totalPx = DEFAULT_WIDTH_PX): number {
  return Math.round((mm / A4_WIDTH_MM) * totalPx);
}

export function mmToPxY(mm: number, totalPy = DEFAULT_HEIGHT_PX): number {
  return Math.round((mm / A4_HEIGHT_MM) * totalPy);
}

/**
 * Converts Proofsy TemplateEditor props (layers + background + qrCode) to a pdfme Template
 */
export function proofsyLayersToPdfme(
  backgroundUrl: string | undefined,
  width: number = DEFAULT_WIDTH_PX,
  height: number = DEFAULT_HEIGHT_PX,
  layers: TextLayer[] = [],
  qrCode?: QrCodeConfig
): PdfmeTemplate {
  const pageSchema: Record<string, any> = {};

  // 1. Convert Text Layers
  layers.forEach((layer, idx) => {
    const key = layer.variable === "custom" ? `custom_text_${idx + 1}` : layer.variable || `text_${idx + 1}`;
    const xMm = pxToMmX(layer.x, width);
    const yMm = pxToMmY(layer.y, height);
    const wMm = layer.maxWidth ? pxToMmX(layer.maxWidth, width) : pxToMmX(600, width);
    const hMm = Math.max(10, pxToMmY(layer.fontSize * 1.5, height));

    pageSchema[key] = {
      type: "text",
      position: { x: Math.max(0, xMm - (layer.textAlign === "center" ? wMm / 2 : 0)), y: Math.max(0, yMm) },
      width: wMm,
      height: hMm,
      alignment: layer.textAlign || "center",
      fontSize: Math.round(layer.fontSize * 0.75), // Convert px to pt
      fontColor: layer.color || "#0F172A",
      fontName: layer.fontFamily || "Inter",
      lineHeight: 1.2,
      content: layer.variable === "custom" ? (layer.customText || "Custom Text") : `{{${layer.variable}}}`,
    };
  });

  // 2. Convert QR Code if enabled
  if (qrCode && qrCode.enabled) {
    const qrSizeMm = pxToMmX(qrCode.size || 100, width);
    pageSchema["verification_qrcode"] = {
      type: "qrcode",
      position: { x: pxToMmX(qrCode.x || 880, width), y: pxToMmY(qrCode.y || 580, height) },
      width: qrSizeMm,
      height: qrSizeMm,
      content: "https://proofsy.io/verify/SAMPLE-CODE",
    };
  }

  return {
    basePdf: backgroundUrl && backgroundUrl.startsWith("data:")
      ? backgroundUrl
      : {
          width: A4_WIDTH_MM,
          height: A4_HEIGHT_MM,
          padding: [0, 0, 0, 0],
        },
    schemas: [pageSchema] as any,
  };
}

/**
 * Converts pdfme Template schemas back to Proofsy TextLayers and QR Code config
 */
export function pdfmeToProofsyLayers(
  pdfmeTemplate: PdfmeTemplate,
  width: number = DEFAULT_WIDTH_PX,
  height: number = DEFAULT_HEIGHT_PX
): { layers: TextLayer[]; qrCode: QrCodeConfig } {
  const pageSchema = pdfmeTemplate.schemas[0] || {};
  const layers: TextLayer[] = [];
  let qrCode: QrCodeConfig = {
    enabled: false,
    x: 880,
    y: 580,
    size: 100,
  };

  Object.entries(pageSchema).forEach(([key, schema]: [string, any]) => {
    if (schema.type === "qrcode") {
      qrCode = {
        enabled: true,
        x: mmToPxX(schema.position.x, width),
        y: mmToPxY(schema.position.y, height),
        size: mmToPxX(schema.width, width),
      };
      return;
    }

    if (schema.type === "text") {
      const isKnownVariable = [
        "recipient_name",
        "event_name",
        "date",
        "verification_code",
        "organizer",
        "duration",
      ].includes(key);

      const align = schema.alignment || "center";
      const wPx = mmToPxX(schema.width, width);
      const xPx = mmToPxX(schema.position.x, width);
      const calculatedX = align === "center" ? xPx + wPx / 2 : xPx;

      layers.push({
        _id: key,
        variable: isKnownVariable ? (key as TextLayer["variable"]) : "custom",
        label: key.replace(/_/g, " ").toUpperCase(),
        x: calculatedX,
        y: mmToPxY(schema.position.y, height),
        fontSize: Math.round((schema.fontSize || 14) / 0.75),
        fontFamily: schema.fontName || "Inter",
        fontWeight: "normal",
        color: schema.fontColor || "#0F172A",
        textAlign: align,
        maxWidth: wPx,
        customText: isKnownVariable ? undefined : (schema.content || key),
      });
    }
  });

  return { layers, qrCode };
}
