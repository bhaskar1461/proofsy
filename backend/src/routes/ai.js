const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { protect, protectOptional } = require("../middleware/auth");
const { tenantProtect } = require("../middleware/tenantProtect");
const aiService = require("../services/aiService");
const templateController = require("../controllers/templateController");

const upload = multer({
  dest: path.join(__dirname, "../../uploads/"),
  fileFilter: (req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".webp", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPG, WebP, and PDF files are allowed"), false);
    }
  },
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

/**
 * POST /api/ai/upload-image
 * Convert an uploaded screenshot or image into a certificate template.
 */
router.post("/upload-image", protectOptional, upload.single("image"), templateController.createFromImage);

/**
 * POST /api/ai/chat
 * Process an AI chat message with conversation history.
 * Body: { messages: [{ role: "user"|"assistant", content: string }] }
 */
router.post("/chat", protect, tenantProtect, async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Messages array is required",
      });
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return res.status(400).json({
          success: false,
          error: "Each message must have a role and content",
        });
      }
      if (!["user", "assistant", "system"].includes(msg.role)) {
        return res.status(400).json({
          success: false,
          error: "Invalid message role. Must be user, assistant, or system",
        });
      }
    }

    // Limit conversation history to prevent token overflow
    const trimmedMessages = messages.slice(-20).map((m) => ({
      role: m.role,
      content: String(m.content).slice(0, 4000),
    }));

    const result = await aiService.chat(trimmedMessages, req.workspaceId, req.member?._id || req.user?._id);

    return res.json({
      success: true,
      data: {
        content: result.content,
        toolExecutions: result.toolExecutions || [],
      },
    });
  } catch (err) {
    console.error("[AI Route] Chat error:", err);
    
    if (err.message?.includes("GROQ_API_KEY")) {
      return res.status(503).json({
        success: false,
        error: "AI service is not configured. Please add a GROQ_API_KEY to your environment.",
      });
    }

    return res.status(500).json({
      success: false,
      error: "AI service error: " + (err.message || "Unknown error"),
    });
  }
});

module.exports = router;
