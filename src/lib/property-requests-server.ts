/**
 * طبقة السيرفر لطلبات العقار.
 *
 * تُخزَّن الطلبات في جدول `inquiries` الموجود بالفعل (kind = property_request)
 * لتجنّب أي تغييرات على مخطط قاعدة البيانات، مع حفظ التفاصيل الكاملة في
 * عمود `payload` (JSONB). الوصول كله عبر service_role من داخل route handlers.
 */

import { LISTING_OVERRIDE_KEY, getDefaultApprovedIds, SITE_SETTINGS_KEY } from "@/lib/admin-system";
import type { CrmLead } from "@/lib/crm-types";
import { cloudGetCrmSettings, cloudCreateCrmLead } from "@/lib/crm-server";
import {
  CloudRestError,
  cloudDeleteInquiry,
  cloudGetInquiriesByKind,
  cloudGetRows,
  cloudInsertInquiry,
  cloudRest,
  cloudUpdateInquiry,
  type CloudInquiryRow,
} from "@/lib/cloud/server";
import { sanitizePublicCloudRows } from "@/lib/cloud/privacy";
import { USER_PROPERTIES_KEY, mockProperties } from "@/data/properties";
import { rankPropertyMatches } from "@/lib/property-request-match";
import {
  DEFAULT_PROPERTY_REQUEST_SETTINGS,
  PROPERTY_REQUEST_STATUS_LABEL,
  isPropertyRequestPriority,
  isPropertyRequestStatus,
  normalizePropertyRequestBrief,
  normalizePropertyRequestSettings,
  propertyRequestPublicTitle,
  propertyRequestReference,
  propertyRequestSummary,
  type PropertyRequest,
  type PropertyRequestEvent,
  type PropertyRequestMatch,
  type PropertyRequestsSettings,
} from "@/lib/property-requests";
import { initializeReviewRecord } from "@/lib/workflow-server";
import { PROPERTY_REQUEST_KIND } from "@/lib/property-requests";
import type { Property } from "@/types/property";

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeHistory(value: unknown): PropertyRequestEvent[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-80).flatMap((raw) => {
    const item = objectValue(raw);
    const at = stringValue(item.at);
    const text = stringValue(item.text);
    if (!at || !text) return [];
    const kind =
      item.kind === "status" ||
      item.kind === "note" ||
      item.kind === "sent" ||
      item.kind === "contact" ||
      item.kind === "created"
        ? item.kind
        : "note";
    return [
      {
        id: stringValue(item.id) || `evt-${at}`,
        at,
        by: stringValue(item.by, "الإدارة"),
        kind,
        text,
      },
    ];
  });
}

/** تحويل صف inquiries إلى طلب عقار مكتمل */
export function toPropertyRequest(row: CloudInquiryRow): PropertyRequest {
  const payload = objectValue(row.payload);
  const brief = normalizePropertyRequestBrief(payload.brief);
  const createdAt = stringValue(row.created_at, new Date().toISOString());
  const sentPropertyIds = Array.isArray(payload.sentPropertyIds)
    ? Array.from(
        new Set(
          payload.sentPropertyIds.filter(
            (item): item is string => typeof item === "string" && Boolean(item)
          )
        )
      ).slice(0, 100)
    : [];
  const seenPropertyIds = Array.isArray(payload.seenPropertyIds)
    ? Array.from(
        new Set(
          payload.seenPropertyIds.filter(
            (item): item is string => typeof item === "string" && Boolean(item)
          )
        )
      ).slice(0, 200)
    : [];

  const status = isPropertyRequestStatus(row.status)
    ? row.status
    : isPropertyRequestStatus(payload.status)
      ? payload.status
      : "new";

  return {
    id: row.id,
    reference:
      stringValue(payload.reference) ||
      `REQ-${row.id.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
    name: stringValue(row.name, "عميل"),
    phone: stringValue(row.phone),
    email: stringValue(row.email),
    brief,
    status,
    priority: isPropertyRequestPriority(payload.priority)
      ? payload.priority
      : "warm",
    assignedTo: stringValue(payload.assignedTo) || undefined,
    assignedToName: stringValue(payload.assignedToName) || undefined,
    adminNotes: stringValue(payload.adminNotes).slice(0, 4000),
    sentPropertyIds,
    seenPropertyIds,
    accountId: stringValue(payload.accountId) || undefined,
    published: payload.published === true,
    publicTitleAr: stringValue(payload.publicTitleAr).slice(0, 180),
    publicTitleEn: stringValue(payload.publicTitleEn).slice(0, 180),
    publicDescriptionAr: stringValue(payload.publicDescriptionAr).slice(0, 1200),
    publicDescriptionEn: stringValue(payload.publicDescriptionEn).slice(0, 1200),
    publishedAt: stringValue(payload.publishedAt) || undefined,
    publishedBy: stringValue(payload.publishedBy) || undefined,
    history: normalizeHistory(payload.history),
    createdAt,
    updatedAt: stringValue(payload.updatedAt, createdAt),
    version: typeof payload.version === "number" ? payload.version : 1,
  };
}

function toPayload(request: PropertyRequest): Record<string, unknown> {
  return {
    brief: request.brief,
    reference: request.reference,
    accountId: request.accountId,
    priority: request.priority,
    assignedTo: request.assignedTo,
    assignedToName: request.assignedToName,
    adminNotes: request.adminNotes,
    sentPropertyIds: request.sentPropertyIds.slice(0, 100),
    seenPropertyIds: request.seenPropertyIds.slice(0, 200),
    published: request.published,
    publicTitleAr: request.publicTitleAr,
    publicTitleEn: request.publicTitleEn,
    publicDescriptionAr: request.publicDescriptionAr,
    publicDescriptionEn: request.publicDescriptionEn,
    publishedAt: request.publishedAt,
    publishedBy: request.publishedBy,
    history: request.history.slice(-80),
    version: request.version,
    updatedAt: request.updatedAt,
  };
}

export interface CreatePropertyRequestInput {
  name: string;
  phone: string;
  email: string;
  brief: PropertyRequest["brief"];
  accountId?: string;
  priority?: PropertyRequest["priority"];
}

/** إنشاء طلب عقار جديد في inquiries وإرجاع السجل النهائي */
export async function createPropertyRequest(
  input: CreatePropertyRequestInput
): Promise<PropertyRequest> {
  const now = new Date().toISOString();
  const reference = propertyRequestReference(new Date());
  const request: PropertyRequest = {
    id: "",
    reference,
    name: input.name,
    phone: input.phone,
    email: input.email,
    brief: input.brief,
    status: "new",
    priority: input.priority ?? "warm",
    adminNotes: "",
    sentPropertyIds: [],
    seenPropertyIds: [],
    published: false,
    publicTitleAr: "",
    publicTitleEn: "",
    publicDescriptionAr: "",
    publicDescriptionEn: "",
    accountId: input.accountId,
    history: [
      {
        id: `evt-${Date.now()}`,
        at: now,
        by: input.accountId ? "الموقع (حساب مسجّل)" : "الموقع",
        kind: "created",
        text: "تم استلام طلب العقار من الموقع.",
      },
    ],
    createdAt: now,
    updatedAt: now,
    version: 1,
  };

  const inserted = await cloudInsertInquiry({
    kind: PROPERTY_REQUEST_KIND,
    name: request.name,
    phone: request.phone || undefined,
    email: request.email || undefined,
    message: propertyRequestSummary(request.brief),
    payload: toPayload(request),
    status: request.status,
  });
  await initializeReviewRecord("propertyRequests", inserted.id, "property-request-form").catch(
    () => undefined
  );

  return { ...request, id: inserted.id };
}

export async function listPropertyRequests(limit = 500): Promise<PropertyRequest[]> {
  const rows = await cloudGetInquiriesByKind(PROPERTY_REQUEST_KIND, limit);
  return rows.map(toPropertyRequest);
}

async function getPropertyRequestRow(id: string): Promise<CloudInquiryRow | null> {
  if (!/^[a-f0-9-]{20,40}$/i.test(id)) return null;
  const params = new URLSearchParams();
  params.set(
    "select",
    "id,kind,name,phone,email,message,payload,status,created_at"
  );
  params.set("id", `eq.${id}`);
  params.set("kind", `eq.${PROPERTY_REQUEST_KIND}`);
  params.set("limit", "1");
  const rows = await cloudRest<CloudInquiryRow[]>(`inquiries?${params.toString()}`);
  return rows[0] ?? null;
}

export async function getPropertyRequest(id: string): Promise<PropertyRequest | null> {
  const row = await getPropertyRequestRow(id);
  return row ? toPropertyRequest(row) : null;
}

export class PropertyRequestConflictError extends Error {
  constructor() {
    super("تم تحديث الطلب من جهاز آخر. حدّث الصفحة ثم أعد المحاولة.");
    this.name = "PropertyRequestConflictError";
  }
}

export interface UpdatePropertyRequestPatch {
  status?: PropertyRequest["status"];
  priority?: PropertyRequest["priority"];
  assignedTo?: string;
  assignedToName?: string;
  adminNotes?: string;
  sentPropertyIds?: string[];
  seenPropertyIds?: string[];
  name?: string;
  phone?: string;
  email?: string;
  published?: boolean;
  publicTitleAr?: string;
  publicTitleEn?: string;
  publicDescriptionAr?: string;
  publicDescriptionEn?: string;
  /** تسجيل محاولة تواصل مستقلة في سجل الطلب */
  contactText?: string;
  expectedVersion?: number;
}

/** تحديث طلب مع تسجيل كل تغيير في سجل المتابعة */
export async function updatePropertyRequest(
  id: string,
  patch: UpdatePropertyRequestPatch,
  actor: string
): Promise<PropertyRequest> {
  const current = await getPropertyRequest(id);
  if (!current) throw new Error("NOT_FOUND");
  if (
    typeof patch.expectedVersion === "number" &&
    patch.expectedVersion !== current.version
  ) {
    throw new PropertyRequestConflictError();
  }

  const now = new Date().toISOString();
  const events: PropertyRequestEvent[] = [];
  const next: PropertyRequest = {
    ...current,
    updatedAt: now,
    version: current.version + 1,
  };

  if (patch.status && patch.status !== current.status) {
    next.status = patch.status;
    events.push({
      id: `evt-${Date.now()}-status`,
      at: now,
      by: actor,
      kind: "status",
      text: `تغيير الحالة إلى «${PROPERTY_REQUEST_STATUS_LABEL[patch.status]}».`,
    });
  }
  if (patch.priority && patch.priority !== current.priority) {
    next.priority = patch.priority;
  }
  if (patch.assignedTo !== undefined) {
    next.assignedTo = patch.assignedTo || undefined;
    next.assignedToName = patch.assignedToName || undefined;
    events.push({
      id: `evt-${Date.now()}-assign`,
      at: now,
      by: actor,
      kind: "note",
      text: `إسناد الطلب إلى ${patch.assignedToName || patch.assignedTo || "غير محدد"}.`,
    });
  }
  if (patch.adminNotes !== undefined && patch.adminNotes !== current.adminNotes) {
    next.adminNotes = patch.adminNotes.slice(0, 4000);
    events.push({
      id: `evt-${Date.now()}-note`,
      at: now,
      by: actor,
      kind: "note",
      text: "تم تحديث الملاحظات الداخلية.",
    });
  }
  if (patch.sentPropertyIds) {
    const sent = Array.from(new Set(patch.sentPropertyIds)).slice(0, 100);
    const added = sent.filter((item) => !current.sentPropertyIds.includes(item));
    next.sentPropertyIds = sent;
    if (added.length) {
      /* ترشيح الإدارة تنبيه جديد حتى لو شاهد العميل نفس العقار كمطابقة آلية. */
      next.seenPropertyIds = current.seenPropertyIds.filter(
        (item) => !added.includes(item)
      );
      events.push({
        id: `evt-${Date.now()}-sent`,
        at: now,
        by: actor,
        kind: "sent",
        text: `تم ترشيح ${added.length} عقار للعميل.`,
      });
    }
  }
  if (patch.seenPropertyIds) {
    next.seenPropertyIds = Array.from(new Set(patch.seenPropertyIds)).slice(0, 200);
  }
  if (patch.name !== undefined) next.name = patch.name;
  if (patch.phone !== undefined) next.phone = patch.phone;
  if (patch.email !== undefined) next.email = patch.email;
  if (patch.publicTitleAr !== undefined) {
    next.publicTitleAr = patch.publicTitleAr.slice(0, 180);
  }
  if (patch.publicTitleEn !== undefined) {
    next.publicTitleEn = patch.publicTitleEn.slice(0, 180);
  }
  if (patch.publicDescriptionAr !== undefined) {
    next.publicDescriptionAr = patch.publicDescriptionAr.slice(0, 1200);
  }
  if (patch.publicDescriptionEn !== undefined) {
    next.publicDescriptionEn = patch.publicDescriptionEn.slice(0, 1200);
  }
  if (patch.published !== undefined && patch.published !== current.published) {
    next.published = patch.published;
    if (patch.published) {
      next.publicTitleAr =
        next.publicTitleAr || propertyRequestPublicTitle(next.brief);
      next.publishedAt = now;
      next.publishedBy = actor;
    } else {
      next.publishedAt = undefined;
      next.publishedBy = undefined;
    }
    events.push({
      id: `evt-${Date.now()}-publish`,
      at: now,
      by: actor,
      kind: "status",
      text: patch.published
        ? "وافقت الإدارة على نشر الطلب في صفحة العقارات المطلوبة."
        : "أوقفت الإدارة نشر الطلب من الصفحة العامة.",
    });
  }
  if (patch.contactText) {
    events.push({
      id: `evt-${Date.now()}-contact`,
      at: now,
      by: actor,
      kind: "contact",
      text: patch.contactText.slice(0, 500),
    });
  }

  if (events.length) next.history = [...current.history, ...events].slice(-80);

  const updated = await cloudUpdateInquiry(id, {
    name: next.name,
    phone: next.phone || null,
    email: next.email || null,
    status: next.status,
    message: propertyRequestSummary(next.brief),
    payload: toPayload(next),
  });
  if (!updated) throw new Error("NOT_FOUND");
  return toPropertyRequest(updated);
}

export async function deletePropertyRequest(id: string): Promise<boolean> {
  const row = await getPropertyRequestRow(id);
  if (!row) return false;
  await cloudDeleteInquiry(id);
  return true;
}

/** إعدادات الميزة كما يراها الزائر — تُقرأ من إعدادات الموقع السحابية */
export async function readPropertyRequestSettings(): Promise<PropertyRequestsSettings> {
  try {
    const rows = await cloudGetRows({ keys: [SITE_SETTINGS_KEY] });
    const settings = objectValue(rows[0]?.value);
    return normalizePropertyRequestSettings(settings.propertyRequests);
  } catch {
    return DEFAULT_PROPERTY_REQUEST_SETTINGS;
  }
}

/**
 * الإعلانات المنشورة فعلياً — نفس سياسة النشر التي يراها الزائر.
 * لا نستخدم getListings لأنها تعتمد على localStorage وتفشل على السيرفر.
 */
export async function loadPublishedProperties(): Promise<Property[]> {
  try {
    const rows = await cloudGetRows({
      keys: [USER_PROPERTIES_KEY, LISTING_OVERRIDE_KEY],
      timeoutMs: 8_000,
    });
    const safeRows = sanitizePublicCloudRows(rows);
    const userRow = safeRows.find((row) => row.key === USER_PROPERTIES_KEY);
    const overrideRow = safeRows.find((row) => row.key === LISTING_OVERRIDE_KEY);

    const userProperties = Array.isArray(userRow?.value)
      ? (userRow.value as Property[])
      : [];
    const overrides = objectValue(overrideRow?.value) as Record<
      string,
      Record<string, unknown>
    >;
    const defaultApproved = new Set(getDefaultApprovedIds());

    const demo = mockProperties
      .filter((property) => {
        const status = overrides[property.id]?.status;
        return typeof status === "string"
          ? status === "approved"
          : defaultApproved.has(property.id);
      })
      .map((property) => {
        const override = overrides[property.id];
        return {
          ...property,
          whatsapp: "",
          title:
            typeof override?.title === "string" ? override.title : property.title,
          price:
            typeof override?.price === "number" ? override.price : property.price,
        } satisfies Property;
      });

    return [...userProperties, ...demo].slice(0, 5000);
  } catch {
    /* تعذّر الاتصال: نرجع الإعلانات التجريبية المعتمدة فقط */
    const approved = new Set(getDefaultApprovedIds());
    return mockProperties
      .filter((property) => approved.has(property.id))
      .map((property) => ({ ...property, whatsapp: "" }));
  }
}

/** مطابقة طلب بأفضل العقارات المنشورة */
export function matchesForRequest(
  request: PropertyRequest,
  properties: Property[],
  limit = 20
): PropertyRequestMatch[] {
  return rankPropertyMatches(request.brief, properties, limit);
}

/** بيانات عقار آمنة للعرض على العميل مع نتيجة المطابقة */
export interface PublicPropertyMatch extends PropertyRequestMatch {
  title: string;
  city: string;
  district: string;
  type: string;
  area: number;
  rooms: number;
  bathrooms: number;
  price: number;
  image: string;
}

export function toPublicMatch(
  match: PropertyRequestMatch,
  property: Property
): PublicPropertyMatch {
  return {
    propertyId: property.id,
    score: match.score,
    reasons: match.reasons,
    overBudget: match.overBudget,
    priceOnRequest: match.priceOnRequest,
    title: property.title,
    city: property.city,
    district: property.district,
    type: property.type,
    area: property.area,
    rooms: property.rooms,
    bathrooms: property.bathrooms,
    price: property.price,
    image: property.image,
  };
}

function newLeadId(): string {
  return `lead-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * إنشاء بطاقة عميل في الـCRM لكل طلب عقار.
 * نستخدم source = inquiry (قيمة مسموحة في مخطط CRM الحالي) مع sourceRef
 * مميز يمنع التكرار ويعرض وسم «طلب عقار» بوضوح.
 */
export async function createPropertyRequestLead(
  request: PropertyRequest
): Promise<void> {
  const created = request.createdAt;
  const lead: CrmLead = {
    id: newLeadId(),
    name: request.name || "عميل طلب عقار",
    phone: request.phone,
    email: request.email || undefined,
    source: "inquiry",
    sourceLabel: "طلب عقار",
    sourceRef: `property-request:${request.id}`,
    interest: `طلب عقار — ${propertyRequestSummary(request.brief)}`,
    city: request.brief.cities[0],
    budget: request.brief.priceMax ?? undefined,
    stage: "new",
    tags: ["طلب عقار", ...request.brief.types],
    notes: request.brief.notes,
    reference: request.reference,
    priority: request.priority,
    activities: [
      {
        id: `act-${Date.now()}`,
        kind: "note",
        at: created,
        by: "الموقع",
        text: `طلب عقار جديد (${request.reference}): ${propertyRequestSummary(request.brief)}`,
      },
    ],
    tasks: [],
    createdAt: created,
    updatedAt: created,
  };

  try {
    const settings = await cloudGetCrmSettings();
    if (settings.autoAssign && settings.defaultAssigneeId) {
      lead.assignedTo = settings.defaultAssigneeId;
      lead.assignedToName = settings.defaultAssigneeName;
    }
  } catch {
    /* إعدادات CRM غير متاحة — نكمل بدون إسناد */
  }

  await cloudCreateCrmLead(lead, "الموقع");
}

/** هل الخطأ بسبب غياب جدول inquiries في قاعدة البيانات؟ */
export function inquirySchemaMissing(error: unknown): boolean {
  return (
    error instanceof CloudRestError &&
    (error.status === 404 ||
      error.body.includes("PGRST205") ||
      error.body.includes("inquiries"))
  );
}

/** ترميز آمن لعرض حالة المطابقة في الـAPI دون كشف بيانات الملاك */
export { numberValue };
