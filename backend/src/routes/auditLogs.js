const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");
const { protect } = require("../middleware/auth");
const { tenantProtect, restrictToRoles } = require("../middleware/tenantProtect");

router.get("/", protect, tenantProtect, auditController.listAuditLogs);
router.get("/security-status", protect, tenantProtect, auditController.getSecurityStatus);
router.post("/rotate-signing-key", protect, tenantProtect, restrictToRoles("owner", "admin"), auditController.rotateSigningKey);
router.get("/export", protect, tenantProtect, restrictToRoles("owner", "admin"), auditController.exportComplianceReport);

module.exports = router;
