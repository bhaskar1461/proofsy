import { CanvasElement, PageSettings } from "../../types/template";

// Helper to sanitize font family strings from PDF FontDescriptors
export function cleanFontFamily(rawName: string): { fontFamily: string; fontWeight: "normal" | "bold"; fontStyle: "normal" | "italic" } {
  if (!rawName) return { fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal" };

  // Remove subset prefix like "ABCDE+Cinzel-Bold"
  const cleanName = rawName.replace(/^[A-Z]{6}\+/, "").trim();
  const lower = cleanName.toLowerCase();

  const isBold = lower.includes("bold") || lower.includes("black") || lower.includes("heavy") || lower.includes("semibold") || lower.includes("700") || lower.includes("800");
  const isItalic = lower.includes("italic") || lower.includes("oblique");

  // Strip modifier suffixes to extract pure family name
  let family = cleanName
    .replace(/[-_](Bold|Regular|Italic|Light|Medium|Black|SemiBold|Oblique|Roman|Regular|Book)/gi, "")
    .replace(/(Bold|Regular|Italic|Light|Medium|Black|SemiBold|Oblique|Roman|Regular|Book)/gi, "")
    .replace(/[,\s]+$/g, "")
    .trim();

  if (!family || family.length < 2) {
    family = "Inter";
  }

  // Normalize common standard font family aliases
  if (lower.includes("times") || lower.includes("roman")) family = "Times New Roman";
  else if (lower.includes("arial") || lower.includes("helvetica")) family = "Arial";
  else if (lower.includes("cinzel")) family = "Cinzel";
  else if (lower.includes("playfair")) family = "Playfair Display";
  else if (lower.includes("montserrat")) family = "Montserrat";
  else if (lower.includes("poppins")) family = "Poppins";
  else if (lower.includes("roboto")) family = "Roboto";
  else if (lower.includes("merriweather")) family = "Merriweather";
  else if (lower.includes("greatvibes") || lower.includes("script")) family = "Great Vibes";

  return {
    fontFamily: family,
    fontWeight: isBold ? "bold" : "normal",
    fontStyle: isItalic ? "italic" : "normal",
  };
}

export interface ParsedRawTextItem {
  str: string;
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  fontSizePt: number;
  fontName: string;
  transform: number[];
  colorHex: string;
}

export interface ExtractedPDFStructure {
  pageSettings: PageSettings;
  textElements: CanvasElement[];
  rawTextItems: ParsedRawTextItem[];
  detectedFontNames: string[];
}

/**
 * Configure PDF.js global worker
 */
export async function getPdfJs() {
  const pdfjsLib = await import("pdfjs-dist");
  if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
  return pdfjsLib;
}

/**
 * Parses an uploaded PDF array buffer and reconstructs structural text elements with
 * precise tabular column detection and coordinate mapping.
 */
export async function parsePdfStructure(arrayBuffer: ArrayBuffer): Promise<ExtractedPDFStructure> {
  const pdfjsLib = await getPdfJs();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
    isEvalSupported: false,
  });

  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(1);
  const viewport = page.getViewport({ scale: 1.0 });

  const pdfWidthPt = viewport.width;
  const pdfHeightPt = viewport.height;
  const isLandscape = pdfWidthPt >= pdfHeightPt;

  // Standardize target canvas preserving exact aspect ratio
  const standardBaseWidth = isLandscape ? 1056 : 794;
  const targetCanvasWidth = standardBaseWidth;
  const scale = targetCanvasWidth / pdfWidthPt;
  const targetCanvasHeight = Math.round(pdfHeightPt * scale);

  const textContent = await page.getTextContent();
  const rawItems: ParsedRawTextItem[] = [];
  const detectedFontNames = new Set<string>();

  for (const item of textContent.items) {
    if (!("str" in item) || !item.str.trim()) continue;

    const str = item.str;
    const transform = item.transform; // [scaleX, skewY, skewX, scaleY, tx, ty]
    const pdfX = transform[4];
    const pdfY = transform[5];
    const pdfWidth = item.width || 0;
    const pdfHeight = item.height || Math.hypot(transform[2], transform[3]) || 12;
    const fontSizePt = Math.hypot(transform[0], transform[1]) || 12;
    const fontName = item.fontName || "Inter";

    detectedFontNames.add(fontName);

    rawItems.push({
      str,
      pdfX,
      pdfY,
      pdfWidth,
      pdfHeight,
      fontSizePt,
      fontName,
      transform,
      colorHex: "#0F172A",
    });
  }

  // 1. Vertical baseline grouping: group items sharing similar Y coordinate
  const lines: ParsedRawTextItem[][] = [];
  const yTolerance = 3.5; // points

  // Sort raw items from top to bottom (highest PDF Y first)
  const sortedItems = [...rawItems].sort((a, b) => b.pdfY - a.pdfY || a.pdfX - b.pdfX);

  for (const item of sortedItems) {
    let placed = false;
    for (const line of lines) {
      if (Math.abs(line[0].pdfY - item.pdfY) <= yTolerance) {
        line.push(item);
        placed = true;
        break;
      }
    }
    if (!placed) {
      lines.push([item]);
    }
  }

  // 2. Horizontal Column Clustering: separate distinct columns on the same line
  const textElements: CanvasElement[] = [];
  let zIndexCounter = 1;

  for (const line of lines) {
    line.sort((a, b) => a.pdfX - b.pdfX);

    // Split line into discrete clusters based on horizontal gap
    const clusters: ParsedRawTextItem[][] = [];
    let currentCluster: ParsedRawTextItem[] = [line[0]];

    for (let i = 1; i < line.length; i++) {
      const prev = line[i - 1];
      const curr = line[i];
      const prevRight = prev.pdfX + (prev.pdfWidth || 0);
      const gap = curr.pdfX - prevRight;

      // Gap threshold for column separation: if gap > 1.2x font size or > 14pt, treat as separate column/cell
      const maxWordGap = Math.max(prev.fontSizePt * 1.2, 14);

      if (gap <= maxWordGap) {
        currentCluster.push(curr);
      } else {
        clusters.push(currentCluster);
        currentCluster = [curr];
      }
    }
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    // Build CanvasElement for each discrete cluster
    for (const cluster of clusters) {
      const fullText = cluster.map((item) => item.str).join(" ").replace(/\s+/g, " ").trim();
      if (!fullText) continue;

      const minPdfX = Math.min(...cluster.map((i) => i.pdfX));
      const maxPdfX = Math.max(...cluster.map((i) => i.pdfX + (i.pdfWidth || 0)));
      const avgPdfY = cluster[0].pdfY;
      const maxFontSizePt = Math.max(...cluster.map((i) => i.fontSizePt));
      const primaryFont = cluster[0].fontName;

      const { fontFamily, fontWeight, fontStyle } = cleanFontFamily(primaryFont);

      // Coordinate transformation: PDF points to Screen Canvas Pixels
      const canvasFontSize = Math.max(10, Math.round(maxFontSizePt * scale));
      const canvasX = Math.round(minPdfX * scale);
      const rawCanvasY = Math.round((pdfHeightPt - avgPdfY - (maxFontSizePt * 0.88)) * scale);
      const canvasY = Math.max(4, rawCanvasY);

      const rawWidth = Math.round((maxPdfX - minPdfX) * scale);
      const canvasWidth = Math.max(rawWidth + 8, Math.round(canvasFontSize * fullText.length * 0.62));
      const canvasHeight = Math.max(Math.round(canvasFontSize * 1.35), 18);

      textElements.push({
        id: `el_txt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
        type: "text",
        x: canvasX,
        y: canvasY,
        width: canvasWidth,
        height: canvasHeight,
        rotation: 0,
        opacity: 1.0,
        zIndex: zIndexCounter++,
        isLocked: false,
        isHidden: false,
        text: fullText,
        fontFamily,
        fontSize: canvasFontSize,
        fontWeight,
        fontStyle,
        color: "#0F172A",
        textAlign: "left",
        letterSpacing: 0,
        lineHeight: 1.2,
      });
    }
  }

  const pageSettings: PageSettings = {
    width: targetCanvasWidth,
    height: targetCanvasHeight,
    unit: "px",
    dpi: 300,
    orientation: isLandscape ? "landscape" : "portrait",
    standardFormat: isLandscape ? "A4" : "A4",
  };

  return {
    pageSettings,
    textElements,
    rawTextItems: rawItems,
    detectedFontNames: Array.from(detectedFontNames),
  };
}
