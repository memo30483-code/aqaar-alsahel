import { NextResponse } from "next/server";
import { adminActor, adminCan, getAdminApiSession } from "@/lib/admin-api";
import {
  cloudAssignCrmLead,
  cloudChangeCrmStage,
  cloudGetCrmLead,
  cloudUpdateCrmLead,
  CrmConflictError,
  crmSchemaMissing,
  type CrmLeadPatch,
} from "@/lib/crm-server";
import type { CrmPriority, CrmStage } from "@/lib/crm-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAGES = new Set<CrmStage>([
  "new",
  "contacted",
  "viewing",
  "negotiation",
  "won",
  "lost",
]);
const PRIORITIES = new Set<CrmPriority>(["hot", "warm", "cold"]);
const NO_STORE = { "Cache-Control": "no-store" };

function text(value: unknown, max: number): string | undefined {
  return typeof value === "string" ? value.trim().slice(0, max) : undefined;
}

function number(value: unknown): number | undefined {
  if (value === null || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function errorResponse(error: unknown) {
  if (error instanceof CrmConflictError) {
    return NextResponse.json(
      { ok: false, error: error.message, code: "conflict" },
      { status: 409, headers: NO_STORE }
    );
  }
  if (crmSchemaMissing(error)) {
    return NextResponse.json(
      { ok: false, error: "جداول CRM غير مفعّلة", code: "crm_schema_missing" },
      { status: 503, headers: NO_STORE }
    );
  }
  return NextResponse.json(
    { ok: false, error: error instanceof Error ? error.message : "تعذر الحفظ" },
    { status: 500, headers: NO_STORE }
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "غير مصرّح" }, { status: 401 });
  }
  if (!adminCan(session, "crm.view") || !adminCan(session, "owner.contact.view")) {
    return NextResponse.json({ ok: false, error: "غير مصرّح ببيانات العملاء" }, { status: 403 });
  }
  try {
    const lead = await cloudGetCrmLead(id);
    if (!lead) {
      return NextResponse.json({ ok: false, error: "العميل غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, lead }, { headers: NO_STORE });
  } catch (error) {
    return errorResponse(error);
  }
}

interface PatchBody {
  action?: unknown;
  stage?: unknown;
  assignedTo?: unknown;
  assignedToName?: unknown;
  patch?: Record<string, unknown>;
  expectedVersion?: unknown;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "غير مصرّح" }, { status: 401 });
  }
  if (!adminCan(session, "crm.manage") || !adminCan(session, "owner.contact.view")) {
    return NextResponse.json({ ok: false, error: "غير مصرّح ببيانات العملاء" }, { status: 403 });
  }
  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ ok: false, error: "صيغة غير صحيحة" }, { status: 400 });
  }

  try {
    if (body.action === "stage") {
      if (!STAGES.has(body.stage as CrmStage)) {
        return NextResponse.json({ ok: false, error: "مرحلة غير صالحة" }, { status: 400 });
      }
      const changed = await cloudChangeCrmStage(
        id,
        body.stage as CrmStage,
        adminActor(session)
      );
      if (!changed) {
        return NextResponse.json({ ok: false, error: "العميل غير موجود" }, { status: 404 });
      }
    } else if (body.action === "assign") {
      const changed = await cloudAssignCrmLead(
        id,
        text(body.assignedTo, 120),
        text(body.assignedToName, 160),
        adminActor(session)
      );
      if (!changed) {
        return NextResponse.json({ ok: false, error: "العميل غير موجود" }, { status: 404 });
      }
    } else {
      const input = body.patch ?? {};
      const patch: CrmLeadPatch = {};
      if (Object.prototype.hasOwnProperty.call(input, "name")) {
        const name = text(input.name, 160);
        if (!name) {
          return NextResponse.json({ ok: false, error: "اسم العميل مطلوب" }, { status: 400 });
        }
        patch.name = name;
      }
      if (Object.prototype.hasOwnProperty.call(input, "phone")) {
        patch.phone = text(input.phone, 40) ?? "";
      }
      if (Object.prototype.hasOwnProperty.call(input, "email")) {
        patch.email = text(input.email, 240);
      }
      if (Object.prototype.hasOwnProperty.call(input, "interest")) {
        patch.interest = text(input.interest, 600);
      }
      if (Object.prototype.hasOwnProperty.call(input, "city")) {
        patch.city = text(input.city, 120);
      }
      if (Object.prototype.hasOwnProperty.call(input, "budget")) {
        patch.budget = number(input.budget);
      }
      if (Object.prototype.hasOwnProperty.call(input, "notes")) {
        patch.notes = text(input.notes, 5000);
      }
      if (Object.prototype.hasOwnProperty.call(input, "reference")) {
        patch.reference = text(input.reference, 160);
      }
      if (Object.prototype.hasOwnProperty.call(input, "tags")) {
        if (!Array.isArray(input.tags)) {
          return NextResponse.json({ ok: false, error: "الوسوم غير صالحة" }, { status: 400 });
        }
        patch.tags = input.tags
          .filter((tag): tag is string => typeof tag === "string")
          .slice(0, 30)
          .map((tag) => tag.trim().slice(0, 80))
          .filter(Boolean);
      }
      if (Object.prototype.hasOwnProperty.call(input, "priority")) {
        if (!PRIORITIES.has(input.priority as CrmPriority)) {
          return NextResponse.json({ ok: false, error: "الأولوية غير صالحة" }, { status: 400 });
        }
        patch.priority = input.priority as CrmPriority;
      }
      if (Object.prototype.hasOwnProperty.call(input, "dealValue")) {
        patch.dealValue = number(input.dealValue);
      }
      if (Object.prototype.hasOwnProperty.call(input, "commission")) {
        patch.commission = number(input.commission);
      }
      if (Object.prototype.hasOwnProperty.call(input, "archived")) {
        patch.archived = input.archived === true;
      }
      const expectedVersion =
        typeof body.expectedVersion === "number" ? body.expectedVersion : undefined;
      await cloudUpdateCrmLead(id, patch, expectedVersion);
    }

    const lead = await cloudGetCrmLead(id);
    return NextResponse.json({ ok: true, lead }, { headers: NO_STORE });
  } catch (error) {
    return errorResponse(error);
  }
}

/** الحذف من الواجهة = أرشفة آمنة؛ لا نمسح سجل التواصل نهائيًا. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "غير مصرّح" }, { status: 401 });
  }
  if (!adminCan(session, "crm.manage")) {
    return NextResponse.json({ ok: false, error: "غير مصرّح" }, { status: 403 });
  }
  try {
    const lead = await cloudUpdateCrmLead(id, { archived: true });
    return NextResponse.json({ ok: true, lead }, { headers: NO_STORE });
  } catch (error) {
    return errorResponse(error);
  }
}
