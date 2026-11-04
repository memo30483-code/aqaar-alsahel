/**
 * طبقة CRM العلاقية — للسيرفر فقط.
 *
 * كل القراءة والكتابة تمر عبر service_role داخل Route Handlers. جداول CRM
 * نفسها مغلقة بـRLS ولا تُتاح مباشرة للمتصفح أو للزوار.
 */

import { cloudRest, CloudRestError } from "@/lib/cloud/server";
import {
  CRM_SOURCE_LABEL,
  normalizeCrmLead,
  type CrmActivity,
  type CrmActivityKind,
  type CrmLead,
  type CrmPriority,
  type CrmStage,
  type CrmTask,
} from "@/lib/crm-types";
import {
  DEFAULT_CRM_SETTINGS,
  type CrmSettings,
} from "@/lib/crm-settings";

interface CrmLeadRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: string;
  source_label: string | null;
  source_ref: string | null;
  property_id: string | null;
  interest: string | null;
  city: string | null;
  budget: number | string | null;
  stage: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  tags: string[] | null;
  notes: string | null;
  reference: string | null;
  archived: boolean;
  priority: string | null;
  deal_value: number | string | null;
  commission: number | string | null;
  won_at: string | null;
  version: number | string;
  created_at: string;
  updated_at: string;
}

interface CrmActivityRow {
  id: string;
  lead_id: string;
  kind: string;
  actor: string;
  body: string;
  from_stage: string | null;
  to_stage: string | null;
  created_at: string;
}

interface CrmTaskRow {
  id: string;
  lead_id: string;
  title: string;
  due_at: string;
  done: boolean;
  created_by: string;
  created_at: string;
  done_at: string | null;
}

interface CrmSettingsRow {
  id: string;
  auto_assign: boolean;
  default_assignee_id: string | null;
  default_assignee_name: string | null;
}

function query(resource: string, params: Record<string, string>): string {
  return `${resource}?${new URLSearchParams(params).toString()}`;
}

function optionalNumber(value: number | string | null): number | undefined {
  if (value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function activityFromRow(row: CrmActivityRow): CrmActivity {
  return {
    id: row.id,
    kind: row.kind as CrmActivityKind,
    at: row.created_at,
    by: row.actor,
    text: row.body,
    ...(row.from_stage ? { fromStage: row.from_stage as CrmStage } : {}),
    ...(row.to_stage ? { toStage: row.to_stage as CrmStage } : {}),
  };
}

function taskFromRow(row: CrmTaskRow): CrmTask {
  return {
    id: row.id,
    title: row.title,
    dueAt: row.due_at,
    done: row.done,
    createdAt: row.created_at,
    createdBy: row.created_by,
    ...(row.done_at ? { doneAt: row.done_at } : {}),
  };
}

function leadFromRow(
  row: CrmLeadRow,
  activities: CrmActivity[] = [],
  tasks: CrmTask[] = []
): CrmLead {
  const source = row.source as CrmLead["source"];
  const raw: CrmLead = {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || undefined,
    source,
    sourceLabel: row.source_label || CRM_SOURCE_LABEL[source],
    sourceRef: row.source_ref || undefined,
    propertyId: row.property_id || undefined,
    interest: row.interest || undefined,
    city: row.city || undefined,
    budget: optionalNumber(row.budget),
    stage: row.stage as CrmStage,
    assignedTo: row.assigned_to || undefined,
    assignedToName: row.assigned_to_name || undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    notes: row.notes || undefined,
    reference: row.reference || undefined,
    archived: row.archived || undefined,
    priority: (row.priority || "warm") as CrmPriority,
    dealValue: optionalNumber(row.deal_value),
    commission: optionalNumber(row.commission),
    wonAt: row.won_at || undefined,
    version: Number(row.version) || 1,
    activities,
    tasks,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  return normalizeCrmLead(raw) ?? raw;
}

function serializeLead(lead: CrmLead): Record<string, unknown> {
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    source: lead.source,
    sourceLabel: lead.sourceLabel,
    sourceRef: lead.sourceRef,
    propertyId: lead.propertyId,
    interest: lead.interest,
    city: lead.city,
    budget: lead.budget,
    stage: lead.stage,
    assignedTo: lead.assignedTo,
    assignedToName: lead.assignedToName,
    tags: lead.tags,
    notes: lead.notes,
    reference: lead.reference,
    archived: lead.archived,
    priority: lead.priority ?? "warm",
    dealValue: lead.dealValue,
    commission: lead.commission,
    wonAt: lead.wonAt,
    activities: lead.activities,
    tasks: lead.tasks,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}

export function crmSchemaMissing(error: unknown): boolean {
  return (
    error instanceof CloudRestError &&
    (error.status === 404 ||
      error.body.includes("PGRST205") ||
      error.body.includes("crm_leads"))
  );
}

export async function cloudGetCrmLeads(): Promise<CrmLead[]> {
  const [leadRows, activityRows, taskRows] = await Promise.all([
    cloudRest<CrmLeadRow[]>(
      query("crm_leads", {
        select: "*",
        order: "updated_at.desc",
        limit: "5000",
      })
    ),
    cloudRest<CrmActivityRow[]>(
      query("crm_activities", {
        select: "*",
        order: "created_at.desc",
        limit: "20000",
      })
    ),
    cloudRest<CrmTaskRow[]>(
      query("crm_tasks", {
        select: "*",
        order: "due_at.asc",
        limit: "20000",
      })
    ),
  ]);

  const activities = new Map<string, CrmActivity[]>();
  for (const row of activityRows) {
    const list = activities.get(row.lead_id) ?? [];
    list.push(activityFromRow(row));
    activities.set(row.lead_id, list);
  }
  const tasks = new Map<string, CrmTask[]>();
  for (const row of taskRows) {
    const list = tasks.get(row.lead_id) ?? [];
    list.push(taskFromRow(row));
    tasks.set(row.lead_id, list);
  }
  return leadRows.map((row) =>
    leadFromRow(row, activities.get(row.id) ?? [], tasks.get(row.id) ?? [])
  );
}

export async function cloudGetCrmLead(id: string): Promise<CrmLead | null> {
  const filter = `eq.${id}`;
  const [leads, activities, tasks] = await Promise.all([
    cloudRest<CrmLeadRow[]>(
      query("crm_leads", { select: "*", id: filter, limit: "1" })
    ),
    cloudRest<CrmActivityRow[]>(
      query("crm_activities", {
        select: "*",
        lead_id: filter,
        order: "created_at.desc",
      })
    ),
    cloudRest<CrmTaskRow[]>(
      query("crm_tasks", {
        select: "*",
        lead_id: filter,
        order: "due_at.asc",
      })
    ),
  ]);
  const row = leads[0];
  return row
    ? leadFromRow(
        row,
        activities.map(activityFromRow),
        tasks.map(taskFromRow)
      )
    : null;
}

export async function cloudCreateCrmLead(
  lead: CrmLead,
  actor: string
): Promise<{ lead: CrmLead; duplicate: boolean }> {
  const result = await cloudRest<{ id: string; duplicate: boolean }>(
    "rpc/crm_create_lead",
    {
      method: "POST",
      body: { p_lead: serializeLead(lead), p_actor: actor },
    }
  );
  const saved = await cloudGetCrmLead(result.id);
  if (!saved) throw new Error("تم الحفظ لكن تعذر قراءة العميل من قاعدة البيانات");
  return { lead: saved, duplicate: result.duplicate === true };
}

export async function cloudImportCrmLeads(
  leads: CrmLead[],
  actor: string
): Promise<{ added: number; duplicates: number }> {
  let added = 0;
  let duplicates = 0;
  for (const lead of leads.slice(0, 5000)) {
    const result = await cloudCreateCrmLead(lead, actor);
    if (result.duplicate) duplicates += 1;
    else added += 1;
  }
  return { added, duplicates };
}

export type CrmLeadPatch = Partial<
  Pick<
    CrmLead,
    | "name"
    | "phone"
    | "email"
    | "interest"
    | "city"
    | "budget"
    | "tags"
    | "notes"
    | "reference"
    | "priority"
    | "dealValue"
    | "commission"
    | "archived"
  >
>;

export class CrmConflictError extends Error {
  constructor() {
    super("تم تعديل العميل من جهاز آخر. حدّث الصفحة ثم أعد المحاولة.");
    this.name = "CrmConflictError";
  }
}

export async function cloudUpdateCrmLead(
  id: string,
  patch: CrmLeadPatch,
  expectedVersion?: number
): Promise<CrmLead> {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.phone !== undefined) payload.phone = patch.phone;
  if (patch.email !== undefined) payload.email = patch.email || null;
  if (patch.interest !== undefined) payload.interest = patch.interest || null;
  if (patch.city !== undefined) payload.city = patch.city || null;
  if (patch.budget !== undefined) payload.budget = patch.budget ?? null;
  if (patch.tags !== undefined) payload.tags = patch.tags;
  if (patch.notes !== undefined) payload.notes = patch.notes || null;
  if (patch.reference !== undefined) payload.reference = patch.reference || null;
  if (patch.priority !== undefined) payload.priority = patch.priority;
  if (patch.dealValue !== undefined) payload.deal_value = patch.dealValue ?? null;
  if (patch.commission !== undefined) payload.commission = patch.commission ?? null;
  if (patch.archived !== undefined) payload.archived = patch.archived;

  const params: Record<string, string> = { id: `eq.${id}`, select: "id" };
  if (typeof expectedVersion === "number") {
    params.version = `eq.${expectedVersion}`;
  }
  const rows = await cloudRest<{ id: string }[]>(query("crm_leads", params), {
    method: "PATCH",
    body: payload,
    prefer: "return=representation",
  });
  if (!rows.length && typeof expectedVersion === "number") {
    throw new CrmConflictError();
  }
  const saved = await cloudGetCrmLead(id);
  if (!saved) throw new Error("العميل غير موجود");
  return saved;
}

async function booleanRpc(
  name: string,
  body: Record<string, unknown>
): Promise<boolean> {
  return cloudRest<boolean>(`rpc/${name}`, { method: "POST", body });
}

export async function cloudChangeCrmStage(
  id: string,
  stage: CrmStage,
  actor: string
): Promise<boolean> {
  return booleanRpc("crm_set_stage", {
    p_lead_id: id,
    p_stage: stage,
    p_actor: actor,
  });
}

export async function cloudAssignCrmLead(
  id: string,
  assigneeId: string | undefined,
  assigneeName: string | undefined,
  actor: string
): Promise<boolean> {
  return booleanRpc("crm_assign_lead", {
    p_lead_id: id,
    p_assignee_id: assigneeId ?? "",
    p_assignee_name: assigneeName ?? "",
    p_actor: actor,
  });
}

export async function cloudAddCrmActivity(
  id: string,
  kind: CrmActivityKind,
  text: string,
  actor: string
): Promise<string> {
  return cloudRest<string>("rpc/crm_add_activity", {
    method: "POST",
    body: {
      p_lead_id: id,
      p_kind: kind,
      p_body: text,
      p_actor: actor,
    },
  });
}

export async function cloudAddCrmTask(
  id: string,
  title: string,
  dueAt: string,
  actor: string
): Promise<string> {
  return cloudRest<string>("rpc/crm_add_task", {
    method: "POST",
    body: {
      p_lead_id: id,
      p_title: title,
      p_due_at: dueAt,
      p_actor: actor,
    },
  });
}

export async function cloudToggleCrmTask(
  id: string,
  taskId: string,
  done: boolean
): Promise<boolean> {
  return booleanRpc("crm_set_task_done", {
    p_lead_id: id,
    p_task_id: taskId,
    p_done: done,
  });
}

export async function cloudDeleteCrmTask(
  id: string,
  taskId: string
): Promise<boolean> {
  return booleanRpc("crm_delete_task", {
    p_lead_id: id,
    p_task_id: taskId,
  });
}

export async function cloudGetCrmSettings(): Promise<CrmSettings> {
  const rows = await cloudRest<CrmSettingsRow[]>(
    query("crm_settings", { select: "*", id: "eq.main", limit: "1" })
  );
  const row = rows[0];
  if (!row) return { ...DEFAULT_CRM_SETTINGS };
  return {
    autoAssign: row.auto_assign && Boolean(row.default_assignee_id),
    ...(row.default_assignee_id
      ? { defaultAssigneeId: row.default_assignee_id }
      : {}),
    ...(row.default_assignee_name
      ? { defaultAssigneeName: row.default_assignee_name }
      : {}),
  };
}

export async function cloudSaveCrmSettings(
  settings: CrmSettings,
  actor: string
): Promise<CrmSettings> {
  await cloudRest<CrmSettingsRow[]>(
    query("crm_settings", { id: "eq.main", select: "id" }),
    {
      method: "PATCH",
      body: {
        auto_assign: settings.autoAssign,
        default_assignee_id: settings.defaultAssigneeId ?? null,
        default_assignee_name: settings.defaultAssigneeName ?? null,
        updated_at: new Date().toISOString(),
        updated_by: actor,
      },
      prefer: "return=representation",
    }
  );
  return cloudGetCrmSettings();
}
