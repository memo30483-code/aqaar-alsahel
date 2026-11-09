import { NextResponse } from "next/server";
import { adminCan, getAdminApiSession } from "@/lib/admin-api";
import {
  createStaffInvite,
  deleteStaffUser,
  isStaffRoleValue,
  readStaffPermissions,
  readStaffUsers,
  renewStaffInvite,
  saveStaffPermissions,
  updateStaffUser,
} from "@/lib/staff-server";
import { actorSummary, appendAudit } from "@/lib/workflow-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function forbidden() {
  return NextResponse.json(
    { ok: false, error: "غير مصرح" },
    { status: 403, headers: NO_STORE }
  );
}

export async function GET() {
  const session = await getAdminApiSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE });
  if (
    !adminCan(session, "users.view") &&
    !adminCan(session, "review.assign") &&
    !adminCan(session, "workflow.manage")
  ) return forbidden();
  try {
    const [users, permissionSets] = await Promise.all([
      readStaffUsers(),
      adminCan(session, "users.roles") ? readStaffPermissions() : Promise.resolve([]),
    ]);
    const visibleUsers = adminCan(session, "users.view")
      ? users
      : users.filter((item) => item.active).map((item) => ({
          id: item.id,
          name: item.name,
          email: "",
          phone: "",
          role: item.role,
          active: item.active,
          status: item.status,
          joinedAt: item.joinedAt,
        }));
    return NextResponse.json({ ok: true, users: visibleUsers, permissionSets }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "server_error" },
      { status: 500, headers: NO_STORE }
    );
  }
}

export async function POST(request: Request) {
  const session = await getAdminApiSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE });
  if (!adminCan(session, "users.manage")) return forbidden();
  let body: { name?: unknown; email?: unknown; phone?: unknown; role?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400, headers: NO_STORE });
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const role = body.role;
  if (name.length < 2 || !EMAIL_RE.test(email) || !isStaffRoleValue(role)) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400, headers: NO_STORE });
  }
  if (!adminCan(session, "users.roles") && role !== "reviewer") return forbidden();
  try {
    const result = await createStaffInvite({ name, email, phone, role }, session.sub);
    const inviteUrl = `${new URL(request.url).origin}/admin/join?code=${encodeURIComponent(result.code)}`;
    await appendAudit({
      ...actorSummary(session),
      action: "staff.invite",
      category: "staff",
      itemId: result.user.id,
      details: `إنشاء دعوة للموظف ${result.user.name}`,
      meta: { role: result.user.role },
    }).catch(() => undefined);
    return NextResponse.json(
      { ok: true, user: result.user, inviteUrl, code: result.code },
      { status: 201, headers: NO_STORE }
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "SERVER_ERROR";
    return NextResponse.json(
      { ok: false, error: code.toLowerCase() },
      { status: code === "EMAIL_EXISTS" ? 409 : 500, headers: NO_STORE }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getAdminApiSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE });
  if (!adminCan(session, "users.manage")) return forbidden();
  let body: {
    id?: unknown;
    operation?: unknown;
    name?: unknown;
    phone?: unknown;
    role?: unknown;
    status?: unknown;
    permissions?: unknown;
    revoked?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400, headers: NO_STORE });
  }
  const id = typeof body.id === "string" ? body.id : "";
  if (!id || (id === session.uid && body.operation !== "permissions")) {
    return NextResponse.json({ ok: false, error: "invalid_target" }, { status: 400, headers: NO_STORE });
  }
  try {
    if (body.operation === "invite") {
      const result = await renewStaffInvite(id, session.sub);
      const inviteUrl = `${new URL(request.url).origin}/admin/join?code=${encodeURIComponent(result.code)}`;
      await appendAudit({
        ...actorSummary(session),
        action: "staff.invite.renew",
        category: "staff",
        itemId: id,
        details: `إعادة إصدار دعوة للموظف ${result.user.name}`,
      }).catch(() => undefined);
      return NextResponse.json({ ok: true, user: result.user, inviteUrl, code: result.code }, { headers: NO_STORE });
    }
    if (body.operation === "permissions") {
      if (!adminCan(session, "users.roles")) return forbidden();
      const permissions = Array.isArray(body.permissions)
        ? body.permissions.filter((item): item is string => typeof item === "string")
        : [];
      const revoked = Array.isArray(body.revoked)
        ? body.revoked.filter((item): item is string => typeof item === "string")
        : [];
      const entry = await saveStaffPermissions(id, permissions, revoked, session.sub);
      await appendAudit({
        ...actorSummary(session),
        action: "staff.permissions.update",
        category: "staff",
        itemId: id,
        details: "تحديث صلاحيات الموظف",
      }).catch(() => undefined);
      return NextResponse.json({ ok: true, permissionSet: entry }, { headers: NO_STORE });
    }
    const role = body.role === undefined ? undefined : body.role;
    if (role !== undefined && (!isStaffRoleValue(role) || !adminCan(session, "users.roles"))) {
      return forbidden();
    }
    const status = body.status === "active" || body.status === "suspended" ? body.status : undefined;
    const user = await updateStaffUser(
      id,
      {
        ...(typeof body.name === "string" ? { name: body.name } : {}),
        ...(typeof body.phone === "string" ? { phone: body.phone } : {}),
        ...(role !== undefined && isStaffRoleValue(role) ? { role } : {}),
        ...(status ? { status } : {}),
      },
      session.sub
    );
    await appendAudit({
      ...actorSummary(session),
      action: "staff.update",
      category: "staff",
      itemId: id,
      details: `تحديث حساب الموظف ${user.name}`,
      meta: { role: user.role, status: user.status },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, user }, { headers: NO_STORE });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SERVER_ERROR";
    return NextResponse.json(
      { ok: false, error: code.toLowerCase() },
      { status: code === "NOT_FOUND" ? 404 : 500, headers: NO_STORE }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getAdminApiSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401, headers: NO_STORE });
  if (!adminCan(session, "users.manage")) return forbidden();
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id || id === session.uid) {
    return NextResponse.json({ ok: false, error: "invalid_target" }, { status: 400, headers: NO_STORE });
  }
  try {
    await deleteStaffUser(id, session.sub);
    await appendAudit({
      ...actorSummary(session),
      action: "staff.delete",
      category: "staff",
      itemId: id,
      details: "حذف حساب موظف",
    }).catch(() => undefined);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SERVER_ERROR";
    return NextResponse.json({ ok: false, error: code.toLowerCase() }, { status: code === "NOT_FOUND" ? 404 : 500, headers: NO_STORE });
  }
}
