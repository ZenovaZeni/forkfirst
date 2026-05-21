import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const DEFAULT_PORT = 3062;
const BASE_URL = process.env.FORKFIRST_BASE_URL ?? `http://127.0.0.1:${DEFAULT_PORT}`;
const PROMPTS = [
  {
    label: "receipt-scanner",
    prompt: "I want to build a local-first receipt scanner that tracks expenses, lets me review parsed receipts, and exports CSV for taxes.",
    expectedTerms: ["receipt", "expense"]
  },
  {
    label: "shopify-dashboard",
    prompt: "I want a dashboard for tracking Shopify store profit, ad spend, orders, and inventory.",
    expectedTerms: ["shopify", "store", "dashboard", "profit"]
  },
  {
    label: "salon-booking",
    prompt: "I want to make a booking app for a small salon.",
    expectedTerms: ["booking", "appointment", "calendar", "salon"]
  },
  {
    label: "parent-sports",
    prompt: "I want to build a thing that helps parents organize kids sports schedules.",
    expectedTerms: ["sports", "schedule", "calendar", "team"]
  }
];
const API_TIMEOUT_MS = Number(process.env.FORKFIRST_SMOKE_API_TIMEOUT_MS ?? 45_000);
const UI_TIMEOUT_MS = Number(process.env.FORKFIRST_SMOKE_UI_TIMEOUT_MS ?? 150_000);
const UI_RESULT_TIMEOUT_MS = Math.min(UI_TIMEOUT_MS, 75_000);
const UI_HANDOFF_TIMEOUT_MS = Math.min(UI_TIMEOUT_MS, 90_000);
const UI_DOWNLOAD_TIMEOUT_MS = Math.min(UI_TIMEOUT_MS, 30_000);

const GENERIC_BUILD_PACK_PATTERNS = [
  /PrimaryItem/i,
  /UserInput/i,
  /placeholder workflow/i,
  /one working product loop/i,
  /User starts the primary task/i,
  /turn the selected repo into the user's product idea/i,
  /<UNTRUSTED_REPO_CONTENT>/i
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logStep(message) {
  console.error(`[smoke] ${message}`);
}

async function withTimeout(label, timeoutMs, task) {
  let timer;
  try {
    return await Promise.race([
      task(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetchWithTimeout(url, { method: "GET" }, 2500);
      if (response.ok) return true;
    } catch {
      // Keep polling until timeout.
    }
    await delay(750);
  }
  return false;
}

function startDevServerIfNeeded() {
  if (process.env.FORKFIRST_BASE_URL) return null;
  const isWindows = process.platform === "win32";
  const child = spawn(
    isWindows ? "cmd.exe" : "npm",
    isWindows
      ? ["/d", "/s", "/c", `npm run dev -- --hostname 127.0.0.1 --port ${DEFAULT_PORT}`]
      : ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(DEFAULT_PORT)],
    {
      cwd: process.cwd(),
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"]
    }
  );
  child.stdout.on("data", () => undefined);
  child.stderr.on("data", () => undefined);
  return child;
}

function stopDevServer(child) {
  if (!child) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  child.kill("SIGTERM");
}

function repoText(repo) {
  return [
    repo?.fullName,
    repo?.description,
    repo?.summary,
    ...(repo?.topics ?? []),
    ...(repo?.score?.reasons ?? [])
  ].filter(Boolean).join(" ").toLowerCase();
}

function hasExpectedTerm(repo, expectedTerms) {
  const text = repoText(repo);
  return expectedTerms.some((term) => text.includes(term));
}

async function runApiPromptCheck(testCase) {
  const started = Date.now();
  const response = await fetchWithTimeout(`${BASE_URL}/api/idea-check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: testCase.prompt,
      aiProvider: "openai"
    })
  }, API_TIMEOUT_MS);

  if (!response.ok) {
    return {
      label: testCase.label,
      ok: false,
      error: `API returned ${response.status}`,
      durationMs: Date.now() - started
    };
  }

  const result = await response.json();
  const topRepo = result.repos?.[0] ?? null;
  const score = topRepo?.score?.total ?? null;
  const termFit = hasExpectedTerm(topRepo, testCase.expectedTerms);
  const closeMatches = (result.repos ?? []).filter((repo) => (repo.score?.total ?? 0) >= 75).length;
  const ok = Boolean(topRepo) && termFit && (score === null || score >= 55);

  return {
    label: testCase.label,
    ok,
    verdict: result.verdictLabel,
    mode: result.mode,
    topRepo: topRepo?.fullName ?? null,
    score,
    closeMatches,
    termFit,
    durationMs: Date.now() - started,
    warning: ok ? null : "Top repo did not clearly match expected domain terms or score floor."
  };
}

async function runUiHandoffSmoke(testCase, outputDir) {
  const downloadDir = path.join(outputDir, "ui-download");
  await fs.mkdir(downloadDir, { recursive: true });
  const browser = await chromium.launch({ headless: true, downloadsPath: downloadDir });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleMessages = [];
  const dialogs = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.accept();
  });

  try {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 20_000 });
    await page.waitForTimeout(700);
    const startButton = page.locator("button:has-text(\"Start free\")");
    if (await startButton.count()) await startButton.click({ timeout: 5000 });
    await page.waitForTimeout(500);

    if (await page.locator("textarea").count()) {
      await page.locator("textarea").first().fill(testCase.prompt);
    } else {
      await page.locator("[contenteditable=\"true\"]").first().fill(testCase.prompt);
    }
    await page.locator("button:has-text(\"Check it\")").click({ timeout: 10_000 });
    logStep("UI waiting for repo result");
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes("No strong GitHub match yet") || text.includes("Use") && text.includes("FIT");
    }, null, { timeout: UI_RESULT_TIMEOUT_MS });

    const resultText = await page.locator("body").innerText({ timeout: 10_000 });
    const topRepo = (resultText.match(/START HERE[\s\S]*?\n([^\n]+\/[A-Za-z0-9_.-]+)/) || resultText.match(/I'd start with\s+([^\.\s]+\/[^\.\s]+)/) || [])[1] ?? null;
    const score = Number((resultText.match(/(\d+)%\s*FIT/) || [])[1] ?? 0) || null;

    if (!(await page.locator("button:has-text(\"Use\")").count())) {
      throw new Error("No Use button appeared after prompt result.");
    }

    await page.locator("button:has-text(\"Use\")").first().click({ timeout: 10_000 });
    logStep("UI waiting for builder questions or handoff card");
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes("Skip and create simple handoff") || text.includes("Download zip") || text.includes("AI-builder handoff");
    }, null, { timeout: UI_HANDOFF_TIMEOUT_MS });

    const skipHandoffButton = page.locator("button:has-text(\"Skip and create simple handoff\")");
    if (await skipHandoffButton.count()) {
      logStep("UI skipping builder questions");
      await skipHandoffButton.first().click({ timeout: 10_000 });
      await page.waitForFunction(() => {
        const text = document.body.innerText;
        return text.includes("Download zip") || text.includes("AI-builder handoff");
      }, null, { timeout: UI_HANDOFF_TIMEOUT_MS });
    }

    logStep("UI downloading Build Pack zip");
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: UI_DOWNLOAD_TIMEOUT_MS }),
      page.locator("button:has-text(\"Download zip\")").first().click({ timeout: 10_000 })
    ]);
    const zipPath = path.join(downloadDir, await download.suggestedFilename());
    await download.saveAs(zipPath);

    const pageText = await page.locator("body").innerText({ timeout: 10_000 });
    return {
      ok: dialogs.length === 0 && Boolean(zipPath),
      topRepo,
      score,
      zipPath,
      dialogs,
      consoleMessages: consoleMessages.slice(0, 10),
      hasHandoff: pageText.includes("AI-builder handoff")
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      dialogs,
      consoleMessages: consoleMessages.slice(0, 10)
    };
  } finally {
    await browser.close().catch(() => undefined);
  }
}

async function inspectZipWithPowerShell(zipPath) {
  if (!zipPath) {
    return { ok: false, warning: "No Build Pack zip was downloaded." };
  }
  if (process.platform !== "win32") {
    return { ok: true, skipped: true, warning: "Zip inspection is currently implemented for Windows PowerShell runs." };
  }
  const extractDir = `${zipPath.replace(/\.zip$/i, "")}-unzipped`;
  await fs.rm(extractDir, { recursive: true, force: true });
  await new Promise((resolve, reject) => {
    const child = spawn("powershell", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      `Expand-Archive -LiteralPath ${JSON.stringify(zipPath)} -DestinationPath ${JSON.stringify(extractDir)} -Force`
    ], { stdio: "ignore" });
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`Expand-Archive failed with ${code}`)));
    child.on("error", reject);
  });

  const files = await fs.readdir(extractDir);
  const markdownFiles = files.filter((file) => file.toLowerCase().endsWith(".md"));
  const combined = (await Promise.all(markdownFiles.map(async (file) => fs.readFile(path.join(extractDir, file), "utf8")))).join("\n\n");
  const missing = ["STARTER_REPO.md", "PRD.md", "BUILD_PLAN.md", "REPO_STARTER_NOTES.md", "AGENTS.md", "CLAUDE.md"]
    .filter((file) => !files.includes(file));
  const genericHits = GENERIC_BUILD_PACK_PATTERNS
    .filter((pattern) => pattern.test(combined))
    .map((pattern) => pattern.source);
  const domainHits = ["receipt", "expense", "csv", "tax", "parsed"].filter((term) => combined.toLowerCase().includes(term));

  return {
    ok: missing.length === 0 && genericHits.length === 0 && domainHits.length >= 3,
    extractDir,
    files: markdownFiles,
    missing,
    genericHits,
    domainHits
  };
}

function printResult(summary) {
  console.log(JSON.stringify(summary, null, 2));
  const failedApi = summary.apiChecks.filter((item) => !item.ok);
  if (!summary.uiHandoff.ok || !summary.zipInspection.ok || failedApi.length) {
    process.exitCode = 1;
  }
}

const server = startDevServerIfNeeded();
const outputDir = path.join(os.tmpdir(), `forkfirst-launch-smoke-${Date.now()}`);
await fs.mkdir(outputDir, { recursive: true });

try {
  const ready = await waitForServer(BASE_URL);
  if (!ready) throw new Error(`ForkFirst did not become ready at ${BASE_URL}`);

  const apiChecks = await Promise.all(PROMPTS.map(async (testCase) => {
    logStep(`API prompt: ${testCase.label}`);
    try {
      return await withTimeout(`API prompt ${testCase.label}`, API_TIMEOUT_MS + 10_000, () => runApiPromptCheck(testCase));
    } catch (error) {
      return {
        label: testCase.label,
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }));

  logStep(`UI handoff: ${PROMPTS[0].label}`);
  const uiHandoff = await runUiHandoffSmoke(PROMPTS[0], outputDir);
  logStep("Inspecting downloaded Build Pack");
  const zipInspection = await inspectZipWithPowerShell(uiHandoff.zipPath);

  printResult({
    baseUrl: BASE_URL,
    outputDir,
    apiChecks,
    uiHandoff,
    zipInspection
  });
} finally {
  stopDevServer(server);
}
