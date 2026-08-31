const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/server");
const Organization = require("../src/models/Organization");
const TeamMember = require("../src/models/TeamMember");
const Workspace = require("../src/models/Workspace");
const Event = require("../src/models/Event");
const Certificate = require("../src/models/Certificate");
const User = require("../src/models/User");
const { getSigningProvider, serializeLegacyPayload, buildLegacyPayload } = require("../src/services/signing");

let mongod;

beforeAll(async () => {
  const { MongoMemoryServer } = require("mongodb-memory-server");
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

describe("Verification Privacy & Signature Inspection Tests", () => {
  let org;
  let member;
  let workspace;
  let event;
  let user;

  beforeEach(async () => {
    process.env.JWT_SECRET = "test-secret-123456789012345678901234";
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }

    org = await Organization.create({ name: "Premier Institute" });
    member = await TeamMember.create({
      organizationId: org._id,
      name: "Registrar",
      email: "registrar@institute.edu",
      password: "password123",
      role: "owner",
    });
    workspace = await Workspace.create({
      name: "Graduation 2026",
      organizationId: org._id,
      slug: "grad-2026",
      createdBy: member._id,
    });
    event = await Event.create({
      name: "Annual Convocation 2026",
      date: new Date("2026-06-01T10:00:00.000Z"),
      organizerName: "Office of the Dean",
      organizationId: org._id,
      workspaceId: workspace._id,
    });
    user = await User.create({
      name: "Emily Watson",
      email: "emily.watson@student.edu",
    });
  });

  it("should mask recipient email on public verification to protect privacy", async () => {
    const fixedIssuedDate = new Date("2026-06-01T12:00:00.000Z");

    const claims = {
      verificationCode: "CERT-PRIVACY-01",
      recipientName: user.name,
      recipientEmail: user.email,
      eventName: event.name,
      eventDate: event.date,
      organizationId: org._id,
      issuedAt: fixedIssuedDate.toISOString(),
    };

    const provider = getSigningProvider("institution");
    const signResult = await provider.sign(claims);

    const cert = await Certificate.create({
      userId: user._id,
      eventId: event._id,
      organizationId: org._id,
      workspaceId: workspace._id,
      verificationCode: "CERT-PRIVACY-01",
      status: "generated",
      signingProvider: "institution",
      signingKeyId: signResult.signingKeyId,
      signatureAlgorithm: signResult.algorithm,
      cryptographicSignature: signResult.signature,
      signedAt: new Date(signResult.signedAt),
      createdAt: fixedIssuedDate,
    });

    const res = await request(app).get(`/api/verify/${cert.verificationCode}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isValid).toBe(true);
    expect(res.body.data.certificate.recipientName).toBe("Emily Watson");

    // Verify email is masked on public endpoint
    expect(res.body.data.certificate.recipientEmail).not.toBe("emily.watson@student.edu");
    expect(res.body.data.certificate.recipientEmail).toContain("***");
    expect(res.body.data.certificate.recipientEmail).toContain("@student.edu");

    // Verify signature metadata
    expect(res.body.data.certificate.signingKeyId).toBe(signResult.signingKeyId);
    expect(res.body.data.certificate.signatureAlgorithm).toBe("RSA-SHA256");
    expect(res.body.data.certificate.isCryptographicallyVerified).toBe(true);
  });

  it("should verify backward-compatible legacy v1 certificates seamlessly", async () => {
    const legacyIssuedDate = new Date("2025-01-01T00:00:00.000Z");

    const legacyClaims = {
      verificationCode: "CERT-LEGACY-99",
      recipientName: user.name,
      recipientEmail: user.email,
      eventName: event.name,
      issuedAt: legacyIssuedDate.toISOString(),
    };

    const provider = getSigningProvider("institution");
    provider.init();

    const crypto = require("crypto");
    const serializedLegacy = serializeLegacyPayload(buildLegacyPayload(legacyClaims));
    const entry = provider.keyCache.get(provider.getActiveKeyId());
    const signer = crypto.createSign("SHA256");
    signer.update(serializedLegacy, "utf8");
    signer.end();
    const legacySignature = signer.sign(entry.privateKeyPem, "base64");

    const cert = await Certificate.create({
      userId: user._id,
      eventId: event._id,
      organizationId: org._id,
      workspaceId: workspace._id,
      verificationCode: "CERT-LEGACY-99",
      status: "generated",
      cryptographicSignature: legacySignature,
      signingKeyId: null, // Legacy cert with no keyId
      createdAt: legacyIssuedDate,
    });

    const res = await request(app).get(`/api/verify/${cert.verificationCode}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isValid).toBe(true);
    expect(res.body.data.certificate.isCryptographicallyVerified).toBe(true);
  });

  it("should return public key list and key metadata via verification endpoints", async () => {
    const resKeys = await request(app).get("/api/verify/public-keys");
    expect(resKeys.status).toBe(200);
    expect(resKeys.body.success).toBe(true);
    expect(Array.isArray(resKeys.body.data)).toBe(true);
    expect(resKeys.body.data.length).toBeGreaterThanOrEqual(1);

    const resKey = await request(app).get("/api/verify/public-key");
    expect(resKey.status).toBe(200);
    expect(resKey.body.success).toBe(true);
    expect(resKey.body.data.publicKey).toContain("BEGIN PUBLIC KEY");
    expect(resKey.body.data.algorithm).toBe("RSA-SHA256");
  });
});
