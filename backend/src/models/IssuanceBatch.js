const mongoose = require("mongoose");

const IssuanceBatchSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamMember",
      default: null,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    totalCount: {
      type: Number,
      default: 0,
    },
    pendingCount: {
      type: Number,
      default: 0,
    },
    processingCount: {
      type: Number,
      default: 0,
    },
    completedCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed", "partially_failed"],
      default: "queued",
      index: true,
    },
    errors: [
      {
        certificateId: { type: mongoose.Schema.Types.ObjectId, ref: "Certificate" },
        recipientEmail: { type: String, default: "" },
        error: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

module.exports = mongoose.model("IssuanceBatch", IssuanceBatchSchema);
