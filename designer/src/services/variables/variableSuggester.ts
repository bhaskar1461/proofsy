import { CanvasElement, ReconstructionReport } from "../../types/template";
import { PREDEFINED_CERTIFICATE_VARIABLES } from "../../types/variables";

export interface VariableSuggestion {
  elementId: string;
  detectedText: string;
  suggestedVariableKey: string;
  suggestedLabel: string;
  confidence: number;
  accepted: boolean;
}

/**
 * Analyzes extracted text elements and generates intelligent variable binding suggestions.
 * All suggestions require explicit user confirmation before being applied.
 */
export function suggestCertificateVariables(elements: CanvasElement[]): VariableSuggestion[] {
  const suggestions: VariableSuggestion[] = [];

  const textElements = elements.filter((e) => e.type === "text" && e.text && e.text.trim().length > 0);

  // Heuristic 1: Detect Student / Recipient Name (usually large font, centered, 2-4 words, capitalized)
  const candidateNames = textElements
    .filter((e) => (e.fontSize || 0) >= 26 && e.textAlign === "center")
    .sort((a, b) => (b.fontSize || 0) - (a.fontSize || 0));

  if (candidateNames.length > 0) {
    const primaryName = candidateNames[0];
    const text = primaryName.text || "";
    // Avoid headers like "CERTIFICATE OF ACHIEVEMENT"
    if (!text.toUpperCase().includes("CERTIFICATE") && !text.toUpperCase().includes("DIPLOMA")) {
      suggestions.push({
        elementId: primaryName.id,
        detectedText: text,
        suggestedVariableKey: "student_name",
        suggestedLabel: "Recipient / Student Name",
        confidence: 0.92,
        accepted: true,
      });
    }
  }

  // Heuristic 2: Detect Dates (e.g. "August 15, 2026", "15/08/2026", "2026-08-15")
  const dateRegex = /\b(\d{1,2}(st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[,.\s]+\d{4}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}[,.\s]+\d{4})\b/i;

  for (const el of textElements) {
    const text = el.text || "";
    if (dateRegex.test(text) && !suggestions.some((s) => s.elementId === el.id)) {
      suggestions.push({
        elementId: el.id,
        detectedText: text,
        suggestedVariableKey: "issue_date",
        suggestedLabel: "Certificate Issue Date",
        confidence: 0.88,
        accepted: true,
      });
      break;
    }
  }

  // Heuristic 3: Detect Course / Event Name (often positioned right below name or after "for completing")
  for (const el of textElements) {
    const text = el.text || "";
    if (
      (el.fontSize || 0) >= 18 &&
      (el.fontSize || 0) <= 26 &&
      el.textAlign === "center" &&
      !suggestions.some((s) => s.elementId === el.id) &&
      !text.toUpperCase().includes("CERTIFICATE")
    ) {
      suggestions.push({
        elementId: el.id,
        detectedText: text,
        suggestedVariableKey: "course_name",
        suggestedLabel: "Course / Event Title",
        confidence: 0.84,
        accepted: true,
      });
      break;
    }
  }

  // Heuristic 4: Detect Certificate Verification ID / Code
  const idRegex = /(ID|Code|No|Reg|Cert)[:\s]+([A-Z0-9-]+)/i;
  for (const el of textElements) {
    const text = el.text || "";
    if (idRegex.test(text) && !suggestions.some((s) => s.elementId === el.id)) {
      suggestions.push({
        elementId: el.id,
        detectedText: text,
        suggestedVariableKey: "certificate_id",
        suggestedLabel: "Certificate Verification Code",
        confidence: 0.95,
        accepted: true,
      });
      break;
    }
  }

  return suggestions;
}
