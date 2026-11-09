import { NextResponse } from "next/server";
import { adminCan, getAdminApiSession } from "@/lib/admin-api";
import { readAccounts } from "@/lib/auth/accounts";
import { readStaffUsers } from "@/lib/staff-server";
import { readReviewStore } from "@/lib/workflow-server";
import { REVIEW_SCOPES } from "@/lib/workflow";
import { cloudGetRows } from "@/lib/cloud/server";
import { listPropertyRequests } from "@/lib/property-requests-server";
import { reviewKey } from "@/lib/workflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const session = await getAdminApiSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE });
  try {
    const counts: Record<string, number> = {};
    const store = await readReviewStore();
    for (const scope of REVIEW_SCOPES) {
      if (
        !adminCan(session, `${scope}.view`) &&
        !adminCan(session, `${scope}.review`) &&
        !adminCan(session, `${scope}.publish`)
      ) continue;
      const records = Object.values(store.records).filter((item) => item.scope === scope);
      counts[`${scope}.review`] = records.filter((item) => item.stage === "new" || item.stage === "in_review" || item.stage === "returned").length;
      counts[`${scope}.approval`] = records.filter((item) => item.stage === "awaiting_admin").length;
    }
    const sourceRows = await cloudGetRows({
      keys: [
        "aqaar-properties",
        "aqaar-admin-listing-overrides-v2",
        "aqaar-professionals",
      ],
    });
    const value = (key: string) => sourceRows.find((row) => row.key === key)?.value;
    const overrides = value("aqaar-admin-listing-overrides-v2");
    const overrideMap =
      overrides && typeof overrides === "object" && !Array.isArray(overrides)
        ? (overrides as Record<string, Record<string, unknown>>)
        : {};
    if (adminCan(session, "listings.view")) {
      const properties = Array.isArray(value("aqaar-properties"))
        ? (value("aqaar-properties") as Array<Record<string, unknown>>)
        : [];
      counts["listings.review"] =
        (counts["listings.review"] ?? 0) +
        properties.filter((item) => {
          const id = typeof item.id === "string" ? item.id : "";
          return id &&
            !store.records[reviewKey("listings", id)] &&
            overrideMap[id]?.status !== "approved" &&
            overrideMap[id]?.status !== "rejected";
        }).length;
    }
    if (adminCan(session, "professionals.view")) {
      const professionals = Array.isArray(value("aqaar-professionals"))
        ? (value("aqaar-professionals") as Array<Record<string, unknown>>)
        : [];
      counts["professionals.review"] =
        (counts["professionals.review"] ?? 0) +
        professionals.filter((item) => {
          const id = typeof item.id === "string" ? item.id : "";
          return id && item.status === "pending" && !store.records[reviewKey("professionals", id)];
        }).length;
    }
    if (adminCan(session, "propertyRequests.view")) {
      const requests = await listPropertyRequests(1000);
      counts["propertyRequests.review"] =
        (counts["propertyRequests.review"] ?? 0) +
        requests.filter(
          (item) =>
            item.status === "new" &&
            !store.records[reviewKey("propertyRequests", item.id)]
        ).length;
    }
    if (adminCan(session, "members.view")) {
      const accounts = await readAccounts();
      counts.members = accounts.file.accounts.filter((item) => item.status === "pending").length;
    }
    if (adminCan(session, "users.view")) {
      const users = await readStaffUsers();
      counts.staffInvites = users.filter((item) => item.status === "invited").length;
    }
    return NextResponse.json({ ok: true, counts }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "server_error" },
      { status: 500, headers: NO_STORE }
    );
  }
}
