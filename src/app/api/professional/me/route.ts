import { NextResponse } from "next/server";
import { getUserApiSession } from "@/lib/user-api";
import {
  getOwnedProfessional,
  ProfessionalConflictError,
  updateOwnedProfessional,
} from "@/lib/professionals-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function GET() {
  const session = await getUserApiSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }
  try {
    const owned = await getOwnedProfessional(session.sub);
    if (!owned) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json({ ok: true, ...owned }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ ok: false, error: "professional_unavailable" }, { status: 503, headers: NO_STORE });
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "origin_not_allowed" }, { status: 403, headers: NO_STORE });
  }
  const session = await getUserApiSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }
  let body: { record?: unknown; expectedVersion?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400, headers: NO_STORE });
  }
  const expectedVersion = Number(body.expectedVersion);
  if (
    !body.record ||
    typeof body.record !== "object" ||
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion < 1 ||
    JSON.stringify(body.record).length > 4_000_000
  ) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400, headers: NO_STORE });
  }
  try {
    const saved = await updateOwnedProfessional({
      accountId: session.sub,
      actor: session.name || session.email,
      expectedVersion,
      value: body.record,
    });
    return NextResponse.json({ ok: true, ...saved }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof ProfessionalConflictError) {
      return NextResponse.json(
        { ok: false, error: "conflict", message: error.message, current: error.current },
        { status: 409, headers: NO_STORE }
      );
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 503, headers: NO_STORE });
  }
}
