import { expect, test } from "@playwright/test";

test("مسار الانضمام يفتح التسجيل الحقيقي ويحدد نوع الحساب", async ({
  page,
}) => {
  await page.goto("/join?role=engineer");

  await expect(page).toHaveURL(/\/register\?role=engineer$/);
  const selectedType = page.locator('button[aria-pressed="true"]').first();
  await expect(selectedType).toContainText("مكتب هندسي");
});

test("النشرة تعرض النجاح فقط بعد تأكيد السيرفر", async ({ page }) => {
  let requestBody: Record<string, unknown> | null = null;
  await page.route("**/api/requests", async (route) => {
    requestBody = JSON.parse(route.request().postData() ?? "{}");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, id: "inquiry-newsletter-1" }),
    });
  });
  await page.goto("/");

  const form = page.locator("form").filter({
    has: page.locator("#footer-newsletter"),
  });
  await form.locator("#footer-newsletter").fill("subscriber@example.com");
  await form.getByRole("button", { name: "اشترك" }).click();

  await expect(form).toContainText("تم تسجيل بريدك");
  expect(requestBody).toMatchObject({
    kind: "newsletter_subscription",
    email: "subscriber@example.com",
  });
});

test("النشرة لا تعرض نجاحًا كاذبًا عند رفض السيرفر", async ({ page }) => {
  await page.route("**/api/requests", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "قاعدة البيانات غير متاحة" }),
    });
  });
  await page.goto("/");

  const form = page.locator("form").filter({
    has: page.locator("#footer-newsletter"),
  });
  await form.locator("#footer-newsletter").fill("subscriber@example.com");
  await form.getByRole("button", { name: "اشترك" }).click();

  await expect(form.getByRole("alert")).toContainText("تعذّر حفظ اشتراكك");
  await expect(form).not.toContainText("تم تسجيل بريدك");
});

test("طلب التواصل ينتظر حفظ السيرفر ويرسل بيانات المهني", async ({ page }) => {
  let requestBody: Record<string, unknown> | null = null;
  await page.route("**/api/requests", async (route) => {
    requestBody = JSON.parse(route.request().postData() ?? "{}");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, id: "inquiry-professional-1" }),
    });
  });
  await page.goto("/lawyers/law-mahmoud");

  const form = page.locator("form").filter({
    has: page.getByRole("button", { name: "إرسال الطلب" }),
  });
  await form.getByLabel("الاسم").fill("سارة محمد");
  await form.getByLabel("رقم الهاتف").fill("01012345678");
  await form.getByLabel("البريد الإلكتروني (اختياري)").fill("sara@example.com");
  await form.getByRole("button", { name: "إرسال الطلب" }).click();

  await expect(page.getByText("تم إرسال طلبك إلى إدارة المنصة")).toBeVisible();
  expect(requestBody).toMatchObject({
    kind: "professional_request",
    name: "سارة محمد",
    phone: "01012345678",
    email: "sara@example.com",
    payload: {
      professionalId: "law-mahmoud",
      requestKind: "lawyer",
    },
  });
});

test("طلب التواصل لا يعرض نجاحًا عند فشل الحفظ", async ({ page }) => {
  await page.route("**/api/requests", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "قاعدة البيانات غير متاحة" }),
    });
  });
  await page.goto("/lawyers/law-mahmoud");

  const form = page.locator("form").filter({
    has: page.getByRole("button", { name: "إرسال الطلب" }),
  });
  await form.getByLabel("الاسم").fill("سارة محمد");
  await form.getByLabel("رقم الهاتف").fill("01012345678");
  await form.getByRole("button", { name: "إرسال الطلب" }).click();

  await expect(form).toContainText("قاعدة البيانات غير متاحة");
  await expect(page.getByText("تم إرسال طلبك إلى إدارة المنصة")).toHaveCount(0);
});

test("تسجيل الاهتمام بالتطبيق يعتمد على حفظ السيرفر", async ({ page }) => {
  let requestBody: Record<string, unknown> | null = null;
  await page.route("**/api/requests", async (route) => {
    requestBody = JSON.parse(route.request().postData() ?? "{}");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, id: "inquiry-app-1" }),
    });
  });
  await page.goto("/app");

  const interest = page.locator("#interest");
  await interest.getByLabel("البريد الإلكتروني").fill("mobile@example.com");
  await interest.getByRole("button", { name: "سجّل اهتمامك" }).click();

  await expect(interest).toContainText("تم تسجيل اهتمامك");
  expect(requestBody).toMatchObject({
    kind: "app_interest",
    email: "mobile@example.com",
  });
});

test("اهتمام التطبيق يعرض بديل التواصل عند فشل الحفظ", async ({ page }) => {
  await page.route("**/api/requests", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "قاعدة البيانات غير متاحة" }),
    });
  });
  await page.goto("/app");

  const interest = page.locator("#interest");
  await interest.getByLabel("البريد الإلكتروني").fill("mobile@example.com");
  await interest.getByRole("button", { name: "سجّل اهتمامك" }).click();

  await expect(interest).toContainText("تعذّر تسجيل اهتمامك");
  await expect(interest.getByRole("link", { name: "البريد المباشر" })).toBeVisible();
  await expect(interest).not.toContainText("تم تسجيل اهتمامك");
});
