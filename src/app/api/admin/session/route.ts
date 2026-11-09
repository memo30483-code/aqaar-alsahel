import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/admin-api";

/**
 * حالة جلسة الأدمن حسب الكوكي الموقّع على السيرفر.
 * لا يعتمد على أي قيمة قابلة للتلاعب في localStorage.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await getAdminApiSession();

  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    email: payload.sub,
    name: payload.name,
    role: payload.role,
    uid: payload.uid,
    permissions: payload.permissions,
  });
}
