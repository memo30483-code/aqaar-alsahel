import { NextResponse } from "next/server";
import { USER_COOKIE } from "@/lib/user-session";
import { getUserApiSession } from "@/lib/user-api";
import { revokeAccountSessions } from "@/lib/auth/accounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** إنهاء جلسة المستخدم على السيرفر (الكوكي الموقّع) */
export async function POST() {
  const session = await getUserApiSession();
  let revoked = false;
  if (session) {
    revoked = await revokeAccountSessions(session.sub).catch(() => false);
  }
  const response = NextResponse.json({ ok: true, revoked });
  response.cookies.set(USER_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
