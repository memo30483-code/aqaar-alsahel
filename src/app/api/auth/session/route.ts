import { NextResponse } from "next/server";
import { getUserApiSession } from "@/lib/user-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** حالة جلسة المستخدم حسب الكوكي الموقّع — مصدر الحقيقة للسيرفر */
export async function GET() {
  const session = await getUserApiSession();
  if (!session) {
    return NextResponse.json(
      { ok: true, authenticated: false },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
  return NextResponse.json(
    {
      ok: true,
      authenticated: true,
      account: {
        id: session.sub,
        email: session.email,
        name: session.name,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
