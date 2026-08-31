const mongoose = require("mongoose");

const SigningKeyRegistrySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
    keyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    algorithm: {
      type: String,
      default: "RSA-SHA256",
    },
    keySize: {
      type: Number,
      default: 2048,
    },
    fingerprint: {
      type: String,
      required: true,
      index: true,
    },
    publicKeyPem: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "retired", "compromised"],
      default: "active",
      index: true,
    },
    description: {
      type: String,
      default: "Institution Cryptographic Signing Key",
    },
    activatedAt: {
      type: Date,
      default: Date.now,
    },
    retiredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SigningKeyRegistry", SigningKeyRegistrySchema);
