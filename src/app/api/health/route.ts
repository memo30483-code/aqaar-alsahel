import { NextResponse } from "next/server";
import { cloudEnabled, cloudGetRows, cloudRest } from "@/lib/cloud/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const startedAt = Date.now();
  if (!cloudEnabled()) {
    return NextResponse.json(
      { ok: false, status: "unconfigured" },
      { status: 503, headers: NO_STORE }
    );
  }

  const checks = await Promise.allSettled([
    cloudGetRows({ keys: ["aqaar-site-settings"], timeoutMs: 4_000 }),
    cloudRest<unknown[]>("inquiries?select=id&limit=1", { timeoutMs: 4_000 }),
    cloudRest<unknown[]>("rate_limits?select=key&limit=1", { timeoutMs: 4_000 }),
    cloudRest<unknown[]>("upload_staging?select=path&limit=1", {
      timeoutMs: 4_000,
    }),
  ]);
  const names = ["state", "inquiries", "rateLimits", "uploads"] as const;
  const components = Object.fromEntries(
    checks.map((check, index) => [names[index], check.status === "fulfilled"])
  );
  const ok = checks.every((check) => check.status === "fulfilled");

  return NextResponse.json(
    {
      ok,
      status: ok ? "healthy" : "degraded",
      components,
      latencyMs: Date.now() - startedAt,
    },
    { status: ok ? 200 : 503, headers: NO_STORE }
  );
}
