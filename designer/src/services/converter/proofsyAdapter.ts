import { ProofsyTemplate } from "../../types/template";

export interface ProofsyLegacyTemplateFormat {
  name: string;
  backgroundType: "image" | "pdf";
  backgroundUrl: string;
  width: number;
  height: number;
  textLayers: {
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
  }[];
  qrCode: {
    enabled: boolean;
    x: number;
    y: number;
    size: number;
  };
}

/**
 * Converts a Designer Schema v2.0 template into the Proofsy Certificate Issuer format.
 */
export function convertV2ToProofsyLegacy(template: ProofsyTemplate): ProofsyLegacyTemplateFormat {
  const textLayers = template.elements
    .filter((el) => el.type === "text" || el.type === "variable_text")
    .map((el) => {
      let variable = "custom";
      if (el.type === "variable_text" && el.variableKey) {
        if (el.variableKey === "student_name") variable = "recipient_name";
        else if (el.variableKey === "course_name" || el.variableKey === "event_name") variable = "event_name";
        else if (el.variableKey === "issue_date" || el.variableKey === "completion_date") variable = "date";
        else if (el.variableKey === "certificate_id") variable = "verification_code";
        else if (el.variableKey === "organizer_name" || el.variableKey === "department_name") variable = "organizer";
        else if (el.variableKey === "duration") variable = "duration";
        else variable = "custom";
      }

      const fontWeight: "normal" | "bold" = el.fontWeight === "bold" || el.fontWeight === "800" ? "bold" : "normal";
      const textAlign: "left" | "center" | "right" = el.textAlign === "left" || el.textAlign === "right" ? el.textAlign : "center";

      return {
        variable,
        label: el.variableKey || el.text || "Text Layer",
        x: Math.round(el.x),
        y: Math.round(el.y),
        fontSize: el.fontSize || 24,
        fontFamily: el.fontFamily || "Inter",
        fontWeight,
        color: el.color || "#000000",
        textAlign,
        maxWidth: el.maxWidth || null,
        customText: variable === "custom" ? el.text || el.fallbackText || null : null,
      };
    });

  const qrEl = template.elements.find((el) => el.type === "qr_placeholder");

  return {
    name: template.name,
    backgroundType: template.background.type === "pdf" ? "pdf" : "image",
    backgroundUrl: template.background.url || "/storage/templates/classic.png",
    width: template.page.width || 1056,
    height: template.page.height || 746,
    textLayers,
    qrCode: qrEl
      ? {
          enabled: true,
          x: Math.round(qrEl.x),
          y: Math.round(qrEl.y),
          size: Math.round(qrEl.width || 120),
        }
      : {
          enabled: true,
          x: 880,
          y: 580,
          size: 120,
        },
  };
}
