import { logger } from "./logger";

const SEEIT_SLUG = "advanced-mastery-DJ6L7uLWtkJ496rZjFO-Y";
const SEEIT_LOCKED_URL = `https://app.seeit.co/locked/${SEEIT_SLUG}`;
const SEEIT_LINK_ID = "DJ6L7uLWtkJ496rZjFO-Y";
const TEAM_EMAIL = "synapsemind.ai@gmail.com";
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// seeit.co Next.js Server Action ID for createStripeCheckout
const NEXT_ACTION_ID = "7f5938fa5a8abeca04723c2a717d40ad24a9c09c5f";

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

// ─── Strategy 2: seeit.co Server Action (pure HTTP, no browser needed) ───────
// seeit.co is a Next.js app on Vercel. Its "Unlock" button calls a Next.js
// Server Action that creates a Stripe Checkout Session and returns the URL.
// We call that Server Action directly via POST with the Next-Action header —
// no Puppeteer, no Chromium, works in any environment.
async function getStripeUrlViaServerAction(): Promise<CheckoutResult | null> {
  try {
    logger.info("Calling seeit.co Server Action to get Stripe checkout URL");

    const body = JSON.stringify([{
      email: TEAM_EMAIL,
      linkId: SEEIT_LINK_ID,
      pathname: `/locked/${SEEIT_SLUG}`,
    }]);

    const res = await fetch(SEEIT_LOCKED_URL, {
      method: "POST",
      headers: {
        "Next-Action": NEXT_ACTION_ID,
        "Content-Type": "application/json",
        "Origin": "https://app.seeit.co",
        "Referer": SEEIT_LOCKED_URL,
        "User-Agent": UA,
      },
      body,
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      logger.warn({ status: res.status }, "seeit.co Server Action returned non-OK status");
      return null;
    }

    const text = await res.text();

    // The RSC streaming response contains a line like:
    // 1:{"data":{"data":"https://checkout.stripe.com/...","error":null,"success":true}}
    const jsonMatch = text.match(/\d+:\{"data":\{"data":"(https:\/\/checkout\.stripe\.com\/[^"\\]+)"/);
    if (jsonMatch?.[1]) {
      const url = jsonMatch[1];
      logger.info({ url }, "Got Stripe URL from seeit.co Server Action");
      return { checkoutUrl: url, isDirect: true };
    }

    // Broader fallback pattern
    const stripeMatch = text.match(/https:\/\/checkout\.stripe\.com\/c\/pay\/[^"\\]+/);
    if (stripeMatch) {
      logger.info({ url: stripeMatch[0] }, "Got Stripe URL from seeit.co Server Action (broad match)");
      return { checkoutUrl: stripeMatch[0], isDirect: true };
    }

    logger.warn({ responseSnippet: text.slice(0, 300) }, "No Stripe URL found in Server Action response");
    return null;
  } catch (err) {
    logger.warn({ err }, "seeit.co Server Action call failed");
    return null;
  }
}

// ─── Main resolution ──────────────────────────────────────────────────────────
async function resolveStripeUrl(): Promise<CheckoutResult> {
  const fallback: CheckoutResult = { checkoutUrl: SEEIT_LOCKED_URL, isDirect: false };

  const envResult = getEnvOverride();
  if (envResult) return envResult;

  const serverActionResult = await getStripeUrlViaServerAction();
  if (serverActionResult?.isDirect) return serverActionResult;

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
