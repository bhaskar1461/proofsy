const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const AdmZip = require("adm-zip");
const mongoose = require("mongoose");
const User = require("../models/User");
const Event = require("../models/Event");
const Certificate = require("../models/Certificate");
const IssuanceBatch = require("../models/IssuanceBatch");
const { getCertificateQueue } = require("../services/certificateQueue");
const auditService = require("../services/auditService");
const { parseAndValidateRecipientFile } = require("../utils/fileParser");

const MAX_CSV_ROWS = 50000;

/**
 * Generate a tamper-resistant verification code.
 * 16 random bytes (128 bits) encoded as base64url ≈ 22 characters.
 */
function generateVerificationCode() {
  const token = crypto.randomBytes(16).toString("base64url").toUpperCase();
  return `CERT-${token}`;
}

// POST /api/certificates/generate
exports.generateCertificates = async (req, res) => {
  const file = req.file;

  try {
    const { eventId } = req.body;
    const idempotencyKey = (req.body.idempotencyKey || req.headers["x-idempotency-key"] || "").trim() || null;

    if (!eventId) {
      return res.status(400).json({ success: false, error: "Missing eventId" });
    }
    if (!file) {
      return res.status(400).json({ success: false, error: "Missing CSV file" });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, error: "Invalid eventId" });
    }

    // Check Idempotency: If a batch with this key already exists for this workspace, return it
    if (idempotencyKey) {
      const existingBatch = await IssuanceBatch.findOne({
        idempotencyKey,
        workspaceId: req.workspaceId,
      });
      if (existingBatch) {
        return res.status(200).json({
          success: true,
          message: "Existing issuance batch returned (idempotent request).",
          data: {
            jobId: existingBatch._id.toString(),
            batchId: existingBatch._id.toString(),
            totalRowsProcessed: existingBatch.totalCount,
            status: existingBatch.status,
            isExistingBatch: true,
          },
        });
      }
    }

    // Verify event exists AND belongs to the caller's workspace.
    const event = await Event.findOne({ _id: eventId, workspaceId: req.workspaceId });
    if (!event) {
      return res.status(404).json({ success: false, error: "Event not found or unauthorized" });
    }

    // Parse and validate uploaded CSV or XLSX file
    let parsedResult;
    try {
      parsedResult = await parseAndValidateRecipientFile(file.path, file.originalname);
    } catch (parseErr) {
      return res.status(400).json({ success: false, error: parseErr.message });
    }

    const { validRows, errors, totalRows } = parsedResult;

    if (validRows.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Validation failed: No valid recipient rows found in file.",
        errors,
        totalRows,
      });
    }

    // Deduplicate valid rows by email in-memory
    const uniqueRowsMap = new Map();
    for (const row of validRows) {
      if (!uniqueRowsMap.has(row.email)) {
        uniqueRowsMap.set(row.email, row.name);
      }
    }

    const uniqueEmails = Array.from(uniqueRowsMap.keys());

    // 1. Bulk find existing users
    const existingUsers = await User.find({ email: { $in: uniqueEmails } }).lean();
    const existingUserMap = new Map();
    for (const user of existingUsers) {
      existingUserMap.set(user.email, user._id);
    }

    // 2. Identify missing users and perform a single bulk insert
    const missingUsers = [];
    for (const email of uniqueEmails) {
      if (!existingUserMap.has(email)) {
        missingUsers.push({ email, name: uniqueRowsMap.get(email) });
      }
    }

    if (missingUsers.length > 0) {
      const insertedUsers = await User.insertMany(missingUsers, { ordered: false });
      for (const user of insertedUsers) {
        existingUserMap.set(user.email, user._id);
      }
    }

    // 3. Collect all user IDs associated with the event
    const allUserIds = Array.from(existingUserMap.values());

    // 4. Bulk find existing certificates for these users & event
    const existingCerts = await Certificate.find({
      userId: { $in: allUserIds },
      eventId: event._id
    }).lean();

    const existingCertSet = new Set();
    for (const cert of existingCerts) {
      existingCertSet.add(cert.userId.toString());
    }

    // 5. Create IssuanceBatch entity for tracking
    const pendingCertCandidates = [];
    for (const userId of allUserIds) {
      if (!existingCertSet.has(userId.toString())) {
        pendingCertCandidates.push(userId);
      }
    }

    if (pendingCertCandidates.length > 0) {
      const workspace = req.workspace;
      if (workspace && workspace.plan !== "annual-pass" && workspace.credits < pendingCertCandidates.length) {
        return res.status(402).json({
          success: false,
          error: `Insufficient credits. This operation requires ${pendingCertCandidates.length} credits, but your workspace only has ${workspace.credits} credits remaining. Please upgrade your plan.`
        });
      }
    }

    const batch = await IssuanceBatch.create({
      workspaceId: event.workspaceId,
      organizationId: event.organizationId,
      eventId: event._id,
      createdBy: req.member?._id || null,
      idempotencyKey: idempotencyKey || undefined,
      totalCount: pendingCertCandidates.length,
      pendingCount: pendingCertCandidates.length,
      status: pendingCertCandidates.length > 0 ? "queued" : "completed",
      startedAt: new Date(),
    });

    const newCertificates = [];
    for (const userId of pendingCertCandidates) {
      newCertificates.push({
        userId: userId,
        eventId: event._id,
        organizationId: event.organizationId,
        workspaceId: event.workspaceId,
        batchId: batch._id,
        verificationCode: generateVerificationCode(),
        status: "pending",
        signingProvider: "institution",
      });
    }

    let created = 0;

    if (newCertificates.length > 0) {
      try {
        const insertedCerts = await Certificate.insertMany(newCertificates, { ordered: false });
        created = insertedCerts.length;
      } catch (insertErr) {
        created = insertErr.result?.insertedCount ?? insertErr.insertedDocs?.length ?? 0;
        if (created === 0) throw insertErr;
      }

      // Deduct credits from workspace
      const workspace = req.workspace;
      if (workspace && workspace.plan !== "annual-pass") {
        workspace.credits = Math.max(0, workspace.credits - created);
        await workspace.save();
      }
    }

    // Push certificate generation to the background worker via Bull queue
    const certQueue = getCertificateQueue();
    const jobPayload = { eventId: event._id.toString(), batchId: batch._id.toString() };

    if (certQueue) {
      try {
        await certQueue.add(jobPayload);
        console.log(`[API] Queued certificate generation for event ${event._id} (Batch: ${batch._id})`);
      } catch (e) {
        console.warn("[API] Redis queue unavailable, generating synchronously:", e.message);
        const { queueCertificateGeneration } = require("../workers/certificateWorker");
        queueCertificateGeneration(event._id.toString(), batch._id.toString());
      }
    } else {
      const { queueCertificateGeneration } = require("../workers/certificateWorker");
      queueCertificateGeneration(event._id.toString(), batch._id.toString());
    }

    if (created > 0) {
      await auditService.logAction(
        req,
        "certificate_issued",
        event._id,
        "Event",
        `Issued ${created} certificates in bulk for event "${event.name}" via CSV upload (Batch: ${batch._id})`
      );
    }

    return res.status(202).json({
      success: true,
      message: "Certificate generation job queued successfully.",
      data: {
        jobId: batch._id.toString(),
        batchId: batch._id.toString(),
        totalRowsProcessed: created,
        totalRowsInFile: totalRows,
        errorCount: errors.length,
        errors: errors.slice(0, 50),
        status: batch.status,
      },
    });
  } catch (err) {
    console.error("generateCertificates error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  } finally {
    if (file?.path && fs.existsSync(file.path)) {
      try { fs.unlinkSync(file.path); } catch { /* ignore cleanup errors */ }
    }
  }
};

// GET /api/certificates/batch/:batchId
exports.getBatchStatus = async (req, res) => {
  try {
    const { batchId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(batchId)) {
      return res.status(400).json({ success: false, error: "Invalid batchId format" });
    }

    const batch = await IssuanceBatch.findOne({
      _id: batchId,
      workspaceId: req.workspaceId,
    });

    if (!batch) {
      return res.status(404).json({ success: false, error: "Issuance batch not found or unauthorized" });
    }

    return res.json({
      success: true,
      data: {
        id: batch._id,
        eventId: batch.eventId,
        status: batch.status,
        totalCount: batch.totalCount,
        pendingCount: batch.pendingCount,
        processingCount: batch.processingCount,
        completedCount: batch.completedCount,
        failedCount: batch.failedCount,
        errors: batch.errors,
        startedAt: batch.startedAt ? batch.startedAt.toISOString() : null,
        completedAt: batch.completedAt ? batch.completedAt.toISOString() : null,
        createdAt: batch.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("getBatchStatus error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// GET /api/certificates?limit=&offset=
exports.listCertificates = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const filter = { workspaceId: req.workspaceId };

    const [total, certificates] = await Promise.all([
      Certificate.countDocuments(filter),
      Certificate.find(filter)
        .populate("userId")
        .populate("eventId")
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit),
    ]);

    return res.json({
      success: true,
      pagination: { total, limit, offset },
      data: certificates.map((c) => ({
        id: c._id,
        verificationCode: c.verificationCode,
        recipientName: c.userId?.name || "Unknown",
        recipientEmail: c.userId?.email || "Unknown",
        eventId: c.eventId?._id || c.eventId || null,
        eventName: c.eventId?.name || "Unknown Event",
        eventDate: c.eventId?.date?.toISOString() || null,
        templateId: c.eventId?.templateId || "modern",
        pdfUrl: c.pdfUrl,
        pngUrl: c.pngUrl || null,
        svgUrl: c.svgUrl || null,
        status: c.status,
        signingKeyId: c.signingKeyId || null,
        signingProvider: c.signingProvider || "institution",
        signatureAlgorithm: c.signatureAlgorithm || "RSA-SHA256",
        signedAt: c.signedAt ? c.signedAt.toISOString() : (c.createdAt ? c.createdAt.toISOString() : null),
        expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
        revokedAt: c.revokedAt ? c.revokedAt.toISOString() : null,
        revocationReason: c.revocationReason || "",
        suspendedAt: c.suspendedAt ? c.suspendedAt.toISOString() : null,
        issuedAt: c.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("listCertificates error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// GET /api/certificates/:id
exports.getCertificateById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid certificate id",
      });
    }

    const certificate = await Certificate.findOne({ _id: id, workspaceId: req.workspaceId })
      .populate("userId")
      .populate("eventId");

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: "Certificate not found or unauthorized",
      });
    }

    // On-demand PNG & SVG retrofit for legacy certificates
    if (certificate.status === "generated" && (!certificate.pngUrl || !certificate.svgUrl)) {
      try {
        const Template = require("../models/Template");
        const { generatePremiumPNG, generatePremiumSVG } = require("../workers/certificateWorker");

        const event = certificate.eventId;
        let template;
        if (typeof event.templateId === "string" && !event.templateId.match(/^[0-9a-fA-F]{24}$/)) {
          template = await Template.findOne({ name: { $regex: new RegExp(event.templateId, "i") }, isStarter: true });
          if (!template) {
            template = await Template.findOne();
          }
        } else {
          template = await Template.findById(event.templateId);
        }

        if (template) {
          let themeColor = "#2563eb";
          if (template.textLayers && template.textLayers.length > 0) {
            const accentLayer = template.textLayers.find(l => l.variable === "recipient_name") || template.textLayers[0];
            if (accentLayer && accentLayer.color) {
              themeColor = accentLayer.color;
            }
          }

          if (!certificate.pngUrl) {
            certificate.pngUrl = await generatePremiumPNG(template, certificate.userId, event, certificate, themeColor);
          }
          if (!certificate.svgUrl) {
            certificate.svgUrl = await generatePremiumSVG(template, certificate.userId, event, certificate, themeColor);
          }
          await certificate.save();
        }
      } catch (genErr) {
        console.error("[API] Failed to dynamically generate missing PNG/SVG for legacy certificate:", genErr);
      }
    }

    return res.json({
      success: true,
      data: {
        id: certificate._id,
        verificationCode: certificate.verificationCode,
        recipientName: certificate.userId?.name || "Unknown",
        recipientEmail: certificate.userId?.email || "Unknown",
        eventName: certificate.eventId?.name || "Unknown Event",
        eventDate: certificate.eventId?.date?.toISOString() || null,
        organizerName: certificate.eventId?.organizerName || "Unknown Organizer",
        templateId: certificate.eventId?.templateId || "modern",
        pdfUrl: certificate.pdfUrl,
        pngUrl: certificate.pngUrl || null,
        svgUrl: certificate.svgUrl || null,
        status: certificate.status,
        signingKeyId: certificate.signingKeyId || null,
        signingProvider: certificate.signingProvider || "institution",
        signatureAlgorithm: certificate.signatureAlgorithm || "RSA-SHA256",
        signedAt: certificate.signedAt ? certificate.signedAt.toISOString() : (certificate.createdAt ? certificate.createdAt.toISOString() : null),
        expiresAt: certificate.expiresAt ? certificate.expiresAt.toISOString() : null,
        revokedAt: certificate.revokedAt ? certificate.revokedAt.toISOString() : null,
        revocationReason: certificate.revocationReason || "",
        suspendedAt: certificate.suspendedAt ? certificate.suspendedAt.toISOString() : null,
        renewedFrom: certificate.renewedFrom || null,
        attemptsCount: certificate.attemptsCount,
        errorLog: certificate.errorLog,
        cryptographicSignature: certificate.cryptographicSignature || null,
        issuedAt: certificate.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("getCertificateById error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// POST /api/certificates/send-emails
exports.sendEmails = async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, error: "Missing eventId" });
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, error: "Invalid eventId" });
    }

    const event = await Event.findOne({ _id: eventId, workspaceId: req.workspaceId });
    if (!event) {
      return res.status(404).json({ success: false, error: "Event not found or unauthorized" });
    }

    const { sendEventEmails } = require("../services/emailService");
    const result = await sendEventEmails(eventId);

    return res.json({
      success: true,
      message: `Emails sent: ${result.sent}, failed: ${result.failed}`,
      data: result,
    });
  } catch (err) {
    console.error("sendEmails error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// GET /api/certificates/stats
exports.getStats = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const certFilter = { workspaceId };
    const eventFilter = { workspaceId };

    const [
      totalCertificates,
      generated,
      pending,
      failed,
      revoked,
      expired,
      suspended,
      totalEvents,
      uniqueRecipients,
      recentEvents
    ] = await Promise.all([
      Certificate.countDocuments(certFilter),
      Certificate.countDocuments({ ...certFilter, status: "generated" }),
      Certificate.countDocuments({ ...certFilter, status: "pending" }),
      Certificate.countDocuments({ ...certFilter, status: "failed" }),
      Certificate.countDocuments({ ...certFilter, status: "revoked" }),
      Certificate.countDocuments({ ...certFilter, status: "expired" }),
      Certificate.countDocuments({ ...certFilter, status: "suspended" }),
      Event.countDocuments(eventFilter),
      Certificate.distinct("userId", certFilter),
      Event.find(eventFilter).sort({ createdAt: -1 }).limit(5).lean()
    ]);

    const totalUsers = uniqueRecipients.length;

    const verificationRate = totalCertificates > 0
      ? Math.round((generated / totalCertificates) * 100)
      : 0;

    const recentWithCounts = await Promise.all(
      recentEvents.map(async (event) => {
        const [certCount, genCount] = await Promise.all([
          Certificate.countDocuments({ eventId: event._id }),
          Certificate.countDocuments({ eventId: event._id, status: "generated" })
        ]);
        
        return {
          id: event._id,
          name: event.name,
          date: event.date.toISOString(),
          organizerName: event.organizerName,
          totalCertificates: certCount,
          generatedCertificates: genCount,
          createdAt: event.createdAt.toISOString(),
        };
      })
    );

    const topRecipients = await Certificate.aggregate([
      { $match: { workspaceId: new mongoose.Types.ObjectId(workspaceId) } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          name: "$user.name",
          email: "$user.email",
          certificateCount: "$count",
        },
      },
    ]);

    return res.json({
      success: true,
      data: {
        totalCertificates,
        generated,
        pending,
        failed,
        revoked,
        expired,
        suspended,
        totalEvents,
        totalUsers,
        verificationRate,
        recentEvents: recentWithCounts,
        topRecipients,
      },
    });
  } catch (err) {
    console.error("getStats error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// POST /api/certificates/:id/retry
exports.retryCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid certificate id" });
    }

    const certificate = await Certificate.findOne({ _id: id, workspaceId: req.workspaceId });
    if (!certificate) {
      return res.status(404).json({ success: false, error: "Certificate not found or unauthorized" });
    }

    certificate.status = "pending";
    certificate.errorLog = "";
    certificate.attemptsCount = 0;
    await certificate.save();

    const certQueue = getCertificateQueue();
    if (certQueue) {
      try {
        await certQueue.add({ eventId: certificate.eventId.toString() });
        console.log(`[API] Re-queued certificate generation for event ${certificate.eventId}`);
      } catch (e) {
        console.warn("[API] Redis queue unavailable, generating synchronously:", e.message);
        const { queueCertificateGeneration } = require("../workers/certificateWorker");
        queueCertificateGeneration(certificate.eventId.toString());
      }
    } else {
      const { queueCertificateGeneration } = require("../workers/certificateWorker");
      queueCertificateGeneration(certificate.eventId.toString());
    }

    await auditService.logAction(
      req,
      "certificate_issued",
      certificate._id,
      "Certificate",
      `Triggered generation retry for certificate "${certificate.verificationCode}"`
    );

    return res.json({
      success: true,
      message: "Certificate generation re-queued successfully.",
      data: {
        id: certificate._id,
        status: certificate.status,
        attemptsCount: certificate.attemptsCount,
      },
    });
  } catch (err) {
    console.error("retryCertificate error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// GET /api/certificates/verification-analytics
exports.getVerificationAnalytics = async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const VerificationAudit = require("../models/VerificationAudit");

    const matchStage = { $match: { workspaceId: new mongoose.Types.ObjectId(workspaceId) } };

    const totalVerifications = await VerificationAudit.countDocuments({ workspaceId });

    const referralGroup = await VerificationAudit.aggregate([
      matchStage,
      { $group: { _id: "$referralSource", count: { $sum: 1 } } }
    ]);
    const referrals = { linkedin: 0, twitter: 0, qr: 0, direct: 0, offline: 0 };
    referralGroup.forEach((rg) => {
      if (rg._id in referrals) {
        referrals[rg._id] = rg.count;
      }
    });

    const deviceGroup = await VerificationAudit.aggregate([
      matchStage,
      { $group: { _id: "$deviceType", count: { $sum: 1 } } }
    ]);
    const devices = { desktop: 0, mobile: 0, tablet: 0 };
    deviceGroup.forEach((dg) => {
      if (dg._id in devices) {
        devices[dg._id] = dg.count;
      }
    });

    const osGroup = await VerificationAudit.aggregate([
      matchStage,
      { $group: { _id: "$os", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const timelineGroup = await VerificationAudit.aggregate([
      {
        $match: {
          workspaceId: new mongoose.Types.ObjectId(workspaceId),
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const timelineMap = new Map();
    timelineGroup.forEach((t) => timelineMap.set(t._id, t.count));

    const timeline = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      
      const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
      timeline.push({
        date: dateStr,
        label: monthFormatter.format(date),
        count: timelineMap.get(dateStr) || 0
      });
    }

    const recentAudits = await VerificationAudit.find({ workspaceId })
      .populate({
        path: "certificateId",
        populate: [
          { path: "userId", select: "name email" },
          { path: "eventId", select: "name" }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const formattedAudits = recentAudits.map((audit) => ({
      id: audit._id,
      verificationCode: audit.certificateId?.verificationCode || "Unknown",
      recipientName: audit.certificateId?.userId?.name || "Unknown",
      eventName: audit.certificateId?.eventId?.name || "Unknown Event",
      referralSource: audit.referralSource,
      browser: audit.browser,
      os: audit.os,
      deviceType: audit.deviceType,
      timestamp: audit.createdAt.toISOString()
    }));

    return res.json({
      success: true,
      data: {
        totalVerifications,
        referrals,
        devices,
        osBreakdown: osGroup.map((o) => ({ name: o._id, count: o.count })),
        timeline,
        recentAudits: formattedAudits
      }
    });
  } catch (err) {
    console.error("getVerificationAnalytics error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// GET /api/events/:id/download-zip
// GET /api/certificates/event/:id/download-zip
exports.downloadEventCertificatesZip = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid event ID" });
    }

    const event = await Event.findOne({ _id: id, workspaceId: req.workspaceId });
    if (!event) {
      return res.status(404).json({ success: false, error: "Event not found or unauthorized" });
    }

    const certificates = await Certificate.find({
      eventId: id,
      workspaceId: req.workspaceId,
      status: "generated",
    }).populate("userId", "name email");

    if (!certificates || certificates.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No generated certificates available to download for this event.",
      });
    }

    const safeEventName = (event.name || "certificates").replace(/[^a-zA-Z0-9_-]/g, "_");
    const zip = new AdmZip();

    for (const cert of certificates) {
      if (!cert.pdfUrl) continue;
      let relativePath = cert.pdfUrl.replace(/^\/storage\//, "storage/");
      let fullPath = path.resolve(__dirname, "../../", relativePath);

      if (fs.existsSync(fullPath)) {
        const recipientName = (cert.userId?.name || "recipient").replace(/[^a-zA-Z0-9_-]/g, "_");
        const zipEntryName = `${cert.verificationCode}_${recipientName}.pdf`;
        zip.addLocalFile(fullPath, "", zipEntryName);
      }
    }

    const zipBuffer = zip.toBuffer();
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="proofsy_${safeEventName}_certificates.zip"`);
    res.setHeader("Content-Length", zipBuffer.length);
    return res.end(zipBuffer);
  } catch (err) {
    console.error("downloadEventCertificatesZip error:", err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
};
