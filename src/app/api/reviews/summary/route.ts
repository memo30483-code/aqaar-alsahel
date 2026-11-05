import { NextResponse } from "next/server";
import { cloudEnabled } from "@/lib/cloud/server";
import {
  cloudGetRatingSummaries,
  reviewSchemaMissing,
} from "@/lib/reviews-server";
import type { ReviewEntity } from "@/lib/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENTITIES = new Set<ReviewEntity>([
  "property",
  "developer",
  "professional",
]);

const ID_PATTERN = /^[\w\-.:]{1,180}$/;

/**
 * ملخّص تقييمات مجموعة عناصر في طلب واحد — يُستخدم في بطاقات القوائم.
 * لا يعيد أي بيانات شخصية، والنتائج عامة وقابلة للكاش القصير.
 */
export async function GET(request: Request) {
  if (!cloudEnabled()) {
    return NextResponse.json(
      { ok: false, error: "قاعدة البيانات غير متاحة" },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const entityRaw = url.searchParams.get("entity") ?? "";
  const entityType = ENTITIES.has(entityRaw as ReviewEntity)
    ? (entityRaw as ReviewEntity)
    : null;
  const ids = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => ID_PATTERN.test(id));

  if (!entityType || !ids.length) {
    return NextResponse.json(
      { ok: false, error: "طلب غير صالح" },
      { status: 400 }
    );
  }
  if (ids.length > 60) {
    return NextResponse.json(
      { ok: false, error: "عدد العناصر أكبر من المسموح" },
      { status: 400 }
    );
  }

  try {
    const summaries = await cloudGetRatingSummaries(entityType, ids);
    return NextResponse.json(
      { ok: true, summaries },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=180",
        },
      }
    );
  } catch (error) {
    if (reviewSchemaMissing(error)) {
      return NextResponse.json(
        { ok: false, error: "نظام التقييمات غير مفعّل بعد", code: "review_schema_missing" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { ok: false, error: "تعذر تحميل التقييمات" },
      { status: 500 }
    );
  }
}
