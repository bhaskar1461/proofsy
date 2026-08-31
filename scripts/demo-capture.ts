/**
 * Proofsy Investor Demo — Auto-Capture Script
 *
 * Records real UI footage for each scene of the investor demo video.
 * Uses Playwright's built-in video recording (one .webm per scene).
 *
 * Prerequisites:
 *   1. Backend running on http://localhost:8001
 *   2. Frontend running on http://localhost:3001
 *
 * Usage:
 *   npx tsx scripts/demo-capture.ts
 *
 * Output:
 *   scripts/demo-recordings/scene-XX-*.webm  — one per scene
 *   scripts/demo-recordings/manifest.json    — scene metadata
 */

import { chromium, BrowserContext, Page } from "playwright";
import * as fs from "fs";
import * as path from "path";

// ─── Config ────────────────────────────────────────────────────────
const BASE_URL = "http://localhost:3001";
const API_URL = "http://localhost:8001/api";
const OUTPUT_DIR = path.join(process.cwd(), "scripts", "demo-recordings");
const VIEWPORT = { width: 1920, height: 1080 };
const SLOW_MO = 80; // ms between actions — makes recordings look natural

interface SceneManifest {
  scene: number;
  name: string;
  filename: string;
  durationMs: number;
  status: "recorded" | "skipped" | "error";
  error?: string;
}

const manifest: SceneManifest[] = [];

// ─── Helpers ───────────────────────────────────────────────────────
async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Create a fresh browser context with video recording pointed at a named directory. */
async function createRecordingContext(
  browser: any,
  sceneName: string
): Promise<{ context: BrowserContext; page: Page; videoDir: string }> {
  const videoDir = path.join(OUTPUT_DIR, `_tmp_${sceneName}`);
  fs.mkdirSync(videoDir, { recursive: true });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: videoDir, size: VIEWPORT },
    colorScheme: "light",
  });

  const page = await context.newPage();
  return { context, page, videoDir };
}

/** Close context, rename the recorded video to the final scene filename. */
async function finishRecording(
  context: BrowserContext,
  page: Page,
  videoDir: string,
  finalName: string
): Promise<string> {
  const video = page.video();
  await page.close();
  await context.close();

  const destPath = path.join(OUTPUT_DIR, finalName);
  const videoPath = video ? await video.path() : null;

  if (videoPath && fs.existsSync(videoPath)) {
    fs.renameSync(videoPath, destPath);
  }

  // Cleanup tmp dir
  try {
    fs.rmSync(videoDir, { recursive: true, force: true });
  } catch {}

  return destPath;
}

/** Login to the UI using the one-click demo button — simulates real user flow. */
async function loginViaDemoButton(page: Page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await sleep(1500); // Let UI animations settle
  const demoBtn = page.locator("button").filter({ hasText: /Explore Demo Workspace/i });
  await demoBtn.waitFor({ state: "visible", timeout: 10000 });
  await demoBtn.click();
  await page.waitForURL((url) => url.pathname === "/" || url.pathname === "", { timeout: 15000 });
  await sleep(2500); // Wait for dashboard stats & charts to load
}

// ─── Scene Recorders ───────────────────────────────────────────────

async function recordScene02(browser: any) {
  console.log("\n🎬 Scene 2 — Landing Page → Dashboard");
  const start = Date.now();
  const { context, page, videoDir } = await createRecordingContext(browser, "scene-02");

  try {
    // 1. Show the public landing page
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await sleep(3500); // Hero animations & visual impact

    // 2. Scroll down smoothly to show features
    await page.evaluate(() => window.scrollTo({ top: 650, behavior: "smooth" }));
    await sleep(2500);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await sleep(1500);

    // 3. Navigate to login and click Demo
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
    await sleep(2000);
    const demoBtn = page.locator("button").filter({ hasText: /Explore Demo Workspace/i });
    await demoBtn.click();
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "", { timeout: 15000 });
    await sleep(3500); // Dashboard load with live stat cards

    // 4. Smoothly scroll the dashboard to showcase metrics & event pipeline
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
    await sleep(2500);

    const finalPath = await finishRecording(context, page, videoDir, "scene-02-landing-dashboard.webm");
    manifest.push({
      scene: 2,
      name: "Landing + Dashboard",
      filename: "scene-02-landing-dashboard.webm",
      durationMs: Date.now() - start,
      status: "recorded",
    });
    console.log(`  ✅ Saved: ${finalPath}`);
  } catch (err: any) {
    console.error(`  ❌ Error: ${err.message}`);
    manifest.push({ scene: 2, name: "Landing + Dashboard", filename: "", durationMs: 0, status: "error", error: err.message });
    try { await context.close(); } catch {}
  }
}

async function recordScene03(browser: any) {
  console.log("\n🎬 Scene 3 — Single Certificate Issuance");
  const start = Date.now();
  const { context, page, videoDir } = await createRecordingContext(browser, "scene-03");

  try {
    await loginViaDemoButton(page);

    // Navigate to create event
    await page.goto(`${BASE_URL}/events/new`, { waitUntil: "networkidle" });
    await sleep(2500);

    // Step 1: Template selection (first starter template is default selected)
    const continueBtn1 = page.locator("button").filter({ hasText: "Continue →" });
    if (await continueBtn1.isVisible({ timeout: 5000 })) {
      await continueBtn1.click();
      await sleep(1500);
    }

    // Step 2: Event details — fill form
    await page.fill('input[placeholder="e.g. Q3 Engineering All-Hands"]', "National Tech Summit 2026");
    await sleep(400);
    await page.fill('input[type="date"]', "2026-09-15");
    await sleep(400);
    await page.fill('input[placeholder="e.g. 10 Hours, 3 Days"]', "3 Days");
    await sleep(400);
    await page.fill('input[placeholder="e.g. Acme Corp Training Dept."]', "Innovation & Technology Cell");
    await sleep(800);

    // Click Continue to Step 3
    const continueBtn2 = page.locator("button").filter({ hasText: "Continue →" });
    await continueBtn2.click();
    await sleep(1500);

    // Step 3: Add recipient manually
    await page.fill('input[placeholder="Full Name"]', "Aditya Kumar");
    await sleep(400);
    await page.fill('input[placeholder="Email Address"]', "aditya.kumar@demo-university.edu");
    await sleep(400);

    const addBtn = page.locator("button").filter({ hasText: /^Add$/ });
    await addBtn.click();
    await sleep(1200);

    // Click Continue to Step 4 (Review)
    const continueBtn3 = page.locator("button").filter({ hasText: "Continue →" });
    await continueBtn3.click();
    await sleep(2000);

    // Step 4: Review & Submit
    const submitBtn = page.locator("button").filter({ hasText: "Create Event & Generate Certificates" });
    if (await submitBtn.isVisible({ timeout: 5000 })) {
      await submitBtn.click();
      await sleep(4000); // Creation + generation
    }

    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "", { timeout: 15000 }).catch(() => {});
    await sleep(3000); // Show dashboard with new event

    const finalPath = await finishRecording(context, page, videoDir, "scene-03-single-issuance.webm");
    manifest.push({
      scene: 3,
      name: "Single Issuance",
      filename: "scene-03-single-issuance.webm",
      durationMs: Date.now() - start,
      status: "recorded",
    });
    console.log(`  ✅ Saved: ${finalPath}`);
  } catch (err: any) {
    console.error(`  ❌ Error: ${err.message}`);
    manifest.push({ scene: 3, name: "Single Issuance", filename: "", durationMs: 0, status: "error", error: err.message });
    try { await context.close(); } catch {}
  }
}

async function recordScene04(browser: any) {
  console.log("\n🎬 Scene 4 — Batch CSV Issuance");
  const start = Date.now();
  const { context, page, videoDir } = await createRecordingContext(browser, "scene-04");

  try {
    await loginViaDemoButton(page);

    // Click "View Event" button on the first event card
    const viewEventBtn = page.locator("button").filter({ hasText: "View Event" }).first();
    await viewEventBtn.waitFor({ state: "visible", timeout: 10000 });
    await viewEventBtn.click();
    await page.waitForURL(/\/events\/.+/, { timeout: 15000 });
    await sleep(2500);

    // Click "Import CSV" button
    const importCsvBtn = page.locator("button").filter({ hasText: "Import CSV" });
    await importCsvBtn.waitFor({ state: "visible", timeout: 5000 });
    await importCsvBtn.click();
    await sleep(1500);

    // Step 1: Upload CSV file
    const csvPath = path.join(process.cwd(), "scripts", "demo-recipients.csv");
    const fileInput = page.locator("input[type='file'][accept='.csv']");
    await fileInput.setInputFiles(csvPath);
    await sleep(2000); // Wizard auto-parses and transitions to preview

    // Step 2: Preview & Column Mapping
    await sleep(2000); // Show preview table
    const continueBtn = page.locator("button").filter({ hasText: "Continue →" });
    await continueBtn.click();
    await sleep(1500);

    // Step 3: Confirm Generation
    const generateBtn = page.locator("button").filter({ hasText: /Generate Certificates/i });
    await generateBtn.click();
    await sleep(2000);

    // Step 4: Progress bar & completion
    const doneBtn = page.locator("button").filter({ hasText: "Done" });
    await doneBtn.waitFor({ state: "visible", timeout: 30000 });
    await sleep(2000);
    await doneBtn.click();
    await sleep(3000); // Show refreshed event detail with all 8+ certificates in table

    const finalPath = await finishRecording(context, page, videoDir, "scene-04-batch-issuance.webm");
    manifest.push({
      scene: 4,
      name: "Batch CSV Issuance",
      filename: "scene-04-batch-issuance.webm",
      durationMs: Date.now() - start,
      status: "recorded",
    });
    console.log(`  ✅ Saved: ${finalPath}`);
  } catch (err: any) {
    console.error(`  ❌ Error: ${err.message}`);
    manifest.push({ scene: 4, name: "Batch CSV Issuance", filename: "", durationMs: 0, status: "error", error: err.message });
    try { await context.close(); } catch {}
  }
}

async function recordScene05(browser: any) {
  console.log("\n🎬 Scene 5 — Certificate Verification");
  const start = Date.now();
  const { context, page, videoDir } = await createRecordingContext(browser, "scene-05");

  try {
    // 1. First login and navigate into an event to get an issued certificate code
    await loginViaDemoButton(page);

    const viewEventBtn = page.locator("button").filter({ hasText: "View Event" }).first();
    await viewEventBtn.waitFor({ state: "visible", timeout: 10000 });
    await viewEventBtn.click();
    await page.waitForURL(/\/events\/.+/, { timeout: 15000 });
    await sleep(2000);

    // If no certificates exist, generate via CSV wizard quickly
    const certRows = page.locator("table tbody tr");
    const certCount = await certRows.count();

    if (certCount === 0) {
      const importCsvBtn = page.locator("button").filter({ hasText: "Import CSV" });
      await importCsvBtn.click();
      await sleep(1000);
      const csvPath = path.join(process.cwd(), "scripts", "demo-recipients.csv");
      await page.locator("input[type='file'][accept='.csv']").setInputFiles(csvPath);
      await sleep(1500);
      await page.locator("button").filter({ hasText: "Continue →" }).click();
      await sleep(1000);
      await page.locator("button").filter({ hasText: /Generate Certificates/i }).click();
      const doneBtn = page.locator("button").filter({ hasText: "Done" });
      await doneBtn.waitFor({ state: "visible", timeout: 30000 });
      await doneBtn.click();
      await sleep(2000);
    }

    // Grab the first certificate's verification code from the 3rd column
    let verificationCode = "";
    const codeCells = page.locator("table tbody tr td:nth-child(3)");
    if (await codeCells.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      verificationCode = ((await codeCells.first().textContent()) || "").trim();
    }

    console.log(`  🔍 Verifying credential code: ${verificationCode || "(sample)"}`);

    // Navigate to public verification page
    if (verificationCode) {
      await page.goto(`${BASE_URL}/verify?code=${encodeURIComponent(verificationCode)}`, { waitUntil: "networkidle" });
    } else {
      await page.goto(`${BASE_URL}/verify`, { waitUntil: "networkidle" });
    }

    await sleep(4000); // Cryptographic signature check animation and "Verified" badge

    // Scroll down to showcase cryptographic proof, issuer identity, and metadata
    await page.evaluate(() => window.scrollTo({ top: 350, behavior: "smooth" }));
    await sleep(3500);

    const finalPath = await finishRecording(context, page, videoDir, "scene-05-verification.webm");
    manifest.push({
      scene: 5,
      name: "Verification",
      filename: "scene-05-verification.webm",
      durationMs: Date.now() - start,
      status: "recorded",
    });
    console.log(`  ✅ Saved: ${finalPath}`);
  } catch (err: any) {
    console.error(`  ❌ Error: ${err.message}`);
    manifest.push({ scene: 5, name: "Verification", filename: "", durationMs: 0, status: "error", error: err.message });
    try { await context.close(); } catch {}
  }
}

async function recordScene06(browser: any) {
  console.log("\n🎬 Scene 6 — Multi-Tenant Isolation");
  const start = Date.now();
  const { context, page, videoDir } = await createRecordingContext(browser, "scene-06");

  try {
    // ── Tenant 1 Login ──
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
    await sleep(1500);
    const demoBtn1 = page.locator("button").filter({ hasText: /Explore Demo Workspace/i });
    await demoBtn1.click();
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "", { timeout: 15000 });
    await sleep(3000);

    // Show Tenant 1 Workspace
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
    await sleep(2000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await sleep(1000);

    // Logout Tenant 1
    const logoutBtn = page.locator("button").filter({ hasText: /Logout/i });
    if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutBtn.click();
      await sleep(2000);
    } else {
      await page.evaluate(() => {
        localStorage.clear();
      });
      await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
    }

    // ── Tenant 2 Login ──
    await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => {});
    await sleep(1500);
    const demoBtn2 = page.locator("button").filter({ hasText: /Explore Demo Workspace/i });
    await demoBtn2.click();
    await page.waitForURL((url) => url.pathname === "/" || url.pathname === "", { timeout: 15000 });
    await sleep(3000);

    // Show Tenant 2's isolated environment
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: "smooth" }));
    await sleep(2500);

    const finalPath = await finishRecording(context, page, videoDir, "scene-06-multi-tenant.webm");
    manifest.push({
      scene: 6,
      name: "Multi-Tenant Isolation",
      filename: "scene-06-multi-tenant.webm",
      durationMs: Date.now() - start,
      status: "recorded",
    });
    console.log(`  ✅ Saved: ${finalPath}`);
  } catch (err: any) {
    console.error(`  ❌ Error: ${err.message}`);
    manifest.push({ scene: 6, name: "Multi-Tenant Isolation", filename: "", durationMs: 0, status: "error", error: err.message });
    try { await context.close(); } catch {}
  }
}

async function recordScene07(browser: any) {
  console.log("\n🎬 Scene 7 — Dashboard Management & Revocation");
  const start = Date.now();
  const { context, page, videoDir } = await createRecordingContext(browser, "scene-07");

  try {
    await loginViaDemoButton(page);

    // Dashboard Overview
    await sleep(2500);
    await page.evaluate(() => window.scrollTo({ top: 250, behavior: "smooth" }));
    await sleep(2000);

    // View Event
    const viewEventBtn = page.locator("button").filter({ hasText: "View Event" }).first();
    await viewEventBtn.waitFor({ state: "visible", timeout: 10000 });
    await viewEventBtn.click();
    await page.waitForURL(/\/events\/.+/, { timeout: 15000 });
    await sleep(2500);

    // Ensure there are certificates in table
    const certRows = page.locator("table tbody tr");
    if ((await certRows.count()) === 0) {
      const importCsvBtn = page.locator("button").filter({ hasText: "Import CSV" });
      await importCsvBtn.click();
      await sleep(1000);
      const csvPath = path.join(process.cwd(), "scripts", "demo-recipients.csv");
      await page.locator("input[type='file'][accept='.csv']").setInputFiles(csvPath);
      await sleep(1500);
      await page.locator("button").filter({ hasText: "Continue →" }).click();
      await sleep(1000);
      await page.locator("button").filter({ hasText: /Generate Certificates/i }).click();
      const doneBtn = page.locator("button").filter({ hasText: "Done" });
      await doneBtn.waitFor({ state: "visible", timeout: 30000 });
      await doneBtn.click();
      await sleep(2000);
    }

    // Scroll to see certificates
    await page.evaluate(() => window.scrollTo({ top: 250, behavior: "smooth" }));
    await sleep(1500);

    // Select the first certificate checkbox
    const firstCheckbox = page.locator("table tbody tr input[type='checkbox']").first();
    if (await firstCheckbox.isVisible({ timeout: 5000 })) {
      await firstCheckbox.click();
      await sleep(1000);
    }

    // Click "Revoke Selected (1)" button
    const revokeSelectedBtn = page.locator("button").filter({ hasText: /Revoke Selected/i });
    if (await revokeSelectedBtn.isVisible({ timeout: 3000 })) {
      await revokeSelectedBtn.click();
      await sleep(1500);

      // Fill revocation reason in modal
      const reasonTextarea = page.locator("textarea");
      if (await reasonTextarea.isVisible({ timeout: 3000 })) {
        await reasonTextarea.fill("Issued in error — demo credential revocation test");
        await sleep(1000);
      }

      // Click "Confirm Revoke"
      const confirmBtn = page.locator("button").filter({ hasText: "Confirm Revoke" });
      if (await confirmBtn.isVisible({ timeout: 3000 })) {
        await confirmBtn.click();
        await sleep(3000); // Wait for status update
      }
    }

    // Show the updated status badge ("revoked" in red)
    await sleep(2500);

    const finalPath = await finishRecording(context, page, videoDir, "scene-07-dashboard-management.webm");
    manifest.push({
      scene: 7,
      name: "Dashboard & Revocation",
      filename: "scene-07-dashboard-management.webm",
      durationMs: Date.now() - start,
      status: "recorded",
    });
    console.log(`  ✅ Saved: ${finalPath}`);
  } catch (err: any) {
    console.error(`  ❌ Error: ${err.message}`);
    manifest.push({ scene: 7, name: "Dashboard & Revocation", filename: "", durationMs: 0, status: "error", error: err.message });
    try { await context.close(); } catch {}
  }
}

async function recordScene09(browser: any) {
  console.log("\n🎬 Scene 9 — Close (Landing Hero + Logo)");
  const start = Date.now();
  const { context, page, videoDir } = await createRecordingContext(browser, "scene-09");

  try {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await sleep(4000); // Full hero glow & branding impact

    // Subtle scroll
    await page.evaluate(() => window.scrollTo({ top: 120, behavior: "smooth" }));
    await sleep(3000);

    const finalPath = await finishRecording(context, page, videoDir, "scene-09-close.webm");
    manifest.push({
      scene: 9,
      name: "Close / CTA",
      filename: "scene-09-close.webm",
      durationMs: Date.now() - start,
      status: "recorded",
    });
    console.log(`  ✅ Saved: ${finalPath}`);
  } catch (err: any) {
    console.error(`  ❌ Error: ${err.message}`);
    manifest.push({ scene: 9, name: "Close / CTA", filename: "", durationMs: 0, status: "error", error: err.message });
    try { await context.close(); } catch {}
  }
}

// ─── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║   Proofsy Investor Demo — Auto-Capture Script   ║");
  console.log("╚══════════════════════════════════════════════════╝");

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log("\n🔍 Checking services...");
  try {
    const healthRes = await fetch(`${API_URL}/health`);
    if (!healthRes.ok) throw new Error(`Backend health check failed: ${healthRes.status}`);
    console.log("  ✅ Backend (port 8001) — Online");
  } catch (err: any) {
    console.error(`  ❌ Backend (port 8001) — OFFLINE. Start with: cd backend && npm run dev`);
    process.exit(1);
  }

  try {
    const frontRes = await fetch(BASE_URL);
    if (!frontRes.ok) throw new Error(`Frontend returned ${frontRes.status}`);
    console.log("  ✅ Frontend (port 3001) — Online");
  } catch (err: any) {
    console.error(`  ❌ Frontend (port 3001) — OFFLINE. Start with: cd frontend && npm run dev`);
    process.exit(1);
  }

  console.log("\n🚀 Launching Chromium (1920×1080)...");
  const browser = await chromium.launch({
    headless: false,
    slowMo: SLOW_MO,
    args: ["--window-size=1920,1080", "--disable-blink-features=AutomationControlled"],
  });

  console.log("  ✅ Browser launched\n");

  // Record all scenes
  await recordScene02(browser);
  await recordScene03(browser);
  await recordScene04(browser);
  await recordScene05(browser);
  await recordScene06(browser);
  await recordScene07(browser);
  await recordScene09(browser);

  // Write manifest
  const manifestPath = path.join(OUTPUT_DIR, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║                   RECORDING SUMMARY              ║");
  console.log("╚══════════════════════════════════════════════════╝");

  const recorded = manifest.filter((s) => s.status === "recorded");
  const errors = manifest.filter((s) => s.status === "error");

  console.log(`\n  ✅ Recorded: ${recorded.length} scenes`);
  if (errors.length) console.log(`  ❌ Errors:   ${errors.length} scenes`);

  console.log("\n  Files:");
  for (const s of manifest) {
    const duration = s.durationMs ? `${(s.durationMs / 1000).toFixed(1)}s` : "—";
    const icon = s.status === "recorded" ? "📹" : "❌";
    console.log(`    ${icon} Scene ${s.scene}: ${s.name} → ${s.filename || "(none)"} [${duration}]`);
  }

  console.log(`\n  📄 Manifest: ${manifestPath}`);
  console.log(`  📁 Output:   ${OUTPUT_DIR}\n`);

  await browser.close();
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err);
  process.exit(1);
});
