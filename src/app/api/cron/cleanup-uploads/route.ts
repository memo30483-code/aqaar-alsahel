import { NextResponse } from "next/server";
import { cleanupOrphanUploads } from "@/lib/upload-cleanup-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401, headers: NO_STORE }
    );
  }
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "cron_not_configured" },
      { status: 503, headers: NO_STORE }
    );
  }
  if (authorization !== `Bearer ${secret}`) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401, headers: NO_STORE }
    );
  }
  try {
    const result = await cleanupOrphanUploads(100);
    return NextResponse.json({ ok: true, ...result }, { headers: NO_STORE });
  } catch {
    return NextResponse.json(
      { ok: false, error: "cleanup_failed" },
      { status: 503, headers: NO_STORE }
    );
  }
}
