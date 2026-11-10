import { NextResponse } from "next/server";
import { isOtpChannel } from "@/lib/otp";
import {
  createOtpChallenge,
  OtpError,
  publicOtpOptions,
} from "@/lib/otp-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

function trustedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!trustedOrigin(request)) {
    return NextResponse.json(
      { ok: false, error: "origin_not_allowed" },
      { status: 403, headers: NO_STORE }
    );
  }
  let body: {
    channel?: unknown;
    email?: unknown;
    phone?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "bad_request" },
      { status: 400, headers: NO_STORE }
    );
  }
  if (!isOtpChannel(body.channel)) {
    return NextResponse.json(
      { ok: false, error: "invalid_channel" },
      { status: 400, headers: NO_STORE }
    );
  }
  try {
    const options = await publicOtpOptions();
    if (!options.required) {
      throw new OtpError(
        "otp_not_required",
        "التحقق OTP غير مفروض حاليًا",
        409
      );
    }
    const challenge = await createOtpChallenge({
      request,
      channel: body.channel,
      purpose: "registration",
      email: typeof body.email === "string" ? body.email : "",
      phone: typeof body.phone === "string" ? body.phone : "",
    });
    return NextResponse.json(
      { ok: true, challenge },
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
