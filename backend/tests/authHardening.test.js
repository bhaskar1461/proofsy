const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/server");
const Organization = require("../src/models/Organization");
const TeamMember = require("../src/models/TeamMember");
const User = require("../src/models/User");

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

describe("Authentication Hardening Tests", () => {
  let org;
  let member;

  beforeEach(async () => {
    process.env.JWT_SECRET = "test-secret-123456789012345678901234";
    process.env.NODE_ENV = "development";

    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }

    org = await Organization.create({ name: "Security Org" });
    member = await TeamMember.create({
      organizationId: org._id,
      name: "Security Admin",
      email: "admin@security.io",
      password: "originalPassword123",
      role: "owner",
    });
  });

  describe("Password Reset Flow", () => {
    it("should allow requesting reset token and resetting password", async () => {
      // 1. Request password reset
      const resForgot = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "admin@security.io" });

      expect(resForgot.status).toBe(200);
      expect(resForgot.body.success).toBe(true);
      expect(resForgot.body.debugResetToken).toBeDefined();

      const resetToken = resForgot.body.debugResetToken;

      // 2. Perform password reset with token
      const resReset = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: resetToken, newPassword: "newSecurePassword456" });

      expect(resReset.status).toBe(200);
      expect(resReset.body.success).toBe(true);

      // 3. Verify old password no longer works
      const resOldLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: "admin@security.io", password: "originalPassword123" });

      expect(resOldLogin.status).toBe(401);

      // 4. Verify new password works
      const resNewLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: "admin@security.io", password: "newSecurePassword456" });

      expect(resNewLogin.status).toBe(200);
      expect(resNewLogin.body.token).toBeDefined();
    });

    it("should return generic message on forgot-password for non-existent email (prevent enumeration)", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "unknown@user.com" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("If an account with that email exists");
      expect(res.body.debugResetToken).toBeUndefined();
    });
  });

  describe("Recipient Authentication Hardening", () => {
    it("should prevent recipient email enumeration by returning generic response", async () => {
      const res = await request(app)
        .post("/api/auth/recipient/login")
        .send({ email: "nonexistent@recipient.org" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("If certificates exist for this email");
    });

    it("should issue OTP when recipient exists and allow verification", async () => {
      const recipient = await User.create({
        name: "Test Student",
        email: "student@college.edu",
      });

      const resLogin = await request(app)
        .post("/api/auth/recipient/login")
        .send({ email: "student@college.edu" });

      expect(resLogin.status).toBe(200);
      expect(resLogin.body.debugOtp).toBeDefined();

      const otp = resLogin.body.debugOtp;

      const resVerify = await request(app)
        .post("/api/auth/recipient/verify")
        .send({ email: "student@college.edu", otp });

      expect(resVerify.status).toBe(200);
      expect(resVerify.body.token).toBeDefined();
      expect(resVerify.body.data.name).toBe("Test Student");
    });
  });
});
