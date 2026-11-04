import { NextResponse } from "next/server";
import { adminActor, getAdminApiSession } from "@/lib/admin-api";
import { cloudAddCrmTask, cloudGetCrmLead, crmSchemaMissing } from "@/lib/crm-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "غير مصرّح" }, { status: 401 });
  }
  let body: { title?: unknown; dueAt?: unknown };
  try {
    body = (await request.json()) as { title?: unknown; dueAt?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "صيغة غير صحيحة" }, { status: 400 });
  }
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 300) : "";
  const dueAt = typeof body.dueAt === "string" ? body.dueAt : "";
  if (!title || !Number.isFinite(Date.parse(dueAt))) {
    return NextResponse.json({ ok: false, error: "عنوان المهمة أو موعدها غير صالح" }, { status: 400 });
  }
  try {
    await cloudAddCrmTask(params.id, title, new Date(dueAt).toISOString(), adminActor(session));
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
            : "تعذر حفظ المهمة",
        ...(missing ? { code: "crm_schema_missing" } : {}),
      },
      { status: missing ? 503 : 500 }
    );
  }
}
