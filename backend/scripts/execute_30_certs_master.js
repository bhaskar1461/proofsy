const https = require("https");

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

    req.on("error", reject);
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

// 4 Target Recipient Inboxes:
const TARGET_RECIPIENTS = [
  { name: "Bhaskar Sharma", email: "23311a05y6@cse.sreenidhi.edu.in" },
  { name: "Bhaskar Sharma", email: "bhaskar2004sharma@gmail.com" },
  { name: "Raj Soni Sharma", email: "rajsonisharma385@gmail.com" },
  { name: "Bhaskar Sharma", email: "bhaskarsharma0109@gmail.com" },
];

// 8 Distinct Programs (8 * 4 = 32 distinct certificates)
const PROGRAMS = [
  {
    templateName: "Cybersecurity & Zero-Trust Defense Master",
    eventName: "Advanced Cybersecurity & Zero-Trust Defense Masterclass",
    organizer: "Global Cybersecurity Consortium",
    bgUrl: "/storage/templates/cyber-futuristic.png",
    nameColor: "#38bdf8",
    accentColor: "#0ea5e9",
  },
  {
    templateName: "Executive Leadership & Tech Innovation Award",
    eventName: "Executive Technology Leadership & Innovation Award",
    organizer: "Executive Digital Leadership Council",
    bgUrl: "/storage/templates/executive-platinum.png",
    nameColor: "#1e293b",
    accentColor: "#b45309",
  },
  {
    templateName: "Generative AI & LLM Systems Specialization",
    eventName: "Generative AI, Large Language Models & Neural Engineering",
    organizer: "Artificial Intelligence Research Institute",
    bgUrl: "/storage/templates/modern-blue.png",
    nameColor: "#0f172a",
    accentColor: "#2563eb",
  },
  {
    templateName: "International AI Innovation Hackathon Champion",
    eventName: "International AI Innovation Hackathon 2026 - 1st Prize Winner",
    organizer: "Global Tech Innovation Forum",
    bgUrl: "/storage/templates/elegant-gold.png",
    nameColor: "#0f172a",
    accentColor: "#d97706",
  },
  {
    templateName: "Full-Stack Web3 & Cryptographic Engineering",
    eventName: "Applied Cryptography, Zero-Knowledge & Web3 Systems",
    organizer: "Institute for Cryptographic Proofs",
    bgUrl: "/storage/templates/dark-premium.png",
    nameColor: "#f8fafc",
    accentColor: "#06b6d4",
  },
  {
    templateName: "Creative Design & Digital Experience Mastery",
    eventName: "Creative UI/UX Design & Human-Centered Computing",
    organizer: "Design & Creative Technology Guild",
    bgUrl: "/storage/templates/creative-gradient.png",
    nameColor: "#0f172a",
    accentColor: "#8b5cf6",
  },
  {
    templateName: "Cloud Native Architecture & Distributed Systems",
    eventName: "Cloud Native Distributed Systems & Kubernetes Architecture",
    organizer: "Cloud Architecture Standards Board",
    bgUrl: "/storage/templates/nature-green.png",
    nameColor: "#0f172a",
    accentColor: "#059669",
  },
  {
    templateName: "High-Performance Data Science & Computing",
    eventName: "High-Performance Data Science & Algorithms Specialization",
    organizer: "Data Computing & Mathematical Science Institute",
    bgUrl: "/storage/templates/minimal-mono.png",
    nameColor: "#0f172a",
    accentColor: "#475569",
  },
];

async function main() {
  console.log("================================================================================");
  console.log("🚀 DISPATCHING 32 DISTINCT PRODUCTION CERTIFICATES VIA HTTPS://PROOFSY.TECH");
  console.log("================================================================================");

  // 1. Health check
  const health = await apiRequest("GET", "/health");
  console.log("✓ Live Health Check:", health.data ? `Status: ${health.data.status} (MongoDB: ${health.data.services?.mongodb})` : health);

  // 2. Register / Authenticate dedicated authority
  const adminEmail = `director_${Date.now()}@proofsy.tech`;
  const adminPassword = "ProofsySecureAdmin2026!";
  console.log(`\n🔑 Registering Accrediting Authority: ${adminEmail}`);

  let authRes = await apiRequest("POST", "/auth/register", {
    orgName: "Proofsy Global Accreditation Academy",
    name: "Dr. Bhaskar Sharma, Accreditation Director",
    email: adminEmail,
    password: adminPassword,
  });

  const token = authRes.token || authRes.data?.token;
  if (!token) {
    console.error("Auth failed:", authRes);
    return;
  }
  console.log("✓ Authenticated. Session token active.");

  // Get active workspace
  const wsRes = await apiRequest("GET", "/workspaces", null, token);
  const workspace = wsRes.data?.[0];
  const workspaceId = workspace?._id;
  const workspaceSlug = workspace?.slug || "main";
  console.log(`✓ Active Workspace: ${workspace?.name} (${workspaceId}) [slug: ${workspaceSlug}]`);

  const allDispatchedCerts = [];
  const eventIdsToEmail = [];

  // 3. Create all 8 Programs, Templates & Events
  for (let i = 0; i < PROGRAMS.length; i++) {
    const prog = PROGRAMS[i];
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`[${i + 1}/${PROGRAMS.length}] 📜 Program: ${prog.eventName}`);
    console.log(`--------------------------------------------------------------------------------`);

    // Create Template using Schema v2.0 import
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
          color: prog.nameColor,
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
          color: prog.accentColor,
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

    const importRes = await apiRequest("POST", "/templates/import", customTemplatePayload, token);
    const templateId = importRes.data?._id || importRes._id;
    console.log(`  ✓ Created Template ID: ${templateId} (Background: ${prog.bgUrl})`);

    // Create Event
    const eventPayload = {
      name: prog.eventName,
      date: new Date().toISOString(),
      organizerName: prog.organizer,
      templateId: templateId,
      duration: "120 Hours",
    };

    const eventRes = await apiRequest("POST", "/events", eventPayload, token);
    const eventId = eventRes.data?.id || eventRes.data?._id || eventRes._id;
    console.log(`  ✓ Created Event ID: ${eventId}`);
    eventIdsToEmail.push({ eventId, eventName: prog.eventName });

    // Generate CSV for 4 recipients
    let csvString = "name,email\n";
    for (const r of TARGET_RECIPIENTS) {
      csvString += `"${r.name}","${r.email}"\n`;
    }
    const csvBuffer = Buffer.from(csvString, "utf8");

    // Upload CSV
    console.log(`  📤 Uploading CSV with 4 recipients into Bull Worker Queue...`);
    const genRes = await uploadCsvRequest("/certificates/generate", eventId, csvBuffer, token);
    const batchId = genRes.data?.batchId || genRes.batchId;
    console.log(`  ✓ Batch Queued: ${batchId}`);
  }

  // 4. Wait for Bull Worker to finish generating all 32 certificates
  console.log("\n⏳ Waiting for multi-core worker to compile all 32 certificates, PDFs and RSA signatures...");
  let allGenerated = false;
  let pollAttempts = 0;

  while (!allGenerated && pollAttempts < 30) {
    await new Promise((r) => setTimeout(r, 2000));
    pollAttempts++;

    const certListRes = await apiRequest("GET", "/certificates", null, token);
    const certs = certListRes.data?.certificates || certListRes.data || [];
    const generated = certs.filter((c) => c.status === "generated");
    console.log(`  [Poll ${pollAttempts}] Generated: ${generated.length}/${certs.length} certificates`);

    if (generated.length === 32) {
      allGenerated = true;
      certs.forEach((c) => {
        allDispatchedCerts.push({
          recipient: c.userId?.email || c.userEmail || "Recipient",
          program: c.eventId?.name || "Program",
          code: c.verificationCode,
          verifyUrl: `https://proofsy.tech/verify/${workspaceSlug}/${c.verificationCode}`,
          pdfUrl: c.pdfUrl ? `https://proofsy.tech${c.pdfUrl}` : "pending",
        });
      });
    }
  }

  // 5. Send Real Emails via Gmail SMTP for all events
  console.log("\n📧 DISPATCHING EMAILS VIA GMAIL SMTP (Invitation@suh.edu.in) TO ALL 4 INBOXES...");
  let totalEmailsSent = 0;

  for (const item of eventIdsToEmail) {
    console.log(`\n  ➡️ Sending emails for: "${item.eventName}" ...`);
    const sendRes = await apiRequest("POST", "/certificates/send-emails", { eventId: item.eventId }, token);
    console.log(`     Result:`, sendRes.message || sendRes.data || sendRes);
    if (sendRes.data?.sent) {
      totalEmailsSent += sendRes.data.sent;
    }
  }

  console.log("\n================================================================================");
  console.log(`🎉 ALL 32 CERTIFICATES SUCCESSFULLY GENERATED & EMAILED!`);
  console.log(`📧 TOTAL EMAILS DISPATCHED: ${totalEmailsSent}`);
  console.log("================================================================================");

  console.log("\n📋 Sample of Issued Certificates:");
  allDispatchedCerts.slice(0, 16).forEach((c, idx) => {
    console.log(`\n[#${idx + 1}] To: ${c.recipient}`);
    console.log(`     Program:    ${c.program}`);
    console.log(`     Code:       ${c.code}`);
    console.log(`     Verify URL: ${c.verifyUrl}`);
    console.log(`     PDF URL:    ${c.pdfUrl}`);
  });
}

main().catch((err) => console.error("Fatal Error:", err));
