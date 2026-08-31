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

    req.on("error", (err) => reject(err));
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  console.log("🔑 Logging in to https://proofsy.tech ...");
  const authRes = await apiRequest("POST", "/auth/login", {
    email: "authority_1788101247491@proofsy.tech",
    password: "ProofsySecureAdmin2026!",
  });

  const token = authRes.token || authRes.data?.token;
  if (!token) {
    console.error("Failed to authenticate:", authRes);
    return;
  }

  console.log("✓ Logged in. Fetching events...");
  const eventsRes = await apiRequest("GET", "/events", null, token);
  const events = eventsRes.data || [];
  console.log(`✓ Found ${events.length} events.`);

  let totalSent = 0;
  for (const event of events) {
    console.log(`\n📧 Dispatching emails for Event: "${event.name}" (ID: ${event.id})...`);
    const emailRes = await apiRequest("POST", "/certificates/send-emails", { eventId: event.id }, token);
    console.log("  Result:", emailRes.message || emailRes.data || emailRes);
    if (emailRes.data?.sent) {
      totalSent += emailRes.data.sent;
    }
  }

  console.log(`\n🎉 Total Emails Dispatched to inboxes: ${totalSent}`);
}

main().catch(console.error);
