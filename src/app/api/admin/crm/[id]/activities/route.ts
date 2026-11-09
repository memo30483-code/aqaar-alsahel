import { NextResponse } from "next/server";
import { adminActor, adminCan, getAdminApiSession } from "@/lib/admin-api";
import {
  cloudAddCrmActivity,
  cloudGetCrmLead,
  crmSchemaMissing,
} from "@/lib/crm-server";
import type { CrmActivityKind } from "@/lib/crm-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = new Set<CrmActivityKind>([
  "note",
  "call",
  "whatsapp",
  "meeting",
  "email",
]);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "غير مصرّح" }, { status: 401 });
  }
  if (!adminCan(session, "crm.manage") || !adminCan(session, "owner.contact.view")) {
    return NextResponse.json({ ok: false, error: "غير مصرّح" }, { status: 403 });
  }
  let body: { kind?: unknown; text?: unknown };
  try {
    body = (await request.json()) as { kind?: unknown; text?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "صيغة غير صحيحة" }, { status: 400 });
  }
  const kind = body.kind as CrmActivityKind;
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 5000) : "";
  if (!KINDS.has(kind) || !text) {
    return NextResponse.json({ ok: false, error: "نوع السجل أو نصه غير صالح" }, { status: 400 });
  }
  try {
    await cloudAddCrmActivity(params.id, kind, text, adminActor(session));
    const lead = await cloudGetCrmLead(params.id);
    return NextResponse.json({ ok: true, lead }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const missing = crmSchemaMissing(error);
    return NextResponse.json(
      {
        ok: false,
        error: missing
          ? "جداول CRM غير مفعّلة"
          : error instanceof Error
            ? error.message
            : "تعذر حفظ السجل",
        ...(missing ? { code: "crm_schema_missing" } : {}),
      },
      { status: missing ? 503 : 500 }
    );
  }
}
