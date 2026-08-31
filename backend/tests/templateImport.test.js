const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../src/server");
const Organization = require("../src/models/Organization");
const TeamMember = require("../src/models/TeamMember");
const Workspace = require("../src/models/Workspace");
const Template = require("../src/models/Template");

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

describe("Template Import API (Proofsy Designer Integration)", () => {
  let org;
  let member;
  let workspace;
  let token;

  beforeEach(async () => {
    process.env.JWT_SECRET = "test-secret-123456789012345678901234";
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }

    org = await Organization.create({ name: "Designer Test Org" });
    member = await TeamMember.create({
      organizationId: org._id,
      name: "Designer Admin",
      email: "designer@proofsy.io",
      password: "password123",
      role: "owner",
    });
    workspace = await Workspace.create({
      name: "Design Studio Workspace",
      organizationId: org._id,
      slug: "design-studio",
      createdBy: member._id,
    });
    token = jwt.sign({ id: member._id }, process.env.JWT_SECRET);
  });

  it("should import a Schema v2.0 template and convert it into Proofsy format", async () => {
    const schemaV2Payload = {
      schemaVersion: "2.0",
      id: "tpl_imported_01",
      version: 1,
      name: "Convocation Honors Certificate 2026",
      page: {
        width: 1056,
        height: 746,
        orientation: "landscape",
      },
      background: {
        type: "image",
        url: "/storage/templates/elegant-gold.png",
      },
      elements: [
        {
          id: "el_title",
          type: "text",
          x: 528,
          y: 160,
          width: 700,
          height: 48,
          text: "CERTIFICATE OF EXCELLENCE",
          fontFamily: "Cinzel",
          fontSize: 32,
          fontWeight: "bold",
          color: "#1E293B",
          textAlign: "center",
        },
        {
          id: "el_student",
          type: "variable_text",
          variableKey: "student_name",
          fallbackText: "Student Name",
          x: 528,
          y: 350,
          width: 750,
          height: 56,
          fontFamily: "Inter",
          fontSize: 40,
          fontWeight: "bold",
          color: "#0F172A",
          textAlign: "center",
        },
        {
          id: "el_course",
          type: "variable_text",
          variableKey: "course_name",
          fallbackText: "Course Title",
          x: 528,
          y: 430,
          width: 800,
          height: 36,
          fontFamily: "Inter",
          fontSize: 22,
          fontWeight: "medium",
          color: "#4F46E5",
          textAlign: "center",
        },
        {
          id: "el_qr",
          type: "qr_placeholder",
          x: 880,
          y: 580,
          width: 120,
          height: 120,
          qrConfig: {
            purpose: "certificate_verification",
          },
        },
      ],
    };

    const res = await request(app)
      .post("/api/templates/import")
      .set("Authorization", `Bearer ${token}`)
      .set("x-workspace-id", workspace._id.toString())
      .send(schemaV2Payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Convocation Honors Certificate 2026");
    expect(res.body.data.textLayers.length).toBe(3);

    // Verify variable mapping
    const studentLayer = res.body.data.textLayers.find((l) => l.variable === "recipient_name");
    expect(studentLayer).toBeDefined();
    expect(studentLayer.fontSize).toBe(40);

    const courseLayer = res.body.data.textLayers.find((l) => l.variable === "event_name");
    expect(courseLayer).toBeDefined();
    expect(courseLayer.fontSize).toBe(22);

    // Verify QR code settings
    expect(res.body.data.qrCode.enabled).toBe(true);
    expect(res.body.data.qrCode.x).toBe(880);
    expect(res.body.data.qrCode.y).toBe(580);
    expect(res.body.data.qrCode.size).toBe(120);

    // Verify saved in MongoDB
    const dbTemplate = await Template.findById(res.body.data._id);
    expect(dbTemplate).toBeDefined();
    expect(dbTemplate.workspaceId.toString()).toBe(workspace._id.toString());
  });
});
