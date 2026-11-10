import { NextResponse } from "next/server";
import { adminCan, getAdminApiSession } from "@/lib/admin-api";
import {
  otpProviderStatuses,
  otpSchemaReady,
  OtpError,
  readOtpSettings,
  writeOtpSettings,
} from "@/lib/otp-server";
import { actorSummary, appendAudit } from "@/lib/workflow-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE });
  }
  if (!adminCan(session, "otp.manage")) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403, headers: NO_STORE }
    );
  }
  try {
    const [settings, schemaReady] = await Promise.all([
      readOtpSettings(),
      otpSchemaReady(),
    ]);
    return NextResponse.json(
      { ok: true, settings, providers: otpProviderStatuses(), schemaReady },
      { headers: NO_STORE }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "otp_unavailable" },
      { status: 503, headers: NO_STORE }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE });
  }
  if (!adminCan(session, "otp.manage")) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403, headers: NO_STORE }
    );
  }
  let body: { settings?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad_request" },
      { status: 400, headers: NO_STORE }
    );
  }
  try {
    const settings = await writeOtpSettings(body.settings, session.sub);
    await appendAudit({
      ...actorSummary(session),
      action: "otp.settings.update",
      category: "settings",
      details: "تحديث إعدادات وقنوات التحقق OTP",
      meta: {
        requiredForRegistration: settings.requiredForRegistration,
        email: settings.channels.email.enabled,
        sms: settings.channels.sms.enabled,
        whatsapp: settings.channels.whatsapp.enabled,
      },
    }).catch(() => undefined);
    return NextResponse.json(
      {
        ok: true,
        settings,
        providers: otpProviderStatuses(),
        schemaReady: await otpSchemaReady(),
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    if (error instanceof OtpError) {
      return NextResponse.json(
        { ok: false, error: error.code, message: error.message },
        { status: error.status, headers: NO_STORE }
      );
    }
    return NextResponse.json(
      { ok: false, error: "otp_unavailable" },
      { status: 503, headers: NO_STORE }
    );
  }
}
