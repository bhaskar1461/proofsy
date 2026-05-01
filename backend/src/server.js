require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve generated PDFs
app.use("/storage", express.static(path.join(__dirname, "../storage")));

// Routes
app.use("/api/events", require("./routes/events"));
app.use("/api/certificates", require("./routes/certificates"));
app.use("/api/users", require("./routes/users"));
app.use("/api/verify", require("./routes/verify"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: err.message || "Internal server error" });
});

// Connect to MongoDB and start server
async function startServer() {
  let mongoUri = process.env.MONGODB_URI;

  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB:", mongoUri);
  } catch (err) {
    console.warn("Local MongoDB not available, starting in-memory MongoDB...");
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();
    await mongoose.connect(mongoUri);
    console.log("Connected to in-memory MongoDB:", mongoUri);
  }

  app.listen(PORT, () => {
    console.log(`Proofsy backend running on http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}

module.exports = app;
