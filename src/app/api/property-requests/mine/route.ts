import { NextResponse } from "next/server";
import { getUserApiSession } from "@/lib/user-api";
import {
  getPropertyRequest,
  inquirySchemaMissing,
  listPropertyRequests,
  loadPublishedProperties,
  matchesForRequest,
  toPublicMatch,
  updatePropertyRequest,
} from "@/lib/property-requests-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const AUTO_ALERT_SCORE = 80;

function errorResponse(error: unknown) {
  if (inquirySchemaMissing(error)) {
    return NextResponse.json(
      { ok: false, error: "نظام الطلبات غير مفعّل", code: "schema_missing" },
      { status: 503, headers: NO_STORE }
    );
  }
  return NextResponse.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : "تعذر قراءة طلباتك",
    },
    { status: 500, headers: NO_STORE }
  );
}

function ownedBy(
  item: { accountId?: string; email: string },
  session: { sub: string; email: string }
): boolean {
  if (item.accountId) return item.accountId === session.sub;
  return item.email.trim().toLowerCase() === session.email.trim().toLowerCase();
}

export async function GET() {
  const session = await getUserApiSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "سجّل الدخول لعرض طلباتك", code: "sign_in_required" },
      { status: 401, headers: NO_STORE }
    );
  }

  try {
    const [allRequests, properties] = await Promise.all([
      listPropertyRequests(500),
      loadPublishedProperties(),
    ]);
    const byId = new Map(properties.map((property) => [property.id, property]));
    let notificationCount = 0;

    const requests = allRequests
      .filter((item) => ownedBy(item, session))
      .map((item) => {
        const ranked = matchesForRequest(item, properties, 16);
        const matches = ranked.flatMap((match) => {
          const property = byId.get(match.propertyId);
          if (!property) return [];
          const alerted =
            match.score >= AUTO_ALERT_SCORE ||
            item.sentPropertyIds.includes(match.propertyId);
          const unseen = alerted && !item.seenPropertyIds.includes(match.propertyId);
          if (unseen) notificationCount += 1;
          return [
            {
              ...toPublicMatch(match, property),
              alerted,
              unseen,
              sharedByAdmin: item.sentPropertyIds.includes(match.propertyId),
            },
          ];
        });

        return {
          id: item.id,
          reference: item.reference,
          brief: item.brief,
          status: item.status,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          matches,
        };
      });

    return NextResponse.json(
      { ok: true, requests, notificationCount },
      { headers: NO_STORE }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

interface SeenBody {
  requestId?: unknown;
  propertyIds?: unknown;
}

/** تعليم تنبيهات المطابقة كمقروءة من صفحة «طلباتي». */
export async function POST(request: Request) {
  const session = await getUserApiSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "غير مصرّح" },
      { status: 401, headers: NO_STORE }
    );
  }

  let body: SeenBody;
  try {
    body = (await request.json()) as SeenBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "صيغة الطلب غير صحيحة" },
      { status: 400, headers: NO_STORE }
    );
  }
  const requestId =
    typeof body.requestId === "string" ? body.requestId.trim() : "";
  const propertyIds = Array.isArray(body.propertyIds)
    ? body.propertyIds
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 100)
    : [];
  if (!requestId || !propertyIds.length) {
    return NextResponse.json(
      { ok: false, error: "لا توجد تنبيهات لتحديثها" },
      { status: 400, headers: NO_STORE }
    );
  }

  try {
    const current = await getPropertyRequest(requestId);
    if (!current || !ownedBy(current, session)) {
      return NextResponse.json(
        { ok: false, error: "الطلب غير موجود" },
        { status: 404, headers: NO_STORE }
      );
    }
    const seenPropertyIds = Array.from(
      new Set([...current.seenPropertyIds, ...propertyIds])
    );
    await updatePropertyRequest(
      current.id,
      { seenPropertyIds, expectedVersion: current.version },
      current.name
    );
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    return errorResponse(error);
  }
}
