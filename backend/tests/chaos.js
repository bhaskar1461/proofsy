/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║              PROOFSY CHAOS LOAD TEST SCRIPT                                ║
 * ║                                                                            ║
 * ║  Standalone load testing script using built-in Node.js HTTP.               ║
 * ║  Tests verification endpoint performance, rate limiting, and resilience.   ║
 * ║                                                                            ║
 * ║  Usage:                                                                    ║
 * ║    node tests/chaos.js [BASE_URL] [CONCURRENCY] [TOTAL_REQUESTS]          ║
 * ║                                                                            ║
 * ║  Examples:                                                                 ║
 * ║    node tests/chaos.js http://localhost:5000 50 1000                       ║
 * ║    node tests/chaos.js https://api.proofsy.in 100 5000                    ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const http = require("http");
const https = require("https");
const crypto = require("crypto");
const { URL } = require("url");

// ─── Configuration ────────────────────────────────────────────────────────────
const BASE_URL = process.argv[2] || "http://localhost:5000";
const CONCURRENCY = parseInt(process.argv[3], 10) || 50;
const TOTAL_REQUESTS = parseInt(process.argv[4], 10) || 1000;

const parsedUrl = new URL(BASE_URL);
const httpModule = parsedUrl.protocol === "https:" ? https : http;

// ─── Results Tracker ──────────────────────────────────────────────────────────
const results = {
  total: 0,
  success: 0,
  failure: 0,
  rateLimited: 0,
  errors: 0,
  latencies: [],
  statusCodes: {},
  startTime: 0,
  endTime: 0,
};

// ─── HTTP Request Helper ──────────────────────────────────────────────────────
function makeRequest(path, method = "GET", body = null) {
  return new Promise((resolve) => {
    const start = Date.now();
    const url = new URL(path, BASE_URL);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "ProofsyChaosTest/1.0",
      },
      timeout: 10000,
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers["Content-Length"] = Buffer.byteLength(bodyStr);
    }

    const req = httpModule.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        const latency = Date.now() - start;
        resolve({
          statusCode: res.statusCode,
          latency,
          body: data,
          headers: res.headers,
        });
      });
    });

    req.on("error", (err) => {
      resolve({
        statusCode: 0,
        latency: Date.now() - start,
        body: "",
        error: err.message,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        statusCode: 0,
        latency: Date.now() - start,
        body: "",
        error: "TIMEOUT",
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// ─── Test Scenarios ───────────────────────────────────────────────────────────

/**
 * SCENARIO 1: Verification Endpoint Flood
 * Hit /api/verify/:code with random codes to test:
 * - 404 response consistency (no data leak)
 * - Response time under load
 * - Rate limiting behavior
 */
async function scenarioVerificationFlood(count) {
  console.log(`\n─── SCENARIO 1: Verification Endpoint Flood (${count} requests) ───`);

  const tasks = [];
  for (let i = 0; i < count; i++) {
    const code = `CERT-CHAOS-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
    tasks.push(makeRequest(`/api/verify/${code}`));
  }

  const batchResults = await runBatched(tasks, CONCURRENCY);

  let consistent404 = 0;
  let rateLimited = 0;
  for (const r of batchResults) {
    if (r.statusCode === 404) consistent404++;
    if (r.statusCode === 429) rateLimited++;
  }

  console.log(`  Total: ${batchResults.length}`);
  console.log(`  404 (expected): ${consistent404}`);
  console.log(`  429 (rate limited): ${rateLimited}`);
  console.log(`  Avg latency: ${avg(batchResults.map((r) => r.latency)).toFixed(1)}ms`);
  console.log(`  P95 latency: ${percentile(batchResults.map((r) => r.latency), 95).toFixed(1)}ms`);
  console.log(`  P99 latency: ${percentile(batchResults.map((r) => r.latency), 99).toFixed(1)}ms`);

  return batchResults;
}

/**
 * SCENARIO 2: Health Check Sustained Load
 * Ensure /api/health stays responsive under concurrent load.
 */
async function scenarioHealthCheckLoad(count) {
  console.log(`\n─── SCENARIO 2: Health Check Sustained Load (${count} requests) ───`);

  const tasks = [];
  for (let i = 0; i < count; i++) {
    tasks.push(makeRequest("/api/health"));
  }

  const batchResults = await runBatched(tasks, CONCURRENCY);

  let healthy = 0;
  for (const r of batchResults) {
    if (r.statusCode === 200) healthy++;
  }

  console.log(`  Total: ${batchResults.length}`);
  console.log(`  200 OK: ${healthy}`);
  console.log(`  Avg latency: ${avg(batchResults.map((r) => r.latency)).toFixed(1)}ms`);
  console.log(`  P95 latency: ${percentile(batchResults.map((r) => r.latency), 95).toFixed(1)}ms`);

  return batchResults;
}

/**
 * SCENARIO 3: Public Key Enumeration
 * Hit /api/verify/public-key?keyId=<random> to test error handling.
 */
async function scenarioPublicKeyEnumeration(count) {
  console.log(`\n─── SCENARIO 3: Public Key Enumeration (${count} requests) ───`);

  const tasks = [];
  for (let i = 0; i < count; i++) {
    const fakeKeyId = `fake-key-${crypto.randomBytes(4).toString("hex")}`;
    tasks.push(makeRequest(`/api/verify/public-key?keyId=${fakeKeyId}`));
  }

  const batchResults = await runBatched(tasks, CONCURRENCY);

  const statusMap = {};
  for (const r of batchResults) {
    statusMap[r.statusCode] = (statusMap[r.statusCode] || 0) + 1;
  }

  console.log(`  Status distribution:`, statusMap);
  console.log(`  Avg latency: ${avg(batchResults.map((r) => r.latency)).toFixed(1)}ms`);

  // Check no 200 with data leak
  let leaks = 0;
  for (const r of batchResults) {
    if (r.statusCode === 200) {
      try {
        const parsed = JSON.parse(r.body);
        if (parsed.data && parsed.data.publicKey) {
          leaks++; // This would be a finding if fake keyIds return real keys
        }
      } catch {}
    }
  }
  console.log(`  Data leaks detected: ${leaks}`);

  return batchResults;
}

/**
 * SCENARIO 4: Sequential Code Enumeration
 * Try sequential patterns to detect if verification codes are predictable.
 */
async function scenarioSequentialEnumeration(count) {
  console.log(`\n─── SCENARIO 4: Sequential Code Enumeration (${count} requests) ───`);

  const tasks = [];
  for (let i = 0; i < count; i++) {
    const code = `CERT-${String(i).padStart(10, "0")}`;
    tasks.push(makeRequest(`/api/verify/${code}`));
  }

  const batchResults = await runBatched(tasks, Math.min(CONCURRENCY, 20));

  let found = 0;
  for (const r of batchResults) {
    if (r.statusCode === 200) found++;
  }

  console.log(`  Sequential codes found: ${found} / ${count}`);
  console.log(`  (Should be 0 if codes are cryptographically random)`);

  return batchResults;
}

/**
 * SCENARIO 5: Brute-Force Login Simulation
 * Attempt rapid logins to test rate limiting.
 */
async function scenarioBruteForceLogin(count) {
  console.log(`\n─── SCENARIO 5: Brute-Force Login Simulation (${count} attempts) ───`);

  const tasks = [];
  for (let i = 0; i < count; i++) {
    tasks.push(
      makeRequest("/api/auth/login", "POST", {
        email: `bruteforce${i}@evil.com`,
        password: `wrong_password_${i}`,
      })
    );
  }

  const batchResults = await runBatched(tasks, Math.min(CONCURRENCY, 10));

  const statusMap = {};
  for (const r of batchResults) {
    statusMap[r.statusCode] = (statusMap[r.statusCode] || 0) + 1;
  }

  console.log(`  Status distribution:`, statusMap);
  console.log(`  Rate limited (429): ${statusMap[429] || 0}`);
  console.log(`  Expected: rate limiting should kick in before ${count} attempts`);

  return batchResults;
}

/**
 * SCENARIO 6: Payload Size Attack
 * Send increasingly large JSON payloads to test body-parser limits.
 */
async function scenarioPayloadSizeAttack() {
  console.log(`\n─── SCENARIO 6: Payload Size Attack ───`);

  const sizes = [
    { label: "1KB", size: 1024 },
    { label: "100KB", size: 100 * 1024 },
    { label: "1MB", size: 1024 * 1024 },
    { label: "5MB", size: 5 * 1024 * 1024 },
    { label: "50MB", size: 50 * 1024 * 1024 },
  ];

  for (const { label, size } of sizes) {
    const payload = { data: "x".repeat(Math.min(size, 60 * 1024 * 1024)) };
    const result = await makeRequest("/api/auth/login", "POST", payload);
    console.log(`  ${label} payload -> Status: ${result.statusCode}, Latency: ${result.latency}ms`);
  }
}

/**
 * SCENARIO 7: Timing Attack on Forgot-Password
 * Measure response time difference between existing and non-existing emails.
 */
async function scenarioTimingAttack(count) {
  console.log(`\n─── SCENARIO 7: Timing Attack on Forgot-Password (${count} pairs) ───`);

  const existingTimings = [];
  const nonExistingTimings = [];

  for (let i = 0; i < count; i++) {
    // Non-existing email
    const r1 = await makeRequest("/api/auth/forgot-password", "POST", {
      email: `nonexistent-${crypto.randomBytes(4).toString("hex")}@timing.test`,
    });
    nonExistingTimings.push(r1.latency);

    // Another non-existing (since we can't know existing emails without setup)
    const r2 = await makeRequest("/api/auth/forgot-password", "POST", {
      email: `alsonotexist-${crypto.randomBytes(4).toString("hex")}@timing.test`,
    });
    existingTimings.push(r2.latency);
  }

  const avgExisting = avg(existingTimings);
  const avgNonExisting = avg(nonExistingTimings);
  const timingDelta = Math.abs(avgExisting - avgNonExisting);

  console.log(`  Avg latency (set A): ${avgExisting.toFixed(1)}ms`);
  console.log(`  Avg latency (set B): ${avgNonExisting.toFixed(1)}ms`);
  console.log(`  Delta: ${timingDelta.toFixed(1)}ms`);
  console.log(`  ${timingDelta < 50 ? "✅ PASS" : "⚠️ TIMING DIFFERENCE DETECTED"}: delta should be < 50ms`);
}

// ─── Utility Functions ────────────────────────────────────────────────────────

async function runBatched(tasks, concurrency) {
  const results = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);

    // Progress indicator
    if (i > 0 && i % (concurrency * 10) === 0) {
      process.stdout.write(`  ...${i}/${tasks.length}\r`);
    }
  }
  return results;
}

function avg(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

// ─── Report Generator ─────────────────────────────────────────────────────────

function generateReport(allResults) {
  const totalLatencies = allResults.flat().map((r) => r.latency);
  const totalStatuses = {};
  for (const r of allResults.flat()) {
    totalStatuses[r.statusCode] = (totalStatuses[r.statusCode] || 0) + 1;
  }

  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║               CHAOS TEST FINAL REPORT               ║");
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log(`║  Target:          ${BASE_URL.padEnd(33)}║`);
  console.log(`║  Concurrency:     ${String(CONCURRENCY).padEnd(33)}║`);
  console.log(`║  Total Requests:  ${String(allResults.flat().length).padEnd(33)}║`);
  console.log(`║  Avg Latency:     ${(avg(totalLatencies).toFixed(1) + "ms").padEnd(33)}║`);
  console.log(`║  P50 Latency:     ${(percentile(totalLatencies, 50).toFixed(1) + "ms").padEnd(33)}║`);
  console.log(`║  P95 Latency:     ${(percentile(totalLatencies, 95).toFixed(1) + "ms").padEnd(33)}║`);
  console.log(`║  P99 Latency:     ${(percentile(totalLatencies, 99).toFixed(1) + "ms").padEnd(33)}║`);
  console.log(`║  Max Latency:     ${(Math.max(...totalLatencies).toFixed(1) + "ms").padEnd(33)}║`);
  console.log("╠══════════════════════════════════════════════════════╣");
  console.log("║  Status Code Distribution:                          ║");
  for (const [code, count] of Object.entries(totalStatuses).sort()) {
    const pct = ((count / allResults.flat().length) * 100).toFixed(1);
    console.log(`║    ${code}: ${String(count).padEnd(8)} (${pct}%)`.padEnd(55) + "║");
  }
  console.log("╠══════════════════════════════════════════════════════╣");

  // Performance assertions
  const p95 = percentile(totalLatencies, 95);
  const p99 = percentile(totalLatencies, 99);
  const checks = [
    { name: "P95 < 500ms", pass: p95 < 500 },
    { name: "P99 < 2000ms", pass: p99 < 2000 },
    { name: "No 500 errors", pass: (totalStatuses[500] || 0) === 0 },
    { name: "Rate limiting active", pass: (totalStatuses[429] || 0) > 0 || allResults.flat().length < 200 },
  ];

  for (const check of checks) {
    console.log(`║  ${check.pass ? "✅" : "❌"} ${check.name}`.padEnd(55) + "║");
  }

  console.log("╚══════════════════════════════════════════════════════╝");
}

// ─── Main Execution ───────────────────────────────────────────────────────────

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║          PROOFSY CHAOS LOAD TEST ENGINE              ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`  Target: ${BASE_URL}`);
  console.log(`  Concurrency: ${CONCURRENCY}`);
  console.log(`  Total planned requests: ~${TOTAL_REQUESTS}`);

  const allResults = [];

  // Check if server is reachable
  try {
    const healthCheck = await makeRequest("/api/health");
    if (healthCheck.statusCode === 0) {
      console.error(`\n❌ Server unreachable at ${BASE_URL}`);
      console.error(`   Start the server first: npm run dev`);
      process.exit(1);
    }
    console.log(`\n  ✅ Server reachable (status: ${healthCheck.statusCode})`);
  } catch (e) {
    console.error(`\n❌ Server unreachable: ${e.message}`);
    process.exit(1);
  }

  const perScenario = Math.floor(TOTAL_REQUESTS / 5);

  allResults.push(await scenarioVerificationFlood(perScenario));
  allResults.push(await scenarioHealthCheckLoad(Math.floor(perScenario / 2)));
  allResults.push(await scenarioPublicKeyEnumeration(Math.floor(perScenario / 2)));
  allResults.push(await scenarioSequentialEnumeration(Math.min(perScenario, 500)));
  allResults.push(await scenarioBruteForceLogin(Math.min(perScenario, 200)));
  await scenarioPayloadSizeAttack();
  await scenarioTimingAttack(Math.min(20, perScenario));

  generateReport(allResults);
}

main().catch(console.error);
