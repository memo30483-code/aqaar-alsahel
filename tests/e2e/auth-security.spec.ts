import { expect, test } from "@playwright/test";

test("سياسة التسجيل تفرض OTP عبر البريد فقط", async ({ request }) => {
  const response = await request.get("/api/auth/otp/options");
  const data = (await response.json()) as {
    ok?: boolean;
    options?: {
      required?: boolean;
      allowUserChoice?: boolean;
      defaultChannel?: string | null;
      channels?: string[];
    };
  };

  expect(response.ok()).toBeTruthy();
  expect(data.ok).toBe(true);
  expect(data.options?.required).toBe(true);
  expect(data.options?.allowUserChoice).toBe(false);
  expect(data.options?.channels?.every((channel) => channel === "email")).toBe(true);
  if (data.options?.channels?.length) {
    expect(data.options.defaultChannel).toBe("email");
  }
});

test("فحص الصحة يؤكد جاهزية مكونات Supabase", async ({ request }) => {
  const response = await request.get("/api/health");
  const data = (await response.json()) as {
    ok?: boolean;
    status?: string;
    components?: Record<string, boolean>;
  };
  expect(response.status()).toBe(200);
  expect(data.ok).toBe(true);
  expect(data.status).toBe("healthy");
  expect(Object.values(data.components ?? {}).every(Boolean)).toBe(true);
});

test("مهمة تنظيف الملفات ترفض الطلب غير الموقّع", async ({ request }) => {
  const response = await request.get("/api/cron/cleanup-uploads");
  expect(response.status()).toBe(401);
});
