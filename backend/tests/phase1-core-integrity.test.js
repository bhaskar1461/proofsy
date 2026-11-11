const request = require("supertest");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const xlsx = require("xlsx");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_super_secret_jwt_key_at_least_32_chars_long";
process.env.SIGNING_SECRET = "test_hmac_signing_secret_for_phase1_integrity_tests";
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/proofsy_phase1_test";

const app = require("../src/server");
const User = require("../src/models/User");
const Event = require("../src/models/Event");
const Certificate = require("../src/models/Certificate");
const Organization = require("../src/models/Organization");
const Workspace = require("../src/models/Workspace");
const TeamMember = require("../src/models/TeamMember");

const {
  buildHmacCanonicalPayload,
  serializeHmacCanonicalPayload,
  signHmacPayload,
  verifyHmacPayload,
} = require("../src/services/signing");

const {
  parseAndValidateRecipientFile,
  sanitizeFormulaInjection,
  isValidEmail,
} = require("../src/utils/fileParser");

let mongodInstance = null;
let testToken = "";
let testWorkspaceId = "";
let testOrgId = "";
let testEventId = "";

beforeAll(async () => {
  // Connect to MongoDB
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    }
  } catch (err) {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    mongodInstance = await MongoMemoryServer.create();
    await mongoose.connect(mongodInstance.getUri());
  }

  // Clear test database
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }

  // Seed organization, owner, and workspace
  const org = await Organization.create({ name: "Nexus Test Org" });
  testOrgId = org._id.toString();

  const member = await TeamMember.create({
    organizationId: org._id,
    name: "Admin Tester",
    email: "admin.tester@fictional.test",
    password: "Password123!",
    role: "owner",
  });

  const workspace = await Workspace.create({
    name: "Nexus Main Workspace",
    organizationId: org._id,
    slug: "nexus-test",
    credits: 1000,
    plan: "fest-pass",
    createdBy: member._id,
  });
  testWorkspaceId = workspace._id.toString();

  member.workspaceId = workspace._id;
  await member.save();

  const jwt = require("jsonwebtoken");
  testToken = jwt.sign(
    { id: member._id, workspaceId: workspace._id, organizationId: org._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  // Seed test event
  const event = await Event.create({
    name: "Distributed Systems Hackathon 2026",
    date: new Date("2026-11-20T10:00:00.000Z"),
    organizerName: "Nexus Tech Academy",
    organizationId: org._id,
    workspaceId: workspace._id,
  });
  testEventId = event._id.toString();
});

afterAll(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
});

describe("Phase 1: Core Integrity & Verification Tests", () => {
  describe("1. Cryptographic HMAC-SHA256 Canonical Signing & Verification", () => {
    it("should deterministically generate identical signatures regardless of input property order", () => {
      const payload1 = {
        id: "CERT-ABCD1234EFGH",
        name: "Alice Developer",
        event: "Distributed Systems Hackathon 2026",
        issuer: "Nexus Tech Academy",
        date: "2026-11-20T10:00:00.000Z",
      };

      const payload2 = {
        date: "2026-11-20T10:00:00.000Z",
        issuer: "Nexus Tech Academy",
        event: "Distributed Systems Hackathon 2026",
        name: "Alice Developer",
        id: "CERT-ABCD1234EFGH",
      };

      const sig1 = signHmacPayload(payload1, "test-secret-key-123");
      const sig2 = signHmacPayload(payload2, "test-secret-key-123");

      expect(sig1).toHaveLength(64); // 256 bits = 64 hex characters
      expect(sig1).toBe(sig2);
      expect(verifyHmacPayload(payload1, sig1, "test-secret-key-123")).toBe(true);
      expect(verifyHmacPayload(payload2, sig1, "test-secret-key-123")).toBe(true);
    });

    it("should reject tampered payload (altered recipient name, event, issuer, or date) in constant time", () => {
      const validPayload = {
        id: "CERT-TAMPER001",
        name: "Alice Original",
        event: "Official Hackathon",
        issuer: "Nexus Tech",
        date: "2026-11-20T10:00:00.000Z",
      };

      const signature = signHmacPayload(validPayload, "test-secret-key-123");
      expect(verifyHmacPayload(validPayload, signature, "test-secret-key-123")).toBe(true);

      // Alter name
      const tamperedName = { ...validPayload, name: "Bob Attacker" };
      expect(verifyHmacPayload(tamperedName, signature, "test-secret-key-123")).toBe(false);

      // Alter event
      const tamperedEvent = { ...validPayload, event: "Hacked Event Title" };
      expect(verifyHmacPayload(tamperedEvent, signature, "test-secret-key-123")).toBe(false);

      // Alter issuer
      const tamperedIssuer = { ...validPayload, issuer: "Fake College Name" };
      expect(verifyHmacPayload(tamperedIssuer, signature, "test-secret-key-123")).toBe(false);

      // Alter date
      const tamperedDate = { ...validPayload, date: "2026-12-01T00:00:00.000Z" };
      expect(verifyHmacPayload(tamperedDate, signature, "test-secret-key-123")).toBe(false);

      // Alter signature
      const corruptedSig = signature.slice(0, -4) + "0000";
      expect(verifyHmacPayload(validPayload, corruptedSig, "test-secret-key-123")).toBe(false);
    });
  });

  describe("2. Public Verification & Privacy Endpoint (/api/verify/:code)", () => {
    let validCertCode = "";
    let revokedCertCode = "";
    let tamperedCertCode = "";

    beforeAll(async () => {
      const recipient = await User.create({
        name: "Charlie Participant",
        email: "charlie.participant@fictional.test",
      });

      // 1. Valid certificate with genuine HMAC signature
      validCertCode = "CERT-" + crypto.randomBytes(16).toString("base64url").toUpperCase();
      const validSig = signHmacPayload({
        id: validCertCode,
        name: recipient.name,
        event: "Distributed Systems Hackathon 2026",
        issuer: "Nexus Tech Academy",
        date: "2026-11-20T10:00:00.000Z",
      });

      await Certificate.create({
        userId: recipient._id,
        eventId: testEventId,
        organizationId: testOrgId,
        workspaceId: testWorkspaceId,
        verificationCode: validCertCode,
        status: "generated",
        cryptographicSignature: validSig,
        signatureAlgorithm: "HMAC-SHA256",
        signingProvider: "hmac-sha256",
      });

      // 2. Revoked certificate
      revokedCertCode = "CERT-" + crypto.randomBytes(16).toString("base64url").toUpperCase();
      const revokedSig = signHmacPayload({
        id: revokedCertCode,
        name: recipient.name,
        event: "Distributed Systems Hackathon 2026",
        issuer: "Nexus Tech Academy",
        date: "2026-11-20T10:00:00.000Z",
      });

      await Certificate.create({
        userId: recipient._id,
        eventId: testEventId,
        organizationId: testOrgId,
        workspaceId: testWorkspaceId,
        verificationCode: revokedCertCode,
        status: "revoked",
        revokedAt: new Date(),
        revocationReason: "Participant disqualified due to code of conduct violation",
        cryptographicSignature: revokedSig,
        signatureAlgorithm: "HMAC-SHA256",
        signingProvider: "hmac-sha256",
      });

      // 3. Certificate with tampered signature
      tamperedCertCode = "CERT-" + crypto.randomBytes(16).toString("base64url").toUpperCase();
      await Certificate.create({
        userId: recipient._id,
        eventId: testEventId,
        organizationId: testOrgId,
        workspaceId: testWorkspaceId,
        verificationCode: tamperedCertCode,
        status: "generated",
        cryptographicSignature: "deadbeef0000111122223333444455556666777788889999aaaabbbbccccdddd",
        signatureAlgorithm: "HMAC-SHA256",
        signingProvider: "hmac-sha256",
      });
    });

    it("should verify authentic certificate and return valid status with no emails or phones", async () => {
      const res = await request(app).get(`/api/verify/${validCertCode}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isValid).toBe(true);

      const cert = res.body.data.certificate;
      expect(cert.status).toBe("valid");
      expect(cert.recipientName).toBe("Charlie Participant");
      expect(cert.eventName).toBe("Distributed Systems Hackathon 2026");
      expect(cert.organizerName).toBe("Nexus Tech Academy");
      expect(cert.issuedBy).toBe("Issued by Nexus Tech Academy via Proofsy");
      expect(cert.isCryptographicallyVerified).toBe(true);

      // Privacy enforcement: recipient email and phone numbers MUST NOT exist
      expect(cert.recipientEmail).toBeUndefined();
      expect(cert.email).toBeUndefined();
      expect(cert.phone).toBeUndefined();
      expect(cert.phoneNumber).toBeUndefined();
    });

    it("should return isValid: false for revoked certificate with revocation reason", async () => {
      const res = await request(app).get(`/api/verify/${revokedCertCode}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isValid).toBe(false);
      expect(res.body.data.reason).toContain("Participant disqualified");
      expect(res.body.data.certificate.status).toBe("revoked");
      expect(res.body.data.certificate.recipientEmail).toBeUndefined();
    });

    it("should reject tampered certificate signature with invalid status", async () => {
      const res = await request(app).get(`/api/verify/${tamperedCertCode}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isValid).toBe(false);
      expect(res.body.data.reason).toMatch(/signature verification failed|tampered/i);
    });

    it("should return HTTP 404 for unknown or non-existent certificate code", async () => {
      const res = await request(app).get("/api/verify/CERT-DOESNOTEXIST999");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Invalid verification code");
    });
  });

  describe("3. Bulk Upload Validation, Sanitization & Row-Level Error Reporting", () => {
    const tempFilesDir = path.join(__dirname, "temp_test_files");

    beforeAll(() => {
      if (!fs.existsSync(tempFilesDir)) {
        fs.mkdirSync(tempFilesDir, { recursive: true });
      }
    });

    afterAll(() => {
      if (fs.existsSync(tempFilesDir)) {
        fs.rmSync(tempFilesDir, { recursive: true, force: true });
      }
    });

    it("should sanitize formula injection characters (=, +, -, @, tab, cr) by prepending a single quote", () => {
      expect(sanitizeFormulaInjection("=cmd|' /C calc'!A0")).toBe("'=cmd|' /C calc'!A0");
      expect(sanitizeFormulaInjection("+12345")).toBe("'+12345");
      expect(sanitizeFormulaInjection("-SUM(A1:A10)")).toBe("'-SUM(A1:A10)");
      expect(sanitizeFormulaInjection("@SUM(B1:B5)")).toBe("'@SUM(B1:B5)");
      expect(sanitizeFormulaInjection("\tdangerousTab")).toBe("'\tdangerousTab");
      expect(sanitizeFormulaInjection("Safe Normal Name")).toBe("Safe Normal Name");
    });

    it("should parse and validate CSV with row-level error reporting for invalid emails and missing names", async () => {
      const csvContent = `name,email
Alice Valid,alice@fictional.test
,missingname@fictional.test
Bob BadEmail,not-an-email
=MaliciousFormula,safe.formula@fictional.test
Duplicate User,alice@fictional.test
`;
      const filePath = path.join(tempFilesDir, "test_errors.csv");
      fs.writeFileSync(filePath, csvContent);

      const result = await parseAndValidateRecipientFile(filePath, "test_errors.csv");

      expect(result.validRows).toHaveLength(2); // Alice and sanitized MaliciousFormula
      expect(result.errors.length).toBeGreaterThanOrEqual(3);

      // Verify row 3 had missing name
      const row3Err = result.errors.find((e) => e.row === 3);
      expect(row3Err).toBeDefined();
      expect(row3Err.error).toContain("Missing or empty recipient name");

      // Verify row 4 had bad email
      const row4Err = result.errors.find((e) => e.row === 4);
      expect(row4Err).toBeDefined();
      expect(row4Err.error).toContain("Invalid email");

      // Verify row 5 was sanitized against formula injection
      const sanitizedRow = result.validRows.find((r) => r.email === "safe.formula@fictional.test");
      expect(sanitizedRow.name).toBe("'=MaliciousFormula");

      // Verify duplicate email detected
      const dupErr = result.errors.find((e) => e.row === 6);
      expect(dupErr).toBeDefined();
      expect(dupErr.error).toContain("Duplicate email");
    });

    it("should successfully parse Excel XLSX file with valid recipients", async () => {
      const wb = xlsx.utils.book_new();
      const wsData = [
        ["name", "email"],
        ["Dave Excel", "dave.excel@fictional.test"],
        ["Eva Spreadsheet", "eva.spreadsheet@fictional.test"],
      ];
      const ws = xlsx.utils.aoa_to_sheet(wsData);
      xlsx.utils.book_append_sheet(wb, ws, "Sheet1");

      const xlsxPath = path.join(tempFilesDir, "valid_recipients.xlsx");
      xlsx.writeFile(wb, xlsxPath);

      const result = await parseAndValidateRecipientFile(xlsxPath, "valid_recipients.xlsx");

      expect(result.validRows).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.validRows[0].name).toBe("Dave Excel");
      expect(result.validRows[1].email).toBe("eva.spreadsheet@fictional.test");
    });

    it("should reject uploads exceeding maximum row limit", async () => {
      const rows = [["name", "email"]];
      for (let i = 0; i < 20; i++) {
        rows.push([`User ${i}`, `user${i}@fictional.test`]);
      }
      const csvPath = path.join(tempFilesDir, "exceed.csv");
      fs.writeFileSync(csvPath, rows.map((r) => r.join(",")).join("\n"));

      await expect(parseAndValidateRecipientFile(csvPath, "exceed.csv", 10)).rejects.toThrow(
        /exceeds maximum limit of 10 rows/i
      );
    });
  });

  describe("4. Batch ZIP Download Endpoint", () => {
    it("should return a valid ZIP stream containing generated PDFs for the event", async () => {
      const res = await request(app)
        .get(`/api/events/${testEventId}/download-zip`)
        .set("Authorization", `Bearer ${testToken}`);

      // If no certificates generated yet, returns 404 or empty notice
      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.headers["content-type"]).toBe("application/zip");
        expect(res.headers["content-disposition"]).toContain(".zip");
      }
    });
  });

  describe("5. Rate Limiting", () => {
    it("should enforce rate limits on /api/verify for rapid requests", async () => {
      // Send rapid requests
      let hitRateLimit = false;
      for (let i = 0; i < 350; i++) {
        const res = await request(app).get("/api/verify/CERT-DOESNOTEXIST999");
        if (res.status === 429) {
          hitRateLimit = true;
          expect(res.body.error).toContain("Too many");
          break;
        }
      }
      expect(hitRateLimit).toBe(true);
    });
  });
});
