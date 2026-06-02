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

// ─── Strategy 1: env var override (most reliable) ───────────────────────────
// Set STRIPE_CHECKOUT_URL in your deployment secrets to a permanent
// Stripe Payment Link (https://buy.stripe.com/...) and this will always work.
function getEnvOverride(): CheckoutResult | null {
  const url = process.env.STRIPE_CHECKOUT_URL;
  if (url && url.includes("stripe.com")) {
    logger.info("Using STRIPE_CHECKOUT_URL from environment");
    return { checkoutUrl: url, isDirect: true };
  }
  return null;
}

// ─── Strategy 2: HTTP fetch (no browser needed, works in production) ─────────
async function getStripeUrlViaHttp(): Promise<CheckoutResult | null> {
  try {
    logger.info("Attempting HTTP fetch approach for seeit.co");

    // Fetch the locked page to get cookies and page structure
    const pageRes = await fetch(SEEIT_LOCKED_URL, {
      headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml,*/*", "Accept-Language": "en-US,en;q=0.9" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (pageRes.url.includes("stripe.com")) {
      logger.info({ url: pageRes.url }, "Direct redirect to Stripe on page load");
      return { checkoutUrl: pageRes.url, isDirect: true };
    }

    const html = await pageRes.text();

    // Collect cookies for subsequent requests
    const rawCookies: string[] = [];
    try {
      const setCookie = pageRes.headers.getSetCookie?.();
      if (setCookie) rawCookies.push(...setCookie.map((c: string) => c.split(";")[0]));
    } catch {
      const setCookie = pageRes.headers.get("set-cookie");
      if (setCookie) rawCookies.push(setCookie.split(";")[0]);
    }
    const cookieStr = rawCookies.join("; ");

    const baseHeaders: Record<string, string> = {
      "User-Agent": UA,
      "Origin": "https://app.seeit.co",
      "Referer": SEEIT_LOCKED_URL,
    };
    if (cookieStr) baseHeaders["Cookie"] = cookieStr;

    // Try JSON API endpoints (common Next.js / SaaS patterns)
    const jsonEndpoints = [
      { url: `https://app.seeit.co/api/checkout`, body: { email: TEAM_EMAIL, slug: SEEIT_SLUG } },
      { url: `https://app.seeit.co/api/unlock`, body: { email: TEAM_EMAIL, slug: SEEIT_SLUG } },
      { url: `https://app.seeit.co/api/locked/${SEEIT_SLUG}`, body: { email: TEAM_EMAIL } },
      { url: `https://app.seeit.co/api/access`, body: { email: TEAM_EMAIL, slug: SEEIT_SLUG } },
      { url: `https://app.seeit.co/api/payment`, body: { email: TEAM_EMAIL, slug: SEEIT_SLUG } },
    ];

    for (const endpoint of jsonEndpoints) {
      try {
        const res = await fetch(endpoint.url, {
          method: "POST",
          headers: { ...baseHeaders, "Content-Type": "application/json", "Accept": "application/json,*/*" },
          body: JSON.stringify(endpoint.body),
          redirect: "follow",
          signal: AbortSignal.timeout(10000),
        });

        if (res.url.includes("stripe.com")) {
          logger.info({ url: res.url, endpoint: endpoint.url }, "Got Stripe URL via JSON API redirect");
          return { checkoutUrl: res.url, isDirect: true };
        }

        const text = await res.text();
        try {
          const data = JSON.parse(text);
          const url: string = data.url ?? data.checkoutUrl ?? data.redirectUrl ?? data.stripeUrl ?? data.redirect ?? "";
          if (url && url.includes("stripe.com")) {
            logger.info({ url, endpoint: endpoint.url }, "Got Stripe URL from JSON response");
            return { checkoutUrl: url, isDirect: true };
          }
        } catch { /* not JSON */ }

        const stripeMatch = text.match(/https:\/\/checkout\.stripe\.com\/c\/pay\/[^\s"'<>\\]+/);
        if (stripeMatch) {
          logger.info({ url: stripeMatch[0], endpoint: endpoint.url }, "Got Stripe URL from response body");
          return { checkoutUrl: stripeMatch[0], isDirect: true };
        }
      } catch { /* try next endpoint */ }
    }

    // Try form submission (traditional HTML form POST)
    const formActionMatch = html.match(/<form[^>]+action="([^"]+)"/i);
    if (formActionMatch?.[1]) {
      try {
        const formAction = new URL(formActionMatch[1], "https://app.seeit.co").toString();
        const csrfMatch =
          html.match(/name="(?:_token|csrf_token|_csrf)"[^>]*value="([^"]+)"/i) ??
          html.match(/value="([^"]+)"[^>]*name="(?:_token|csrf_token|_csrf)"/i) ??
          html.match(/"csrfToken"\s*:\s*"([^"]+)"/);

        const formBody = new URLSearchParams({ email: TEAM_EMAIL });
        if (csrfMatch?.[1]) formBody.append("_token", csrfMatch[1]);

        const submitRes = await fetch(formAction, {
          method: "POST",
          headers: { ...baseHeaders, "Content-Type": "application/x-www-form-urlencoded" },
          body: formBody.toString(),
          redirect: "follow",
          signal: AbortSignal.timeout(15000),
        });

        if (submitRes.url.includes("stripe.com")) {
          logger.info({ url: submitRes.url }, "Got Stripe URL via form POST");
          return { checkoutUrl: submitRes.url, isDirect: true };
        }

        const body = await submitRes.text();
        const m = body.match(/https:\/\/checkout\.stripe\.com\/c\/pay\/[^\s"'<>\\]+/);
        if (m) {
          logger.info({ url: m[0] }, "Got Stripe URL from form POST response body");
          return { checkoutUrl: m[0], isDirect: true };
        }
      } catch { /* ignore */ }
    }

    logger.warn("HTTP fetch approach found no Stripe URL");
    return null;
  } catch (err) {
    logger.warn({ err }, "HTTP fetch approach failed");
    return null;
  }
}

// ─── Strategy 3: Puppeteer (works in dev where Chromium is available) ────────
async function getStripeUrlViaPuppeteer(): Promise<CheckoutResult | null> {
  // Only attempt if Chromium is actually available — skip in production where it crashes
  let executablePath: string | undefined;
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

  if (!executablePath) return null;

  let browser;
  try {
    const puppeteer = (await import("puppeteer-core")).default;
    logger.info({ executablePath }, "Launching headless browser for seeit.co automation");

    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      timeout: 15000,
      args: [
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
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(UA);

    await page.goto(SEEIT_LOCKED_URL, { waitUntil: "networkidle2", timeout: 20000 });

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

    await page.waitForFunction(`window.location.href.includes("stripe.com")`, { timeout: 20000, polling: 500 });

    const stripeUrl = page.url();
    logger.info({ stripeUrl }, "Got Stripe URL via Puppeteer");
    await browser.close();
    return { checkoutUrl: stripeUrl, isDirect: true };
  } catch (err) {
    logger.warn({ err }, "Puppeteer approach failed");
    try { await browser?.close(); } catch { /* ignore */ }
    return null;
  }
}

// ─── Main resolution (tries strategies in order) ────────────────────────────
async function resolveStripeUrl(): Promise<CheckoutResult> {
  const fallback: CheckoutResult = { checkoutUrl: SEEIT_LOCKED_URL, isDirect: false };

  // 1. Env var (immediate, zero latency)
  const envResult = getEnvOverride();
  if (envResult) return envResult;

  // 2. HTTP fetch (no browser, works in production)
  const httpResult = await getStripeUrlViaHttp();
  if (httpResult?.isDirect) return httpResult;

  // 3. Puppeteer (dev only — requires Chromium)
  const puppeteerResult = await getStripeUrlViaPuppeteer();
  if (puppeteerResult?.isDirect) return puppeteerResult;

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
