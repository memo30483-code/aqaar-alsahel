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
