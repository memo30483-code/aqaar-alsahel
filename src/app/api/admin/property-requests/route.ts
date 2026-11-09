import { NextResponse } from "next/server";
import { adminCan, getAdminApiSession } from "@/lib/admin-api";
import {
  inquirySchemaMissing,
  listPropertyRequests,
} from "@/lib/property-requests-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "غير مصرّح" },
      { status: 401, headers: NO_STORE }
    );
  }
  if (!adminCan(session, "propertyRequests.view")) {
    return NextResponse.json(
      { ok: false, error: "غير مصرّح" },
      { status: 403, headers: NO_STORE }
    );
  }
  try {
    const rawRequests = await listPropertyRequests(1000);
    const showContact = adminCan(session, "owner.contact.view");
    const requests = showContact
      ? rawRequests
      : rawRequests.map((item) => ({
          ...item,
          name: "بيانات مقدم الطلب محجوبة",
          phone: "",
          email: "",
        }));
    return NextResponse.json(
      { ok: true, storage: "postgresql", requests },
      { headers: NO_STORE }
    );
  } catch (error) {
    if (inquirySchemaMissing(error)) {
      return NextResponse.json(
        {
          ok: false,
          error: "جدول الاستفسارات غير مفعّل في قاعدة البيانات",
          code: "schema_missing",
        },
        { status: 503, headers: NO_STORE }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "تعذر قراءة الطلبات",
      },
      { status: 500, headers: NO_STORE }
    );
  }
}
