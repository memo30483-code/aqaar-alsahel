import { expect, test } from "@playwright/test";

test("ملفات SEO الأساسية متاحة وتشير للنطاق الرسمي", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const robotsText = await robots.text();
  expect(robotsText).toContain("Sitemap: https://aqaar-alsahel.vercel.app/sitemap.xml");
  expect(robotsText).toContain("Disallow: /admin/");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain("https://aqaar-alsahel.vercel.app/property/dm-1");

  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);
  expect((await manifest.json()).short_name).toBe("عقار FAMILY");
});

test("الرئيسية تحتوي canonical وOpenGraph وبيانات منظمة", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://aqaar-alsahel.vercel.app"
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    /عقار FAMILY/
  );
  await expect(page.locator('script[type="application/ld+json"]')).not.toHaveCount(0);
  expect(await page.locator("main").count()).toBe(1);
});

test("بطاقات العقارات تستخدم تحسين صور Next والخطوط الاختيارية ليست preload", async ({
  page,
}) => {
  await page.goto("/");
  const image = page.getByAltText("شقة فاخرة مطلّة على البحر").first();
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute("src", /\/_next\/image\?/);
  const fontPreloads = await page
    .locator('link[rel="preload"][as="font"]')
    .count();
  expect(fontPreloads).toBeLessThanOrEqual(4);
});

test("المساعد المغلق inert ويحتجز التركيز عند الفتح ويعيده عند Escape", async ({
  page,
}) => {
  await page.goto("/");
  const launcher = page.locator("#ai-launcher");
  const panel = page.locator("#ai-panel");
  await expect(panel).toHaveAttribute("inert", "");

  await launcher.click();
  await expect(panel).not.toHaveAttribute("inert", "");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const active = document.activeElement;
        const dialog = document.querySelector("#ai-panel");
        return Boolean(active && dialog?.contains(active));
      })
    )
    .toBe(true);

  await page.keyboard.press("Escape");
  await expect(launcher).toBeFocused();
  await expect(panel).toHaveAttribute("inert", "");

  const dismiss = page.getByRole("button", { name: "إغلاق المساعد" });
  const box = await dismiss.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
});

test("صفحات التفاصيل تملك عنوانًا وCanonical خاصين بها", async ({ page }) => {
  await page.goto("/property/dm-1");
  await expect(page).toHaveTitle(/شقة فاخرة مطلّة على البحر/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://aqaar-alsahel.vercel.app/property/dm-1"
  );
  expect(await page.locator("main").count()).toBe(1);
});
