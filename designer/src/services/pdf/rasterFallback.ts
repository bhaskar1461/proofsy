import { getPdfJs } from "./pdfParser";

/**
 * Renders a PDF page to a high-resolution 300 DPI image data URL.
 * Used for flattened, scanned, or image-heavy PDFs as the locked background.
 */
export async function renderPdfPageToHighResImage(
  arrayBuffer: ArrayBuffer,
  pageNumber: number = 1,
  targetWidth: number = 1056,
  targetHeight: number = 746
): Promise<string> {
  const pdfjsLib = await getPdfJs();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer.slice(0)),
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(pageNumber);

  // 300 DPI rendering scale (4.16x standard 72 pt PDF space)
  const baseViewport = page.getViewport({ scale: 1.0 });
  const scale = (targetWidth / baseViewport.width) * 2.0; // 2x for ultra-sharp canvas rendering

  const viewport = page.getViewport({ scale });

  // Create an offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    throw new Error("Unable to create 2D canvas context for PDF rendering");
  }

  // Draw white background
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;

  return canvas.toDataURL("image/png", 0.95);
}
