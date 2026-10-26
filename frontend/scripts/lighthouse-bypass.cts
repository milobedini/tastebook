import type { Browser } from 'puppeteer-core';

// Lighthouse CI runs this before each page. It sets Vercel's bypass cookie in the browser Lighthouse then uses,
// because extra headers would go out on Sentry's cross-origin requests too, where its CORS preflight refuses them.
const setBypassCookie = async (browser: Browser, { url }: { url: string }): Promise<void> => {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (!secret) {
    throw new Error('VERCEL_AUTOMATION_BYPASS_SECRET is not set, so Lighthouse would only see the sign-in page.');
  }
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ 'x-vercel-protection-bypass': secret, 'x-vercel-set-bypass-cookie': 'true' });
  // robots.txt is static, so this request loads none of the app and nothing cross-origin.
  const response = await page.goto(new URL('/robots.txt', url).href);
  await page.close();
  if (!response?.ok()) {
    throw new Error(`The bypass request got ${response?.status() ?? 'no response'}, so the cookie isn't set.`);
  }
};

module.exports = setBypassCookie;
