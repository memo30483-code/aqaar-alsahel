import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminToken,
} from "@/lib/admin-session";
import {
  acceptStaffInvite,
  inspectStaffInvite,
  isStaffRoleValue,
} from "@/lib/staff-server";
import {
  checkRateLimit,
  clientIp,
  hashRateKey,
  rateLimitResponse,
} from "@/lib/rate-limit-server";
import { appendAudit } from "@/lib/workflow-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE = { limit: 10, windowSeconds: 30 * 60, failClosed: true };
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim() ?? "";
  try {
    const invite = await inspectStaffInvite(code);
    return NextResponse.json(invite, {
      status: invite.valid ? 200 : 404,
      headers: NO_STORE,
    });
  } catch {
    return NextResponse.json(
      { valid: false, error: "service_unavailable" },
      { status: 503, headers: NO_STORE }
    );
  }
}

export async function POST(request: Request) {
  const limit = await checkRateLimit(
    hashRateKey("staff-join", clientIp(request)),
    RATE
  );
  if (!limit.allowed) {
    return rateLimitResponse(limit, "محاولات كثيرة. حاول بعد قليل.");
  }
  let body: { code?: unknown; password?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad_request" },
      { status: 400, headers: NO_STORE }
    );
  }
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!code || password.length < 10) {
    return NextResponse.json(
      { ok: false, error: "invalid_input" },
      { status: 400, headers: NO_STORE }
    );
  }
  try {
    const user = await acceptStaffInvite(code, password);
    if (!isStaffRoleValue(user.role)) throw new Error("INVALID_ROLE");
    const token = await createAdminToken({
      sub: user.email,
      uid: user.id,
      name: user.name,
      role: user.role,
    });
    await appendAudit({
      action: "staff.invite.accept",
      category: "auth",
      actorId: user.id,
      actorEmail: user.email,
      actorName: user.name,
      actorRole: user.role,
      itemId: user.id,
      details: "تفعيل حساب الموظف وإنشاء كلمة المرور",
    }).catch(() => undefined);
    const response = NextResponse.json(
      {
        ok: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { headers: NO_STORE }
    );
    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    const codeValue = error instanceof Error ? error.message : "SERVER_ERROR";
    const status = codeValue === "INVITE_EXPIRED" ? 410 : codeValue === "INVALID_INVITE" ? 404 : 400;
    return NextResponse.json(
      { ok: false, error: codeValue.toLowerCase() },
      { status, headers: NO_STORE }
    );
  }
}
