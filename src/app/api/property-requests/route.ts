import { NextResponse } from "next/server";
import {
  checkRateLimit,
  clientIp,
  hashRateKey,
  rateLimitResponse,
} from "@/lib/rate-limit-server";
import { cloudEnabled } from "@/lib/cloud/server";
import { getUserApiSession } from "@/lib/user-api";
import {
  normalizePropertyRequestBrief,
  propertyRequestSummary,
} from "@/lib/property-requests";
import {
  createPropertyRequest,
  createPropertyRequestLead,
  inquirySchemaMissing,
  loadPublishedProperties,
  matchesForRequest,
  readPropertyRequestSettings,
  toPublicMatch,
} from "@/lib/property-requests-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE = {
  limit: 6,
  windowSeconds: 60 * 60,
};
const NO_STORE = { "Cache-Control": "no-store" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function databaseError(error: unknown) {
  if (inquirySchemaMissing(error)) {
    return NextResponse.json(
      {
        ok: false,
        error: "نظام طلبات العقار غير مفعّل في قاعدة البيانات",
        code: "property_requests_schema_missing",
      },
      { status: 503, headers: NO_STORE }
    );
  }
  return NextResponse.json(
    {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "تعذر إرسال الطلب، حاول مرة أخرى",
    },
    { status: 500, headers: NO_STORE }
  );
}

/** حالة الميزة والجلسة — بلا أي بيانات خاصة. */
export async function GET() {
  const [settings, session] = await Promise.all([
    readPropertyRequestSettings(),
    getUserApiSession(),
  ]);
  return NextResponse.json(
    {
      ok: true,
      settings,
      authenticated: Boolean(session),
      account: session
        ? { id: session.sub, name: session.name, email: session.email }
        : null,
    },
    { headers: NO_STORE }
  );
}

interface PostBody {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  brief?: unknown;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { ok: false, error: "مصدر الطلب غير مسموح" },
      { status: 403, headers: NO_STORE }
    );
  }
  if (!cloudEnabled()) {
    return NextResponse.json(
      { ok: false, error: "قاعدة البيانات غير متاحة حاليًا" },
      { status: 503, headers: NO_STORE }
    );
  }

  const limit = await checkRateLimit(
    hashRateKey("property-request", clientIp(request)),
    RATE
  );
  if (!limit.allowed) {
    const blocked = rateLimitResponse(
      limit,
      "تم إرسال عدة طلبات مؤخرًا. حاول مرة أخرى بعد قليل."
    );
    blocked.headers.set("Cache-Control", "no-store");
    return blocked;
  }

  const [settings, session] = await Promise.all([
    readPropertyRequestSettings(),
    getUserApiSession(),
  ]);
  if (!settings.enabled) {
    return NextResponse.json(
      { ok: false, error: "خدمة طلب العقار متوقفة مؤقتًا" },
      { status: 403, headers: NO_STORE }
    );
  }
  if (settings.audience === "signed_in" && !session) {
    return NextResponse.json(
      {
        ok: false,
        error: "سجّل الدخول أولًا لإرسال طلب عقار ومتابعته",
        code: "sign_in_required",
      },
      { status: 401, headers: NO_STORE }
    );
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "صيغة الطلب غير صحيحة" },
      { status: 400, headers: NO_STORE }
    );
  }

  const name = session?.name || text(body.name, 120);
  const email = (session?.email || text(body.email, 240)).toLowerCase();
  const phone = text(body.phone, 40);
  const brief = normalizePropertyRequestBrief(body.brief);

  if (name.length < 2) {
    return NextResponse.json(
      { ok: false, error: "اكتب الاسم كاملًا" },
      { status: 400, headers: NO_STORE }
    );
  }
  if (phone.replace(/\D/g, "").length < 7) {
    return NextResponse.json(
      { ok: false, error: "اكتب رقم هاتف صحيحًا للتواصل" },
      { status: 400, headers: NO_STORE }
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "البريد الإلكتروني غير صالح" },
      { status: 400, headers: NO_STORE }
    );
  }
  if (!brief.types.length) {
    return NextResponse.json(
      { ok: false, error: "اختر نوع عقار واحدًا على الأقل" },
      { status: 400, headers: NO_STORE }
    );
  }
  if (!brief.cities.length) {
    return NextResponse.json(
      { ok: false, error: "اختر مدينة واحدة على الأقل" },
      { status: 400, headers: NO_STORE }
    );
  }
  if (
    brief.priceMin !== null &&
    brief.priceMax !== null &&
    brief.priceMin > brief.priceMax
  ) {
    return NextResponse.json(
      { ok: false, error: "الحد الأدنى للميزانية أكبر من الحد الأقصى" },
      { status: 400, headers: NO_STORE }
    );
  }
  if (
    brief.areaMin !== null &&
    brief.areaMax !== null &&
    brief.areaMin > brief.areaMax
  ) {
    return NextResponse.json(
      { ok: false, error: "الحد الأدنى للمساحة أكبر من الحد الأقصى" },
      { status: 400, headers: NO_STORE }
    );
  }

  try {
    const saved = await createPropertyRequest({
      name,
      phone,
      email,
      brief,
      accountId: session?.sub,
    });

    /* فشل CRM لا يلغي طلب العميل بعد أن حُفظ بالفعل. */
    try {
      await createPropertyRequestLead(saved);
    } catch (error) {
      console.error("property request CRM lead failed", error);
    }

    let publicMatches: ReturnType<typeof toPublicMatch>[] = [];
    try {
      const properties = await loadPublishedProperties();
      const matches = matchesForRequest(saved, properties, 4);
      const byId = new Map(properties.map((property) => [property.id, property]));
      publicMatches = matches.flatMap((match) => {
        const property = byId.get(match.propertyId);
        return property ? [toPublicMatch(match, property)] : [];
      });
    } catch {
      /* المطابقة تحسين للرد وليست شرطاً لقبول الطلب */
    }

    return NextResponse.json(
      {
        ok: true,
        request: {
          id: saved.id,
          reference: saved.reference,
          status: saved.status,
          summary: propertyRequestSummary(saved.brief),
          createdAt: saved.createdAt,
        },
        matches: publicMatches,
      },
      { status: 201, headers: NO_STORE }
    );
  } catch (error) {
    return databaseError(error);
  }
}
