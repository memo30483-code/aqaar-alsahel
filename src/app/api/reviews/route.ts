import { NextResponse } from "next/server";
import { cloudEnabled } from "@/lib/cloud/server";
import {
  CloudRestError,
} from "@/lib/cloud/server";
import {
  cloudCheckVerified,
  cloudCreateReview,
  cloudGetApprovedReviews,
  cloudGetReviewSettings,
  reviewDuplicate,
  reviewSchemaMissing,
} from "@/lib/reviews-server";
import {
  clampRating,
  normalizeReviewSettings,
  publicReviewSettings,
  reviewCommentIssue,
  summarizeReviews,
  type ReviewEntity,
} from "@/lib/reviews";
import { createReviewDevice, readReviewDevice } from "@/lib/review-device";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENTITIES = new Set<ReviewEntity>([
  "property",
  "developer",
  "professional",
]);

const WINDOW_MS = 10 * 60 * 1000;
const MAX_POSTS = 12;
const posts = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function allowPost(key: string): boolean {
  const now = Date.now();
  /* تنظيف بسيط للذاكرة: الحذف يتم عند تجاوز حجم معيّن بدل مسح كل شيء */
  if (posts.size > 5000) {
    posts.forEach((entry, entryKey) => {
      if (entry.resetAt <= now) posts.delete(entryKey);
    });
  }
  const current = posts.get(key);
  if (!current || current.resetAt <= now) {
    posts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_POSTS) return false;
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

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function entityFrom(value: string | null): ReviewEntity | null {
  return value && ENTITIES.has(value as ReviewEntity)
    ? (value as ReviewEntity)
    : null;
}

function fail(error: unknown) {
  if (reviewSchemaMissing(error)) {
    return NextResponse.json(
      { ok: false, error: "نظام التقييمات غير مفعّل بعد", code: "review_schema_missing" },
      { status: 503 }
    );
  }
  return NextResponse.json(
    { ok: false, error: "تعذر إكمال الطلب" },
    { status: 500 }
  );
}

export async function GET(request: Request) {
  if (!cloudEnabled()) {
    return NextResponse.json(
      { ok: false, error: "قاعدة البيانات غير متاحة" },
      { status: 503 }
    );
  }
  const url = new URL(request.url);
  const entityType = entityFrom(url.searchParams.get("entity"));
  const entityId = text(url.searchParams.get("id"), 180);
  if (!entityType || !entityId) {
    return NextResponse.json(
      { ok: false, error: "نوع التقييم أو العنصر غير صالح" },
      { status: 400 }
    );
  }

  try {
    const [settings, reviews] = await Promise.all([
      cloudGetReviewSettings(),
      cloudGetApprovedReviews(entityType, entityId, 60),
    ]);
    return NextResponse.json(
      {
        ok: true,
        settings: publicReviewSettings(settings, entityType),
        reviews,
        summary: summarizeReviews(reviews),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return fail(error);
  }
}

interface PostBody {
  entityType?: unknown;
  entityId?: unknown;
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  rating?: unknown;
  subRatings?: unknown;
  comment?: unknown;
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
  if (!allowPost(clientKey(request))) {
    return NextResponse.json(
      { ok: false, error: "عدد التقييمات المسموح مؤقتًا انتهى، حاول لاحقًا" },
      { status: 429 }
    );
  }

  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "صيغة الطلب غير صحيحة" },
      { status: 400 }
    );
  }

  const entityType = entityFrom(text(body.entityType, 20));
  const entityId = text(body.entityId, 180);
  const rating = clampRating(body.rating);
  const name = text(body.name, 60);
  const phone = text(body.phone, 30);
  const email = text(body.email, 240).toLowerCase();
  const comment = text(body.comment, 1200);

  if (!entityType || !entityId) {
    return NextResponse.json(
      { ok: false, error: "العنصر المطلوب تقييمه غير صالح" },
      { status: 400 }
    );
  }
  if (!rating) {
    return NextResponse.json(
      { ok: false, error: "اختر عدد النجوم أولًا" },
      { status: 400 }
    );
  }
  if (name.length < 2) {
    return NextResponse.json(
      { ok: false, error: "اكتب اسمك (حرفان على الأقل)" },
      { status: 400 }
    );
  }
  if (phone && phone.replace(/\D/g, "").length < 7) {
    return NextResponse.json(
      { ok: false, error: "رقم الهاتف غير صالح" },
      { status: 400 }
    );
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "البريد الإلكتروني غير صالح" },
      { status: 400 }
    );
  }
  if (comment) {
    const issue = reviewCommentIssue(comment);
    if (issue) {
      return NextResponse.json({ ok: false, error: issue }, { status: 400 });
    }
  }

  const device = readReviewDevice(request);
  const created = device ? null : createReviewDevice();
  const deviceId = device ?? created!.id;

  try {
    const settings = normalizeReviewSettings(await cloudGetReviewSettings());

    let verified = false;
    if (settings.policy !== "open") {
      verified = await cloudCheckVerified(phone || undefined, email || undefined);
    }
    if (settings.policy === "verified_only" && !verified) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "التقييم متاح لمن سبق له تعامل عبر المنصة. استخدم نفس رقم الهاتف أو البريد الذي تواصلت به مع الإدارة.",
        },
        { status: 403 }
      );
    }

    const allowedItems = settings.subRatings[entityType].enabled
      ? settings.subRatings[entityType].items
      : [];
    const rawSubs =
      body.subRatings && typeof body.subRatings === "object"
        ? (body.subRatings as Record<string, unknown>)
        : {};
    const subRatings: Record<string, number> = {};
    for (const item of allowedItems) {
      const value = clampRating(rawSubs[item.key]);
      if (value) subRatings[item.key] = value;
    }

    const review = await cloudCreateReview({
      entityType,
      entityId,
      device: deviceId,
      name,
      phone: phone || undefined,
      email: email || undefined,
      rating,
      subRatings,
      comment: comment || undefined,
      verified,
      moderation: settings.moderation,
    });

    const response = NextResponse.json({
      ok: true,
      review,
      message: settings.moderation
        ? "تم إرسال تقييمك وسيظهر بعد مراجعة الإدارة."
        : "تم نشر تقييمك، شكرًا لك.",
    });
    if (created) response.headers.append("Set-Cookie", created.cookie);
    return response;
  } catch (error) {
    if (reviewDuplicate(error)) {
      const response = NextResponse.json(
        { ok: false, error: "سبق أن قيّمت هذا العنصر من نفس الجهاز." },
        { status: 409 }
      );
      if (created) response.headers.append("Set-Cookie", created.cookie);
      return response;
    }
    if (error instanceof CloudRestError) {
      const response = fail(error);
      if (created) response.headers.append("Set-Cookie", created.cookie);
      return response;
    }
    return fail(error);
  }
}
