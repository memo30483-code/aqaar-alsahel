import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/admin-api";
import {
  cloudDeleteCrmTask,
  cloudGetCrmLead,
  cloudToggleCrmTask,
  crmSchemaMissing,
} from "@/lib/crm-server";

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
          : "تعذر تعديل المهمة",
      ...(missing ? { code: "crm_schema_missing" } : {}),
    },
    { status: missing ? 503 : 500 }
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "غير مصرّح" }, { status: 401 });
  }
  let body: { done?: unknown };
  try {
    body = (await request.json()) as { done?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "صيغة غير صحيحة" }, { status: 400 });
  }
  if (typeof body.done !== "boolean") {
    return NextResponse.json({ ok: false, error: "حالة المهمة غير صالحة" }, { status: 400 });
  }
  try {
    const changed = await cloudToggleCrmTask(params.id, params.taskId, body.done);
    if (!changed) {
      return NextResponse.json({ ok: false, error: "المهمة غير موجودة" }, { status: 404 });
    }
    const lead = await cloudGetCrmLead(params.id);
    return NextResponse.json({ ok: true, lead }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "غير مصرّح" }, { status: 401 });
  }
  try {
    const changed = await cloudDeleteCrmTask(params.id, params.taskId);
    if (!changed) {
      return NextResponse.json({ ok: false, error: "المهمة غير موجودة" }, { status: 404 });
    }
    const lead = await cloudGetCrmLead(params.id);
    return NextResponse.json({ ok: true, lead }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return fail(error);
  }
}
