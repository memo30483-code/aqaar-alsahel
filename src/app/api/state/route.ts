import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin-session";
import {
  CLOUD_KEYS,
  isCloudKey,
  isPublicCloudKey,
} from "@/lib/cloud/keys";
import { cloudEnabled, cloudGetRows, cloudPutRow } from "@/lib/cloud/server";

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

async function adminSession() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  return verifyAdminToken(token);
}

export async function GET(request: Request) {
  if (!cloudEnabled()) {
    return NextResponse.json(
      { enabled: false, configured: false, rows: {} },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const session = await adminSession();
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
    }

    if (wantsAll && !session) {
      return NextResponse.json(
        { enabled: true, rows: {}, error: "غير مصرّح" },
        { status: 403 }
      );
    }

    const includePrivate = Boolean(session) && (wantsAll || Boolean(requested));
    const rows = await cloudGetRows({
      keys,
      publicOnly: !includePrivate,
    });

    const mapped: Record<string, { value: unknown; updated_at: string }> = {};
    for (const row of rows) {
      if (!session && !row.is_public) continue;
      mapped[row.key] = { value: row.value, updated_at: row.updated_at };
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
  const session = await adminSession();
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
      const row = await cloudPutRow(entry.key, entry.value, session.sub);
      saved[entry.key] = row.updated_at;
    }

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
