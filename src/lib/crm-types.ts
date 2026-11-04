/**
 * أنواع ومصطلحات نظام إدارة العملاء (CRM).
 *
 * الملف نقي (بدون `window`) لأن السيرفر يستخدمه أيضًا عند إنشاء عميل جديد
 * تلقائيًا مع كل طلب عقار، بينما تستخدمه الواجهة للعرض والتحرير.
 */

import type { Property } from "@/types/property";
import type { ProfessionalRequest } from "@/lib/professionals-store";

export const CRM_KEY = "aqaar-crm-v1";

export type CrmStage =
  | "new"
  | "contacted"
  | "viewing"
  | "negotiation"
  | "won"
  | "lost";

export type CrmSource =
  | "property"
  | "inquiry"
  | "professional"
  | "manual"
  | "app";

export type CrmPriority = "hot" | "warm" | "cold";

export type CrmActivityKind =
  | "note"
  | "call"
  | "whatsapp"
  | "meeting"
  | "email"
  | "stage";

export interface CrmActivity {
  id: string;
  kind: CrmActivityKind;
  at: string;
  by: string;
  text: string;
  fromStage?: CrmStage;
  toStage?: CrmStage;
}

export interface CrmTask {
  id: string;
  title: string;
  dueAt: string;
  done: boolean;
  createdAt: string;
  createdBy: string;
  doneAt?: string;
}

export interface CrmLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: CrmSource;
  sourceLabel?: string;
  /** معرّف المصدر الأصلي لمنع التكرار عند الاستيراد */
  sourceRef?: string;
  propertyId?: string;
  interest?: string;
  city?: string;
  budget?: number;
  stage: CrmStage;
  assignedTo?: string;
  assignedToName?: string;
  tags: string[];
  notes?: string;
  reference?: string;
  archived?: boolean;
  priority?: CrmPriority;
  /** قيمة الفرصة أو الصفقة بالجنيه */
  dealValue?: number;
  /** العمولة المتوقعة أو المحققة بالجنيه */
  commission?: number;
  wonAt?: string;
  /** رقم نسخة الصف لمنع الكتابة فوق تعديل أحدث من جهاز آخر */
  version?: number;
  activities: CrmActivity[];
  tasks: CrmTask[];
  createdAt: string;
  updatedAt: string;
}

export const CRM_STAGES: {
  key: CrmStage;
  label: string;
  /** لون النقطة/العمود */
  dot: string;
  chip: string;
}[] = [
  {
    key: "new",
    label: "جديد",
    dot: "bg-sky-500",
    chip: "border-sky-200 bg-sky-50 text-sky-700",
  },
  {
    key: "contacted",
    label: "تم التواصل",
    dot: "bg-indigo-500",
    chip: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  {
    key: "viewing",
    label: "معاينة",
    dot: "bg-amber-500",
    chip: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    key: "negotiation",
    label: "تفاوض",
    dot: "bg-violet-500",
    chip: "border-violet-200 bg-violet-50 text-violet-700",
  },
  {
    key: "won",
    label: "تم البيع/الإيجار",
    dot: "bg-emerald-500",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    key: "lost",
    label: "مغلق/غير مهتم",
    dot: "bg-rose-400",
    chip: "border-rose-200 bg-rose-50 text-rose-700",
  },
];

export const CRM_STAGE_LABEL: Record<CrmStage, string> = CRM_STAGES.reduce(
  (result, stage) => ({ ...result, [stage.key]: stage.label }),
  {} as Record<CrmStage, string>
);

export const CRM_STAGE_STYLE: Record<CrmStage, string> = CRM_STAGES.reduce(
  (result, stage) => ({ ...result, [stage.key]: stage.chip }),
  {} as Record<CrmStage, string>
);

export const CRM_SOURCE_LABEL: Record<CrmSource, string> = {
  property: "طلب عقار",
  inquiry: "استفسار",
  professional: "طلب مهني",
  manual: "إضافة يدوية",
  app: "اهتمام بالتطبيق",
};

export const CRM_PRIORITY_LABEL: Record<CrmPriority, string> = {
  hot: "ساخن",
  warm: "دافئ",
  cold: "بارد",
};

export const CRM_PRIORITY_STYLE: Record<CrmPriority, string> = {
  hot: "border-rose-200 bg-rose-50 text-rose-700",
  warm: "border-amber-200 bg-amber-50 text-amber-700",
  cold: "border-slate-200 bg-slate-50 text-slate-600",
};

export const CRM_ACTIVITY_LABEL: Record<CrmActivityKind, string> = {
  note: "ملاحظة",
  call: "مكالمة",
  whatsapp: "واتساب",
  meeting: "اجتماع",
  email: "بريد",
  stage: "تغيير مرحلة",
};

const PROFESSIONAL_KIND_LABEL: Record<string, string> = {
  developer: "مطور",
  marketer: "مسوق",
  lawyer: "محامي",
  engineer: "مهندس",
};

export function newCrmId(prefix = "lead"): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${random}`;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asIso(value: unknown, fallback: string): string {
  const text = asString(value);
  const stamp = Date.parse(text);
  return Number.isFinite(stamp) ? new Date(stamp).toISOString() : fallback;
}

function asStage(value: unknown): CrmStage {
  return CRM_STAGES.some((stage) => stage.key === value)
    ? (value as CrmStage)
    : "new";
}

function asSource(value: unknown): CrmSource {
  return value === "property" ||
    value === "inquiry" ||
    value === "professional" ||
    value === "manual" ||
    value === "app"
    ? value
    : "manual";
}

function normalizeActivity(raw: unknown): CrmActivity | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = asString(item.id) || newCrmId("act");
  const kind = asString(item.kind) as CrmActivityKind;
  const text = asString(item.text).trim();
  if (!text) return null;
  return {
    id,
    kind:
      kind === "call" ||
      kind === "whatsapp" ||
      kind === "meeting" ||
      kind === "email" ||
      kind === "stage"
        ? kind
        : "note",
    at: asIso(item.at, new Date().toISOString()),
    by: asString(item.by, "الإدارة"),
    text,
    ...(item.fromStage ? { fromStage: asStage(item.fromStage) } : {}),
    ...(item.toStage ? { toStage: asStage(item.toStage) } : {}),
  };
}

function normalizeTask(raw: unknown): CrmTask | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const title = asString(item.title).trim();
  if (!title) return null;
  const created = asIso(item.createdAt, new Date().toISOString());
  return {
    id: asString(item.id) || newCrmId("task"),
    title,
    dueAt: asIso(item.dueAt, created),
    done: item.done === true,
    createdAt: created,
    createdBy: asString(item.createdBy, "الإدارة"),
    ...(item.doneAt ? { doneAt: asIso(item.doneAt, created) } : {}),
  };
}

/** تحويل أي شكل قديم/تالف إلى عميل صالح بدل إسقاط السجل بالكامل */
export function normalizeCrmLead(raw: unknown): CrmLead | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = asString(item.id);
  const name = asString(item.name).trim();
  if (!id || !name) return null;

  const created = asIso(item.createdAt, new Date().toISOString());
  const activities = Array.isArray(item.activities)
    ? item.activities
        .map(normalizeActivity)
        .filter((entry): entry is CrmActivity => entry !== null)
    : [];
  const tasks = Array.isArray(item.tasks)
    ? item.tasks
        .map(normalizeTask)
        .filter((entry): entry is CrmTask => entry !== null)
    : [];

  return {
    id,
    name,
    phone: asString(item.phone),
    email: asString(item.email) || undefined,
    source: asSource(item.source),
    sourceLabel: asString(item.sourceLabel) || undefined,
    sourceRef: asString(item.sourceRef) || undefined,
    propertyId: asString(item.propertyId) || undefined,
    interest: asString(item.interest) || undefined,
    city: asString(item.city) || undefined,
    budget:
      typeof item.budget === "number" && Number.isFinite(item.budget)
        ? item.budget
        : undefined,
    stage: asStage(item.stage),
    assignedTo: asString(item.assignedTo) || undefined,
    assignedToName: asString(item.assignedToName) || undefined,
    tags: Array.isArray(item.tags)
      ? item.tags.map((tag) => asString(tag).trim()).filter(Boolean)
      : [],
    notes: asString(item.notes) || undefined,
    reference: asString(item.reference) || undefined,
    archived: item.archived === true || undefined,
    priority:
      item.priority === "hot" ||
      item.priority === "warm" ||
      item.priority === "cold"
        ? item.priority
        : "warm",
    dealValue:
      typeof item.dealValue === "number" && Number.isFinite(item.dealValue)
        ? item.dealValue
        : undefined,
    commission:
      typeof item.commission === "number" && Number.isFinite(item.commission)
        ? item.commission
        : undefined,
    wonAt: asString(item.wonAt) || undefined,
    version:
      typeof item.version === "number" && Number.isFinite(item.version)
        ? item.version
        : undefined,
    activities,
    tasks,
    createdAt: created,
    updatedAt: asIso(item.updatedAt, created),
  };
}

export function normalizeCrmLeads(value: unknown): CrmLead[] {
  const raw = Array.isArray(value)
    ? value
    : value && typeof value === "object" &&
        Array.isArray((value as { items?: unknown }).items)
      ? (value as { items: unknown[] }).items
      : [];
  return raw
    .map(normalizeCrmLead)
    .filter((lead): lead is CrmLead => lead !== null);
}

function baseActivity(text: string, at: string, by: string): CrmActivity {
  return {
    id: newCrmId("act"),
    kind: "note",
    at,
    by,
    text,
  };
}

/** تحويل طلب نشر عقار إلى عميل في الـCRM */
export function propertyLead(property: Property): CrmLead {
  const created = asIso(property.submittedAt, new Date().toISOString());
  const name = (property.ownerName || property.title || "عميل جديد").trim();
  return {
    id: newCrmId("lead"),
    name,
    phone: property.whatsapp || "",
    source: "property",
    sourceLabel: CRM_SOURCE_LABEL.property,
    sourceRef: property.id,
    propertyId: property.id,
    interest: property.title,
    city: property.city,
    budget:
      !property.priceByAdmin && property.price > 0 ? property.price : undefined,
    stage: property.status === "rejected" ? "lost" : "new",
    tags: ["عقار", property.purpose || "بيع"],
    notes: property.description,
    reference: property.reference,
    activities: [
      baseActivity(
        "تم استلام طلب نشر العقار من الموقع.",
        created,
        "الموقع"
      ),
    ],
    tasks: [],
    createdAt: created,
    updatedAt: created,
  };
}

/** تحويل طلب تواصل مع مهني إلى عميل */
export function professionalLead(request: ProfessionalRequest): CrmLead {
  const created = asIso(request.createdAt, new Date().toISOString());
  const kind = PROFESSIONAL_KIND_LABEL[request.kind] || "مهني";
  return {
    id: newCrmId("lead"),
    name: request.name,
    phone: request.phone,
    email: request.email,
    source: "professional",
    sourceLabel: CRM_SOURCE_LABEL.professional,
    sourceRef: request.id,
    interest: `استشارة ${kind} — ${request.professionalName}`,
    stage: request.status === "handled" ? "contacted" : "new",
    tags: [kind],
    notes: request.message,
    activities: [
      baseActivity(
        `طلب تواصل مع ${kind}: ${request.professionalName}`,
        created,
        "الموقع"
      ),
    ],
    tasks: [],
    createdAt: created,
    updatedAt: created,
  };
}

export interface CrmInquiryRow {
  id: string;
  kind: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  message?: string | null;
  payload?: Record<string, unknown> | null;
  status?: string | null;
  created_at?: string | null;
}

/**
 * الاستفسارات العامة فقط. طلبات العقارات تُنشئ عميلًا مباشرة على السيرفر،
 * لذلك نتجاهلها هنا لمنع التكرار.
 */
export function inquiryLead(row: CrmInquiryRow): CrmLead | null {
  if (!row.id || row.kind === "property_submission") return null;
  const created = asIso(row.created_at, new Date().toISOString());
  const name =
    (row.name || "").trim() ||
    (row.email || "").trim() ||
    (row.phone || "").trim() ||
    "استفسار جديد";
  return {
    id: newCrmId("lead"),
    name,
    phone: row.phone || "",
    email: row.email || undefined,
    source: "inquiry",
    sourceLabel: CRM_SOURCE_LABEL.inquiry,
    sourceRef: `inquiry:${row.id}`,
    interest: (row.message || "").trim().slice(0, 160) || "استفسار من الموقع",
    stage: "new",
    tags: ["استفسار"],
    notes: row.message || undefined,
    activities: [
      baseActivity("تم استلام استفسار من الموقع.", created, "الموقع"),
    ],
    tasks: [],
    createdAt: created,
    updatedAt: created,
  };
}
