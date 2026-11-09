import { NextResponse } from "next/server";
import { cloudGetInquiries } from "@/lib/cloud/server";
import { adminCan, getAdminApiSession } from "@/lib/admin-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** استفسارات قاعدة البيانات — للأدمن الموثّق فقط */
export async function GET() {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  if (!adminCan(session, "crm.view") || !adminCan(session, "owner.contact.view")) {
    return NextResponse.json({ error: "غير مصرّح ببيانات العملاء" }, { status: 403 });
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
