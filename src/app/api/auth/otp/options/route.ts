import { NextResponse } from "next/server";
import { publicOtpOptions } from "@/lib/otp-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const options = await publicOtpOptions();
    return NextResponse.json(
      { ok: true, options },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "otp_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
