import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin-session";

/**
 * حالة جلسة الأدمن حسب الكوكي الموقّع على السيرفر.
 * لا يعتمد على أي قيمة قابلة للتلاعب في localStorage.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  const payload = await verifyAdminToken(token);

  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    email: payload.sub,
    name: payload.name,
    role: payload.role,
  });
}
