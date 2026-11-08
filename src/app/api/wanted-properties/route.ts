import { NextResponse } from "next/server";
import {
  inquirySchemaMissing,
  listPropertyRequests,
  readPropertyRequestSettings,
} from "@/lib/property-requests-server";
import { propertyRequestPublicTitle } from "@/lib/property-requests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * الطلبات التي وافقت الإدارة على نشرها فقط.
 * لا يُرجع هذا المسار اسم العميل أو هاتفه أو بريده أو ملاحظاته الخاصة.
 */
export async function GET() {
  try {
    const [settings, allRequests] = await Promise.all([
      readPropertyRequestSettings(),
      listPropertyRequests(1000),
    ]);

    if (!settings.directoryEnabled) {
      return NextResponse.json(
        { ok: true, enabled: false, settings, requests: [] },
        { headers: NO_STORE }
      );
    }

    const requests = allRequests
      .filter(
        (item) =>
          item.published && !["won", "closed"].includes(item.status)
      )
      .sort((a, b) =>
        (b.publishedAt || b.updatedAt).localeCompare(
          a.publishedAt || a.updatedAt
        )
      )
      .map((item) => ({
        id: item.id,
        reference: item.reference,
        titleAr: item.publicTitleAr || propertyRequestPublicTitle(item.brief),
        titleEn: item.publicTitleEn,
        descriptionAr: item.publicDescriptionAr,
        descriptionEn: item.publicDescriptionEn,
        brief: {
          purpose: item.brief.purpose,
          types: item.brief.types,
          cities: item.brief.cities,
          districts: item.brief.districts,
          priceMin: item.brief.priceMin,
          priceMax: item.brief.priceMax,
          areaMin: item.brief.areaMin,
          areaMax: item.brief.areaMax,
          roomsMin: item.brief.roomsMin,
          bathroomsMin: item.brief.bathroomsMin,
          finishes: item.brief.finishes,
          saleReason: item.brief.saleReason,
          delivery: item.brief.delivery,
        },
        publishedAt: item.publishedAt || item.updatedAt,
      }));

    return NextResponse.json(
      { ok: true, enabled: true, settings, requests },
      { headers: NO_STORE }
    );
  } catch (error) {
    if (inquirySchemaMissing(error)) {
      return NextResponse.json(
        { ok: false, error: "نظام الطلبات غير مفعّل" },
        { status: 503, headers: NO_STORE }
      );
    }
    return NextResponse.json(
      { ok: false, error: "تعذر قراءة العقارات المطلوبة" },
      { status: 500, headers: NO_STORE }
    );
  }
}
