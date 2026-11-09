import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminCan, getAdminApiSession } from "@/lib/admin-api";
import {
  CLOUD_KEYS,
  isCloudKey,
  isPublicCloudKey,
} from "@/lib/cloud/keys";
import { cloudEnabled, cloudGetRows, cloudPutRow } from "@/lib/cloud/server";
import { sanitizePublicCloudRows } from "@/lib/cloud/privacy";
import {
  actorSummary,
  appendAudit,
  readReviewStore,
  readWorkflowSettings,
} from "@/lib/workflow-server";
import { reviewKey } from "@/lib/workflow";
import type { ServerStaffSession } from "@/lib/staff-server";

/**
 * بوابة الحالة المشتركة.
 *
 * GET  /api/state            → كل ما يُسمح بعرضه للزائر
 * GET  /api/state?key=...    → مفتاح محدد (يُستخدم للمفاتيح الكبيرة)
 * GET  /api/state?all=1      → كل المفاتيح (يتطلب جلسة أدمن)
 * PUT  /api/state            → حفظ مفتاح أو عدة مفاتيح (يتطلب جلسة أدمن)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_VALUE_BYTES = 4 * 1024 * 1024;

const SERVER_ONLY_KEYS = new Set([
  "aqaar-accounts",
  "aqaar-staff-auth",
  "aqaar-review-state",
  "aqaar-audit-log",
]);

const KEY_PERMISSION: Record<string, string> = {
  "aqaar-site-settings": "site.settings",
  "aqaar-cities": "site.settings",
  "aqaar-company-info": "site.settings",
  "aqaar-admin-developers-v2": "site.settings",
  "aqaar-offers": "offers.manage",
  "aqaar-offers-settings": "offers.manage",
  "aqaar-marquee-items": "banners.manage",
  "aqaar-professionals": "professionals.manage",
  "aqaar-page-builder-v1": "site.settings",
  "aqaar-text-overrides": "site.settings",
  "aqaar-text-styles": "site.settings",
  "aqaar-home-builder": "site.settings",
  "aqaar-admin-listing-overrides-v2": "listings.edit",
  "aqaar-add-property-fields": "site.settings",
  "aqaar-add-property-options": "site.settings",
  "aqaar-properties": "listings.edit",
  "aqaar-admin-users-v2": "users.view",
  "aqaar-admin-permissions": "users.roles",
  "aqaar-admin-logs": "logs.view",
  "aqaar-listing-actions": "listings.view",
  "aqaar-professional-requests": "professionals.view",
  "aqaar-crm-v1": "crm.view",
  "aqaar-workflow-settings": "workflow.manage",
};

const READ_PERMISSION: Record<string, string> = {
  ...KEY_PERMISSION,
  "aqaar-offers": "offers.view",
  "aqaar-offers-settings": "offers.view",
  "aqaar-professionals": "professionals.view",
  "aqaar-admin-listing-overrides-v2": "listings.view",
  "aqaar-properties": "listings.view",
};

function canReadKey(
  session: ServerStaffSession,
  key: string
): boolean {
  if (SERVER_ONLY_KEYS.has(key)) return false;
  if (key === "aqaar-crm-v1" && !adminCan(session, "owner.contact.view")) return false;
  if (isPublicCloudKey(key)) return true;
  const permission = READ_PERMISSION[key];
  return Boolean(permission && adminCan(session, permission));
}

function canWriteKey(
  session: ServerStaffSession,
  key: string
): boolean {
  if (SERVER_ONLY_KEYS.has(key) || key === "aqaar-workflow-settings") return false;
  if (key === "aqaar-admin-logs") return false;
  /* حسابات الطاقم والصلاحيات تُعدّل فقط عبر API مخصص ومدقّق. */
  if (key === "aqaar-admin-users-v2" || key === "aqaar-admin-permissions") return false;
  const permission = KEY_PERMISSION[key];
  return Boolean(permission && adminCan(session, permission));
}

function cleanObject(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

function hidePrivateFields(
  value: unknown,
  documents: boolean,
  contact: boolean,
  hideSubmitterName = false
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) =>
      hidePrivateFields(item, documents, contact, hideSubmitterName)
    );
  }
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  const hiddenContact = new Set([
    "phone", "email", "whatsapp", "ownerPhone", "ownerEmail", "ownerName",
    "contactPhone", "contactEmail", "submittedByName", "submittedByPhone",
  ]);
  if (hideSubmitterName) {
    hiddenContact.add("name");
    hiddenContact.add("fullName");
    hiddenContact.add("contactName");
  }
  for (const [key, item] of Object.entries(source)) {
    if (key === "ownerToken" || key === "salt" || key === "hash" || key === "password") continue;
    if (!documents && (key === "documents" || key.toLowerCase().includes("document"))) continue;
    if (!contact && hiddenContact.has(key)) continue;
    result[key] = hidePrivateFields(item, documents, contact, hideSubmitterName);
  }
  return result;
}

async function validateWorkflowStateWrite(
  key: string,
  nextValue: unknown
): Promise<boolean> {
  const scope =
    key === "aqaar-admin-listing-overrides-v2"
      ? "listings"
      : key === "aqaar-professionals"
        ? "professionals"
        : null;
  if (!scope) return true;
  const settings = await readWorkflowSettings();
  if (!settings[scope].enabled) return true;
  const [storedRows, reviews] = await Promise.all([
    cloudGetRows({ keys: [key] }),
    readReviewStore(),
  ]);
  const previousValue = storedRows.find((row) => row.key === key)?.value;
  const previous = key === "aqaar-professionals"
    ? new Map(
        (Array.isArray(previousValue) ? previousValue : []).map((item) => {
          const row = cleanObject(item);
          return [String(row.id ?? ""), row.status];
        })
      )
    : new Map(
        Object.entries(cleanObject(previousValue)).map(([id, item]) => [id, cleanObject(item).status])
      );
  const nextItems: Record<string, unknown>[] = key === "aqaar-professionals"
    ? (Array.isArray(nextValue) ? nextValue : []).map((item) => cleanObject(item))
    : Object.entries(cleanObject(nextValue)).map(([id, item]) => ({ id, ...cleanObject(item) }));
  for (const item of nextItems) {
    const id = String(item.id ?? "");
    const status = item.status;
    if (!id || (status !== "approved" && status !== "rejected") || previous.get(id) === status) continue;
    const stage = reviews.records[reviewKey(scope, id)]?.stage;
    if ((status === "approved" && stage !== "approved") || (status === "rejected" && stage !== "rejected")) {
      return false;
    }
  }
  return true;
}

export async function GET(request: Request) {
  if (!cloudEnabled()) {
    return NextResponse.json(
      { enabled: false, configured: false, rows: {} },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const session = await getAdminApiSession();
  const url = new URL(request.url);
  const requested = url.searchParams.get("key");
  const wantsAll = url.searchParams.get("all") === "1";

  try {
    let keys: string[] | undefined;
    if (requested) {
      keys = requested
        .split(",")
        .map((key) => key.trim())
        .filter(isCloudKey);
      if (!keys.length) {
        return NextResponse.json(
          { enabled: true, rows: {}, error: "مفتاح غير معروف" },
          { status: 400 }
        );
      }
      /* المفاتيح الإدارية لا تُقرأ إلا بجلسة أدمن */
      if (!session && keys.some((key) => !isPublicCloudKey(key))) {
        return NextResponse.json(
          { enabled: true, rows: {}, error: "غير مصرّح" },
          { status: 403 }
        );
      }
      if (session && keys.some((key) => !canReadKey(session, key))) {
        return NextResponse.json(
          { enabled: true, rows: {}, error: "غير مصرّح بهذا المفتاح" },
          { status: 403 }
        );
      }
    }

    if (wantsAll && !session) {
      return NextResponse.json(
        { enabled: true, rows: {}, error: "غير مصرّح" },
        { status: 403 }
      );
    }

    if (session && wantsAll) {
      keys = Object.keys(CLOUD_KEYS).filter((key) => canReadKey(session, key));
    }
    const includePrivate = Boolean(session) && (wantsAll || Boolean(requested));
    const storedRows = await cloudGetRows({
      keys,
      publicOnly: !includePrivate,
    });
    const rows = includePrivate
      ? storedRows
      : sanitizePublicCloudRows(storedRows);

    const mapped: Record<string, { value: unknown; updated_at: string }> = {};
    const publicSanitized = new Map(
      sanitizePublicCloudRows(storedRows).map((row) => [row.key, row.value])
    );
    for (const row of rows) {
      if (!session && !row.is_public) continue;
      const readPermission = READ_PERMISSION[row.key];
      const baseValue =
        session &&
        row.is_public &&
        (!readPermission || !adminCan(session, readPermission))
          ? publicSanitized.get(row.key)
          : row.value;
      const value = session
        ? hidePrivateFields(
            baseValue,
            adminCan(session, "documents.view"),
            adminCan(session, "owner.contact.view"),
            row.key === "aqaar-professional-requests"
          )
        : row.value;
      mapped[row.key] = { value, updated_at: row.updated_at };
    }

    return NextResponse.json(
      { enabled: true, configured: true, rows: mapped },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        enabled: true,
        rows: {},
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 }
    );
  }
}

interface PutBody {
  key?: string;
  value?: unknown;
  entries?: { key: string; value: unknown }[];
}

export async function PUT(request: Request) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "جلسة الأدمن غير صالحة" },
      { status: 401 }
    );
  }

  if (!cloudEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Supabase غير مضبوط. أضف SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY ثم أعد النشر.",
      },
      { status: 503 }
    );
  }

  let body: PutBody;
  try {
    body = (await request.json()) as PutBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "صيغة الطلب غير صحيحة" },
      { status: 400 }
    );
  }

  const entries =
    body.entries ??
    (typeof body.key === "string" ? [{ key: body.key, value: body.value }] : []);

  if (!entries.length) {
    return NextResponse.json(
      { ok: false, error: "لا توجد بيانات للحفظ" },
      { status: 400 }
    );
  }

  const unknown = entries.filter((entry) => !isCloudKey(entry.key));
  if (unknown.length) {
    return NextResponse.json(
      {
        ok: false,
        error: `مفاتيح غير مسموح بها: ${unknown.map((e) => e.key).join(", ")}`,
      },
      { status: 400 }
    );
  }

  const forbidden = entries.filter((entry) => !canWriteKey(session, entry.key));
  if (forbidden.length) {
    return NextResponse.json(
      {
        ok: false,
        error: `لا تملك صلاحية حفظ: ${forbidden.map((entry) => CLOUD_KEYS[entry.key].label).join("، ")}`,
      },
      { status: 403 }
    );
  }

  for (const entry of entries) {
    const size = JSON.stringify(entry.value ?? null).length;
    if (size > MAX_VALUE_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          error: `حجم «${CLOUD_KEYS[entry.key].label}» أكبر من الحد المسموح`,
        },
        { status: 413 }
      );
    }
  }

  try {
    const saved: Record<string, string> = {};
    for (const entry of entries) {
      if (!(await validateWorkflowStateWrite(entry.key, entry.value))) {
        return NextResponse.json(
          {
            ok: false,
            error: "لا يمكن نشر أو رفض الطلب قبل اكتمال مسار المراجعة والموافقة النهائية.",
          },
          { status: 409 }
        );
      }
      const row = await cloudPutRow(entry.key, entry.value, session.sub);
      saved[entry.key] = row.updated_at;
    }
    await appendAudit({
      ...actorSummary(session),
      action: "state.update",
      category: "settings",
      details: `تحديث ${entries.map((entry) => CLOUD_KEYS[entry.key].label).join("، ")}`,
      meta: { keys: entries.map((entry) => entry.key) },
    }).catch(() => undefined);

    /* إعادة توليد الصفحات فورًا حتى يرى الزوار التعديل بدون انتظار */
    try {
      revalidatePath("/", "layout");
    } catch {
      /* خارج بيئة Next (اختبارات) — لا مشكلة */
    }

    return NextResponse.json(
      { ok: true, saved },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 }
    );
  }
}
