/**
 * طبقة الاتصال بـ Supabase — تعمل على السيرفر فقط.
 *
 * لا يُستورد هذا الملف أبدًا داخل مكوّن `"use client"`، لأن مفتاح
 * `SUPABASE_SERVICE_ROLE_KEY` يتجاوز كل سياسات RLS.
 */

import { CLOUD_KEYS, isCloudKey } from "./keys";

export interface CloudRow {
  key: string;
  value: unknown;
  is_public: boolean;
  updated_at: string;
}

function supabaseUrl(): string {
  const raw =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return raw.replace(/\/+$/, "");
}

function serviceKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

/** هل السحابة مضبوطة؟ (بدون مفاتيح يعمل الموقع محليًا كما هو) */
export function cloudEnabled(): boolean {
  return Boolean(supabaseUrl() && serviceKey());
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: serviceKey(),
    Authorization: `Bearer ${serviceKey()}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

/**
 * مهلة قصوى لأي طلب Supabase — لا يجوز أن يعلّق توليد الصفحة أو أي API
 * إذا تأخّر أو تعطّل الاتصال. عند انتهاء المهلة يُلغى الطلب ويُعامل كخطأ
 * عادي، فتظهر النسخة المحلية/الافتراضية بدل أن تبقى الصفحة معلّقة.
 */
function timeoutSignal(ms: number): AbortSignal | undefined {
  try {
    if (
      typeof AbortSignal !== "undefined" &&
      typeof AbortSignal.timeout === "function"
    ) {
      return AbortSignal.timeout(ms);
    }
  } catch {
    /* بيئة قديمة — نكمل بدون مهلة */
  }
  return undefined;
}


function requireCloud(): void {
  if (!cloudEnabled()) {
    throw new Error("Supabase غير مضبوط: تأكد من SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY");
  }
}

export class CloudRestError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`Supabase REST ${status}: ${body}`);
    this.name = "CloudRestError";
    this.status = status;
    this.body = body;
  }
}

export class CloudConflictError extends Error {
  constructor(message = "تم تعديل البيانات من جهاز آخر. اجلب آخر نسخة ثم أعد المحاولة.") {
    super(message);
    this.name = "CloudConflictError";
  }
}

/**
 * طلب داخلي عام إلى PostgREST. يبقى مفتاح service_role على السيرفر فقط.
 * يُستخدم للجداول العلاقية التي لا تمر عبر app_state، مثل جداول CRM.
 */
export async function cloudRest<T>(
  resource: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    prefer?: string;
    /** مهلة الطلب بالمللي ثانية — الافتراضي 10 ثوانٍ */
    timeoutMs?: number;
  } = {}
): Promise<T> {
  requireCloud();
  const safeResource = resource.replace(/^\/+/, "");
  if (!safeResource || safeResource.includes("..")) {
    throw new Error("مسار Supabase غير صالح");
  }

  const response = await fetch(`${supabaseUrl()}/rest/v1/${safeResource}`, {
    method: options.method ?? "GET",
    headers: headers(
      options.prefer ? { Prefer: options.prefer } : {}
    ),
    ...(options.body === undefined
      ? {}
      : { body: JSON.stringify(options.body) }),
    cache: "no-store",
    signal: timeoutSignal(options.timeoutMs ?? 10_000),
  });

  if (!response.ok) {
    throw new CloudRestError(response.status, await response.text());
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/**
 * قراءة صفوف الحالة من قاعدة البيانات.
 * `publicOnly` يحصر النتيجة في ما يُسمح بعرضه للزوار.
 */
export async function cloudGetRows(options: {
  publicOnly?: boolean;
  keys?: string[];
  /** مدة كاش Next.js بالثواني — تُستخدم أثناء توليد الصفحات */
  revalidate?: number;
  /** مهلة الطلب بالمللي ثانية — الافتراضي 6 ثوانٍ */
  timeoutMs?: number;
} = {}): Promise<CloudRow[]> {
  if (!cloudEnabled()) return [];

  const params = new URLSearchParams();
  params.set("select", "key,value,is_public,updated_at");
  params.set("order", "key.asc");

  if (options.publicOnly) params.set("is_public", "eq.true");

  if (options.keys?.length) {
    const safe = options.keys.filter(isCloudKey);
    if (!safe.length) return [];
    params.set("key", `in.(${safe.map((key) => `"${key}"`).join(",")})`);
  }

  const response = await fetch(
    `${supabaseUrl()}/rest/v1/app_state?${params.toString()}`,
    {
      headers: headers(),
      ...(typeof options.revalidate === "number"
        ? { next: { revalidate: options.revalidate } }
        : { cache: "no-store" as RequestCache }),
      signal: timeoutSignal(options.timeoutMs ?? 6_000),
    }
  );

  if (!response.ok) {
    throw new Error(
      `فشل قراءة الحالة من Supabase (${response.status}): ${await response.text()}`
    );
  }

  return (await response.json()) as CloudRow[];
}

/** كتابة/تحديث مفتاح واحد */
export async function cloudPutRow(
  key: string,
  value: unknown,
  updatedBy: string | null
): Promise<CloudRow> {
  requireCloud();
  if (!isCloudKey(key)) {
    throw new Error(`مفتاح غير مدرج في قائمة المزامنة: ${key}`);
  }

  const response = await fetch(
    `${supabaseUrl()}/rest/v1/app_state?on_conflict=key`,
    {
      method: "POST",
      headers: headers({
        Prefer: "resolution=merge-duplicates,return=representation",
      }),
      body: JSON.stringify([
        {
          key,
          value,
          is_public: CLOUD_KEYS[key].public,
          updated_by: updatedBy,
        },
      ]),
      cache: "no-store",
      signal: timeoutSignal(12_000),
    }
  );

  if (!response.ok) {
    throw new Error(
      `فشل حفظ الحالة في Supabase (${response.status}): ${await response.text()}`
    );
  }

  const rows = (await response.json()) as CloudRow[];
  return rows[0];
}

/** حفظ قائمة المهنيين بقفل ذري ونسخ تفاؤلية لكل سجل. */
export async function cloudPutProfessionalsAdmin(
  records: Record<string, unknown>[],
  updatedBy: string
): Promise<CloudRow> {
  const result = await cloudRest<{
    result: "updated" | "conflict" | "not_found";
    records?: unknown[];
    updated_at?: string;
  }>("rpc/update_professionals_admin", {
    method: "POST",
    body: { p_records: records, p_updated_by: updatedBy },
    timeoutMs: 12_000,
  });
  if (result.result === "conflict") throw new CloudConflictError();
  if (result.result === "not_found") {
    return cloudPutRow("aqaar-professionals", records, updatedBy);
  }
  if (result.result !== "updated" || !result.records || !result.updated_at) {
    throw new Error("تعذر حفظ بيانات المهنيين");
  }
  return {
    key: "aqaar-professionals",
    value: result.records,
    is_public: true,
    updated_at: result.updated_at,
  };
}

/** رابط عام لملف داخل bucket الصور */
export function cloudPublicUrl(path: string): string {
  return `${supabaseUrl()}/storage/v1/object/public/media/${path}`;
}

/** رفع ملف إلى bucket محدد. لا نُنشئ رابطًا عامًا للمستندات الخاصة. */
export async function cloudUploadToBucket(
  bucket: "media" | "documents",
  path: string,
  body: ArrayBuffer | Uint8Array,
  contentType: string
): Promise<{ path: string; publicUrl?: string }> {
  requireCloud();

  const response = await fetch(
    `${supabaseUrl()}/storage/v1/object/${bucket}/${path}`,
    {
      method: "POST",
      headers: {
        apikey: serviceKey(),
        Authorization: `Bearer ${serviceKey()}`,
        "Content-Type": contentType,
        "x-upsert": "true",
        "cache-control": "public, max-age=31536000, immutable",
      },
      body: body as BodyInit,
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `فشل رفع الملف إلى Supabase (${response.status}): ${await response.text()}`
    );
  }

  return {
    path,
    ...(bucket === "media" ? { publicUrl: cloudPublicUrl(path) } : {}),
  };
}

export async function cloudTrackStagedUpload(input: {
  path: string;
  bucket: "media" | "documents";
  accountId: string;
  submissionId: string;
}): Promise<void> {
  await cloudRest<unknown[]>("upload_staging?on_conflict=path", {
    method: "POST",
    body: {
      path: input.path,
      bucket: input.bucket,
      account_id: input.accountId,
      submission_id: input.submissionId,
    },
    prefer: "resolution=merge-duplicates,return=minimal",
    timeoutMs: 8_000,
  });
}

export async function cloudDeleteStorageObject(
  bucket: "media" | "documents",
  path: string
): Promise<void> {
  requireCloud();
  const response = await fetch(`${supabaseUrl()}/storage/v1/object/${bucket}`, {
    method: "DELETE",
    headers: headers(),
    body: JSON.stringify({ prefixes: [path] }),
    cache: "no-store",
    signal: timeoutSignal(10_000),
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(`تعذر حذف الملف المؤقت (${response.status})`);
  }
}

export interface StagedUploadRow {
  path: string;
  bucket: "media" | "documents";
  account_id: string;
  submission_id: string;
  claimed_at: string | null;
  created_at: string;
}

export async function cloudGetOrphanUploads(
  olderThanIso: string,
  limit = 100
): Promise<StagedUploadRow[]> {
  const params = new URLSearchParams();
  params.set("select", "path,bucket,account_id,submission_id,claimed_at,created_at");
  params.set("claimed_at", "is.null");
  params.set("created_at", `lt.${olderThanIso}`);
  params.set("order", "created_at.asc");
  params.set("limit", String(Math.min(Math.max(limit, 1), 500)));
  return cloudRest<StagedUploadRow[]>(`upload_staging?${params.toString()}`, {
    timeoutMs: 10_000,
  });
}

export async function cloudDeleteUploadTracking(paths: string[]): Promise<void> {
  if (!paths.length) return;
  const safe = paths
    .filter(Boolean)
    .slice(0, 500)
    .map((path) => `"${path.replace(/"/g, "")}"`)
    .join(",");
  if (!safe) return;
  await cloudRest<void>(`upload_staging?path=in.(${encodeURIComponent(safe)})`, {
    method: "DELETE",
    timeoutMs: 10_000,
  });
}

export async function cloudPurgeClaimedUploadTracking(
  olderThanIso: string
): Promise<void> {
  const params = new URLSearchParams();
  params.set("claimed_at", `lt.${olderThanIso}`);
  await cloudRest<void>(`upload_staging?${params.toString()}`, {
    method: "DELETE",
    timeoutMs: 10_000,
  });
}

/** رفع صورة عامة — دالة توافقية للاستخدامات القائمة */
export async function cloudUpload(
  path: string,
  body: ArrayBuffer | Uint8Array,
  contentType: string
): Promise<string> {
  const uploaded = await cloudUploadToBucket("media", path, body, contentType);
  return uploaded.publicUrl ?? "";
}

/** قراءة مستند خاص للسيرفر فقط — لا يُنشأ له رابط عام دائم. */
export async function cloudDownloadDocument(
  path: string
): Promise<{ bytes: ArrayBuffer; contentType: string }> {
  requireCloud();
  const response = await fetch(
    `${supabaseUrl()}/storage/v1/object/documents/${path}`,
    {
      headers: {
        apikey: serviceKey(),
        Authorization: `Bearer ${serviceKey()}`,
      },
      cache: "no-store",
    }
  );
  if (!response.ok) {
    throw new Error(`المستند غير متاح (${response.status})`);
  }
  return {
    bytes: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") || "application/octet-stream",
  };
}

export interface CloudInquiryInput {
  kind: string;
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  payload?: Record<string, unknown>;
  status?: string;
}

/** حفظ طلب زائر داخل جدول inquiries */
export async function cloudInsertInquiry(
  input: CloudInquiryInput
): Promise<{ id: string; created_at: string }> {
  requireCloud();
  const response = await fetch(`${supabaseUrl()}/rest/v1/inquiries`, {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify({
      kind: input.kind,
      name: input.name || null,
      phone: input.phone || null,
      email: input.email || null,
      message: input.message || null,
      payload: input.payload ?? {},
      status: input.status ?? "new",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `فشل حفظ الطلب في Supabase (${response.status}): ${await response.text()}`
    );
  }

  const rows = (await response.json()) as { id: string; created_at: string }[];
  return rows[0];
}

export async function cloudCreatePropertySubmission(input: {
  accountId: string;
  submissionId: string;
  property: Record<string, unknown>;
  reference: string;
  name: string;
  phone?: string;
  message: string;
}): Promise<{
  result: "created" | "duplicate";
  inquiryId: string;
  reference: string;
  property: Record<string, unknown>;
}> {
  const result = await cloudRest<{
    result?: "created" | "duplicate" | "invalid";
    inquiryId?: string;
    reference?: string;
    property?: Record<string, unknown>;
  }>("rpc/create_property_submission", {
    method: "POST",
    body: {
      p_account_id: input.accountId,
      p_submission_id: input.submissionId,
      p_property: input.property,
      p_reference: input.reference,
      p_name: input.name,
      p_phone: input.phone ?? "",
      p_message: input.message,
    },
    timeoutMs: 15_000,
  });
  if (
    (result.result === "created" || result.result === "duplicate") &&
    result.inquiryId &&
    result.reference &&
    result.property
  ) {
    return {
      result: result.result,
      inquiryId: result.inquiryId,
      reference: result.reference,
      property: result.property,
    };
  }
  throw new Error("تعذر حفظ طلب العقار");
}

export interface CloudInquiryRow {
  id: string;
  kind: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  payload: Record<string, unknown> | null;
  status: string | null;
  created_at: string | null;
}

/** قراءة الاستفسارات للأدمن — تُستخدم في صندوق الـCRM الموحّد */
export async function cloudGetInquiries(limit = 500): Promise<CloudInquiryRow[]> {
  if (!cloudEnabled()) return [];
  const safeLimit = Math.min(Math.max(Math.round(limit), 1), 1000);
  const params = new URLSearchParams();
  params.set(
    "select",
    "id,kind,name,phone,email,message,payload,status,created_at"
  );
  params.set("order", "created_at.desc");
  params.set("limit", String(safeLimit));

  const response = await fetch(
    `${supabaseUrl()}/rest/v1/inquiries?${params.toString()}`,
    { headers: headers(), cache: "no-store", signal: timeoutSignal(8_000) }
  );
  if (!response.ok) {
    throw new Error(
      `فشل قراءة الاستفسارات (${response.status}): ${await response.text()}`
    );
  }
  return (await response.json()) as CloudInquiryRow[];
}

/** قراءة صفوف نوع واحد فقط (مثل طلبات العقار) بدل جلب كل الاستفسارات */
export async function cloudGetInquiriesByKind(
  kind: string,
  limit = 1000
): Promise<CloudInquiryRow[]> {
  if (!kind.trim()) return [];
  const safeLimit = Math.min(Math.max(Math.round(limit), 1), 1000);
  const params = new URLSearchParams();
  params.set(
    "select",
    "id,kind,name,phone,email,message,payload,status,created_at"
  );
  params.set("kind", `eq.${kind}`);
  params.set("order", "created_at.desc");
  params.set("limit", String(safeLimit));

  return cloudRest<CloudInquiryRow[]>(`inquiries?${params.toString()}`, {
    timeoutMs: 8_000,
  });
}

/** تحديث صف استفسار واحد — يُستخدم لطلبات العقار (حالة، ملاحظات، تواصل) */
export async function cloudUpdateInquiry(
  id: string,
  patch: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    message?: string | null;
    payload?: Record<string, unknown>;
    status?: string;
  }
): Promise<CloudInquiryRow | null> {
  const safeId = encodeURIComponent(id);
  const body: Record<string, unknown> = {};
  for (const key of ["name", "phone", "email", "message", "payload", "status"] as const) {
    if (patch[key] !== undefined) body[key] = patch[key];
  }
  if (!Object.keys(body).length) return null;

  const rows = await cloudRest<CloudInquiryRow[]>(
    `inquiries?id=eq.${safeId}`,
    {
      method: "PATCH",
      body,
      prefer: "return=representation",
      timeoutMs: 10_000,
    }
  );
  return rows[0] ?? null;
}

/** حذف صف استفسار واحد */
export async function cloudDeleteInquiry(id: string): Promise<void> {
  const safeId = encodeURIComponent(id);
  await cloudRest<void>(`inquiries?id=eq.${safeId}`, {
    method: "DELETE",
    timeoutMs: 10_000,
  });
}
