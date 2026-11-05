import { NextResponse } from "next/server";
import { cloudEnabled, cloudInsertInquiry } from "@/lib/cloud/server";
import {
  cloudCreateCrmLead,
  cloudGetCrmSettings,
} from "@/lib/crm-server";
import { inquiryLead } from "@/lib/crm-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * استقبال طلبات الزوار غير العقارية (تواصل مع مهني، اهتمام بالتطبيق).
 *
 * كل طلب يُحفظ في `inquiries` ثم تُنشأ له بطاقة CRM تلقائيًا في PostgreSQL،
 * حتى لا يعتمد وصول الطلب على المتصفح أو على ضغط زر «استيراد» في اللوحة.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 12;
const KINDS = new Set(["professional_request", "app_interest", "property_inquiry"]);

const requests = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function allowRequest(key: string): boolean {
  const now = Date.now();
  const current = requests.get(key);
  if (!current || current.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_REQUESTS) return false;
  current.count += 1;
  return true;
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

function text(value: unknown, max = 600): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function phone(value: unknown): string {
  return text(value, 30).replace(/[^\d+]/g, "");
}

interface RequestBody {
  kind?: unknown;
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  message?: unknown;
  payload?: unknown;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { ok: false, error: "مصدر الطلب غير مسموح" },
      { status: 403 }
    );
  }
  if (!cloudEnabled()) {
    return NextResponse.json(
      { ok: false, error: "قاعدة البيانات غير متاحة" },
      { status: 503 }
    );
  }
  if (!allowRequest(clientKey(request))) {
    return NextResponse.json(
      { ok: false, error: "تم تجاوز عدد الطلبات المسموح مؤقتًا، حاول لاحقًا" },
      { status: 429 }
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "صيغة الطلب غير صحيحة" },
      { status: 400 }
    );
  }

  const kind = text(body.kind, 40);
  if (!KINDS.has(kind)) {
    return NextResponse.json(
      { ok: false, error: "نوع الطلب غير معروف" },
      { status: 400 }
    );
  }

  const name = text(body.name, 160);
  const phoneValue = phone(body.phone);
  const email = text(body.email, 240);
  const message = text(body.message, 2000);

  if (kind === "app_interest") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: "بريد إلكتروني غير صالح" },
        { status: 400 }
      );
    }
  } else if (phoneValue.replace(/\D/g, "").length < 7) {
    return NextResponse.json(
      { ok: false, error: "رقم هاتف غير صالح" },
      { status: 400 }
    );
  }

  if (kind !== "app_interest" && !name) {
    return NextResponse.json(
      { ok: false, error: "الاسم مطلوب" },
      { status: 400 }
    );
  }

  const payload =
    body.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
      ? (body.payload as Record<string, unknown>)
      : {};

  try {
    const inquiry = await cloudInsertInquiry({
      kind,
      name: name || email,
      phone: phoneValue || undefined,
      email: email || undefined,
      message: message || undefined,
      payload,
      status: "new",
    });

    /*
     * فشل إنشاء بطاقة CRM لا يفقد الطلب نفسه؛ السجل محفوظ في inquiries
     * ويمكن استيراده من اللوحة لاحقًا.
     */
    try {
      const lead = inquiryLead({
        id: inquiry.id,
        kind,
        name: name || email,
        phone: phoneValue,
        email,
        message,
        payload,
        created_at: inquiry.created_at,
      });
      if (lead) {
        const settings = await cloudGetCrmSettings();
        if (settings.autoAssign && settings.defaultAssigneeId) {
          lead.assignedTo = settings.defaultAssigneeId;
          lead.assignedToName = settings.defaultAssigneeName;
        }
        await cloudCreateCrmLead(lead, "الموقع");
      }
    } catch {
      /* يبقى الطلب في inquiries للاستيراد اليدوي */
    }

    return NextResponse.json({ ok: true, id: inquiry.id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "تعذر حفظ الطلب، حاول لاحقًا",
      },
      { status: 500 }
    );
  }
}
