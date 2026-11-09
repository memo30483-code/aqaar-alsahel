import { NextResponse } from "next/server";
import { adminCan, getAdminApiSession } from "@/lib/admin-api";
import { actorSummary, appendAudit, readWorkflowSettings, writeWorkflowSettings } from "@/lib/workflow-server";
import { readStaffUsers } from "@/lib/staff-server";
import { normalizeWorkflowSettings } from "@/lib/workflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const session = await getAdminApiSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE });
  try {
    const settings = await readWorkflowSettings();
    return NextResponse.json(
      {
        ok: true,
        settings,
        canManage: adminCan(session, "workflow.manage"),
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "server_error" },
      { status: 500, headers: NO_STORE }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getAdminApiSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE });
  if (!adminCan(session, "workflow.manage")) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403, headers: NO_STORE });
  }
  let body: { settings?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400, headers: NO_STORE });
  }
  try {
    const [staff, current] = await Promise.all([
      readStaffUsers(),
      readWorkflowSettings(),
    ]);
    const allowed = new Set(staff.map((item) => item.id));
    const normalized = normalizeWorkflowSettings(body.settings);
    const previousById = new Map(current.delegations.map((item) => [item.id, item]));
    normalized.delegations = normalized.delegations
      .filter((item) => allowed.has(item.staffId))
      .map((item) => ({
        ...item,
        createdAt: previousById.get(item.id)?.createdAt ?? new Date().toISOString(),
        createdBy: previousById.get(item.id)?.createdBy ?? session.sub,
      }));
    const settings = await writeWorkflowSettings(normalized, session.sub);
    await appendAudit({
      ...actorSummary(session),
      action: "workflow.settings.update",
      category: "workflow",
      details: "تحديث سياسة المراجعة والموافقات والتفويضات",
      meta: { delegations: settings.delegations.length },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, settings }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "server_error" },
      { status: 500, headers: NO_STORE }
    );
  }
}
