// Pure JS unit test for Designer Adapter Logic

function cleanFontFamily(rawName) {
  if (!rawName) return { fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal" };

  const cleanName = rawName.replace(/^[A-Z]{6}\+/, "").trim();
  const lower = cleanName.toLowerCase();

  const isBold = lower.includes("bold") || lower.includes("black") || lower.includes("heavy") || lower.includes("semibold") || lower.includes("700") || lower.includes("800");
  const isItalic = lower.includes("italic") || lower.includes("oblique");

  let family = cleanName
    .replace(/[-_](Bold|Regular|Italic|Light|Medium|Black|SemiBold|Oblique|Roman|Regular|Book)/gi, "")
    .replace(/(Bold|Regular|Italic|Light|Medium|Black|SemiBold|Oblique|Roman|Regular|Book)/gi, "")
    .replace(/[,\s]+$/g, "")
    .trim();

  if (!family || family.length < 2) {
    family = "Inter";
  }

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

function convertV2ToProofsyLegacy(template) {
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

      const fontWeight = el.fontWeight === "bold" || el.fontWeight === "800" ? "bold" : "normal";
      const textAlign = el.textAlign === "left" || el.textAlign === "right" ? el.textAlign : "center";

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

describe("Proofsy Designer Core Algorithms & Conversion Tests", () => {
  describe("Font Sanitizer & Normalizer", () => {
    it("should strip subset prefixes and detect bold/italic variants", () => {
      const f1 = cleanFontFamily("ABCDE+Cinzel-Bold");
      expect(f1.fontFamily).toBe("Cinzel");
      expect(f1.fontWeight).toBe("bold");
      expect(f1.fontStyle).toBe("normal");

      const f2 = cleanFontFamily("XYZW+PlayfairDisplay-Italic");
      expect(f2.fontFamily).toBe("Playfair Display");
      expect(f2.fontStyle).toBe("italic");

      const f3 = cleanFontFamily("TimesNewRomanPS-BoldMT");
      expect(f3.fontFamily).toBe("Times New Roman");
      expect(f3.fontWeight).toBe("bold");
    });
  });

  describe("Schema v2.0 Adapter Converter", () => {
    it("should correctly convert full Schema v2.0 template into Proofsy Issuer format", () => {
      const v2Template = {
        schemaVersion: "2.0",
        id: "tpl_test_01",
        version: 1,
        name: "Test Certificate Design",
        page: { width: 1056, height: 746, unit: "px", dpi: 300, orientation: "landscape", standardFormat: "A4" },
        background: { type: "image", url: "/storage/templates/elegant-gold.png", opacity: 1.0 },
        elements: [
          {
            id: "el_1",
            type: "variable_text",
            variableKey: "student_name",
            fallbackText: "Student Name",
            x: 528,
            y: 350,
            width: 700,
            height: 50,
            fontSize: 40,
            fontFamily: "Inter",
            fontWeight: "bold",
            color: "#1E293B",
            textAlign: "center",
          },
          {
            id: "el_qr",
            type: "qr_placeholder",
            x: 880,
            y: 580,
            width: 120,
            height: 120,
          },
        ],
        variables: [],
        fonts: [],
        assets: [],
      };

      const converted = convertV2ToProofsyLegacy(v2Template);
      expect(converted.name).toBe("Test Certificate Design");
      expect(converted.backgroundUrl).toBe("/storage/templates/elegant-gold.png");
      expect(converted.textLayers.length).toBe(1);
      expect(converted.textLayers[0].variable).toBe("recipient_name");
      expect(converted.textLayers[0].fontSize).toBe(40);
      expect(converted.qrCode.enabled).toBe(true);
      expect(converted.qrCode.x).toBe(880);
      expect(converted.qrCode.size).toBe(120);
    });
  });
});
