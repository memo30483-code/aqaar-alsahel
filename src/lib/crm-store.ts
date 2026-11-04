"use client";

/**
 * عميل واجهة CRM العلاقية.
 *
 * مصدر الحقيقة هو PostgreSQL عبر `/api/admin/crm`. التخزين المحلي هنا كاش
 * للعرض السريع فقط، ولا يُستخدم للحفظ ولا يُرفع إلى app_state.
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
  type CrmActivityKind,
  type CrmInquiryRow,
  type CrmLead,
  type CrmPriority,
  type CrmSource,
  type CrmStage,
} from "./crm-types";

export const CRM_EVENT = "aqaar:crm";
const CRM_CACHE_KEY = "aqaar-crm-cache-v2";
const POLL_MS = 15_000;

let memoryCache: CrmLead[] | null = null;
let refreshInFlight: Promise<CrmLead[]> | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export class CrmApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "CrmApiError";
    this.status = status;
    this.code = code;
  }
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
  } & T;
  if (!response.ok) {
    throw new CrmApiError(
      data.error || "تعذر الاتصال بقاعدة بيانات العملاء",
      response.status,
      data.code
    );
  }
  return data;
}

function readCache(): CrmLead[] {
  if (memoryCache) return memoryCache;
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(CRM_CACHE_KEY);
    memoryCache = raw ? normalizeCrmLeads(JSON.parse(raw)) : [];
  } catch {
    memoryCache = [];
  }
  return memoryCache;
}

function publish(leads: CrmLead[]): CrmLead[] {
  memoryCache = leads;
  if (isBrowser()) {
    try {
      window.localStorage.setItem(
        CRM_CACHE_KEY,
        JSON.stringify({ items: leads, cachedAt: new Date().toISOString() })
      );
    } catch {
      // الكاش اختياري؛ فشل التخزين لا يؤثر على قاعدة البيانات.
    }
    window.dispatchEvent(new CustomEvent(CRM_EVENT));
  }
  return leads;
}

function applyLead(lead: CrmLead | null | undefined): void {
  if (!lead) return;
  const existing = readCache();
  publish([lead, ...existing.filter((item) => item.id !== lead.id)]);
}

export function getCrmLeads(): CrmLead[] {
  return readCache();
}

/** بيانات JSON القديمة للاستيراد فقط، وليست مصدر الحقيقة بعد الترقية. */
export function readStoredCrm(): CrmLead[] | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(CRM_KEY);
    return raw ? normalizeCrmLeads(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function hasCrmStore(): boolean {
  return readCache().length > 0;
}

export async function refreshCrmLeads(): Promise<CrmLead[]> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = api<{ leads: CrmLead[] }>("/api/admin/crm")
    .then((result) => publish(normalizeCrmLeads(result.leads)))
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

function nowIso(): string {
  return new Date().toISOString();
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
  priority?: CrmPriority;
  dealValue?: number;
  commission?: number;
  createdBy: string;
}

export async function createCrmLead(input: CrmLeadInput): Promise<CrmLead | null> {
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
    budget: input.budget,
    stage: input.stage ?? "new",
    assignedTo: input.assignedTo || undefined,
    assignedToName: input.assignedToName || undefined,
    tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
    notes: input.notes?.trim() || undefined,
    reference: input.reference?.trim() || undefined,
    priority: input.priority ?? "warm",
    dealValue: input.dealValue,
    commission: input.commission,
    activities: [
      {
        id: newCrmId("act"),
        kind: "note",
        at: created,
        by: input.createdBy,
        text: "تمت إضافة العميل يدويًا.",
      },
    ],
    tasks: [],
    createdAt: created,
    updatedAt: created,
  };
  const result = await api<{ lead: CrmLead; duplicate?: boolean }>(
    "/api/admin/crm",
    { method: "POST", body: JSON.stringify({ lead }) }
  );
  applyLead(result.lead);
  return result.lead;
}

export async function updateCrmLead(
  id: string,
  patch: Partial<
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
  >
): Promise<boolean> {
  const current = readCache().find((lead) => lead.id === id);
  const result = await api<{ lead: CrmLead }>(`/api/admin/crm/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ patch, expectedVersion: current?.version }),
  });
  applyLead(result.lead);
  return true;
}

/** الحذف الآمن = أرشفة، ويمكن استرجاع العميل لاحقًا. */
export async function deleteCrmLead(id: string): Promise<boolean> {
  const result = await api<{ lead: CrmLead }>(`/api/admin/crm/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  applyLead(result.lead);
  return true;
}

export async function addCrmActivity(
  id: string,
  kind: CrmActivityKind,
  text: string,
  by: string
): Promise<boolean> {
  void by; // اسم المنفذ الموثوق يأتي من جلسة السيرفر، لا من المتصفح.
  const result = await api<{ lead: CrmLead }>(
    `/api/admin/crm/${encodeURIComponent(id)}/activities`,
    { method: "POST", body: JSON.stringify({ kind, text }) }
  );
  applyLead(result.lead);
  return true;
}

export async function changeCrmStage(
  id: string,
  stage: CrmStage,
  by: string
): Promise<boolean> {
  void by;
  const result = await api<{ lead: CrmLead }>(`/api/admin/crm/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "stage", stage }),
  });
  applyLead(result.lead);
  return true;
}

export async function assignCrmLead(
  id: string,
  assignedTo: string | undefined,
  assignedToName: string | undefined,
  by: string
): Promise<boolean> {
  void by;
  const result = await api<{ lead: CrmLead }>(`/api/admin/crm/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "assign", assignedTo, assignedToName }),
  });
  applyLead(result.lead);
  return true;
}

export async function addCrmTask(
  id: string,
  title: string,
  dueAt: string,
  by: string
): Promise<boolean> {
  void by;
  const result = await api<{ lead: CrmLead }>(
    `/api/admin/crm/${encodeURIComponent(id)}/tasks`,
    { method: "POST", body: JSON.stringify({ title, dueAt }) }
  );
  applyLead(result.lead);
  return true;
}

export async function toggleCrmTask(
  id: string,
  taskId: string,
  done: boolean
): Promise<boolean> {
  const result = await api<{ lead: CrmLead }>(
    `/api/admin/crm/${encodeURIComponent(id)}/tasks/${encodeURIComponent(taskId)}`,
    { method: "PATCH", body: JSON.stringify({ done }) }
  );
  applyLead(result.lead);
  return true;
}

export async function deleteCrmTask(id: string, taskId: string): Promise<boolean> {
  const result = await api<{ lead: CrmLead }>(
    `/api/admin/crm/${encodeURIComponent(id)}/tasks/${encodeURIComponent(taskId)}`,
    { method: "DELETE" }
  );
  applyLead(result.lead);
  return true;
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

function uniqueCandidates(candidates: CrmLead[]): CrmLead[] {
  const seen = new Set<string>();
  return candidates.filter((lead) => {
    const ref = lead.sourceRef
      ? `${lead.source}:${lead.sourceRef}`
      : `${lead.source}:${lead.id}`;
    if (seen.has(ref)) return false;
    seen.add(ref);
    return true;
  });
}

export async function importCrmLeads(candidates: CrmLead[]): Promise<number> {
  const leads = uniqueCandidates(candidates);
  if (!leads.length) return 0;
  const result = await api<{ added: number; duplicates: number }>(
    "/api/admin/crm",
    {
      method: "POST",
      body: JSON.stringify({ action: "import", leads }),
    }
  );
  await refreshCrmLeads();
  return result.added;
}

/** ترحيل نسخة JSON القديمة والطلبات المحلية مرة واحدة إلى PostgreSQL. */
export async function importLocalCrmLeads(): Promise<number> {
  const properties = readArray("aqaar-properties") as Property[];
  const requests = readArray(
    "aqaar-professional-requests"
  ) as ProfessionalRequest[];
  const legacy = readStoredCrm() ?? [];
  return importCrmLeads([
    ...legacy,
    ...properties.map((property) => propertyLead(property)),
    ...requests.map((request) => professionalLead(request)),
  ]);
}

export async function importInquiryLeads(rows: CrmInquiryRow[]): Promise<number> {
  return importCrmLeads(
    rows
      .map((row) => inquiryLead(row))
      .filter((lead): lead is CrmLead => lead !== null)
  );
}

/** حالة تفاعلية: قاعدة البيانات أولًا، مع تحديث تلقائي بين الأجهزة كل 15 ثانية. */
export function useCrmLeads(): CrmLead[] {
  const [leads, setLeads] = useState<CrmLead[]>(() => readCache());

  useEffect(() => {
    let active = true;
    const sync = () => {
      if (active) setLeads([...readCache()]);
    };
    const refresh = () => {
      void refreshCrmLeads().then(sync).catch(() => sync());
    };
    refresh();
    const timer = window.setInterval(refresh, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener(CRM_EVENT, sync);
    window.addEventListener("storage", sync);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener(CRM_EVENT, sync);
      window.removeEventListener("storage", sync);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return leads;
}
