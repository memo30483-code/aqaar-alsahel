import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/admin-api";
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
  try {
    const requests = await listPropertyRequests(1000);
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
