const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const templateController = require("../controllers/templateController");

// Configure multer for template background uploads
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
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

const { protect, protectOptional } = require("../middleware/auth");
const { tenantProtect, restrictToRoles } = require("../middleware/tenantProtect");

router.post("/", protect, tenantProtect, upload.single("background"), templateController.createTemplate);
router.post("/from-image", protectOptional, upload.single("image"), templateController.createFromImage);
router.post("/import", protectOptional, templateController.importTemplate);
router.get("/", protect, tenantProtect, templateController.listTemplates);
router.post("/seed", protect, tenantProtect, restrictToRoles("owner", "admin"), templateController.seedStarterTemplates);
router.get("/:id", protect, tenantProtect, templateController.getTemplate);
router.put("/:id", protect, tenantProtect, upload.single("background"), templateController.updateTemplate);
router.delete("/:id", protect, tenantProtect, templateController.deleteTemplate);

module.exports = router;
