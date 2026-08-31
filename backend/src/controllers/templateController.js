const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Template = require("../models/Template");
const auditService = require("../services/auditService");

const TEMPLATES_DIR = path.join(__dirname, "../../storage/templates");

// Ensure templates directory exists
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

// Helper to move files across device boundaries (essential for Docker volumes)
const safeMove = (src, dest) => {
  try {
    fs.renameSync(src, dest);
  } catch (err) {
    if (err.code === "EXDEV") {
      fs.copyFileSync(src, dest);
      fs.unlinkSync(src);
    } else {
      throw err;
    }
  }
};

// POST /api/templates — Create a new template
exports.createTemplate = async (req, res) => {
  try {
    const { name, width, height, textLayers, qrCode } = req.body;
    const file = req.file;

    if (!name) {
      return res.status(400).json({ success: false, error: "Missing template name" });
    }
    if (!file) {
      return res.status(400).json({ success: false, error: "Missing background file" });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const backgroundType = ext === ".pdf" ? "pdf" : "image";
    const fileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const destPath = path.join(TEMPLATES_DIR, fileName);

    // Move file from uploads to templates storage
    safeMove(file.path, destPath);

    const template = await Template.create({
      name,
      backgroundType,
      backgroundUrl: `/storage/templates/${fileName}`,
      width: parseInt(width) || 1056,
      height: parseInt(height) || 746,
      textLayers: textLayers ? JSON.parse(textLayers) : [],
      qrCode: qrCode ? JSON.parse(qrCode) : undefined,
      organizationId: req.organizationId,
      workspaceId: req.workspaceId,
    });

    await auditService.logAction(req, "template_created", template._id, "Template", `Created event template "${template.name}"`);

    return res.status(201).json({
      success: true,
      data: template,
    });
  } catch (err) {
    console.error("createTemplate error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// POST /api/templates/import — Ingest a template exported from Proofsy Template Studio (Schema v2.0)
exports.importTemplate = async (req, res) => {
  try {
    let payload = req.body.templateJson ? (typeof req.body.templateJson === "string" ? JSON.parse(req.body.templateJson) : req.body.templateJson) : req.body;

    if (!payload || !payload.name) {
      return res.status(400).json({ success: false, error: "Invalid template payload: 'name' is required" });
    }

    let backgroundUrl = payload.background?.url || "/storage/templates/elegant-gold.png";
    let backgroundType = payload.background?.type === "pdf" ? "pdf" : "image";
    let width = payload.page?.width || payload.width || 1056;
    let height = payload.page?.height || payload.height || 746;
    let textLayers = [];
    let qrCode = { enabled: true, x: 880, y: 580, size: 120 };

    // If a background data URL is provided, write it to file storage
    if (payload.background?.url && payload.background.url.startsWith("data:image/")) {
      const matches = payload.background.url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const ext = matches[1].includes("jpeg") || matches[1].includes("jpg") ? ".jpg" : ".png";
        const fileName = `import-bg-${Date.now()}${ext}`;
        const filePath = path.join(TEMPLATES_DIR, fileName);
        fs.writeFileSync(filePath, Buffer.from(matches[2], "base64"));
        backgroundUrl = `/storage/templates/${fileName}`;
      }
    }

    const hasBg = Boolean(payload.background?.url);

    // Convert Schema v2.0 elements
    if (payload.schemaVersion === "2.0" && Array.isArray(payload.elements)) {
      textLayers = payload.elements
        .filter((el) => {
          if (el.isHidden) return false;
          return el.type === "text" || el.type === "variable_text";
        })
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

      const qrEl = payload.elements.find((el) => el.type === "qr_placeholder");
      if (qrEl) {
        qrCode = {
          enabled: true,
          x: Math.round(qrEl.x),
          y: Math.round(qrEl.y),
          size: Math.round(qrEl.width || 120),
        };
      }
    } else if (Array.isArray(payload.textLayers)) {
      textLayers = payload.textLayers;
      if (payload.qrCode) qrCode = payload.qrCode;
    }

    // Resolve Organization and Workspace Context dynamically
    const Organization = require("../models/Organization");
    const Workspace = require("../models/Workspace");

    let organizationId = req.organizationId;
    let workspaceId = req.workspaceId;

    if (!organizationId) {
      const defaultOrg = await Organization.findOne();
      if (defaultOrg) organizationId = defaultOrg._id;
    }
    if (!workspaceId) {
      const defaultWs = await Workspace.findOne(organizationId ? { organizationId } : {});
      if (defaultWs) workspaceId = defaultWs._id;
    }

    const template = await Template.create({
      name: payload.name,
      backgroundType,
      backgroundUrl,
      width,
      height,
      textLayers,
      qrCode,
      organizationId,
      workspaceId,
    });

    try {
      await auditService.logAction(req, "template_created", template._id, "Template", `Imported template "${template.name}" from Template Studio`);
    } catch {
      // Ignore audit error if unauthenticated
    }

    return res.status(201).json({
      success: true,
      data: template,
    });
  } catch (err) {
    console.error("importTemplate error:", err);
    return res.status(500).json({ success: false, error: "Internal server error: " + err.message });
  }
};

// GET /api/templates — List all templates
exports.listTemplates = async (req, res) => {
  try {
    const templates = await Template.find({
      $or: [{ workspaceId: req.workspaceId }, { isStarter: true }],
    })
      .sort({ isStarter: -1, createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: templates.map((t) => ({
        id: t._id,
        name: t.name,
        backgroundType: t.backgroundType,
        backgroundUrl: t.backgroundUrl,
        width: t.width,
        height: t.height,
        textLayerCount: t.textLayers?.length || 0,
        isStarter: t.isStarter,
        qrCode: t.qrCode,
        createdAt: t.createdAt,
      })),
    });
  } catch (err) {
    console.error("listTemplates error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// GET /api/templates/:id — Get a single template with full text layers
exports.getTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid template id" });
    }

    const template = await Template.findOne({
      _id: id,
      $or: [{ workspaceId: req.workspaceId }, { isStarter: true }],
    });
    if (!template) {
      return res.status(404).json({ success: false, error: "Template not found or unauthorized" });
    }

    return res.json({
      success: true,
      data: template,
    });
  } catch (err) {
    console.error("getTemplate error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// PUT /api/templates/:id — Update template (text layers, name, qrCode)
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, textLayers, qrCode, width, height } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid template id" });
    }

    const template = await Template.findOne({
      _id: id,
      $or: [{ workspaceId: req.workspaceId }, { isStarter: true }],
    });
    if (!template) {
      return res.status(404).json({ success: false, error: "Template not found or unauthorized" });
    }

    if (name) template.name = name;
    if (textLayers) template.textLayers = textLayers;
    if (qrCode) template.qrCode = qrCode;
    if (width) template.width = width;
    if (height) template.height = height;
    if (req.body.backgroundUrl) template.backgroundUrl = req.body.backgroundUrl;
    if (req.body.backgroundType) template.backgroundType = req.body.backgroundType;

    // If a new background file is uploaded, replace the old one
    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const fileName = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const destPath = path.join(TEMPLATES_DIR, fileName);
      safeMove(req.file.path, destPath);

      // Delete old background
      const oldPath = path.join(__dirname, "../..", template.backgroundUrl);
      if (fs.existsSync(oldPath) && !template.isStarter) {
        fs.unlinkSync(oldPath);
      }

      template.backgroundType = ext === ".pdf" ? "pdf" : "image";
      template.backgroundUrl = `/storage/templates/${fileName}`;
    }

    await template.save();

    await auditService.logAction(req, "template_updated", template._id, "Template", `Updated event template "${template.name}"`);

    return res.json({
      success: true,
      data: template,
    });
  } catch (err) {
    console.error("updateTemplate error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// DELETE /api/templates/:id — Delete a template
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid template id" });
    }

    const template = await Template.findOne({
      _id: id,
      workspaceId: req.workspaceId,
    });
    if (!template) {
      return res.status(404).json({ success: false, error: "Template not found or unauthorized" });
    }

    if (template.isStarter) {
      return res.status(403).json({ success: false, error: "Cannot delete starter templates" });
    }

    // Delete background file
    const bgPath = path.join(__dirname, "../..", template.backgroundUrl);
    if (fs.existsSync(bgPath)) {
      fs.unlinkSync(bgPath);
    }

    await Template.findByIdAndDelete(id);

    await auditService.logAction(req, "template_deleted", id, "Template", `Deleted event template "${template.name}"`);

    return res.json({
      success: true,
      data: { id },
    });
  } catch (err) {
    console.error("deleteTemplate error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// POST /api/templates/seed — Seed starter templates (run once)
exports.seedStarterTemplates = async (req, res) => {
  try {
    const existing = await Template.countDocuments({ isStarter: true });
    if (existing > 0) {
      return res.json({ success: true, message: `${existing} starter templates already exist.` });
    }

    const starters = [
      {
        name: "Elegant Gold",
        backgroundUrl: "/storage/templates/elegant-gold.png",
        textLayers: [
          { variable: "recipient_name", label: "Recipient Name", x: 528, y: 320, fontSize: 42, fontFamily: "Inter", fontWeight: "bold", color: "#1a1a1a", textAlign: "center", maxWidth: 700 },
          { variable: "event_name", label: "Event Name", x: 528, y: 400, fontSize: 22, fontFamily: "Inter", fontWeight: "normal", color: "#555555", textAlign: "center", maxWidth: 600 },
          { variable: "date", label: "Date", x: 528, y: 460, fontSize: 16, fontFamily: "Inter", fontWeight: "normal", color: "#777777", textAlign: "center", maxWidth: 400 },
          { variable: "verification_code", label: "Verification Code", x: 528, y: 650, fontSize: 12, fontFamily: "monospace", fontWeight: "normal", color: "#999999", textAlign: "center", maxWidth: 300 },
          { variable: "organizer", label: "Organizer", x: 200, y: 580, fontSize: 16, fontFamily: "Inter", fontWeight: "normal", color: "#555555", textAlign: "center", maxWidth: 300 },
        ],
      },
      {
        name: "Modern Blue",
        backgroundUrl: "/storage/templates/modern-blue.png",
        textLayers: [
          { variable: "recipient_name", label: "Recipient Name", x: 528, y: 300, fontSize: 44, fontFamily: "Inter", fontWeight: "bold", color: "#0f172a", textAlign: "center", maxWidth: 700 },
          { variable: "event_name", label: "Event Name", x: 528, y: 380, fontSize: 24, fontFamily: "Inter", fontWeight: "normal", color: "#2563eb", textAlign: "center", maxWidth: 600 },
          { variable: "date", label: "Date", x: 528, y: 440, fontSize: 16, fontFamily: "Inter", fontWeight: "normal", color: "#64748b", textAlign: "center", maxWidth: 400 },
          { variable: "verification_code", label: "Verification Code", x: 528, y: 650, fontSize: 12, fontFamily: "monospace", fontWeight: "normal", color: "#94a3b8", textAlign: "center", maxWidth: 300 },
          { variable: "organizer", label: "Organizer", x: 200, y: 580, fontSize: 16, fontFamily: "Inter", fontWeight: "normal", color: "#475569", textAlign: "center", maxWidth: 300 },
        ],
      },
      {
        name: "Creative Gradient",
        backgroundUrl: "/storage/templates/creative-gradient.png",
        textLayers: [
          { variable: "recipient_name", label: "Recipient Name", x: 528, y: 310, fontSize: 40, fontFamily: "Inter", fontWeight: "bold", color: "#4c1d95", textAlign: "center", maxWidth: 700 },
          { variable: "event_name", label: "Event Name", x: 528, y: 390, fontSize: 22, fontFamily: "Inter", fontWeight: "normal", color: "#7c3aed", textAlign: "center", maxWidth: 600 },
          { variable: "date", label: "Date", x: 528, y: 450, fontSize: 16, fontFamily: "Inter", fontWeight: "normal", color: "#8b5cf6", textAlign: "center", maxWidth: 400 },
          { variable: "verification_code", label: "Verification Code", x: 528, y: 640, fontSize: 12, fontFamily: "monospace", fontWeight: "normal", color: "#a78bfa", textAlign: "center", maxWidth: 300 },
          { variable: "organizer", label: "Organizer", x: 200, y: 570, fontSize: 16, fontFamily: "Inter", fontWeight: "normal", color: "#6d28d9", textAlign: "center", maxWidth: 300 },
        ],
      },
      {
        name: "Dark Premium",
        backgroundUrl: "/storage/templates/dark-premium.png",
        textLayers: [
          { variable: "recipient_name", label: "Recipient Name", x: 528, y: 300, fontSize: 44, fontFamily: "Inter", fontWeight: "bold", color: "#f8fafc", textAlign: "center", maxWidth: 700 },
          { variable: "event_name", label: "Event Name", x: 528, y: 380, fontSize: 24, fontFamily: "Inter", fontWeight: "normal", color: "#cbd5e1", textAlign: "center", maxWidth: 600 },
          { variable: "date", label: "Date", x: 528, y: 440, fontSize: 16, fontFamily: "Inter", fontWeight: "normal", color: "#94a3b8", textAlign: "center", maxWidth: 400 },
          { variable: "verification_code", label: "Verification Code", x: 528, y: 650, fontSize: 12, fontFamily: "monospace", fontWeight: "normal", color: "#64748b", textAlign: "center", maxWidth: 300 },
          { variable: "organizer", label: "Organizer", x: 200, y: 580, fontSize: 16, fontFamily: "Inter", fontWeight: "normal", color: "#94a3b8", textAlign: "center", maxWidth: 300 },
        ],
        qrCode: { enabled: true, x: 880, y: 580, size: 120 },
      },
      {
        name: "Nature Green",
        backgroundUrl: "/storage/templates/nature-green.png",
        textLayers: [
          { variable: "recipient_name", label: "Recipient Name", x: 528, y: 310, fontSize: 42, fontFamily: "Inter", fontWeight: "bold", color: "#14532d", textAlign: "center", maxWidth: 700 },
          { variable: "event_name", label: "Event Name", x: 528, y: 390, fontSize: 22, fontFamily: "Inter", fontWeight: "normal", color: "#166534", textAlign: "center", maxWidth: 600 },
          { variable: "date", label: "Date", x: 528, y: 450, fontSize: 16, fontFamily: "Inter", fontWeight: "normal", color: "#4d7c0f", textAlign: "center", maxWidth: 400 },
          { variable: "verification_code", label: "Verification Code", x: 528, y: 650, fontSize: 12, fontFamily: "monospace", fontWeight: "normal", color: "#65a30d", textAlign: "center", maxWidth: 300 },
          { variable: "organizer", label: "Organizer", x: 200, y: 580, fontSize: 16, fontFamily: "Inter", fontWeight: "normal", color: "#166534", textAlign: "center", maxWidth: 300 },
        ],
      },
      {
        name: "Minimal Mono",
        backgroundUrl: "/storage/templates/minimal-mono.png",
        textLayers: [
          { variable: "recipient_name", label: "Recipient Name", x: 528, y: 300, fontSize: 44, fontFamily: "Inter", fontWeight: "bold", color: "#000000", textAlign: "center", maxWidth: 700 },
          { variable: "event_name", label: "Event Name", x: 528, y: 380, fontSize: 22, fontFamily: "Inter", fontWeight: "normal", color: "#333333", textAlign: "center", maxWidth: 600 },
          { variable: "date", label: "Date", x: 528, y: 440, fontSize: 16, fontFamily: "Inter", fontWeight: "normal", color: "#666666", textAlign: "center", maxWidth: 400 },
          { variable: "verification_code", label: "Verification Code", x: 528, y: 650, fontSize: 12, fontFamily: "monospace", fontWeight: "normal", color: "#888888", textAlign: "center", maxWidth: 300 },
          { variable: "organizer", label: "Organizer", x: 200, y: 580, fontSize: 16, fontFamily: "Inter", fontWeight: "normal", color: "#444444", textAlign: "center", maxWidth: 300 },
        ],
      },
    ];

    const docs = starters.map((s) => ({
      ...s,
      backgroundType: "image",
      width: 1056,
      height: 746,
      isStarter: true,
    }));

    await Template.insertMany(docs);

    return res.status(201).json({
      success: true,
      message: `Seeded ${docs.length} starter templates.`,
    });
  } catch (err) {
    console.error("seedStarterTemplates error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// POST /api/templates/from-image — Convert an uploaded screenshot or pasted clipboard image into a certificate template
exports.createFromImage = async (req, res) => {
  try {
    let file = req.file;
    let base64Data = req.body?.imageData || req.body?.base64;
    let fileName;
    let ext = ".png";

    if (file) {
      ext = path.extname(file.originalname).toLowerCase() || ".png";
      fileName = `cert-img-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const destPath = path.join(TEMPLATES_DIR, fileName);
      safeMove(file.path, destPath);
    } else if (base64Data && typeof base64Data === "string" && base64Data.startsWith("data:image/")) {
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        ext = matches[1].includes("jpeg") || matches[1].includes("jpg") ? ".jpg" : ".png";
        fileName = `cert-paste-${Date.now()}${ext}`;
        const filePath = path.join(TEMPLATES_DIR, fileName);
        fs.writeFileSync(filePath, Buffer.from(matches[2], "base64"));
      } else {
        return res.status(400).json({ success: false, error: "Invalid base64 image data" });
      }
    } else {
      return res.status(400).json({ success: false, error: "No image file or base64 screenshot data provided" });
    }

    const imageFilePath = path.join(TEMPLATES_DIR, fileName);
    let width = 1056;
    let height = 746;

    // Detect actual dimensions using @napi-rs/canvas
    try {
      const { loadImage } = require("@napi-rs/canvas");
      const img = await loadImage(imageFilePath);
      if (img.width && img.height) {
        width = img.width;
        height = img.height;
      }
    } catch (e) {
      console.warn("Could not read image dimensions, defaulting to 1056x746:", e.message);
    }

    const scaleX = width / 1056;
    const scaleY = height / 746;
    const centerX = Math.round(width / 2);

    const templateName = req.body?.name || `Custom Certificate (${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;

    const textLayers = [
      {
        variable: "recipient_name",
        label: "Recipient Name",
        x: centerX,
        y: Math.round(height * 0.44),
        fontSize: Math.max(28, Math.round(38 * scaleY)),
        fontFamily: "Playfair Display",
        fontWeight: "bold",
        color: "#1E293B",
        textAlign: "center",
        maxWidth: Math.round(width * 0.8),
      },
      {
        variable: "event_name",
        label: "Course / Event Name",
        x: centerX,
        y: Math.round(height * 0.58),
        fontSize: Math.max(18, Math.round(22 * scaleY)),
        fontFamily: "Inter",
        fontWeight: "bold",
        color: "#334155",
        textAlign: "center",
        maxWidth: Math.round(width * 0.75),
      },
      {
        variable: "date",
        label: "Issue Date",
        x: Math.round(width * 0.28),
        y: Math.round(height * 0.78),
        fontSize: Math.max(13, Math.round(15 * scaleY)),
        fontFamily: "Inter",
        fontWeight: "normal",
        color: "#475569",
        textAlign: "center",
        maxWidth: null,
      },
      {
        variable: "organizer",
        label: "Authorized Signer",
        x: Math.round(width * 0.72),
        y: Math.round(height * 0.78),
        fontSize: Math.max(13, Math.round(15 * scaleY)),
        fontFamily: "Inter",
        fontWeight: "normal",
        color: "#475569",
        textAlign: "center",
        maxWidth: null,
      },
      {
        variable: "verification_code",
        label: "Verification Code",
        x: centerX,
        y: Math.round(height * 0.88),
        fontSize: Math.max(10, Math.round(11 * scaleY)),
        fontFamily: "monospace",
        fontWeight: "normal",
        color: "#64748B",
        textAlign: "center",
        maxWidth: null,
      },
    ];

    const qrCode = {
      enabled: true,
      x: Math.round(width - (140 * scaleX)),
      y: Math.round(height - (140 * scaleY)),
      size: Math.round(100 * Math.min(scaleX, scaleY)),
    };

    const template = await Template.create({
      name: templateName,
      backgroundType: ext === ".pdf" ? "pdf" : "image",
      backgroundUrl: `/storage/templates/${fileName}`,
      width,
      height,
      textLayers,
      qrCode,
      organizationId: req.organizationId,
      workspaceId: req.workspaceId,
      isStarter: false,
    });

    try {
      await auditService.logAction(req, "template_created", template._id, "Template", `Created template "${template.name}" from image screenshot`);
    } catch { /* ignore audit error if unauthed */ }

    return res.status(201).json({
      success: true,
      message: `Successfully created certificate template "${template.name}" from screenshot.`,
      data: template,
    });
  } catch (err) {
    console.error("createFromImage error:", err);
    return res.status(500).json({ success: false, error: "Internal server error: " + err.message });
  }
};
