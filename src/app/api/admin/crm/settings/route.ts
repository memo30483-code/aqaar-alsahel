import { NextResponse } from "next/server";
import { adminActor, adminCan, getAdminApiSession } from "@/lib/admin-api";
import {
  cloudGetCrmSettings,
  cloudSaveCrmSettings,
  crmSchemaMissing,
} from "@/lib/crm-server";
import { normalizeCrmSettings } from "@/lib/crm-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: unknown) {
  const missing = crmSchemaMissing(error);
  return NextResponse.json(
    {
      ok: false,
      error: missing
        ? "جداول CRM غير مفعّلة"
        : error instanceof Error
          ? error.message
          : "تعذر حفظ الإعدادات",
      ...(missing ? { code: "crm_schema_missing" } : {}),
    },
    { status: missing ? 503 : 500 }
  );
}

export async function GET() {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "غير مصرّح" }, { status: 401 });
  }
  if (!adminCan(session, "crm.view")) {
    return NextResponse.json({ ok: false, error: "غير مصرّح" }, { status: 403 });
  }
  try {
    const settings = await cloudGetCrmSettings();
    return NextResponse.json({ ok: true, settings }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "غير مصرّح" }, { status: 401 });
  }
  if (!adminCan(session, "crm.manage")) {
    return NextResponse.json({ ok: false, error: "غير مصرّح" }, { status: 403 });
  }
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "صيغة غير صحيحة" }, { status: 400 });
  }
  try {
    const settings = await cloudSaveCrmSettings(
      normalizeCrmSettings(raw),
      adminActor(session)
    );
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    return fail(error);
  }
}
