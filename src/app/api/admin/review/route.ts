import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminActor, adminCan, getAdminApiSession } from "@/lib/admin-api";
import { LISTING_OVERRIDE_KEY } from "@/lib/admin-system";
import { cloudGetRows, cloudPutRow } from "@/lib/cloud/server";
import { updatePropertyRequest } from "@/lib/property-requests-server";
import {
  getReviewRecord,
  performReviewAction,
  readReviewStore,
  restoreReviewRecord,
  WorkflowActionError,
  type ReviewActionInput,
} from "@/lib/workflow-server";
import { REVIEW_SCOPES, type ReviewScope } from "@/lib/workflow";
import type { ServerStaffSession } from "@/lib/staff-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };
const PROFESSIONALS_KEY = "aqaar-professionals";

function scopeValue(value: unknown): ReviewScope | null {
  return typeof value === "string" && (REVIEW_SCOPES as string[]).includes(value)
    ? (value as ReviewScope)
    : null;
}

function canReadScope(
  session: ServerStaffSession,
  scope: ReviewScope
): boolean {
  return (
    adminCan(session, `${scope}.review`) ||
    adminCan(session, `${scope}.publish`) ||
    adminCan(session, `${scope}.view`)
  );
}

export async function GET(request: Request) {
  const session = await getAdminApiSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE });
  const url = new URL(request.url);
  const scope = scopeValue(url.searchParams.get("scope"));
  const itemId = url.searchParams.get("itemId")?.trim() ?? "";
  if (!scope || !canReadScope(session, scope)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403, headers: NO_STORE });
  }
  try {
    if (itemId) {
      const record = await getReviewRecord(scope, itemId);
      return NextResponse.json({ ok: true, record }, { headers: NO_STORE });
    }
    const store = await readReviewStore();
    const records = Object.values(store.records).filter((item) => item.scope === scope);
    return NextResponse.json({ ok: true, records }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "server_error" },
      { status: 500, headers: NO_STORE }
    );
  }
}

async function applyPublicDecision(
  input: ReviewActionInput,
  actor: string
): Promise<void> {
  if (
    input.action !== "approve" &&
    input.action !== "reject" &&
    input.action !== "return" &&
    input.action !== "reopen"
  ) return;
  const status = input.action === "approve" ? "approved" : input.action === "reject" ? "rejected" : "pending";
  if (input.scope === "listings") {
    const rows = await cloudGetRows({ keys: [LISTING_OVERRIDE_KEY] });
    const raw = rows.find((row) => row.key === LISTING_OVERRIDE_KEY)?.value;
    const overrides = raw && typeof raw === "object" && !Array.isArray(raw)
      ? { ...(raw as Record<string, unknown>) }
      : {};
    const current = overrides[input.itemId];
    overrides[input.itemId] = {
      ...(current && typeof current === "object" && !Array.isArray(current)
        ? (current as Record<string, unknown>)
        : {}),
      status,
      ...(input.action === "approve"
        ? { approvedBy: actor, approvedAt: new Date().toISOString() }
        : {}),
    };
    await cloudPutRow(LISTING_OVERRIDE_KEY, overrides, actor);
  } else if (input.scope === "propertyRequests") {
    await updatePropertyRequest(
      input.itemId,
      { published: input.action === "approve" },
      actor
    );
  } else {
    const rows = await cloudGetRows({ keys: [PROFESSIONALS_KEY] });
    const raw = rows.find((row) => row.key === PROFESSIONALS_KEY)?.value;
    const professionals = Array.isArray(raw) ? raw : [];
    let found = false;
    const next = professionals.map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return entry;
      const item = entry as Record<string, unknown>;
      if (item.id !== input.itemId) return item;
      found = true;
      return {
        ...item,
        status,
        reviewedAt: new Date().toISOString(),
        reviewNote: typeof input.decisionNote === "string" ? input.decisionNote.slice(0, 2000) : item.reviewNote,
      };
    });
    if (!found) throw new Error("NOT_FOUND");
    await cloudPutRow(PROFESSIONALS_KEY, next, actor);
  }
  try {
    revalidatePath("/", "layout");
  } catch {
    // لا شيء
  }
}

export async function POST(request: Request) {
  const session = await getAdminApiSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE });
  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400, headers: NO_STORE });
  }
  const scope = scopeValue(raw.scope);
  const itemId = typeof raw.itemId === "string" ? raw.itemId.trim().slice(0, 160) : "";
  const action = raw.action;
  if (
    !scope ||
    !itemId ||
    (action !== "start" &&
      action !== "assign" &&
      action !== "submit" &&
      action !== "approve" &&
      action !== "reject" &&
      action !== "return" &&
      action !== "reopen")
  ) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400, headers: NO_STORE });
  }
  const input: ReviewActionInput = {
    scope,
    itemId,
    action,
    ...(typeof raw.assignedTo === "string" ? { assignedTo: raw.assignedTo.slice(0, 160) } : {}),
    ...(typeof raw.assignedToName === "string" ? { assignedToName: raw.assignedToName.slice(0, 160) } : {}),
    ...(typeof raw.notes === "string" ? { notes: raw.notes } : {}),
    ...(typeof raw.decisionNote === "string" ? { decisionNote: raw.decisionNote } : {}),
    ...(Array.isArray(raw.documents) ? { documents: raw.documents as ReviewActionInput["documents"] } : {}),
    ...(typeof raw.expectedVersion === "number" ? { expectedVersion: raw.expectedVersion } : {}),
  };
  try {
    const previous = await getReviewRecord(scope, itemId);
    const record = await performReviewAction(session, input);
    try {
      await applyPublicDecision(input, adminActor(session));
    } catch (publishError) {
      await restoreReviewRecord(previous, session.sub).catch(() => undefined);
      throw publishError;
    }
    return NextResponse.json({ ok: true, record }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof WorkflowActionError) {
      return NextResponse.json(
        { ok: false, error: error.code, message: error.message },
        { status: error.status, headers: NO_STORE }
      );
    }
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "server_error" },
      { status: 500, headers: NO_STORE }
    );
  }
}
