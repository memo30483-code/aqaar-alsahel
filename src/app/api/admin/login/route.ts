import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminToken,
} from "@/lib/admin-session";
import { authenticateStaff, isStaffRoleValue } from "@/lib/staff-server";
import { appendAudit } from "@/lib/workflow-server";
import {
  checkRateLimit,
  clientIp,
  hashRateKey,
  rateLimitResponse,
} from "@/lib/rate-limit-server";

/**
 * تسجيل دخول المدير العام أو أحد الموظفين — التحقق يتم على السيرفر فقط.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** حدود موزّعة: 20 محاولة لكل عنوان و8 لكل بريد كل 10 دقائق */
const IP_LIMIT = { limit: 20, windowSeconds: 600, failClosed: true };
const EMAIL_LIMIT = { limit: 8, windowSeconds: 600, failClosed: true };

/** مقارنة ثابتة الزمن لتقليل تسريب المعلومات عبر التوقيت */
function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const ipLimit = await checkRateLimit(
    hashRateKey("admin-login-ip", clientIp(request)),
    IP_LIMIT
  );
  if (!ipLimit.allowed) {
    return rateLimitResponse(
      ipLimit,
      "محاولات دخول كثيرة من هذا العنوان. حاول بعد قليل."
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (email) {
    const emailLimit = await checkRateLimit(
      hashRateKey("admin-login-email", email),
      EMAIL_LIMIT
    );
    if (!emailLimit.allowed) {
      return rateLimitResponse(
        emailLimit,
        "محاولات دخول كثيرة لهذا الحساب. حاول بعد قليل."
      );
    }
  }

  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
  }

  const isRoot = Boolean(
    adminEmail &&
      adminPassword &&
      safeEqual(email, adminEmail) &&
      safeEqual(password, adminPassword)
  );

  let uid = "root";
  let name = process.env.ADMIN_NAME || "مدير النظام";
  let role: "agent" | "moderator" | "reviewer" | "admin" | "super_admin" =
    "super_admin";

  if (!isRoot) {
    try {
      const staff = await authenticateStaff(email, password);
      if (!staff || !isStaffRoleValue(staff.role)) {
        return NextResponse.json(
          { ok: false, error: "invalid_credentials" },
          { status: 401 }
        );
      }
      uid = staff.id;
      name = staff.name;
      role = staff.role;
    } catch {
      return NextResponse.json(
        { ok: false, error: "service_unavailable" },
        { status: 503 }
      );
    }
  }

  const token = await createAdminToken({
    sub: isRoot ? adminEmail : email,
    uid,
    name,
    role,
  });

  const response = NextResponse.json({
    ok: true,
    name,
    email: isRoot ? adminEmail : email,
    uid,
    role,
  });

  await appendAudit({
    action: "auth.login",
    category: "auth",
    actorId: uid,
    actorEmail: isRoot ? adminEmail : email,
    actorName: name,
    actorRole: role,
    details: "تسجيل دخول ناجح إلى لوحة الإدارة",
  }).catch(() => undefined);

  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  return response;
}
