import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminToken,
} from "@/lib/admin-session";

/**
 * تسجيل دخول الأدمن — التحقق يتم على السيرفر فقط.
 * بيانات الدخول من متغيّرات البيئة (ADMIN_EMAIL / ADMIN_PASSWORD)،
 * ولا تظهر أبدًا في حزمة JavaScript التي تُحمَّل للمتصفح.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** حد بسيط لمحاولات الدخول الفاشلة — 8 محاولات كل 10 دقائق لكل عنوان */
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const first = forwarded.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || "local";
}

function isRateLimited(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= Date.now()) return false;
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return;
  }
  entry.count += 1;
}

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
  const key = clientKey(request);

  if (isRateLimited(key)) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429 }
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

  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";

  /* فشل مغلق: بدون إعدادات على السيرفر لا يُسمح بأي دخول إداري */
  if (!adminEmail || !adminPassword) {
    return NextResponse.json(
      { ok: false, error: "not_configured" },
      { status: 503 }
    );
  }

  if (
    !email ||
    !password ||
    !safeEqual(email, adminEmail) ||
    !safeEqual(password, adminPassword)
  ) {
    recordFailure(key);
    return NextResponse.json(
      { ok: false, error: "invalid_credentials" },
      { status: 401 }
    );
  }

  attempts.delete(key);

  const name = process.env.ADMIN_NAME || "مدير النظام";
  const token = await createAdminToken({
    sub: adminEmail,
    name,
    role: "super_admin",
  });

  const response = NextResponse.json({
    ok: true,
    name,
    email: adminEmail,
    role: "super_admin",
  });

  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  return response;
}
