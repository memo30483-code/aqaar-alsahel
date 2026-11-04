import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin-session";
import { cloudGetInquiries } from "@/lib/cloud/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** استفسارات قاعدة البيانات — للأدمن الموثّق فقط */
export async function GET() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  const session = await verifyAdminToken(token);
  if (!session) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  try {
    const rows = await cloudGetInquiries(500);
    return NextResponse.json({ ok: true, rows });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "تعذر قراءة الاستفسارات",
      },
      { status: 500 }
    );
  }
}
