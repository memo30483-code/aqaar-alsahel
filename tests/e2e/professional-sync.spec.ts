import { expect, test } from "@playwright/test";

const record = {
  id: "developer-account-1",
  kind: "developer",
  status: "approved",
  verified: true,
  featured: false,
  nameAr: "مسؤول الاختبار",
  companyAr: "شركة اختبار المزامنة",
  phone: "01012345678",
  email: "owner@example.com",
  projects: [],
  documents: [],
  licenses: [],
  reels: [],
  requestedAt: "2026-01-01T00:00:00.000Z",
  ownerToken: "owner-token-test",
  accountId: "account-test",
  publishPolicy: "review",
  order: 1,
  version: 1,
};

async function installSession(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "aqaar-session",
      JSON.stringify({
        name: "مسؤول الاختبار",
        email: "owner@example.com",
        phone: "01012345678",
        accountType: "developer",
        verifiedAt: new Date().toISOString(),
        role: "agent",
        memberStatus: "approved",
        ownerToken: "owner-token-test",
      })
    );
  });
}

test("تعديل المهني يُحفظ على السيرفر ويحدّث النسخة", async ({ page }) => {
  await installSession(page);
  const patchBodies: Array<{
    record?: typeof record;
    expectedVersion?: number;
  }> = [];
  await page.route("**/api/professional/me", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          record,
          updatedAt: "2026-11-11T10:00:00.000Z",
        }),
      });
      return;
    }
    const patchBody = JSON.parse(route.request().postData() ?? "{}") as {
      record?: typeof record;
      expectedVersion?: number;
    };
    patchBodies.push(patchBody);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        record: { ...patchBody.record, status: "pending", version: 2 },
        updatedAt: "2026-11-11T10:01:00.000Z",
      }),
    });
  });
  await page.goto("/professional");

  const form = page.locator("form").filter({
    has: page.getByRole("button", { name: "حفظ التعديلات" }),
  });
  await form.getByLabel(/اسم المسؤول/).fill("مسؤول محدث");
  await form.getByRole("button", { name: "حفظ التعديلات" }).click();

  await expect(page.getByRole("status")).toContainText(
    "تم حفظ التعديلات على السيرفر"
  );
  expect(patchBodies[0]?.expectedVersion).toBe(1);
  expect(patchBodies[0]?.record?.nameAr).toBe("مسؤول محدث");
});

test("تعارض نسخة المهني يظهر بوضوح ولا يعلن النجاح", async ({ page }) => {
  await installSession(page);
  await page.route("**/api/professional/me", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          record,
          updatedAt: "2026-11-11T10:00:00.000Z",
        }),
      });
      return;
    }
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        error: "conflict",
        message: "تم تعديل الملف من جهاز آخر",
        current: { ...record, version: 2 },
      }),
    });
  });
  await page.goto("/professional");

  const form = page.locator("form").filter({
    has: page.getByRole("button", { name: "حفظ التعديلات" }),
  });
  await form.getByLabel(/اسم المسؤول/).fill("تعديل متعارض");
  await form.getByRole("button", { name: "حفظ التعديلات" }).click();

  await expect(page.getByRole("status")).toContainText(
    "تم تعديل الملف من جهاز آخر"
  );
  await expect(page.getByRole("status")).not.toContainText(
    "تم حفظ التعديلات على السيرفر"
  );
});
