const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Organization = require("../src/models/Organization");
const TeamMember = require("../src/models/TeamMember");
const Workspace = require("../src/models/Workspace");
const Event = require("../src/models/Event");
const User = require("../src/models/User");
const Certificate = require("../src/models/Certificate");
const { getSigningProvider } = require("../src/services/signing");

async function seed() {
  // Connect to DB (Use MONGO_URI or in-memory)
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/proofsy";
  await mongoose.connect(mongoUri);
  console.log("Connected to Mongo:", mongoUri);

  // Find or create Org
  let org = await Organization.findOne();
  if (!org) {
    org = await Organization.create({ name: "Demo Institution of Technology" });
  }

  // Find or create TeamMember
  let member = await TeamMember.findOne({ organizationId: org._id });
  if (!member) {
    member = await TeamMember.create({
      organizationId: org._id,
      name: "Admin Coordinator",
      email: "admin@institution.edu",
      password: "Password123!",
      role: "owner"
    });
  }

  // Find or create Workspace
  let workspace = await Workspace.findOne({ organizationId: org._id });
  if (!workspace) {
    workspace = await Workspace.create({
      name: "Main Workspace",
      slug: "main-workspace",
      organizationId: org._id,
      createdBy: member._id,
      credits: 1000
    });
  }

  let event = await Event.findOne({ organizationId: org._id });
  if (!event) {
    event = await Event.create({
      name: "Annual Technical Symposium 2026",
      date: new Date(),
      organizerName: "Faculty of Engineering",
      organizationId: org._id,
      workspaceId: workspace._id,
      templateId: "starter-modern-gold"
    });
  }

  let user = await User.findOne({ email: "bhaskarsharma0109@gmail.com" });
  if (!user) {
    user = await User.create({
      name: "Bhaskar Sharma",
      email: "bhaskarsharma0109@gmail.com"
    });
  }

  // Institutional Signer
  const signingProvider = getSigningProvider();
  await signingProvider.init();

  const verificationCode = "PROOF-MSUAQHG7-XTMT";

  // Create certificate with verified code
  await Certificate.deleteMany({ verificationCode });

  const payloadToSign = `${verificationCode}:${user.name}:${event.name}:${new Date().toISOString().split("T")[0]}`;
  const sigResult = signingProvider.sign(payloadToSign);

  const cert = await Certificate.create({
    userId: user._id,
    eventId: event._id,
    organizationId: org._id,
    workspaceId: workspace._id,
    verificationCode,
    status: "generated",
    pdfUrl: "http://localhost:5000/storage/certificates/sample.pdf",
    pngUrl: "http://localhost:5000/storage/certificates/sample.png",
    cryptographicSignature: sigResult.signature,
    signatureAlgorithm: sigResult.algorithm,
    keyId: sigResult.keyId,
    issuedAt: new Date()
  });

  console.log("==========================================");
  console.log("✓ TEST CERTIFICATE SEEDED SUCCESSFULLY!");
  console.log("Recipient:", user.name);
  console.log("Event:", event.name);
  console.log("Verification Code:", cert.verificationCode);
  console.log("Key ID:", cert.keyId);
  console.log("Status:", cert.status);
  console.log("==========================================");

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
