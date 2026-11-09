import { NextResponse } from "next/server";
import { adminActor, adminCan, getAdminApiSession } from "@/lib/admin-api";
import {
  cloudCreateCrmLead,
  cloudGetCrmLeads,
  cloudImportCrmLeads,
  crmSchemaMissing,
} from "@/lib/crm-server";
import { normalizeCrmLead, type CrmLead } from "@/lib/crm-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const MAX_IMPORT = 1000;

function unauthorized() {
  return NextResponse.json({ ok: false, error: "غير مصرّح" }, { status: 401 });
}

function cleanLead(value: unknown): CrmLead | null {
  const lead = normalizeCrmLead(value);
  if (!lead) return null;
  if (lead.name.length > 160 || lead.phone.length > 40) return null;
  if (lead.email && lead.email.length > 240) return null;
  return {
    ...lead,
    name: lead.name.trim(),
    phone: lead.phone.trim(),
    email: lead.email?.trim() || undefined,
    tags: lead.tags.slice(0, 30).map((tag) => tag.slice(0, 80)),
    activities: lead.activities.slice(0, 1000),
    tasks: lead.tasks.slice(0, 1000),
  };
}

function databaseError(error: unknown) {
  if (crmSchemaMissing(error)) {
    return NextResponse.json(
      {
        ok: false,
        error: "جداول CRM غير مفعّلة في قاعدة البيانات",
        code: "crm_schema_missing",
      },
      { status: 503, headers: NO_STORE }
    );
  }
  return NextResponse.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : "تعذر الاتصال بقاعدة البيانات",
    },
    { status: 500, headers: NO_STORE }
  );
}

export async function GET() {
  const session = await getAdminApiSession();
  if (!session) return unauthorized();
  if (!adminCan(session, "crm.view") || !adminCan(session, "owner.contact.view")) {
    return NextResponse.json({ ok: false, error: "غير مصرّح ببيانات العملاء" }, { status: 403 });
  }
  try {
    const leads = await cloudGetCrmLeads();
    return NextResponse.json(
      { ok: true, storage: "postgresql", leads },
      { headers: NO_STORE }
    );
  } catch (error) {
    return databaseError(error);
  }
}

interface PostBody {
  action?: unknown;
  lead?: unknown;
  leads?: unknown;
}

export async function POST(request: Request) {
  const session = await getAdminApiSession();
  if (!session) return unauthorized();
  if (!adminCan(session, "crm.manage") || !adminCan(session, "owner.contact.view")) {
    return NextResponse.json({ ok: false, error: "غير مصرّح ببيانات العملاء" }, { status: 403 });
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "صيغة الطلب غير صحيحة" },
      { status: 400 }
    );
  }

  try {
    if (body.action === "import") {
      if (!Array.isArray(body.leads) || body.leads.length > MAX_IMPORT) {
        return NextResponse.json(
          { ok: false, error: `الاستيراد لا يتجاوز ${MAX_IMPORT} عميل في المرة` },
          { status: 400 }
        );
      }
      const leads = body.leads
        .map(cleanLead)
        .filter((lead): lead is CrmLead => lead !== null);
      if (leads.length !== body.leads.length) {
        return NextResponse.json(
          { ok: false, error: "بعض سجلات الاستيراد غير صالحة" },
          { status: 400 }
        );
      }
      const result = await cloudImportCrmLeads(leads, adminActor(session));
      return NextResponse.json({ ok: true, ...result }, { headers: NO_STORE });
    }

    const lead = cleanLead(body.lead);
    if (!lead) {
      return NextResponse.json(
        { ok: false, error: "بيانات العميل غير مكتملة" },
        { status: 400 }
      );
    }
    const result = await cloudCreateCrmLead(lead, adminActor(session));
    return NextResponse.json(
      { ok: true, lead: result.lead, duplicate: result.duplicate },
      { status: result.duplicate ? 200 : 201, headers: NO_STORE }
    );
  } catch (error) {
    return databaseError(error);
  }
}
