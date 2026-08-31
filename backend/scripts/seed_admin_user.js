const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Organization = require("../src/models/Organization");
const TeamMember = require("../src/models/TeamMember");
const Workspace = require("../src/models/Workspace");
const Event = require("../src/models/Event");
const Template = require("../src/models/Template");

async function seedAdmin() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/proofsy";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", mongoUri);

  // 1. Create or find Organization
  let org = await Organization.findOne();
  if (!org) {
    org = await Organization.create({ name: "Proofsy Organization" });
  }

  // 2. Create or find Workspace
  let workspace = await Workspace.findOne();
  if (!workspace) {
    workspace = await Workspace.create({
      name: "Main Workspace",
      slug: "main-workspace",
      organizationId: org._id,
      credits: 1000
    });
  }

  // 3. Create or update admin users
  const adminUsers = [
    { email: "admin@proofsy.io", name: "Proofsy Administrator", password: "Password123!" },
    { email: "admin@acme.edu", name: "Acme Admin", password: "Password123!" },
    { email: "bhaskarsharma0109@gmail.com", name: "Bhaskar Sharma", password: "Password123!" }
  ];

  for (const user of adminUsers) {
    let member = await TeamMember.findOne({ email: user.email });
    if (member) {
      member.password = user.password;
      member.role = "owner";
      member.organizationId = org._id;
      member.workspaceId = workspace._id;
      await member.save();
      console.log(`✓ Updated credentials for: ${user.email}`);
    } else {
      member = await TeamMember.create({
        organizationId: org._id,
        workspaceId: workspace._id,
        name: user.name,
        email: user.email,
        password: user.password,
        role: "owner"
      });
      console.log(`✓ Created new admin user: ${user.email}`);
    }
  }

  // 4. Ensure Template and Sample Event exist
  let starterTemplate = await Template.findOne({ name: "Elegant Gold", isStarter: true }) || await Template.findOne({ isStarter: true });
  let templateId = starterTemplate ? starterTemplate._id : "modern";

  let event = await Event.findOne({ organizationId: org._id });
  if (!event) {
    event = await Event.create({
      name: "Annual Technical Symposium 2026",
      date: new Date(),
      organizerName: "Faculty of Engineering",
      organizationId: org._id,
      workspaceId: workspace._id,
      templateId: templateId,
      duration: "2 Days"
    });
  }

  console.log("==========================================");
  console.log(" ADMIN USERS READY TO SIGN IN:");
  console.log("1. Email: admin@acme.edu");
  console.log("   Pass:  Password123!");
  console.log("2. Email: admin@proofsy.io");
  console.log("   Pass:  Password123!");
  console.log("3. Email: bhaskarsharma0109@gmail.com");
  console.log("   Pass:  Password123!");
  console.log("==========================================");

  await mongoose.disconnect();
}

seedAdmin().catch(err => {
  console.error("Error seeding admin:", err);
  process.exit(1);
});
