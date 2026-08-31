const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const path = require("path");
const fs = require("fs");

const Organization = require("../src/models/Organization");
const Workspace = require("../src/models/Workspace");
const TeamMember = require("../src/models/TeamMember");
const Event = require("../src/models/Event");
const Template = require("../src/models/Template");
const User = require("../src/models/User");
const Certificate = require("../src/models/Certificate");
const IssuanceBatch = require("../src/models/IssuanceBatch");
const { queueCertificateGeneration } = require("../src/workers/certificateWorker");
const { sendCertificateEmail } = require("../src/services/emailService");
const { getSigningProvider } = require("../src/services/signing");
const { ensureStarterTemplates } = require("../src/utils/templateSetup");

async function run() {
  console.log("==================================================");
  console.log("Proofsy — Issuing & Sending Test Certificate");
  console.log("==================================================");

  let mongod;
  try {
    // 1. Connect to MongoDB (try default URI first, fallback to in-memory)
    const localUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/proofsy";
    try {
      await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
      console.log(`[Database] Connected to MongoDB at ${localUri}`);
    } catch (e) {
      console.log("[Database] Local MongoDB unavailable, starting embedded in-memory MongoDB instance...");
      mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
      console.log("[Database] Connected to in-memory MongoDB.");
    }

    // 2. Initialize Signing Provider
    const signingProvider = getSigningProvider("institution");
    signingProvider.init();
    const activeKeyId = signingProvider.getActiveKeyId();
    console.log(`[Cryptography] Active Signing Key: ${activeKeyId}`);

    // 3. Ensure template background asset exists
    ensureStarterTemplates();

    // 4. Create Organization, TeamMember, Workspace
    const org = await Organization.findOneAndUpdate(
      { name: "Proofsy Institute of Technology" },
      { name: "Proofsy Institute of Technology" },
      { upsert: true, returnDocument: "after" }
    );

    const member = await TeamMember.findOneAndUpdate(
      { email: "admin@proofsy.io" },
      {
        organizationId: org._id,
        name: "Platform Registrar",
        email: "admin@proofsy.io",
        password: "password123",
        role: "owner",
      },
      { upsert: true, returnDocument: "after" }
    );

    const workspace = await Workspace.findOneAndUpdate(
      { slug: "pit-academic" },
      {
        name: "Faculty of Computer Science & Engineering",
        slug: "pit-academic",
        organizationId: org._id,
        createdBy: member._id,
        credits: 1000,
      },
      { upsert: true, returnDocument: "after" }
    );

    // 5. Create / Update Template with valid existing background
    const template = await Template.findOneAndUpdate(
      { workspaceId: workspace._id, name: "Institutional Honors Certificate Template" },
      {
        name: "Institutional Honors Certificate Template",
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
            fontSize: 36,
            fontFamily: "Inter",
            fontWeight: "bold",
            color: "#1E293B",
            textAlign: "center",
          },
          {
            variable: "event_name",
            label: "Course Title",
            x: 528,
            y: 430,
            fontSize: 22,
            fontFamily: "Inter",
            fontWeight: "bold",
            color: "#4F46E5",
            textAlign: "center",
          },
          {
            variable: "date",
            label: "Issue Date",
            x: 300,
            y: 580,
            fontSize: 14,
            fontFamily: "Inter",
            fontWeight: "normal",
            color: "#64748B",
            textAlign: "center",
          },
          {
            variable: "verification_code",
            label: "Credential ID",
            x: 528,
            y: 650,
            fontSize: 13,
            fontFamily: "Inter",
            fontWeight: "normal",
            color: "#94A3B8",
            textAlign: "center",
          },
        ],
      },
      { upsert: true, returnDocument: "after" }
    );

    // 6. Create / Update Event
    const event = await Event.findOneAndUpdate(
      { name: "Advanced Software Engineering & Cryptographic Systems Certification 2026", workspaceId: workspace._id },
      {
        name: "Advanced Software Engineering & Cryptographic Systems Certification 2026",
        date: new Date(),
        organizerName: "Proofsy Academic Senate & Office of Registrar",
        organizationId: org._id,
        workspaceId: workspace._id,
        templateId: template._id,
        status: "active",
      },
      { upsert: true, returnDocument: "after" }
    );

    // 7. Create / Update Recipient User
    const targetEmail = "bhaskarsharma0109@gmail.com";
    const targetName = "Bhaskar Sharma";

    const user = await User.findOneAndUpdate(
      { email: targetEmail },
      {
        name: targetName,
        email: targetEmail,
      },
      { upsert: true, returnDocument: "after" }
    );

    // Clean up any prior certificate for clean rerun
    await Certificate.deleteMany({ userId: user._id, eventId: event._id });

    // 8. Create Pending Certificate & Issuance Batch
    const batch = await IssuanceBatch.create({
      workspaceId: workspace._id,
      organizationId: org._id,
      eventId: event._id,
      createdBy: member._id,
      totalCount: 1,
      pendingCount: 1,
      status: "queued",
    });

    const verificationCode = `PROOF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const cert = await Certificate.create({
      userId: user._id,
      eventId: event._id,
      organizationId: org._id,
      workspaceId: workspace._id,
      batchId: batch._id,
      verificationCode,
      status: "pending",
      signingProvider: "institution",
      signingKeyId: activeKeyId,
      signatureAlgorithm: "RSA-SHA256",
    });

    console.log(`\n[Issuance] Created Pending Certificate for: ${targetName} (${targetEmail})`);
    console.log(`[Issuance] Credential Code: ${verificationCode}`);
    console.log(`[Issuance] Batch ID: ${batch._id}`);

    // 9. Process Certificate Generation (PDF + PNG + SVG + Institutional RSA Signature + QR)
    console.log("\n[Worker] Generating Certificate Artifacts & Cryptographic Signature...");
    const generationResult = await queueCertificateGeneration(event._id.toString(), batch._id.toString());
    console.log("[Worker] Generation result:", generationResult);

    // 10. Fetch Generated Certificate with Metadata
    const generatedCert = await Certificate.findById(cert._id);
    console.log("\n==================================================");
    console.log("✓ Certificate Generated Successfully!");
    console.log("==================================================");
    console.log(`Status:                  ${generatedCert.status}`);
    console.log(`Verification Code:       ${generatedCert.verificationCode}`);
    console.log(`Signing Provider:        ${generatedCert.signingProvider}`);
    console.log(`Signing Key ID:          ${generatedCert.signingKeyId}`);
    console.log(`Algorithm:               ${generatedCert.signatureAlgorithm}`);
    console.log(`Signed At:               ${generatedCert.signedAt}`);
    console.log(`Cryptographic Signature: ${generatedCert.cryptographicSignature ? generatedCert.cryptographicSignature.substring(0, 48) + "..." : "NONE"}`);
    console.log(`PDF URL:                 ${generatedCert.pdfUrl}`);
    console.log(`PNG URL:                 ${generatedCert.pngUrl}`);
    console.log(`SVG URL:                 ${generatedCert.svgUrl}`);

    // 11. Send Certificate Email via emailService
    console.log("\n[Email] Dispatching certificate delivery email to:", targetEmail);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyUrl = `${frontendUrl}/verify/${workspace.slug}/${generatedCert.verificationCode}`;
    const pdfUrl = `${frontendUrl}${generatedCert.pdfUrl}`;

    const emailResult = await sendCertificateEmail({
      recipientName: targetName,
      recipientEmail: targetEmail,
      eventName: event.name,
      eventDate: event.date,
      verificationCode: generatedCert.verificationCode,
      pdfUrl,
      verifyUrl,
    });

    console.log("\n==================================================");
    console.log("✓ Email Dispatch Result");
    console.log("==================================================");
    console.log(`Recipient:   ${targetEmail}`);
    console.log(`Message ID:  ${emailResult.messageId}`);
    if (emailResult.previewUrl) {
      console.log(`Preview URL: ${emailResult.previewUrl}`);
      console.log("(Note: Open the preview URL in your browser to view the delivered certificate email)");
    }

    console.log("\nTest Certificate Workflow Completed Successfully! 🎓✨");

  } catch (err) {
    console.error("\n[Error] Certificate generation or delivery failed:", err);
  } finally {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }
}

run();
