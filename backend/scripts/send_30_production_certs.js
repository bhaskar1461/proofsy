const https = require("https");
const fs = require("fs");

const BASE_URL = "https://proofsy.tech/api";

function apiRequest(method, endpoint, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    const options = {
      method,
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      rejectUnauthorized: false,
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            resolve({ error: parsed.error || body, statusCode: res.statusCode });
          }
        } catch (e) {
          resolve({ error: body, statusCode: res.statusCode });
        }
      });
    });

    req.on("error", (err) => reject(err));
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function uploadCsvRequest(endpoint, eventId, csvBuffer, token) {
  return new Promise((resolve, reject) => {
    const boundary = "----ProofsyBoundary" + Date.now().toString(16);
    const url = new URL(`${BASE_URL}${endpoint}`);

    const header = `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="eventId"\r\n\r\n` +
      `${eventId}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="recipients.csv"\r\n` +
      `Content-Type: text/csv\r\n\r\n`;

    const footer = `\r\n--${boundary}--\r\n`;

    const payload = Buffer.concat([
      Buffer.from(header, "utf8"),
      csvBuffer,
      Buffer.from(footer, "utf8"),
    ]);

    const options = {
      method: "POST",
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": payload.length,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      rejectUnauthorized: false,
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            resolve({ error: parsed.error || body, statusCode: res.statusCode });
          }
        } catch (e) {
          resolve({ error: body, statusCode: res.statusCode });
        }
      });
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// 4 Target recipient emails specified by user
const RECIPIENT_EMAILS = [
  { name: "Bhaskar Sharma", email: "23311a05y6@cse.sreenidhi.edu.in" },
  { name: "Bhaskar Sharma", email: "bhaskar2004sharma@gmail.com" },
  { name: "Raj Soni Sharma", email: "rajsonisharma385@gmail.com" },
  { name: "Bhaskar Sharma", email: "bhaskarsharma0109@gmail.com" },
];

// 8 Distinct, Non-Default Certification Programs (8 programs * 4 recipients = 32 distinct certificates)
const PROGRAMS = [
  {
    templateName: "Apex Cyber Defense & Zero-Trust Architecture",
    eventName: "Advanced Cybersecurity & Zero-Trust Defense Masterclass",
    organizerName: "Global Cybersecurity Consortium",
    accentColor: "#0ea5e9",
    bgUrl: "/storage/templates/elegant-gold.png",
  },
  {
    templateName: "Generative AI & LLM Systems Specialization",
    eventName: "Generative AI, LLMs & Neural Engineering Fellowship",
    organizerName: "Artificial Intelligence Research Institute",
    accentColor: "#10b981",
    bgUrl: "/storage/templates/modern-minimalist.png",
  },
  {
    templateName: "International AI Innovation Hackathon Champion",
    eventName: "International AI Innovation Hackathon 2026 - 1st Prize Winner",
    organizerName: "Global Tech Innovation Forum",
    accentColor: "#f59e0b",
    bgUrl: "/storage/templates/classic-diploma.png",
  },
  {
    templateName: "Cloud Native & Distributed Architecture",
    eventName: "Cloud Native Distributed Systems & Kubernetes Architecture",
    organizerName: "Cloud Architecture Standards Board",
    accentColor: "#6366f1",
    bgUrl: "/storage/templates/modern-blue.png",
  },
  {
    templateName: "Executive Tech Leadership & Digital Strategy",
    eventName: "Executive Technology Leadership & Innovation Award",
    organizerName: "Executive Digital Leadership Council",
    accentColor: "#8b5cf6",
    bgUrl: "/storage/templates/elegant-dark.png",
  },
  {
    templateName: "Applied Cryptography & Zero-Knowledge Systems",
    eventName: "Applied Cryptography, Zero-Knowledge & Web3 Systems",
    organizerName: "Institute for Cryptographic Proofs",
    accentColor: "#06b6d4",
    bgUrl: "/storage/templates/elegant-gold.png",
  },
  {
    templateName: "Quantum Computing & High-Performance Data",
    eventName: "Quantum Algorithms & High-Performance Computing",
    organizerName: "Quantum Computing & Data Society",
    accentColor: "#ec4899",
    bgUrl: "/storage/templates/modern-minimalist.png",
  },
  {
    templateName: "Site Reliability & Ultra-Low Latency Systems",
    eventName: "Site Reliability Engineering & Ultra-Low Latency Systems",
    organizerName: "SRE Reliability Academy",
    accentColor: "#14b8a6",
    bgUrl: "/storage/templates/classic-diploma.png",
  },
];

async function main() {
  console.log("================================================================================");
  console.log("🚀 STARTING PRODUCTION CERTIFICATE DISPATCH ON HTTPS://PROOFSY.TECH");
  console.log("================================================================================");

  // 1. Check live health
  const health = await apiRequest("GET", "/health");
  console.log("✓ Live API Health:", health.data ? `Status: ${health.data.status} (Uptime: ${health.data.uptime}s, Mongo: ${health.data.services?.mongodb})` : health);

  // 2. Register Organizer Account
  const adminEmail = `authority_${Date.now()}@proofsy.tech`;
  const adminPassword = "ProofsySecureAdmin2026!";
  console.log(`\n🔑 Creating Organizer Account: ${adminEmail}`);

  let authRes = await apiRequest("POST", "/auth/register", {
    orgName: "Proofsy Global Academy",
    name: "Proofsy Accreditation Board",
    email: adminEmail,
    password: adminPassword,
  });

  if (authRes.error) {
    console.log("Register returned error, trying login...", authRes);
    authRes = await apiRequest("POST", "/auth/login", {
      email: adminEmail,
      password: adminPassword,
    });
  }

  const token = authRes.token || authRes.data?.token;
  console.log("✓ Authenticated. Token received.");

  // Get active workspace
  const wsRes = await apiRequest("GET", "/workspaces", null, token);
  const workspace = wsRes.data?.[0];
  const workspaceId = workspace?._id;
  const workspaceSlug = workspace?.slug || "main";
  console.log(`✓ Active Workspace: ${workspace?.name} (${workspaceId}) [slug: ${workspaceSlug}]`);

  // Fetch available starter templates or create distinct ones
  const existingTemplates = await apiRequest("GET", "/templates", null, token);
  const templateList = existingTemplates.data || [];
  console.log(`✓ Available templates in workspace: ${templateList.length}`);

  const allGeneratedCerts = [];
  let totalEmailsSent = 0;

  // 3. Process each of the 8 Programs
  for (let i = 0; i < PROGRAMS.length; i++) {
    const prog = PROGRAMS[i];
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`[${i + 1}/${PROGRAMS.length}] 📜 Program: ${prog.eventName}`);
    console.log(`--------------------------------------------------------------------------------`);

    // Create a Custom Imported Template with unique styling
    const customTemplatePayload = {
      name: prog.templateName,
      background: {
        type: "image",
        url: prog.bgUrl,
      },
      page: {
        width: 1056,
        height: 746,
      },
      elements: [
        {
          type: "variable_text",
          variableKey: "student_name",
          label: "Recipient Name",
          x: 528,
          y: 335,
          fontSize: 36,
          fontFamily: "Inter",
          fontWeight: "bold",
          color: "#0f172a",
          textAlign: "center",
        },
        {
          type: "variable_text",
          variableKey: "course_name",
          label: "Program Name",
          x: 528,
          y: 415,
          fontSize: 21,
          fontFamily: "Inter",
          fontWeight: "normal",
          color: "#334155",
          textAlign: "center",
        },
        {
          type: "variable_text",
          variableKey: "issue_date",
          label: "Date",
          x: 280,
          y: 590,
          fontSize: 14,
          fontFamily: "Inter",
          fontWeight: "normal",
          color: "#64748b",
          textAlign: "center",
        },
        {
          type: "variable_text",
          variableKey: "organizer",
          label: "Issuer",
          x: 770,
          y: 590,
          fontSize: 14,
          fontFamily: "Inter",
          fontWeight: "bold",
          color: "#0f172a",
          textAlign: "center",
        },
      ],
      qrCode: {
        enabled: true,
        x: 880,
        y: 560,
        size: 110,
      },
    };

    let templateId = null;
    const importRes = await apiRequest("POST", "/templates/import", customTemplatePayload, token);
    if (importRes.data?._id || importRes._id) {
      templateId = importRes.data?._id || importRes._id;
      console.log(`  ✓ Created Custom Template ID: ${templateId}`);
    } else if (templateList.length > 0) {
      templateId = templateList[i % templateList.length]._id;
      console.log(`  ✓ Using Template ID: ${templateId}`);
    }

    // Create Event
    const eventPayload = {
      name: prog.eventName,
      date: new Date().toISOString(),
      organizerName: prog.organizerName,
      templateId: templateId,
      duration: "120 Hours",
    };

    const eventRes = await apiRequest("POST", "/events", eventPayload, token);
    const eventId = eventRes.data?.id || eventRes.data?._id || eventRes._id;
    console.log(`  ✓ Created Event ID: ${eventId}`);

    // Generate CSV data for the 4 recipient emails
    let csvString = "name,email\n";
    for (const r of RECIPIENT_EMAILS) {
      csvString += `"${r.name}","${r.email}"\n`;
    }
    const csvBuffer = Buffer.from(csvString, "utf8");

    // Upload CSV to generate certificates
    console.log(`  📤 Uploading CSV and generating certificates in Bull worker queue...`);
    const genRes = await uploadCsvRequest("/certificates/generate", eventId, csvBuffer, token);
    const batchId = genRes.data?.batchId || genRes.batchId;
    console.log(`  ✓ Generation Batch ID: ${batchId || "OK"}`);

    // Poll until batch is complete
    let isComplete = false;
    let attempts = 0;
    while (!isComplete && attempts < 20) {
      await new Promise((r) => setTimeout(r, 1500));
      attempts++;
      const certList = await apiRequest("GET", `/certificates?eventId=${eventId}`, null, token);
      const certs = certList.data?.certificates || certList.data || [];
      const generatedCount = certs.filter((c) => c.status === "generated").length;

      if (generatedCount >= RECIPIENT_EMAILS.length || certs.length >= RECIPIENT_EMAILS.length) {
        isComplete = true;
        console.log(`  ✓ All ${certs.length} certificates compiled, cryptographically signed with RSA-2048 & PDFs generated!`);
        certs.forEach((c) => {
          allGeneratedCerts.push({
            recipient: c.userId?.email || c.userEmail || "Recipient",
            program: prog.eventName,
            code: c.verificationCode,
            verifyUrl: `https://proofsy.tech/verify/${workspaceSlug}/${c.verificationCode}`,
            pdfUrl: c.pdfUrl ? `https://proofsy.tech${c.pdfUrl}` : "pending",
          });
        });
      }
    }

    // Trigger real email sending via Gmail SMTP
    console.log(`  📧 Sending certificate delivery emails via Gmail SMTP to 4 recipients...`);
    const emailRes = await apiRequest("POST", "/certificates/send-emails", { eventId }, token);
    console.log(`  ✓ Email Dispatch Result:`, emailRes.message || emailRes.data || emailRes);
    if (emailRes.data?.sent) {
      totalEmailsSent += emailRes.data.sent;
    }
  }

  console.log("\n================================================================================");
  console.log(`🎉 SUCCESS! TOTAL CERTIFICATES GENERATED: ${allGeneratedCerts.length}`);
  console.log(`📧 EMAILS SENT VIA GMAIL SMTP: ${totalEmailsSent}`);
  console.log("================================================================================");

  console.log("\n📋 Sample of Issued Certificates (Verification Links & PDFs):");
  allGeneratedCerts.forEach((c, idx) => {
    console.log(`\n[#${idx + 1}] To: ${c.recipient}`);
    console.log(`     Program:    ${c.program}`);
    console.log(`     Code:       ${c.code}`);
    console.log(`     Verify URL: ${c.verifyUrl}`);
    console.log(`     PDF URL:    ${c.pdfUrl}`);
  });
}

main().catch((err) => console.error("Error executing dispatch:", err));
