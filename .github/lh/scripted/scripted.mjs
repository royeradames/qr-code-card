// Lighthouse for views that need browser-local state first (PFA demo session, Audiophile cart/order).
// Usage: node scripted.mjs <row> <url> <setup> <mobile|desktop> <out.json>
// Setup only creates this fresh browser's fictional demo state; it never submits a payment, order or credential.
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';

const [row, url, setup, dev, out] = process.argv.slice(2);
const origin = new URL(url).origin;
const order = JSON.parse(fs.readFileSync(new URL('./synthetic-order.json', import.meta.url))).records;
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: 'new', args: ['--no-sandbox', '--no-first-run'] });
try {
  const page = await browser.newPage();
  if (setup === 'pfa-demo-session') {
    await page.goto(`${origin}/login`, { waitUntil: 'networkidle0' });
    const [btn] = await page.$$('xpath/.//button[contains(., "Use the demo account")]');
    if (!btn) throw new Error('demo button not found');
    await Promise.all([page.waitForFunction(() => !location.pathname.startsWith('/login'), { timeout: 30000 }), btn.click()]);
  } else if (setup === 'audiophile-checkout') {
    await page.goto(origin, { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.setItem('audiophile-demo-cart-v1', JSON.stringify([{ productId: 'yx1-earphones', quantity: 1 }])));
  } else if (setup === 'audiophile-order') {
    // Reviewed manifest recipe (fixtures-plan.json, audiophile-order): a synthetic order lives only in this
    // browser, so the store must answer in browser-only demo mode, or the page asks the server for an order
    // the server never had (404). No order, payment or account request reaches the server.
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (new URL(req.url()).pathname === '/api/store/features')
        return req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ demo: true, durableOrders: false, accounts: 'coming_soon' }) });
      return req.continue();
    });
    await page.goto(origin, { waitUntil: 'networkidle0' });
    await page.evaluate((r) => localStorage.setItem('audiophile-orders-v1', JSON.stringify(r)), order);
  } else throw new Error(`unknown setup ${setup}`);
  // Keep the storage, drop the warm HTTP cache so the audit is a cold load.
  const cdp = await page.createCDPSession();
  await cdp.send('Network.clearBrowserCache');
  await page.goto('about:blank');
  const flags = { output: 'json', logLevel: 'error', disableStorageReset: true, maxWaitForLoad: 45000 };
  const result = await lighthouse(url, flags, dev === 'desktop' ? desktopConfig : undefined, page);
  const lhr = result.lhr;
  if (new URL(lhr.finalDisplayedUrl).pathname.startsWith('/login') && !new URL(url).pathname.startsWith('/login')) lhr.runtimeError = { code: 'SETUP_REDIRECTED_TO_LOGIN', message: lhr.finalDisplayedUrl };
  fs.writeFileSync(out, JSON.stringify(lhr));
  console.log(`${row} ${dev} ${setup} final=${lhr.finalDisplayedUrl} perf=${lhr.categories.performance.score}`);
} finally { await browser.close(); }
