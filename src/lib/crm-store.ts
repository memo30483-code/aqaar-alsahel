"use client";

/**
 * مخزن نظام العملاء (CRM).
 *
 * يُحفظ محليًا مثل بقية مخازن المنصة، ويُزامَن تلقائيًا مع Supabase عبر
 * اعتراض `localStorage` في `cloud/push.ts` بعد إدراج المفتاح في `cloud/keys.ts`.
 */

import { useEffect, useState } from "react";
import type { Property } from "@/types/property";
import type { ProfessionalRequest } from "@/lib/professionals-store";
import {
  CRM_KEY,
  CRM_SOURCE_LABEL,
  inquiryLead,
  newCrmId,
  normalizeCrmLeads,
  professionalLead,
  propertyLead,
  type CrmActivity,
  type CrmActivityKind,
  type CrmInquiryRow,
  type CrmLead,
  type CrmSource,
  type CrmStage,
  type CrmTask,
} from "./crm-types";

export const CRM_EVENT = "aqaar:crm";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** null يعني أن المفتاح لم يُنشأ بعد (أول استخدام) */
export function readStoredCrm(): CrmLead[] | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(CRM_KEY);
    if (raw === null) return null;
    return normalizeCrmLeads(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function hasCrmStore(): boolean {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(CRM_KEY) !== null;
}

export function getCrmLeads(): CrmLead[] {
  return readStoredCrm() ?? [];
}

export function saveCrmLeads(leads: CrmLead[]): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(
      CRM_KEY,
      JSON.stringify({
        items: leads,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch {
    return false;
  }
  window.dispatchEvent(new CustomEvent(CRM_EVENT));
  return true;
}

function nowIso(): string {
  return new Date().toISOString();
}

function activity(
  kind: CrmActivityKind,
  text: string,
  by: string,
  extra: Partial<CrmActivity> = {}
): CrmActivity {
  return {
    id: newCrmId("act"),
    kind,
    at: nowIso(),
    by,
    text,
    ...extra,
  };
}

export interface CrmLeadInput {
  name: string;
  phone: string;
  email?: string;
  source?: CrmSource;
  sourceLabel?: string;
  interest?: string;
  city?: string;
  budget?: number;
  stage?: CrmStage;
  assignedTo?: string;
  assignedToName?: string;
  tags?: string[];
  notes?: string;
  reference?: string;
  createdBy: string;
}

export function createCrmLead(input: CrmLeadInput): CrmLead | null {
  const name = input.name.trim();
  if (!name) return null;
  const created = nowIso();
  const lead: CrmLead = {
    id: newCrmId("lead"),
    name,
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    source: input.source ?? "manual",
    sourceLabel: input.sourceLabel ?? CRM_SOURCE_LABEL[input.source ?? "manual"],
    interest: input.interest?.trim() || undefined,
    city: input.city?.trim() || undefined,
    budget:
      typeof input.budget === "number" && Number.isFinite(input.budget)
        ? input.budget
        : undefined,
    stage: input.stage ?? "new",
    assignedTo: input.assignedTo || undefined,
    assignedToName: input.assignedToName || undefined,
    tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
    notes: input.notes?.trim() || undefined,
    reference: input.reference?.trim() || undefined,
    activities: [
      activity("note", "تمت إضافة العميل يدويًا.", input.createdBy),
    ],
    tasks: [],
    createdAt: created,
    updatedAt: created,
  };
  const saved = saveCrmLeads([lead, ...getCrmLeads()]);
  return saved ? lead : null;
}

export function updateCrmLead(
  id: string,
  patch: Partial<Omit<CrmLead, "id" | "createdAt">>
): boolean {
  const leads = getCrmLeads();
  let changed = false;
  const next = leads.map((lead) => {
    if (lead.id !== id) return lead;
    changed = true;
    return { ...lead, ...patch, id: lead.id, updatedAt: nowIso() };
  });
  return changed ? saveCrmLeads(next) : false;
}

export function deleteCrmLead(id: string): boolean {
  const leads = getCrmLeads();
  const next = leads.filter((lead) => lead.id !== id);
  if (next.length === leads.length) return false;
  return saveCrmLeads(next);
}

export function addCrmActivity(
  id: string,
  kind: CrmActivityKind,
  text: string,
  by: string
): boolean {
  const clean = text.trim();
  if (!clean) return false;
  const leads = getCrmLeads();
  let changed = false;
  const next = leads.map((lead) => {
    if (lead.id !== id) return lead;
    changed = true;
    return {
      ...lead,
      activities: [activity(kind, clean, by), ...lead.activities],
      updatedAt: nowIso(),
    };
  });
  return changed ? saveCrmLeads(next) : false;
}

export function changeCrmStage(
  id: string,
  stage: CrmStage,
  by: string
): boolean {
  const leads = getCrmLeads();
  let changed = false;
  const next = leads.map((lead) => {
    if (lead.id !== id || lead.stage === stage) return lead;
    changed = true;
    return {
      ...lead,
      stage,
      activities: [
        activity("stage", "تم تغيير مرحلة العميل.", by, {
          fromStage: lead.stage,
          toStage: stage,
        }),
        ...lead.activities,
      ],
      updatedAt: nowIso(),
    };
  });
  return changed ? saveCrmLeads(next) : false;
}

export function assignCrmLead(
  id: string,
  assignedTo: string | undefined,
  assignedToName: string | undefined,
  by: string
): boolean {
  const leads = getCrmLeads();
  let changed = false;
  const next = leads.map((lead) => {
    if (lead.id !== id) return lead;
    changed = true;
    return {
      ...lead,
      assignedTo,
      assignedToName,
      activities: [
        activity(
          "note",
          assignedToName
            ? `تم إسناد العميل إلى ${assignedToName}.`
            : "تم إلغاء إسناد العميل.",
          by
        ),
        ...lead.activities,
      ],
      updatedAt: nowIso(),
    };
  });
  return changed ? saveCrmLeads(next) : false;
}

export function addCrmTask(
  id: string,
  title: string,
  dueAt: string,
  by: string
): boolean {
  const clean = title.trim();
  if (!clean) return false;
  const leads = getCrmLeads();
  let changed = false;
  const next = leads.map((lead) => {
    if (lead.id !== id) return lead;
    changed = true;
    const task: CrmTask = {
      id: newCrmId("task"),
      title: clean,
      dueAt: dueAt || nowIso(),
      done: false,
      createdAt: nowIso(),
      createdBy: by,
    };
    return {
      ...lead,
      tasks: [task, ...lead.tasks],
      updatedAt: nowIso(),
    };
  });
  return changed ? saveCrmLeads(next) : false;
}

export function toggleCrmTask(
  id: string,
  taskId: string,
  done: boolean
): boolean {
  const leads = getCrmLeads();
  let changed = false;
  const next = leads.map((lead) => {
    if (lead.id !== id) return lead;
    const tasks = lead.tasks.map((task) => {
      if (task.id !== taskId) return task;
      changed = true;
      return {
        ...task,
        done,
        doneAt: done ? nowIso() : undefined,
      };
    });
    return changed ? { ...lead, tasks, updatedAt: nowIso() } : lead;
  });
  return changed ? saveCrmLeads(next) : false;
}

export function deleteCrmTask(id: string, taskId: string): boolean {
  const leads = getCrmLeads();
  let changed = false;
  const next = leads.map((lead) => {
    if (lead.id !== id) return lead;
    const tasks = lead.tasks.filter((task) => task.id !== taskId);
    if (tasks.length === lead.tasks.length) return lead;
    changed = true;
    return { ...lead, tasks, updatedAt: nowIso() };
  });
  return changed ? saveCrmLeads(next) : false;
}

function readArray(key: string): unknown[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { items?: unknown }).items)
    ) {
      return (parsed as { items: unknown[] }).items;
    }
    return [];
  } catch {
    return [];
  }
}

function refOf(lead: CrmLead): string {
  return `${lead.source}:${lead.sourceRef ?? lead.id}`;
}

/** دمج قائمة مرشحين مع الموجود فعليًا دون تكرار */
export function importCrmLeads(candidates: CrmLead[]): number {
  const existing = getCrmLeads();
  const known = new Set(existing.map(refOf));
  const additions: CrmLead[] = [];
  for (const candidate of candidates) {
    const ref = refOf(candidate);
    if (known.has(ref)) continue;
    known.add(ref);
    additions.push(candidate);
  }
  /*
   * لا نكتب شيئًا عند عدم وجود إضافات: الكتابة هنا كانت تحفظ مصفوفة فارغة
   * فوق بيانات السحابة إن لم يكن المفتاح قد وصل بعد، فتضيع بطاقات العملاء.
   */
  if (additions.length === 0) return 0;
  saveCrmLeads(
    [...additions, ...existing].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    )
  );
  return additions.length;
}

/**
 * استيراد الطلبات الموجودة محليًا (طلبات العقارات وطلبات المهنيين).
 * طلبات العقارات الجديدة تُضاف تلقائيًا من السيرفر، وهذا يغطي القديمة فقط.
 */
export function importLocalCrmLeads(): number {
  const properties = readArray("aqaar-properties") as Property[];
  const requests = readArray("aqaar-professional-requests") as ProfessionalRequest[];
  const candidates = [
    ...properties.map((property) => propertyLead(property)),
    ...requests.map((request) => professionalLead(request)),
  ];
  if (candidates.length === 0) return 0;
  return importCrmLeads(candidates);
}

/** دمج استفسارات قاعدة البيانات — تُجلب عبر API للأدمن فقط */
export function importInquiryLeads(rows: CrmInquiryRow[]): number {
  return importCrmLeads(
    rows
      .map((row) => inquiryLead(row))
      .filter((lead): lead is CrmLead => lead !== null)
  );
}

/** حالة تفاعلية تتحدث مع أي تعديل محلي أو قادم من السحابة */
export function useCrmLeads(): CrmLead[] {
  const [leads, setLeads] = useState<CrmLead[]>([]);

  useEffect(() => {
    const sync = () => setLeads(getCrmLeads());
    sync();
    window.addEventListener(CRM_EVENT, sync);
    window.addEventListener("storage", sync);
    window.addEventListener("aqaar:cloud", sync);
    return () => {
      window.removeEventListener(CRM_EVENT, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("aqaar:cloud", sync);
    };
  }, []);

  return leads;
}
