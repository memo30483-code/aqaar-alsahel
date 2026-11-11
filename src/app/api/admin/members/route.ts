import { NextResponse } from "next/server";
import { adminCan, getAdminApiSession } from "@/lib/admin-api";
import {
  ACCOUNTS_VERSION,
  readAccounts,
  toAdminMember,
  writeAccounts,
  type MemberStatus,
} from "@/lib/auth/accounts";
import {
  actorSummary,
  appendAudit,
  canApproveMembers,
  readWorkflowSettings,
} from "@/lib/workflow-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const session = await getAdminApiSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE });
  if (!adminCan(session, "members.view")) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403, headers: NO_STORE });
  }
  try {
    const store = await readAccounts();
    const showContact = adminCan(session, "owner.contact.view");
    const members = store.file.accounts.map((record) => {
      const member = toAdminMember(record);
      if (showContact) return member;
      return {
        ...member,
        name: `عضو ${member.id.slice(0, 8)}`,
        email: "محجوب — يحتاج صلاحية بيانات مقدم الطلب",
        phone: "محجوب",
      };
    });
    return NextResponse.json({ ok: true, members }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "server_error" },
      { status: 500, headers: NO_STORE }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getAdminApiSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE });
  let body: {
    id?: unknown;
    status?: unknown;
    note?: unknown;
    action?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400, headers: NO_STORE });
  }
  const id = typeof body.id === "string" ? body.id : "";
  const revokeOnly = body.action === "revoke_sessions";
  const status: MemberStatus | null =
    body.status === "approved" ||
    body.status === "rejected" ||
    body.status === "suspended" ||
    body.status === "pending"
      ? body.status
      : null;
  if (!id || (!status && !revokeOnly)) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400, headers: NO_STORE });
  }
  try {
    const workflow = await readWorkflowSettings();
    if (!canApproveMembers(session, workflow)) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403, headers: NO_STORE });
    }
    const store = await readAccounts();
    const index = store.file.accounts.findIndex((item) => item.id === id);
    if (index < 0) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404, headers: NO_STORE });
    }
    const now = new Date().toISOString();
    const current = store.file.accounts[index];
    store.file.accounts[index] = {
      ...current,
      ...(status
        ? {
            status,
            statusUpdatedAt: now,
            statusUpdatedBy: session.name || session.sub,
            statusNote:
              typeof body.note === "string"
                ? body.note.trim().slice(0, 1000)
                : undefined,
          }
        : {}),
      /* أي تغيير إداري للحالة يبطل الكوكيز القديمة، حتى بعد إعادة التفعيل. */
      sessionVersion: current.sessionVersion + 1,
    };
    await writeAccounts({
      version: ACCOUNTS_VERSION,
      accounts: store.file.accounts,
    });
    await appendAudit({
      ...actorSummary(session),
      action: revokeOnly ? "member.sessions.revoke" : `member.${status}`,
      category: "members",
      scope: "members",
      itemId: id,
      details: revokeOnly
        ? "إبطال كل جلسات العضو"
        : `تغيير حالة العضو إلى ${status}`,
      meta: revokeOnly
        ? { sessionVersion: store.file.accounts[index].sessionVersion }
        : { from: current.status, to: status },
    });
    return NextResponse.json(
      { ok: true, member: toAdminMember(store.file.accounts[index]) },
      { headers: NO_STORE }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "server_error" },
      { status: 500, headers: NO_STORE }
    );
  }
}
