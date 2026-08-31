const request = require("supertest");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const app = require("../src/server");
const Organization = require("../src/models/Organization");
const TeamMember = require("../src/models/TeamMember");
const Workspace = require("../src/models/Workspace");
const Event = require("../src/models/Event");
const Certificate = require("../src/models/Certificate");
const IssuanceBatch = require("../src/models/IssuanceBatch");

jest.mock("../src/workers/certificateWorker", () => ({
  queueCertificateGeneration: jest.fn().mockResolvedValue({ success: 2, failed: 0 }),
}));

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

describe("Idempotency & IssuanceBatch Tests", () => {
  let org;
  let member;
  let workspace;
  let event;
  let token;

  beforeEach(async () => {
    process.env.JWT_SECRET = "test-secret-123456789012345678901234";
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }

    org = await Organization.create({ name: "College of Tech" });
    member = await TeamMember.create({
      organizationId: org._id,
      name: "Coordinator",
      email: "coord@college.edu",
      password: "password123",
      role: "owner",
    });
    workspace = await Workspace.create({
      name: "Engineering Dept",
      organizationId: org._id,
      slug: "eng-dept",
      createdBy: member._id,
      credits: 500,
    });
    event = await Event.create({
      name: "Tech Fest 2026",
      date: new Date(),
      organizerName: "Dept of CS",
      organizationId: org._id,
      workspaceId: workspace._id,
    });
    token = jwt.sign({ id: member._id }, process.env.JWT_SECRET);
  });

  it("should enforce idempotency when uploading CSV with the same idempotency key", async () => {
    const csvPath = path.join(__dirname, "test_batch.csv");
    fs.writeFileSync(csvPath, "name,email\nSam,sam@test.com\nSara,sara@test.com");

    const idempotencyKey = "unique-client-req-9999";

    // First bulk issuance request
    const res1 = await request(app)
      .post("/api/certificates/generate")
      .set("Authorization", `Bearer ${token}`)
      .set("x-workspace-id", workspace._id.toString())
      .set("x-idempotency-key", idempotencyKey)
      .field("eventId", event._id.toString())
      .attach("file", csvPath);

    expect(res1.status).toBe(202);
    expect(res1.body.success).toBe(true);
    expect(res1.body.data.batchId).toBeDefined();

    const batchId = res1.body.data.batchId;

    // Verify batch entity was created in database
    const batch = await IssuanceBatch.findById(batchId);
    expect(batch).toBeDefined();
    expect(batch.idempotencyKey).toBe(idempotencyKey);
    expect(batch.totalCount).toBe(2);

    // Second identical request with same idempotency key
    const res2 = await request(app)
      .post("/api/certificates/generate")
      .set("Authorization", `Bearer ${token}`)
      .set("x-workspace-id", workspace._id.toString())
      .set("x-idempotency-key", idempotencyKey)
      .field("eventId", event._id.toString())
      .attach("file", csvPath);

    // Idempotent hit: returns 200 with existing batch without re-deducting or re-creating
    expect(res2.status).toBe(200);
    expect(res2.body.success).toBe(true);
    expect(res2.body.data.batchId).toBe(batchId);
    expect(res2.body.data.isExistingBatch).toBe(true);

    // Verify certificate count in DB is still 2, not 4
    const certCount = await Certificate.countDocuments({ eventId: event._id });
    expect(certCount).toBe(2);

    fs.unlinkSync(csvPath);
  });

  it("should query batch progress via GET /api/certificates/batch/:batchId", async () => {
    const batch = await IssuanceBatch.create({
      workspaceId: workspace._id,
      organizationId: org._id,
      eventId: event._id,
      totalCount: 100,
      pendingCount: 50,
      completedCount: 48,
      failedCount: 2,
      status: "processing",
      startedAt: new Date(),
    });

    const res = await request(app)
      .get(`/api/certificates/batch/${batch._id}`)
      .set("Authorization", `Bearer ${token}`)
      .set("x-workspace-id", workspace._id.toString());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalCount).toBe(100);
    expect(res.body.data.completedCount).toBe(48);
    expect(res.body.data.failedCount).toBe(2);
    expect(res.body.data.status).toBe("processing");
  });
});
