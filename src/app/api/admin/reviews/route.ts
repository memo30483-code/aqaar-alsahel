import { NextResponse } from "next/server";
import { adminActor, getAdminApiSession } from "@/lib/admin-api";
import {
  cloudGetAdminReviews,
  cloudGetReviewSettings,
  cloudSaveReviewSettings,
  reviewSchemaMissing,
} from "@/lib/reviews-server";
import {
  normalizeReviewSettings,
  type ReviewEntity,
  type ReviewStatus,
} from "@/lib/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const STATUSES = new Set<ReviewStatus>(["pending", "approved", "rejected"]);
const ENTITIES = new Set<ReviewEntity>(["property", "developer", "professional"]);

function fail(error: unknown) {
  if (reviewSchemaMissing(error)) {
    return NextResponse.json(
      {
        ok: false,
        error: "جداول التقييمات غير مفعّلة في قاعدة البيانات",
        code: "review_schema_missing",
      },
      { status: 503, headers: NO_STORE }
    );
  }
  return NextResponse.json(
    { ok: false, error: "تعذر تحميل التقييمات" },
    { status: 500, headers: NO_STORE }
  );
}

export async function GET(request: Request) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "غير مصرّح" },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const statusRaw = url.searchParams.get("status") ?? "all";
  const entityRaw = url.searchParams.get("entityType") ?? "all";
  const status = STATUSES.has(statusRaw as ReviewStatus)
    ? (statusRaw as ReviewStatus)
    : "all";
  const entityType = ENTITIES.has(entityRaw as ReviewEntity)
    ? (entityRaw as ReviewEntity)
    : "all";

  try {
    const [reviews, settings] = await Promise.all([
      cloudGetAdminReviews({ status, entityType, limit: 400 }),
      cloudGetReviewSettings(),
    ]);
    return NextResponse.json({ ok: true, reviews, settings }, { headers: NO_STORE });
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "غير مصرّح" },
      { status: 401 }
    );
  }
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "صيغة غير صحيحة" },
      { status: 400 }
    );
  }
  try {
    const settings = await cloudSaveReviewSettings(
      normalizeReviewSettings(raw),
      adminActor(session)
    );
    return NextResponse.json({ ok: true, settings }, { headers: NO_STORE });
  } catch (error) {
    return fail(error);
  }
}
