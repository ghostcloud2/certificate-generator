import { logger } from "./logger";
import puppeteer from "puppeteer-core";
import { existsSync } from "fs";
import { execFileSync } from "child_process";

const SEEIT_SLUG = "get-you-sorted-95GtR6Mbn7-cAU6g8Y30E";
const SEEIT_LOCKED_URL = `https://app.seeit.co/locked/${SEEIT_SLUG}`;
const TEAM_EMAIL = "danielhowards965@gmail.com";

const CACHE_TTL_MS = 25 * 60 * 1000;

export interface CheckoutResult {
  checkoutUrl: string;
  isDirect: boolean;
}

let cachedResult: CheckoutResult | null = null;
let cacheExpiresAt = 0;
let warmupPromise: Promise<void> | null = null;

async function getChromiumExecutable(): Promise<string | undefined> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const chromium = require("@sparticuz/chromium");
    const exec: string = await chromium.executablePath();
    if (exec && existsSync(exec)) return exec;
  } catch {
    // not installed or not available
  }

  const candidates = [
    process.env.CHROME_EXECUTABLE_PATH,
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/local/bin/chromium",
    "/snap/bin/chromium",
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (existsSync(p)) return p;
  }

  // Fallback: ask the shell where chromium lives (handles Nix store paths)
  for (const bin of ["chromium", "chromium-browser", "google-chrome", "google-chrome-stable"]) {
    try {
      const resolved = execFileSync("which", [bin], { encoding: "utf8" }).trim();
      if (resolved && existsSync(resolved)) return resolved;
    } catch {
      // not on PATH
    }
  }

  return undefined;
}

async function runPuppeteer(): Promise<CheckoutResult> {
  const fallback: CheckoutResult = { checkoutUrl: SEEIT_LOCKED_URL, isDirect: false };

  const executablePath = await getChromiumExecutable();
  if (!executablePath) {
    logger.warn("No Chromium binary found — falling back to seeit.co direct URL");
    return fallback;
  }

  let browser;
  try {
    logger.info({ executablePath }, "Launching headless browser for seeit.co automation");

    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-extensions",
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    logger.info("Navigating to seeit.co locked page");
    await page.goto(SEEIT_LOCKED_URL, { waitUntil: "networkidle2", timeout: 20000 });

    const emailSelector = 'input[type="email"], input[name="email"], input[placeholder*="mail" i]';
    logger.info("Waiting for email input field");
    await page.waitForSelector(emailSelector, { timeout: 15000 });

    logger.info({ email: TEAM_EMAIL }, "Filling email field");
    await page.click(emailSelector, { count: 3 });
    await page.type(emailSelector, TEAM_EMAIL, { delay: 30 });
    await new Promise<void>(r => setTimeout(r, 600));

    logger.info("Clicking Unlock button");
    const clicked = await page.evaluate(
      `(function(){
        var btn = document.querySelector('button[type="submit"]') ||
          Array.from(document.querySelectorAll('button')).find(function(b){
            return /unlock|pay|purchase/i.test(b.textContent || '');
          });
        if (btn) { btn.click(); return true; }
        return false;
      })()`
    );

    if (!clicked) {
      await page.keyboard.press("Enter");
    }

    logger.info("Waiting for redirect to Stripe checkout");
    await page.waitForFunction(
      `window.location.href.includes("stripe.com")`,
      { timeout: 20000, polling: 500 }
    );

    const stripeUrl = page.url();
    logger.info({ stripeUrl }, "Successfully captured Stripe checkout URL");
    await browser.close();
    return { checkoutUrl: stripeUrl, isDirect: true };

  } catch (err) {
    logger.error({ err }, "Headless browser automation failed — using fallback");
    try { await browser?.close(); } catch { /* ignore */ }
    return fallback;
  }
}

async function refreshCache(): Promise<void> {
  try {
    logger.info("Refreshing checkout URL cache");
    const result = await runPuppeteer();
    cachedResult = result;
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    logger.info({ isDirect: result.isDirect }, "Checkout URL cache updated");
  } catch (err) {
    logger.error({ err }, "Failed to refresh checkout URL cache");
  }

  const nextRefreshIn = Math.max(CACHE_TTL_MS - 60_000, 60_000);
  setTimeout(() => { refreshCache().catch(() => {}); }, nextRefreshIn);
}

export function warmCheckoutCache(): void {
  if (warmupPromise) return;
  warmupPromise = refreshCache();
}

export async function resolveCheckoutUrl(_applicantName: string): Promise<CheckoutResult> {
  if (cachedResult && Date.now() < cacheExpiresAt) {
    logger.info("Serving checkout URL from cache");
    return cachedResult;
  }

  logger.info("Cache miss — running Puppeteer directly for this request");
  const result = await runPuppeteer();
  cachedResult = result;
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;
  return result;
}
