import { NextResponse } from "next/server";
import { cloudReportReview, reviewSchemaMissing } from "@/lib/reviews-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

/** إبلاغ عن تقييم مسيء — يزيد عدّاد البلاغات للمراجعة الإدارية */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) {
        return NextResponse.json(
          { ok: false, error: "مصدر الطلب غير مسموح" },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { ok: false, error: "مصدر الطلب غير مسموح" },
        { status: 403 }
      );
    }
  }
  if (!UUID.test(id)) {
    return NextResponse.json(
      { ok: false, error: "معرّف التقييم غير صالح" },
      { status: 400 }
    );
  }

  try {
    const count = await cloudReportReview(id);
    if (count < 0) {
      return NextResponse.json(
        { ok: false, error: "التقييم غير موجود" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (reviewSchemaMissing(error)) {
      return NextResponse.json(
        { ok: false, error: "نظام التقييمات غير مفعّل بعد" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { ok: false, error: "تعذر تسجيل البلاغ" },
      { status: 500 }
    );
  }
}
