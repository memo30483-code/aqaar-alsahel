import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-session";
import { getAdminApiSession } from "@/lib/admin-api";
import { actorSummary, appendAudit } from "@/lib/workflow-server";

/** إنهاء جلسة الأدمن على السيرفر */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getAdminApiSession();
  if (session) {
    await appendAudit({
      ...actorSummary(session),
      action: "auth.logout",
      category: "auth",
      details: "تسجيل الخروج من لوحة الإدارة",
    }).catch(() => undefined);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
