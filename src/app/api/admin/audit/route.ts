import { NextResponse } from "next/server";
import { adminCan, getAdminApiSession } from "@/lib/admin-api";
import { readAuditLog } from "@/lib/workflow-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const session = await getAdminApiSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE });
  if (!adminCan(session, "logs.view")) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403, headers: NO_STORE });
  }
  const requested = Number(new URL(request.url).searchParams.get("limit") ?? 300);
  try {
    const rawLogs = await readAuditLog(Number.isFinite(requested) ? requested : 300);
    const logs = adminCan(session, "documents.view")
      ? rawLogs
      : rawLogs.map((entry) =>
          entry.category === "documents"
            ? { ...entry, details: "تم عرض مستند خاص", meta: undefined }
            : entry
        );
    return NextResponse.json({ ok: true, logs }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "server_error" },
      { status: 500, headers: NO_STORE }
    );
  }
}
