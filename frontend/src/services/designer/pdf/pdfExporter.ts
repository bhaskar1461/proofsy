import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { ProofsyTemplate } from "@/types/designer/template";

/**
 * Generates a real, high-resolution printable PDF from a ProofsyTemplate.
 */
export async function exportTemplateAsPdf(
  template: ProofsyTemplate,
  sampleData?: Record<string, string>
): Promise<Blob> {
  const doc = await PDFDocument.create();

  const width = template.page.width || 1056;
  const height = template.page.height || 746;
  const page = doc.addPage([width, height]);

  // 1. Embed and draw high-res background image if present
  if (template.background.url && template.background.url.startsWith("data:image/")) {
    try {
      const isPng = template.background.url.startsWith("data:image/png");
      const base64Data = template.background.url.split(",")[1];
      const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

      const embeddedImg = isPng
        ? await doc.embedPng(imageBytes)
        : await doc.embedJpg(imageBytes);

      page.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width,
        height,
        opacity: template.background.opacity ?? 1.0,
      });
    } catch (e) {
      console.warn("Could not embed background image in PDF:", e);
    }
  }

  // 2. Standard fonts
  const fontHelvetica = await doc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontTimes = await doc.embedFont(StandardFonts.TimesRoman);
  const fontTimesBold = await doc.embedFont(StandardFonts.TimesRomanBold);

  // 3. Draw text and variable elements
  const sortedElements = [...template.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  const hasBackgroundImg = Boolean(template.background.url && (template.background.opacity ?? 1.0) > 0);

  for (const el of sortedElements) {
    if (el.isHidden) continue;

    // If there is a background image, do NOT duplicate static text labels that are already part of the image
    if (hasBackgroundImg && el.type === "text") {
      continue;
    }

    if (el.type === "text" || el.type === "variable_text") {
      let text = el.text || "";
      if (el.type === "variable_text" && el.variableKey) {
        text = sampleData?.[el.variableKey] || el.fallbackText || `{{${el.variableKey}}}`;
      }

      if (!text.trim()) continue;

      const fontSize = Math.max(8, Math.round(el.fontSize || 14));
      const isBold = el.fontWeight === "bold" || el.fontWeight === "800";
      const isSerif = (el.fontFamily || "").toLowerCase().includes("cinzel") || (el.fontFamily || "").toLowerCase().includes("times");

      const chosenFont = isSerif
        ? (isBold ? fontTimesBold : fontTimes)
        : (isBold ? fontHelveticaBold : fontHelvetica);

      // In PDF, Y coordinate is measured from the bottom-left origin
      const drawX = el.x;
      const drawY = height - el.y - fontSize * 0.85;

      page.drawText(text, {
        x: Math.max(5, drawX),
        y: Math.max(5, drawY),
        size: fontSize,
        font: chosenFont,
        color: rgb(0.08, 0.1, 0.16),
      });
    }
  }

  const pdfBytes = await doc.save();
  return new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
}

/**
 * Triggers a browser download for the generated PDF.
 */
export async function downloadTemplatePdf(
  template: ProofsyTemplate,
  sampleData?: Record<string, string>
) {
  const blob = await exportTemplateAsPdf(template, sampleData);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const filename = `${(template.name || "certificate").toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`;
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
