#!/usr/bin/env node

/**
 * Proofsy CLI — High-Resolution PDF Certificate Generator
 * Usable by AI Agents (Antigravity, Claude Code), Terminal Users, and SSH Remote Automation.
 *
 * Examples:
 *   node proofsy-render.js --template template.json --data '{"recipient_name":"Jane Doe","date":"Aug 15, 2026"}' --out cert.pdf
 *   node proofsy-render.js --template-id tpl_123 --csv recipients.csv --out-dir ./output_pdfs/
 */

const fs = require("fs");
const path = require("path");

function getPdfLib() {
  const possiblePaths = [
    "pdf-lib",
    path.join(__dirname, "../designer/node_modules/pdf-lib"),
    path.join(__dirname, "../backend/node_modules/pdf-lib"),
    "/home/ubuntu/projects/proofsy/designer/node_modules/pdf-lib",
    "/home/ubuntu/projects/proofsy/backend/node_modules/pdf-lib",
  ];
  for (const p of possiblePaths) {
    try {
      return require(p);
    } catch {
      // try next
    }
  }
  return require("pdf-lib");
}

const { PDFDocument, rgb, StandardFonts } = getPdfLib();

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        params[key] = next;
        i++;
      } else {
        params[key] = true;
      }
    }
  }
  return params;
}

async function renderPdf(template, data = {}, outputPath = "certificate.pdf") {
  const doc = await PDFDocument.create();
  const width = template.page?.width || 1056;
  const height = template.page?.height || 746;
  const page = doc.addPage([width, height]);

  // 1. Embed background artwork image if present
  if (template.background?.url && template.background.url.startsWith("data:image/")) {
    try {
      const isPng = template.background.url.startsWith("data:image/png");
      const base64Data = template.background.url.split(",")[1];
      const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const image = isPng ? await doc.embedPng(imageBytes) : await doc.embedJpg(imageBytes);
      page.drawImage(image, { x: 0, y: 0, width, height, opacity: template.background.opacity ?? 1.0 });
    } catch (e) {
      console.warn("[Proofsy CLI] Background image embed notice:", e.message);
    }
  }

  // 2. Embed Standard Fonts
  const fontHelvetica = await doc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontTimes = await doc.embedFont(StandardFonts.TimesRoman);
  const fontTimesBold = await doc.embedFont(StandardFonts.TimesRomanBold);

  const hasBackgroundImg = Boolean(template.background?.url);
  const sortedElements = [...(template.elements || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  // 3. Render Variables & Dynamic Elements
  for (const el of sortedElements) {
    if (el.isHidden) continue;

    // Skip static background labels if artwork is already present
    if (hasBackgroundImg && el.type === "text" && !el.isCustom) continue;

    if (el.type === "text" || el.type === "variable_text") {
      let text = el.text || "";
      if (el.type === "variable_text" && el.variableKey) {
        text = data[el.variableKey] || el.fallbackText || `{{${el.variableKey}}}`;
      }

      if (!text.trim()) continue;

      const fontSize = Math.max(8, Math.round(el.fontSize || 14));
      const isBold = el.fontWeight === "bold" || el.fontWeight === "800";
      const isSerif = (el.fontFamily || "").toLowerCase().includes("cinzel") || (el.fontFamily || "").toLowerCase().includes("times");

      const chosenFont = isSerif ? (isBold ? fontTimesBold : fontTimes) : (isBold ? fontHelveticaBold : fontHelvetica);

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
  const dir = path.dirname(path.resolve(outputPath));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, pdfBytes);
  console.log(`✓ [Proofsy CLI] Successfully generated: ${outputPath} (${pdfBytes.length} bytes)`);
  return outputPath;
}

async function main() {
  const args = parseArgs();

  if (args.help || (!args.template && !args.templateJson && !args.templateId)) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Proofsy CLI — Automated PDF Certificate & Template Engine   ║
╚══════════════════════════════════════════════════════════════╝

Usage:
  proofsy-render --template <path.json> --data '{"key":"value"}' --out <output.pdf>
  proofsy-render --template <path.json> --csv <recipients.csv> --out-dir <output_dir>

Options:
  --template      Path to exported Proofsy template.json file
  --data          JSON string with recipient dynamic variables
  --csv           CSV file for bulk generation
  --out           Output PDF file path (default: certificate.pdf)
  --out-dir       Output directory for bulk CSV batch rendering
  --help          Show this manual
`);
    process.exit(0);
  }

  let template;
  if (args.template) {
    const templateContent = fs.readFileSync(path.resolve(args.template), "utf-8");
    template = JSON.parse(templateContent);
  } else if (args.templateJson) {
    template = JSON.parse(args.templateJson);
  }

  let data = {};
  if (args.data) {
    try {
      data = JSON.parse(args.data);
    } catch {
      try {
        data = JSON.parse(args.data.replace(/'/g, '"'));
      } catch (e) {
        console.warn("[Proofsy CLI] Could not parse --data JSON, using key-value args");
      }
    }
  }

  // Also collect any extra flags passed as variables (e.g. --student_name "Name")
  for (const [k, v] of Object.entries(args)) {
    if (!["template", "templateJson", "data", "csv", "out", "outDir", "help"].includes(k) && typeof v === "string") {
      data[k] = v;
    }
  }

  const output = args.out || "certificate.pdf";
  await renderPdf(template, data, output);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("❌ [Proofsy CLI Error]:", err.message);
    process.exit(1);
  });
}

module.exports = { renderPdf };
