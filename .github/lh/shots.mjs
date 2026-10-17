// Screenshot base and head at three widths so a perf change can prove it changes nothing on screen.
// Usage: node shots.mjs <head-dir> <path,path> ; servers on 3101 (base) and 3102 (head).
import { createRequire } from 'node:module';
import path from 'node:path';
const [headDir, paths] = process.argv.slice(2);
const require = createRequire(path.resolve(headDir, 'package.json'));
let pw; try { pw = require('playwright'); } catch { pw = require('@playwright/test'); }
const { chromium } = pw;
const browser = await chromium.launch();
for (const p of paths.split(',')) for (const w of [375, 768, 1440]) for (const [side, port] of [['base', 3101], ['head', 3102]]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
  await page.goto(`http://127.0.0.1:${port}${p}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `shot-${side}-${p.replace(/[/?=&]/g, '_')}-${w}.png`, fullPage: true, animations: 'disabled', caret: 'hide' });
  await page.close();
}
await browser.close();
