import { NextResponse } from "next/server";
import { adminCan, getAdminApiSession } from "@/lib/admin-api";
import {
  cloudDeleteReview,
  cloudUpdateReview,
  reviewSchemaMissing,
  type AdminReviewPatch,
} from "@/lib/reviews-server";
import type { ReviewStatus } from "@/lib/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set<ReviewStatus>(["pending", "approved", "rejected"]);

function fail(error: unknown) {
  if (reviewSchemaMissing(error)) {
    return NextResponse.json(
      { ok: false, error: "جداول التقييمات غير مفعّلة", code: "review_schema_missing" },
      { status: 503 }
    );
  }
  return NextResponse.json(
    { ok: false, error: "تعذر تنفيذ العملية" },
    { status: 500 }
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "غير مصرّح" }, { status: 401 });
  }
  if (!adminCan(session, "reviews.manage")) {
    return NextResponse.json({ ok: false, error: "غير مصرّح" }, { status: 403 });
  }
  let body: {
    status?: unknown;
    adminReply?: unknown;
    verified?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "صيغة غير صحيحة" },
      { status: 400 }
    );
  }

  const patch: AdminReviewPatch = {};
  if (body.status !== undefined) {
    if (!STATUSES.has(body.status as ReviewStatus)) {
      return NextResponse.json(
        { ok: false, error: "حالة غير صالحة" },
        { status: 400 }
      );
    }
    patch.status = body.status as ReviewStatus;
  }
  if (body.adminReply !== undefined) {
    if (typeof body.adminReply !== "string") {
      return NextResponse.json(
        { ok: false, error: "رد غير صالح" },
        { status: 400 }
      );
    }
    if (body.adminReply.length > 1200) {
      return NextResponse.json(
        { ok: false, error: "الرد أطول من المسموح (1200 حرف)" },
        { status: 400 }
      );
    }
    patch.adminReply = body.adminReply;
  }
  if (body.verified !== undefined) {
    patch.verified = body.verified === true;
  }
  if (!Object.keys(patch).length) {
    return NextResponse.json(
      { ok: false, error: "لا يوجد تغيير" },
      { status: 400 }
    );
  }

  try {
    const review = await cloudUpdateReview(id, patch);
    if (!review) {
      return NextResponse.json(
        { ok: false, error: "التقييم غير موجود" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { ok: true, review },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "غير مصرّح" }, { status: 401 });
  }
  if (!adminCan(session, "reviews.manage")) {
    return NextResponse.json({ ok: false, error: "غير مصرّح" }, { status: 403 });
  }
  try {
    const removed = await cloudDeleteReview(id);
    if (!removed) {
      return NextResponse.json(
        { ok: false, error: "التقييم غير موجود" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
