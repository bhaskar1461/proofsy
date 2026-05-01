const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const QRCode = require("qrcode");
const Certificate = require("../models/Certificate");
const User = require("../models/User");
const Event = require("../models/Event");

const TEMPLATES_DIR = path.join(__dirname, "../templates");
const PDF_DIR = path.join(__dirname, "../../storage/pdfs");
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "http://localhost:3000";

// Valid template IDs
const VALID_TEMPLATES = ["classic", "modern", "elegant", "corporate", "academic", "creative"];

if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

/**
 * Load and inject data into the selected template.
 */
async function buildHTML(templateId, data) {
  const id = VALID_TEMPLATES.includes(templateId) ? templateId : "modern";
  const templatePath = path.join(TEMPLATES_DIR, `${id}.html`);

  // Fallback to modern if template file doesn't exist
  let html;
  if (fs.existsSync(templatePath)) {
    html = fs.readFileSync(templatePath, "utf-8");
  } else {
    html = fs.readFileSync(path.join(TEMPLATES_DIR, "modern.html"), "utf-8");
  }

  const dateStr = new Date(data.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const durationStr = data.duration ? `Duration: ${data.duration}` : "";
  const verificationUrl = `${FRONTEND_BASE_URL}/verify?code=${encodeURIComponent(data.verificationCode)}`;
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 180,
    color: {
      dark: "#0F172A",
      light: "#FFFFFF",
    },
  });

  return html
    .replace(/\{\{name\}\}/g, data.name)
    .replace(/\{\{event\}\}/g, data.eventName)
    .replace(/\{\{date\}\}/g, dateStr)
    .replace(/\{\{organizer\}\}/g, data.organizer)
    .replace(/\{\{verificationCode\}\}/g, data.verificationCode)
    .replace(/\{\{duration\}\}/g, durationStr)
    .replace(/\{\{verificationUrl\}\}/g, verificationUrl)
    .replace(/\{\{qrCodeDataUrl\}\}/g, qrCodeDataUrl);
}

/**
 * Renders a single certificate to PDF using Puppeteer.
 */
async function renderCertificatePDF(certificate, user, event) {
  const html = await buildHTML(event.templateId || "modern", {
    name: user.name,
    eventName: event.name,
    date: event.date,
    organizer: event.organizerName,
    verificationCode: certificate.verificationCode,
    duration: event.duration,
  });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.waitForFunction(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 500));

    const pdfFileName = `${certificate.verificationCode}.pdf`;
    const pdfPath = path.join(PDF_DIR, pdfFileName);

    await page.pdf({
      path: pdfPath,
      width: "1056px",
      height: "746px",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return `/storage/pdfs/${pdfFileName}`;
  } finally {
    await browser.close();
  }
}

/**
 * Process all pending certificates for a given event.
 */
async function queueCertificateGeneration(eventId) {
  console.log(`[Worker] Starting certificate generation for event: ${eventId}`);

  const pendingCerts = await Certificate.find({ eventId, status: "pending" });
  console.log(`[Worker] Found ${pendingCerts.length} pending certificates`);

  let success = 0;
  let failed = 0;

  for (const cert of pendingCerts) {
    try {
      const user = await User.findById(cert.userId);
      const event = await Event.findById(cert.eventId);

      if (!user || !event) {
        cert.status = "failed";
        await cert.save();
        failed++;
        continue;
      }

      const pdfUrl = await renderCertificatePDF(cert, user, event);
      cert.pdfUrl = pdfUrl;
      cert.status = "generated";
      await cert.save();

      success++;
      console.log(`[Worker] Generated: ${cert.verificationCode} (template: ${event.templateId || "modern"})`);
    } catch (err) {
      console.error(`[Worker] Failed: ${cert.verificationCode}`, err.message);
      cert.status = "failed";
      await cert.save();
      failed++;
    }
  }

  console.log(`[Worker] Done. Success: ${success}, Failed: ${failed}`);
  return { success, failed };
}

module.exports = { renderCertificatePDF, queueCertificateGeneration };
