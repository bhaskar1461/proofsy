const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    merchantTransactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    phonepeTransactionId: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },
    plan: {
      type: String,
      required: true,
    },
    creditsAdded: {
      type: Number,
      required: true,
      min: [0, "Credits added cannot be negative"],
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", TransactionSchema);
