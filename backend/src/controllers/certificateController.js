const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const User = require("../models/User");
const Event = require("../models/Event");
const Certificate = require("../models/Certificate");

// POST /api/certificates/generate
exports.generateCertificates = async (req, res) => {
  try {
    const { eventId } = req.body;
    const file = req.file;

    if (!eventId) {
      return res.status(400).json({ success: false, error: "Missing eventId" });
    }
    if (!file) {
      return res.status(400).json({ success: false, error: "Missing CSV file" });
    }

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    // Parse CSV and collect rows
    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(file.path)
        .pipe(csv())
        .on("data", (row) => {
          if (row.name && row.email) {
            rows.push({
              name: row.name.trim(),
              email: row.email.trim().toLowerCase(),
            });
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    if (rows.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        error: "CSV is empty or missing required columns (name, email).",
      });
    }

    // Process rows: upsert users, create certificates
    const jobId = uuidv4();
    let created = 0;

    for (const row of rows) {
      // Upsert user
      let user = await User.findOne({ email: row.email });
      if (!user) {
        user = await User.create({ name: row.name, email: row.email });
      }

      // Skip if certificate already exists for this user+event
      const existing = await Certificate.findOne({
        userId: user._id,
        eventId: event._id,
      });
      if (existing) continue;

      const verificationCode = `CERT-${uuidv4().slice(0, 8).toUpperCase()}`;

      await Certificate.create({
        userId: user._id,
        eventId: event._id,
        verificationCode,
        status: "pending",
      });

      created++;
    }

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    // Push certificate generation to the background worker via Bull/Redis
    try {
      const Queue = require("bull");
      const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
      const certQueue = new Queue("certificate-generation", REDIS_URL);
      await certQueue.add({ eventId: event._id.toString() });
      console.log(`[API] Queued certificate generation for event ${event._id}`);
    } catch (e) {
      // Redis unavailable — fall back to synchronous generation
      console.warn("[API] Redis queue unavailable, generating synchronously:", e.message);
      const { queueCertificateGeneration } = require("../workers/certificateWorker");
      queueCertificateGeneration(event._id.toString());
    }

    return res.status(202).json({
      success: true,
      message: "Certificate generation job queued successfully.",
      data: {
        jobId,
        totalRowsProcessed: created,
      },
    });
  } catch (err) {
    console.error("generateCertificates error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// GET /api/certificates
exports.listCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .populate("userId")
      .populate("eventId")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: certificates.map((c) => ({
        id: c._id,
        verificationCode: c.verificationCode,
        recipientName: c.userId?.name || "Unknown",
        recipientEmail: c.userId?.email || "Unknown",
        eventName: c.eventId?.name || "Unknown Event",
        eventDate: c.eventId?.date?.toISOString() || null,
        templateId: c.eventId?.templateId || "modern",
        pdfUrl: c.pdfUrl,
        status: c.status,
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

    const certificate = await Certificate.findById(id)
      .populate("userId")
      .populate("eventId");

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: "Certificate not found",
      });
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
        status: certificate.status,
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
    const totalCertificates = await Certificate.countDocuments();
    const generated = await Certificate.countDocuments({ status: "generated" });
    const pending = await Certificate.countDocuments({ status: "pending" });
    const failed = await Certificate.countDocuments({ status: "failed" });
    const totalEvents = await Event.countDocuments();
    const totalUsers = await User.countDocuments();

    // Verification rate = generated / total
    const verificationRate = totalCertificates > 0
      ? Math.round((generated / totalCertificates) * 100)
      : 0;

    // Recent events with certificate counts
    const recentEvents = await Event.find().sort({ createdAt: -1 }).limit(5);
    const recentWithCounts = await Promise.all(
      recentEvents.map(async (event) => {
        const certCount = await Certificate.countDocuments({ eventId: event._id });
        const genCount = await Certificate.countDocuments({ eventId: event._id, status: "generated" });
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

    // Top recipients
    const topRecipients = await Certificate.aggregate([
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

