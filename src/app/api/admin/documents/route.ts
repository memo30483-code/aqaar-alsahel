import { NextResponse } from "next/server";
import { cloudDownloadDocument } from "@/lib/cloud/server";
import { adminCan, getAdminApiSession } from "@/lib/admin-api";
import { actorSummary, appendAudit } from "@/lib/workflow-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  if (!adminCan(session, "documents.view")) {
    return NextResponse.json({ error: "لا تملك صلاحية عرض المستندات" }, { status: 403 });
  }

  const url = new URL(request.url);
  const path = url.searchParams.get("path") ?? "";
  const requestedName = url.searchParams.get("name") ?? "document";
  if (
    !path.startsWith("property-submissions/") ||
    path.includes("..") ||
    !/^[a-zA-Z0-9_./-]+$/.test(path)
  ) {
    return NextResponse.json({ error: "مسار غير صالح" }, { status: 400 });
  }

  const name = requestedName.replace(/[^a-zA-Z0-9._\u0600-\u06ff -]/g, "_").slice(0, 180);
  try {
    const document = await cloudDownloadDocument(path);
    await appendAudit({
      ...actorSummary(session),
      action: "document.view",
      category: "documents",
      details: `عرض مستند خاص: ${name || "document"}`,
      meta: { path },
    }).catch(() => undefined);
    return new NextResponse(document.bytes, {
      headers: {
        "Content-Type": document.contentType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(name || "document")}`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "المستند غير متاح" },
      { status: 404 }
    );
  }
}
