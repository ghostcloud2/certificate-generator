import { logger } from "./logger";

const SEEIT_SLUG = "advanced-mastery-DJ6L7uLWtkJ496rZjFO-Y";
const SEEIT_LOCKED_URL = `https://app.seeit.co/locked/${SEEIT_SLUG}`;
const TEAM_EMAIL = "synapsemind.ai@gmail.com";
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const CACHE_TTL_MS = 25 * 60 * 1000;

export interface CheckoutResult {
  checkoutUrl: string;
  isDirect: boolean;
}

let cachedResult: CheckoutResult | null = null;
let cacheExpiresAt = 0;
let warmupPromise: Promise<void> | null = null;

// ─── Strategy 1: env var override ────────────────────────────────────────────
function getEnvOverride(): CheckoutResult | null {
  const url = process.env.STRIPE_CHECKOUT_URL;
  if (url && url.includes("stripe.com")) {
    logger.info("Using STRIPE_CHECKOUT_URL from environment");
    return { checkoutUrl: url, isDirect: true };
  }
  return null;
}

// ─── Strategy 2: Puppeteer with @sparticuz/chromium (works in prod) ──────────
async function getStripeUrlViaBrowser(): Promise<CheckoutResult | null> {
  let executablePath: string | undefined;
  let sparticuzArgs: string[] = [];

  // Try @sparticuz/chromium first — built for restricted/serverless environments
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const chromium = require("@sparticuz/chromium");
    executablePath = await chromium.executablePath();
    sparticuzArgs = chromium.args ?? [];
    logger.info({ executablePath }, "Using @sparticuz/chromium");
  } catch {
    logger.info("@sparticuz/chromium not available, trying system Chromium");
  }

  // Fall back to system Chromium (works in dev/Nix)
  if (!executablePath) {
    try {
      const { existsSync } = await import("fs");
      const { execFileSync } = await import("child_process");

      const candidates = [
        process.env.CHROME_EXECUTABLE_PATH,
        "/usr/bin/google-chrome-stable",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
      ].filter(Boolean) as string[];

      for (const p of candidates) {
        if (existsSync(p)) { executablePath = p; break; }
      }

      if (!executablePath) {
        for (const bin of ["chromium", "chromium-browser", "google-chrome"]) {
          try {
            const resolved = execFileSync("which", [bin], { encoding: "utf8" }).trim();
            if (resolved && existsSync(resolved)) { executablePath = resolved; break; }
          } catch { /* not found */ }
        }
      }
    } catch { /* ignore */ }
  }

  if (!executablePath) {
    logger.warn("No Chromium binary found");
    return null;
  }

  let browser;
  try {
    const puppeteer = (await import("puppeteer-core")).default;
    logger.info({ executablePath }, "Launching headless browser");

    const defaultArgs = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--disable-extensions",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-features=TranslateUI",
      "--disable-ipc-flooding-protection",
    ];

    // Merge sparticuz args (deduplicated)
    const allArgs = [...new Set([...sparticuzArgs, ...defaultArgs])];

    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: allArgs,
    });

    const page = await browser.newPage();
    await page.setUserAgent(UA);

    logger.info("Navigating to seeit.co locked page");
    await page.goto(SEEIT_LOCKED_URL, { waitUntil: "networkidle2", timeout: 25000 });

    const emailSelector = 'input[type="email"], input[name="email"], input[placeholder*="mail" i]';
    await page.waitForSelector(emailSelector, { timeout: 15000 });
    await page.click(emailSelector, { count: 3 } as never);
    await page.type(emailSelector, TEAM_EMAIL, { delay: 30 });
    await new Promise<void>(r => setTimeout(r, 600));

    const clicked = await page.evaluate(`(function(){
      var btn = document.querySelector('button[type="submit"]') ||
        Array.from(document.querySelectorAll('button')).find(function(b){
          return /unlock|pay|purchase/i.test(b.textContent || '');
        });
      if (btn) { btn.click(); return true; }
      return false;
    })()`);

    if (!clicked) await page.keyboard.press("Enter");

    await page.waitForFunction(`window.location.href.includes("stripe.com")`, { timeout: 25000, polling: 500 });

    const stripeUrl = page.url();
    logger.info({ stripeUrl }, "Got Stripe URL via browser automation");
    await browser.close();
    return { checkoutUrl: stripeUrl, isDirect: true };
  } catch (err) {
    logger.warn({ err }, "Browser automation failed");
    try { await browser?.close(); } catch { /* ignore */ }
    return null;
  }
}

// ─── Main resolution ──────────────────────────────────────────────────────────
async function resolveStripeUrl(): Promise<CheckoutResult> {
  const fallback: CheckoutResult = { checkoutUrl: SEEIT_LOCKED_URL, isDirect: false };

  const envResult = getEnvOverride();
  if (envResult) return envResult;

  const browserResult = await getStripeUrlViaBrowser();
  if (browserResult?.isDirect) return browserResult;

  logger.error("All strategies failed — serving seeit.co locked URL as fallback");
  return fallback;
}

// ─── Cache layer ──────────────────────────────────────────────────────────────
async function refreshCache(): Promise<void> {
  try {
    logger.info("Refreshing checkout URL cache");
    const result = await resolveStripeUrl();
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

  logger.info("Cache miss — resolving checkout URL");
  const result = await resolveStripeUrl();
  cachedResult = result;
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;
  return result;
}
