import { expect, test, type Page } from "@playwright/test";

const designCopy = "Scan the QR code to visit Frontend Mentor and take your coding skills to the next level";
const siteName = "QR Code Card";
const siteUrl = "https://qr-code-card.royeradames.com/";

async function noHorizontalScroll(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
}

async function smallText(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (!parent || !node.textContent?.trim() || parent.closest("script,style")) continue;
      if (parent.getClientRects().length === 0) continue;
      if (parseFloat(getComputedStyle(parent).fontSize) < 16) out.push(node.textContent.trim());
    }
    return out;
  });
}

test("shows the design's card copy, a loaded QR image and a text route to the same destination", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("QR Code Card | Royer Adames");
  const card = page.getByRole("article", { name: "Improve your front-end skills by building projects" });
  await expect(card).toBeVisible();
  await expect(card.getByRole("heading", { level: 1 })).toHaveText("Improve your front-end skills by building projects");
  await expect(card.locator("p")).toHaveText(designCopy);
  await expect(card.getByRole("link", { name: "Frontend Mentor" })).toHaveAttribute("href", "https://www.frontendmentor.io/");
  const image = card.getByRole("img", { name: /QR code that opens Frontend Mentor/ });
  expect(await image.evaluate((element) => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0)).toBe(true);
});

test("declares one site name in og:site_name and WebSite JSON-LD, with canonical and icons", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", siteName);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "QR Code Card | Royer Adames");
  const jsonLd = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
  expect(jsonLd).toEqual({ "@context": "https://schema.org", "@type": "WebSite", name: siteName, url: siteUrl });
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\/qr-code-card\.royeradames\.com\/?$/);
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveCount(1);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
});

for (const frame of [
  { name: "desktop", width: 1440, height: 960 },
  { name: "mobile", width: 375, height: 812 },
]) {
  test(`matches the ${frame.name} design frame geometry, colour and type`, async ({ page }) => {
    await page.setViewportSize({ width: frame.width, height: frame.height });
    await page.goto("/");
    const card = page.locator(".qr-card");
    const box = (await card.boundingBox())!;
    expect(box.width).toBe(320);
    expect(box.height).toBeGreaterThanOrEqual(498);
    expect(box.height).toBeLessThanOrEqual(526);
    expect(Math.abs(box.x + box.width / 2 - frame.width / 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.y + box.height / 2 - frame.height / 2)).toBeLessThanOrEqual(14);
    await expect(card).toHaveCSS("border-radius", "20px");
    await expect(card).toHaveCSS("padding-top", "16px");
    const image = (await page.locator(".qr-image").boundingBox())!;
    expect(image.width).toBe(288);
    expect(image.height).toBe(288);
    await expect(page.locator(".qr-image")).toHaveCSS("border-radius", "10px");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveCSS("font-size", "22px");
    await expect(heading).toHaveCSS("font-weight", "700");
    await expect(heading).toHaveCSS("color", "rgb(31, 49, 79)");
    expect((await heading.boundingBox())!.y - (image.y + image.height)).toBeCloseTo(24, 0);
    const copy = page.locator(".qr-card p");
    await expect(copy).toHaveCSS("font-size", "16px");
    await expect(copy).toHaveCSS("color", "rgb(104, 119, 141)");
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(213, 225, 239)");
    expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain("Outfit");
  });
}

test("width sweep 320 to 1600 px in 10 px steps: no page scroll, gutters kept, no text under 16 px", async ({ page }) => {
  await page.goto("/");
  const failures: string[] = [];
  for (let width = 320; width <= 1600; width += 10) {
    await page.setViewportSize({ width, height: 800 });
    if (!(await noHorizontalScroll(page))) failures.push(`${width}: page scroll`);
    const box = (await page.locator(".qr-card").boundingBox())!;
    if (box.x < 16 || box.x + box.width > width - 16) failures.push(`${width}: card gutter ${box.x}`);
    const small = await smallText(page);
    if (small.length) failures.push(`${width}: small text ${small.join(" | ")}`);
  }
  expect(failures).toEqual([]);
});

test("keyboard reaches every link in order with a visible focus ring", async ({ page }) => {
  await page.goto("/");
  const expected = ["Frontend Mentor", "Royer Adames", "QR code challenge"];
  for (const name of expected) {
    await page.keyboard.press("Tab");
    const link = page.getByRole("link", { name, exact: true });
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS("outline-style", "solid");
  }
});

test("renders without JavaScript and sends no writes", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  const writes: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") writes.push(request.url());
  });
  try {
    await page.goto(baseURL!);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".qr-card p")).toHaveText(designCopy);
    expect(writes).toEqual([]);
  } finally {
    await context.close();
  }
});
