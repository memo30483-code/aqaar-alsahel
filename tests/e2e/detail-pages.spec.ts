import { expect, test } from "@playwright/test";

const detailPages = [
  {
    path: "/property/dm-1",
    expected: "شقة فاخرة مطلّة على البحر",
    missing: "العقار غير موجود",
  },
  {
    path: "/developers/dev-nile",
    expected: "شركة النيل للتطوير العقاري",
    missing: "الملف غير موجود",
  },
  {
    path: "/brokers/mkt-raselbar",
    expected: "رأس البر للعقارات",
    missing: "الملف غير موجود",
  },
  {
    path: "/lawyers/law-mahmoud",
    expected: "محمود عبد السلام",
    missing: "الملف غير موجود",
  },
  {
    path: "/engineers/eng-nile",
    expected: "مكتب النيل للاستشارات الهندسية",
    missing: "الملف غير موجود",
  },
  {
    path: "/projects/prj-nile-plaza",
    expected: "نيل بلازا",
    missing: "المشروع غير متاح",
  },
] as const;

for (const detail of detailPages) {
  test(`${detail.path} يعرض بياناته الفعلية`, async ({ page }) => {
    const response = await page.goto(detail.path);
    const main = page.getByRole("main").first();

    expect(response?.status()).toBe(200);
    await expect(main).toContainText(detail.expected);
    await expect(main).not.toContainText(detail.missing);
  });
}

test("معرّف عقار غير معروف يرجع 404 حقيقي", async ({ page }) => {
  const response = await page.goto("/property/not-a-real-property");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "العقار غير موجود" })).toBeVisible();
});
