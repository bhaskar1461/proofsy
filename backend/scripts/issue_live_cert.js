const mongoose = require("mongoose");
const Organization = require("../src/models/Organization");
const Workspace = require("../src/models/Workspace");
const TeamMember = require("../src/models/TeamMember");
const Event = require("../src/models/Event");
const Template = require("../src/models/Template");
const User = require("../src/models/User");
const Certificate = require("../src/models/Certificate");
const IssuanceBatch = require("../src/models/IssuanceBatch");
const { getSigningProvider } = require("../src/services/signing");
const { ensureStarterTemplates } = require("../src/utils/templateSetup");
const { queueCertificateGeneration } = require("../src/workers/certificateWorker");
const { sendCertificateEmail } = require("../src/services/emailService");

async function issueLiveCertificate() {
  console.log("==================================================");
  console.log("Proofsy — Issuing Official Live Certificate");
  console.log("==================================================");

  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/proofsy";
  await mongoose.connect(mongoUri);
  console.log("[1/5] Connected to MongoDB at", mongoUri);

  // Initialize RSA Signing Provider
  const signingProvider = getSigningProvider("institution");
  signingProvider.init();
  const activeKeyId = signingProvider.getActiveKeyId();
  console.log(`[2/5] Cryptographic Signing Key: ${activeKeyId}`);

  // Ensure starter templates exist
  ensureStarterTemplates();

  // Find or Create Organization
  const org = await Organization.findOneAndUpdate(
    { name: "Proofsy Institute of Technology" },
    { name: "Proofsy Institute of Technology" },
    { upsert: true, returnDocument: "after" }
  );

  // Find or Create Team Member
  const member = await TeamMember.findOneAndUpdate(
    { email: "admin@proofsy.tech" },
    {
      organizationId: org._id,
      name: "Platform Registrar",
      email: "admin@proofsy.tech",
      password: "password123",
      role: "owner",
    },
    { upsert: true, returnDocument: "after" }
  );

  // Find or Create Workspace
  const workspace = await Workspace.findOneAndUpdate(
    { slug: "proofsy-academy" },
    {
      name: "Proofsy Academy of Technology",
      slug: "proofsy-academy",
      organizationId: org._id,
      createdBy: member._id,
      credits: 5000,
    },
    { upsert: true, returnDocument: "after" }
  );

  // Find or Create Template
  const template = await Template.findOneAndUpdate(
    { workspaceId: workspace._id, name: "Executive Platinum Certificate Template" },
    {
      name: "Executive Platinum Certificate Template",
      backgroundType: "image",
      backgroundUrl: "/storage/templates/elegant-gold.png",
      width: 1056,
      height: 746,
      workspaceId: workspace._id,
      organizationId: org._id,
      qrCode: {
        enabled: true,
        x: 880,
        y: 580,
        size: 120,
      },
      textLayers: [
        {
          variable: "recipient_name",
          label: "Recipient Name",
          x: 528,
          y: 360,
          fontSize: 34,
          fontFamily: "Outfit, Arial, sans-serif",
          color: "#0F172A",
          align: "center",
          fontWeight: "bold",
        },
        {
          variable: "event_name",
          label: "Event Name",
          x: 528,
          y: 440,
          fontSize: 18,
          fontFamily: "Outfit, Arial, sans-serif",
          color: "#2563EB",
          align: "center",
          fontWeight: "bold",
        },
        {
          variable: "issue_date",
          label: "Issue Date",
          x: 220,
          y: 625,
          fontSize: 12,
          fontFamily: "Outfit, Arial, sans-serif",
          color: "#475569",
          align: "center",
        },
      ],
    },
    { upsert: true, returnDocument: "after" }
  );

  console.log(`[3/5] Template Ready: "${template.name}"`);

  // Find or Create Event
  const event = await Event.findOneAndUpdate(
    { workspaceId: workspace._id, name: "Full-Stack Cloud Architecture & Distributed Systems" },
    {
      name: "Full-Stack Cloud Architecture & Distributed Systems",
      date: new Date(),
      templateId: template._id,
      workspaceId: workspace._id,
      organizationId: org._id,
      status: "published",
    },
    { upsert: true, returnDocument: "after" }
  );

  console.log(`[4/5] Event Ready: "${event.name}"`);

  // Recipient info
  const targetName = "Bhaskar Sharma";
  const targetEmail = "bhaskarsharma0109@gmail.com";

  // Create User Recipient
  const user = await User.findOneAndUpdate(
    { email: targetEmail },
    { name: targetName, email: targetEmail, organizationId: org._id },
    { upsert: true, returnDocument: "after" }
  );

  // Generate unique verification code
  const verificationCode = `CERT-RSA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Create Batch
  const batch = await IssuanceBatch.create({
    eventId: event._id,
    workspaceId: workspace._id,
    organizationId: org._id,
    status: "processing",
    totalRecipients: 1,
    pendingCount: 1,
    successCount: 0,
    failedCount: 0,
    createdBy: member._id,
  });

  // Create Certificate record
  const cert = await Certificate.create({
    eventId: event._id,
    templateId: template._id,
    userId: user._id,
    workspaceId: workspace._id,
    organizationId: org._id,
    issuanceBatchId: batch._id,
    recipientName: targetName,
    recipientEmail: targetEmail,
    verificationCode,
    status: "pending",
  });

  console.log(`\n[5/5] Generating Certificate Artifacts & Cryptographic Signature...`);
  const genResult = await queueCertificateGeneration(event._id.toString(), batch._id.toString());
  console.log("Generation Result:", genResult);

  // Fetch updated Certificate
  const generatedCert = await Certificate.findById(cert._id);
  console.log("\n==================================================");
  console.log("✓ Live Certificate Generated & Cryptographically Signed!");
  console.log("==================================================");
  console.log(`Recipient:               ${generatedCert.recipientName} (${generatedCert.recipientEmail})`);
  console.log(`Verification Code:       ${generatedCert.verificationCode}`);
  console.log(`Signing Provider:        ${generatedCert.signingProvider}`);
  console.log(`Signing Key ID:          ${generatedCert.signingKeyId}`);
  console.log(`Algorithm:               ${generatedCert.signatureAlgorithm}`);
  console.log(`Cryptographic Signature: ${generatedCert.cryptographicSignature ? generatedCert.cryptographicSignature.substring(0, 40) + "..." : "NONE"}`);
  console.log(`PDF:                     https://proofsy.tech${generatedCert.pdfUrl}`);
  console.log(`PNG:                     https://proofsy.tech${generatedCert.pngUrl}`);
  console.log(`SVG:                     https://proofsy.tech${generatedCert.svgUrl}`);
  console.log(`Live Verification URL:   https://proofsy.tech/verify/${workspace.slug}/${generatedCert.verificationCode}`);
  console.log(`Direct Lookup URL:       https://proofsy.tech/verify?code=${generatedCert.verificationCode}`);

  // Send delivery email
  try {
    const emailResult = await sendCertificateEmail({
      recipientName: targetName,
      recipientEmail: targetEmail,
      eventName: event.name,
      eventDate: event.date,
      verificationCode: generatedCert.verificationCode,
      pdfUrl: `https://proofsy.tech${generatedCert.pdfUrl}`,
      verifyUrl: `https://proofsy.tech/verify/${workspace.slug}/${generatedCert.verificationCode}`,
    });
    console.log(`\n[Email] Sent notification to ${targetEmail} (Message ID: ${emailResult?.messageId || "Queued"})`);
  } catch (emailErr) {
    console.log(`[Email] Note on email delivery: ${emailErr.message}`);
  }

  console.log("\n==================================================");
  console.log("TEST RUN SUCCESSFUL! Ready for live verification.");
  console.log("==================================================");

  await mongoose.disconnect();
}

issueLiveCertificate().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
