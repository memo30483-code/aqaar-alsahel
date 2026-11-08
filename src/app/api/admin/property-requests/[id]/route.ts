import { NextResponse } from "next/server";
import { adminActor, getAdminApiSession } from "@/lib/admin-api";
import {
  deletePropertyRequest,
  getPropertyRequest,
  inquirySchemaMissing,
  loadPublishedProperties,
  matchesForRequest,
  PropertyRequestConflictError,
  toPublicMatch,
  updatePropertyRequest,
} from "@/lib/property-requests-server";
import {
  isPropertyRequestPriority,
  isPropertyRequestStatus,
} from "@/lib/property-requests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

function text(value: unknown, max: number): string | undefined {
  return typeof value === "string" ? value.trim().slice(0, max) : undefined;
}

function errorResponse(error: unknown) {
  if (error instanceof PropertyRequestConflictError) {
    return NextResponse.json(
      { ok: false, error: error.message, code: "conflict" },
      { status: 409, headers: NO_STORE }
    );
  }
  if (error instanceof Error && error.message === "NOT_FOUND") {
    return NextResponse.json(
      { ok: false, error: "الطلب غير موجود" },
      { status: 404, headers: NO_STORE }
    );
  }
  if (inquirySchemaMissing(error)) {
    return NextResponse.json(
      { ok: false, error: "نظام الطلبات غير مفعّل", code: "schema_missing" },
      { status: 503, headers: NO_STORE }
    );
  }
  return NextResponse.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : "تعذر حفظ التعديل",
    },
    { status: 500, headers: NO_STORE }
  );
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "غير مصرّح" },
      { status: 401, headers: NO_STORE }
    );
  }

  try {
    const [item, properties] = await Promise.all([
      getPropertyRequest(params.id),
      loadPublishedProperties(),
    ]);
    if (!item) {
      return NextResponse.json(
        { ok: false, error: "الطلب غير موجود" },
        { status: 404, headers: NO_STORE }
      );
    }
    const byId = new Map(properties.map((property) => [property.id, property]));
    const matches = matchesForRequest(item, properties, 30).flatMap((match) => {
      const property = byId.get(match.propertyId);
      return property
        ? [
            {
              ...toPublicMatch(match, property),
              sent: item.sentPropertyIds.includes(match.propertyId),
            },
          ]
        : [];
    });
    return NextResponse.json(
      { ok: true, request: item, matches },
      { headers: NO_STORE }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

interface PatchBody {
  status?: unknown;
  priority?: unknown;
  assignedTo?: unknown;
  assignedToName?: unknown;
  adminNotes?: unknown;
  sentPropertyIds?: unknown;
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  published?: unknown;
  publicTitleAr?: unknown;
  publicTitleEn?: unknown;
  publicDescriptionAr?: unknown;
  publicDescriptionEn?: unknown;
  contactText?: unknown;
  expectedVersion?: unknown;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "غير مصرّح" },
      { status: 401, headers: NO_STORE }
    );
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "صيغة الطلب غير صحيحة" },
      { status: 400, headers: NO_STORE }
    );
  }

  if (body.status !== undefined && !isPropertyRequestStatus(body.status)) {
    return NextResponse.json(
      { ok: false, error: "حالة الطلب غير صالحة" },
      { status: 400, headers: NO_STORE }
    );
  }
  if (body.priority !== undefined && !isPropertyRequestPriority(body.priority)) {
    return NextResponse.json(
      { ok: false, error: "أولوية الطلب غير صالحة" },
      { status: 400, headers: NO_STORE }
    );
  }
  if (body.sentPropertyIds !== undefined && !Array.isArray(body.sentPropertyIds)) {
    return NextResponse.json(
      { ok: false, error: "قائمة العقارات المرشحة غير صالحة" },
      { status: 400, headers: NO_STORE }
    );
  }

  const sentPropertyIds = Array.isArray(body.sentPropertyIds)
    ? body.sentPropertyIds
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 100)
    : undefined;

  try {
    const updated = await updatePropertyRequest(
      params.id,
      {
        status: isPropertyRequestStatus(body.status) ? body.status : undefined,
        priority: isPropertyRequestPriority(body.priority)
          ? body.priority
          : undefined,
        assignedTo:
          body.assignedTo !== undefined ? text(body.assignedTo, 160) ?? "" : undefined,
        assignedToName:
          body.assignedToName !== undefined
            ? text(body.assignedToName, 160) ?? ""
            : undefined,
        adminNotes:
          body.adminNotes !== undefined
            ? text(body.adminNotes, 4000) ?? ""
            : undefined,
        sentPropertyIds,
        name: body.name !== undefined ? text(body.name, 120) ?? "" : undefined,
        phone: body.phone !== undefined ? text(body.phone, 40) ?? "" : undefined,
        email: body.email !== undefined ? text(body.email, 240) ?? "" : undefined,
        published:
          body.published !== undefined ? body.published === true : undefined,
        publicTitleAr:
          body.publicTitleAr !== undefined
            ? text(body.publicTitleAr, 180) ?? ""
            : undefined,
        publicTitleEn:
          body.publicTitleEn !== undefined
            ? text(body.publicTitleEn, 180) ?? ""
            : undefined,
        publicDescriptionAr:
          body.publicDescriptionAr !== undefined
            ? text(body.publicDescriptionAr, 1200) ?? ""
            : undefined,
        publicDescriptionEn:
          body.publicDescriptionEn !== undefined
            ? text(body.publicDescriptionEn, 1200) ?? ""
            : undefined,
        contactText: text(body.contactText, 500),
        expectedVersion:
          typeof body.expectedVersion === "number"
            ? body.expectedVersion
            : undefined,
      },
      adminActor(session)
    );
    return NextResponse.json(
      { ok: true, request: updated },
      { headers: NO_STORE }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "غير مصرّح" },
      { status: 401, headers: NO_STORE }
    );
  }
  try {
    const deleted = await deletePropertyRequest(params.id);
    if (!deleted) {
      return NextResponse.json(
        { ok: false, error: "الطلب غير موجود" },
        { status: 404, headers: NO_STORE }
      );
    }
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    return errorResponse(error);
  }
}
