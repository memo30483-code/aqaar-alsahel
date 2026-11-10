import { NextResponse } from "next/server";
import {
  createOtpProofToken,
  OTP_PROOF_COOKIE,
  OTP_PROOF_MAX_AGE,
  OtpError,
  verifyOtpChallenge,
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
    challengeId?: unknown;
    code?: unknown;
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
  try {
    const proof = await verifyOtpChallenge({
      challengeId:
        typeof body.challengeId === "string" ? body.challengeId : "",
      code: typeof body.code === "string" ? body.code : "",
      email: typeof body.email === "string" ? body.email : "",
      phone: typeof body.phone === "string" ? body.phone : "",
    });
    const response = NextResponse.json(
      { ok: true, verified: true, channel: proof.channel },
      { headers: NO_STORE }
    );
    response.cookies.set(OTP_PROOF_COOKIE, createOtpProofToken(proof), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: OTP_PROOF_MAX_AGE,
    });
    return response;
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
