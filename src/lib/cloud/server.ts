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

function requireCloud(): void {
  if (!cloudEnabled()) {
    throw new Error("Supabase غير مضبوط: تأكد من SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY");
  }
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

/** رابط عام لملف داخل bucket الصور */
export function cloudPublicUrl(path: string): string {
  return `${supabaseUrl()}/storage/v1/object/public/media/${path}`;
}

/** رفع ملف إلى bucket الصور وإرجاع رابطه العام */
export async function cloudUpload(
  path: string,
  body: ArrayBuffer | Uint8Array,
  contentType: string
): Promise<string> {
  requireCloud();

  const response = await fetch(
    `${supabaseUrl()}/storage/v1/object/media/${path}`,
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

  return cloudPublicUrl(path);
}
