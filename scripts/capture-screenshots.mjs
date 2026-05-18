// scripts/capture-screenshots.mjs
// Capture polished release screenshots for ForkFirst using Playwright.
//
// Usage:
//   1. Start the dev server in another terminal:  npm run dev
//   2. (First time) install Playwright browsers:  npx playwright install chromium
//   3. Run this script:                            node scripts/capture-screenshots.mjs
//
// Captures land in public/screenshots/ (used by the README) and docs/assets/
// (used by the public release page). Existing files are overwritten.

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.FORKFIRST_URL ?? process.env.OPEN_REPO_URL ?? "http://127.0.0.1:3000";

const PUBLIC_DIR = path.resolve("public", "screenshots");
const ASSETS_DIR = path.resolve("docs", "assets");

const DEMO_PROMPT =
  "I want to make an image generator for realtors that creates social media visuals from a listing.";

/** @type {Array<{
 *   name: string;
 *   theme: "paper" | "ink";
 *   viewport: { width: number; height: number };
 *   describe: string;
 *   prepare?: (page: import("playwright").Page) => Promise<void>;
 * }>} */
const SHOTS = [
  {
    name: "01-home-paper",
    theme: "paper",
    viewport: { width: 1440, height: 900 },
    describe: "Desktop home, Paper (light) theme."
  },
  {
    name: "02-home-ink",
    theme: "ink",
    viewport: { width: 1440, height: 900 },
    describe: "Desktop home, Ink (dark) theme."
  },
  {
    name: "03-chat-results",
    theme: "paper",
    viewport: { width: 1440, height: 900 },
    describe: "Chat-style results after running the demo prompt.",
    async prepare(page) {
      await typeAndSubmitPrompt(page, DEMO_PROMPT);
      await page.waitForSelector(".chat-transcript .chat-turn", { timeout: 60_000 });
    }
  },
  {
    name: "04-saved-library",
    theme: "paper",
    viewport: { width: 1440, height: 900 },
    describe: "Saved library drawer.",
    async prepare(page) {
      await openDrawer(page, /saved library|saved/i);
    }
  },
  {
    name: "05-build-pack",
    theme: "paper",
    viewport: { width: 1440, height: 900 },
    describe: "Build Pack modal with editable Markdown.",
    async prepare(page) {
      await typeAndSubmitPrompt(page, DEMO_PROMPT);
      await page.waitForSelector(".chat-transcript .chat-turn", { timeout: 60_000 });
      const buildPackButton = page.getByRole("button", { name: /build pack/i }).first();
      if (await buildPackButton.isVisible().catch(() => false)) {
        await buildPackButton.click();
      }
    }
  },
  {
    name: "06-mobile-home",
    theme: "paper",
    viewport: { width: 390, height: 844 },
    describe: "Mobile home (iPhone 14 size)."
  },
  {
    name: "07-mobile-results",
    theme: "paper",
    viewport: { width: 390, height: 844 },
    describe: "Mobile chat/results.",
    async prepare(page) {
      await typeAndSubmitPrompt(page, DEMO_PROMPT);
      await page.waitForSelector(".chat-transcript .chat-turn", { timeout: 60_000 });
    }
  }
];

async function typeAndSubmitPrompt(page, prompt) {
  const input = page.locator("textarea, input[type='text']").first();
  await input.fill(prompt);
  const submit = page.getByRole("button", { name: /check|search|ask|go/i }).first();
  await submit.click();
}

async function openDrawer(page, label) {
  const button = page.getByRole("button", { name: label }).first();
  if (await button.isVisible().catch(() => false)) {
    await button.click();
  }
}

async function setTheme(page, theme) {
  await page.addInitScript(({ theme }) => {
    window.localStorage.setItem("forkfirst:theme", theme);
  }, { theme });
}

async function captureOne(browser, shot) {
  const context = await browser.newContext({ viewport: shot.viewport, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await setTheme(page, shot.theme);
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  if (shot.prepare) {
    await shot.prepare(page);
    await page.waitForLoadState("networkidle").catch(() => {});
  }
  await page.waitForTimeout(500);

  const publicPath = path.join(PUBLIC_DIR, `${shot.name}.png`);
  const assetsPath = path.join(ASSETS_DIR, `${shot.name}.png`);
  await page.screenshot({ path: publicPath, fullPage: false });
  await page.screenshot({ path: assetsPath, fullPage: false });
  console.log(`OK ${shot.name} - ${shot.describe}`);
  await context.close();
}

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true });
  await mkdir(ASSETS_DIR, { recursive: true });

  console.log(`Capturing release screenshots from ${BASE_URL}`);
  const browser = await chromium.launch();
  try {
    for (const shot of SHOTS) {
      try {
        await captureOne(browser, shot);
      } catch (error) {
        console.error(`✗ ${shot.name} failed: ${error.message}`);
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
