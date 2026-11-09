/**
 * حسابات طاقم الإدارة — طبقة سيرفر فقط.
 *
 * البيانات العامة للموظف منفصلة عن بصمة كلمة المرور ورمز الدعوة. لا يجوز
 * استيراد هذا الملف داخل أي مكوّن عميل أو إعادة محتوى `aqaar-staff-auth`.
 */

import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  ADMIN_USERS_KEY,
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS_KEY,
  type AdminPermissionSet,
  type AdminUser,
} from "@/lib/admin-system";
import type { AdminRole, AdminTokenPayload } from "@/lib/admin-session";
import {
  burnPasswordCheck,
  hashPassword,
  normalizeEmail,
  verifyPassword,
} from "@/lib/auth/accounts";
import { cloudGetRows, cloudPutRow } from "@/lib/cloud/server";
import { isDelegationActive, normalizeWorkflowSettings } from "@/lib/workflow";

export const STAFF_AUTH_KEY = "aqaar-staff-auth";
const STAFF_AUTH_VERSION = 1;
const INVITE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type StaffRole = Exclude<AdminRole, "super_admin">;

interface StaffAuthRecord {
  staffId: string;
  emailNormalized: string;
  salt?: string;
  hash?: string;
  inviteHash?: string;
  inviteExpiresAt?: string;
  passwordUpdatedAt?: string;
  lastLoginAt?: string;
}

interface StaffAuthFile {
  version: number;
  records: StaffAuthRecord[];
}

export interface ServerStaffSession extends AdminTokenPayload {
  permissions: string[];
}

export interface StaffInviteResult {
  user: AdminUser;
  code: string;
}

const PERMISSION_KEYS = new Set(ALL_PERMISSIONS.map((item) => item.key));

function text(value: unknown, max = 200): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function isStaffRoleValue(value: unknown): value is StaffRole {
  return (
    value === "agent" ||
    value === "moderator" ||
    value === "reviewer" ||
    value === "admin"
  );
}

function normalizeUser(value: unknown): AdminUser | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const id = text(item.id, 160);
  const email = text(item.email, 254);
  if (!id || !email || !isStaffRoleValue(item.role)) return null;
  const active = item.active === true;
  const status =
    item.status === "invited" ||
    item.status === "active" ||
    item.status === "suspended"
      ? item.status
      : active
        ? "active"
        : "suspended";
  return {
    id,
    name: text(item.name, 160),
    email,
    phone: text(item.phone, 40),
    role: item.role,
    active: status === "active" && active,
    status,
    joinedAt: text(item.joinedAt, 40) || new Date().toISOString(),
    ...(text(item.lastLoginAt, 40)
      ? { lastLoginAt: text(item.lastLoginAt, 40) }
      : {}),
    ...(text(item.inviteExpiresAt, 40)
      ? { inviteExpiresAt: text(item.inviteExpiresAt, 40) }
      : {}),
  };
}

function normalizeUsers(value: unknown): AdminUser[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const users: AdminUser[] = [];
  for (const raw of value) {
    const user = normalizeUser(raw);
    if (!user || seen.has(user.id)) continue;
    seen.add(user.id);
    users.push(user);
  }
  return users;
}

function normalizeAuth(value: unknown): StaffAuthFile {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const records: StaffAuthRecord[] = [];
  const rawRecords = Array.isArray(source.records) ? source.records : [];
  for (const raw of rawRecords) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const item = raw as Record<string, unknown>;
    const staffId = text(item.staffId, 160);
    const emailNormalized = normalizeEmail(text(item.emailNormalized, 254));
    if (!staffId || !emailNormalized) continue;
    records.push({
      staffId,
      emailNormalized,
      ...(text(item.salt, 256) ? { salt: text(item.salt, 256) } : {}),
      ...(text(item.hash, 512) ? { hash: text(item.hash, 512) } : {}),
      ...(text(item.inviteHash, 128)
        ? { inviteHash: text(item.inviteHash, 128) }
        : {}),
      ...(text(item.inviteExpiresAt, 40)
        ? { inviteExpiresAt: text(item.inviteExpiresAt, 40) }
        : {}),
      ...(text(item.passwordUpdatedAt, 40)
        ? { passwordUpdatedAt: text(item.passwordUpdatedAt, 40) }
        : {}),
      ...(text(item.lastLoginAt, 40)
        ? { lastLoginAt: text(item.lastLoginAt, 40) }
        : {}),
    });
  }
  return { version: STAFF_AUTH_VERSION, records };
}

function normalizePermissionSets(value: unknown): AdminPermissionSet[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const item = raw as Record<string, unknown>;
    const adminId = text(item.adminId, 160);
    if (!adminId) return [];
    const clean = (candidate: unknown) =>
      Array.isArray(candidate)
        ? Array.from(
            new Set(
              candidate.filter(
                (key): key is string =>
                  typeof key === "string" && PERMISSION_KEYS.has(key)
              )
            )
          )
        : [];
    return [
      {
        adminId,
        permissions: clean(item.permissions),
        revoked: clean(item.revoked),
        updatedAt: text(item.updatedAt, 40) || new Date(0).toISOString(),
        updatedBy: text(item.updatedBy, 160) || "system",
      },
    ];
  });
}

async function readStaffData(): Promise<{
  users: AdminUser[];
  auth: StaffAuthFile;
  permissionSets: AdminPermissionSet[];
}> {
  const rows = await cloudGetRows({
    keys: [ADMIN_USERS_KEY, STAFF_AUTH_KEY, PERMISSIONS_KEY],
    timeoutMs: 8_000,
  });
  const value = (key: string) => rows.find((row) => row.key === key)?.value;
  const auth = normalizeAuth(value(STAFF_AUTH_KEY));
  const users = normalizeUsers(value(ADMIN_USERS_KEY)).map((user) => {
    const credentials = auth.records.find((item) => item.staffId === user.id);
    if (credentials?.salt && credentials.hash) return user;
    return {
      ...user,
      active: false,
      status: "invited" as const,
      inviteExpiresAt: credentials?.inviteExpiresAt,
    };
  });
  return {
    users,
    auth,
    permissionSets: normalizePermissionSets(value(PERMISSIONS_KEY)),
  };
}

export async function readStaffUsers(): Promise<AdminUser[]> {
  return (await readStaffData()).users;
}

export function effectivePermissions(
  role: AdminRole,
  staffId: string,
  permissionSets: AdminPermissionSet[]
): string[] {
  if (role === "super_admin") return ALL_PERMISSIONS.map((item) => item.key);
  const custom = permissionSets.find((item) => item.adminId === staffId);
  const defaults = DEFAULT_ROLE_PERMISSIONS[role] ?? [];
  const revoked = new Set(custom?.revoked ?? []);
  return Array.from(new Set([...defaults, ...(custom?.permissions ?? [])])).filter(
    (key) => PERMISSION_KEYS.has(key) && !revoked.has(key)
  );
}

/** يعيد جلسة الطاقم بعد فحص أن الحساب لم يُوقف منذ إصدار الكوكي. */
export async function resolveStaffSession(
  token: AdminTokenPayload
): Promise<ServerStaffSession | null> {
  if (token.role === "super_admin") {
    return {
      ...token,
      uid: "root",
      permissions: ALL_PERMISSIONS.map((item) => item.key),
    };
  }
  const data = await readStaffData();
  const user = data.users.find((item) => item.id === token.uid);
  if (
    !user ||
    !user.active ||
    user.status !== "active" ||
    user.role !== token.role ||
    normalizeEmail(user.email) !== normalizeEmail(token.sub)
  ) {
    return null;
  }
  let permissions = effectivePermissions(user.role, user.id, data.permissionSets);
  try {
    const rows = await cloudGetRows({ keys: ["aqaar-workflow-settings"] });
    const workflow = normalizeWorkflowSettings(rows[0]?.value);
    const delegated = workflow.delegations
      .filter((item) => item.staffId === user.id && isDelegationActive(item))
      .flatMap((item) =>
        item.action === "approve_member"
          ? ["members.view", "members.approve"]
          : [
              `${item.scope}.view`,
              `${item.scope}.${item.action === "publish" ? "publish" : "review"}`,
            ]
      );
    permissions = Array.from(new Set([...permissions, ...delegated]));
  } catch {
    /* الصلاحيات الأساسية تستمر؛ التفويض لا يُفعّل إذا تعذرت قراءة السياسة. */
  }
  return {
    ...token,
    name: user.name,
    sub: user.email,
    permissions,
  };
}

export function sessionCan(
  session: Pick<ServerStaffSession, "role" | "permissions">,
  permission: string
): boolean {
  return (
    session.role === "super_admin" ||
    session.permissions.includes(permission)
  );
}

function inviteDigest(code: string): string {
  return createHash("sha256").update(`aqaar-staff:${code}`).digest("hex");
}

function createInviteCode(): string {
  return randomBytes(24).toString("base64url");
}

export async function createStaffInvite(
  input: { name: string; email: string; phone?: string; role: StaffRole },
  actor: string
): Promise<StaffInviteResult> {
  const data = await readStaffData();
  const emailNormalized = normalizeEmail(input.email);
  if (!emailNormalized) throw new Error("INVALID_EMAIL");
  if (
    data.users.some((item) => normalizeEmail(item.email) === emailNormalized) ||
    data.auth.records.some((item) => item.emailNormalized === emailNormalized)
  ) {
    throw new Error("EMAIL_EXISTS");
  }
  const now = new Date();
  const expiresAt = new Date(now.getTime() + INVITE_MAX_AGE_MS).toISOString();
  const code = createInviteCode();
  const user: AdminUser = {
    id: randomUUID(),
    name: text(input.name, 160),
    email: text(input.email, 254),
    phone: text(input.phone, 40),
    role: input.role,
    active: false,
    status: "invited",
    joinedAt: now.toISOString(),
    inviteExpiresAt: expiresAt,
  };
  data.users.push(user);
  data.auth.records.push({
    staffId: user.id,
    emailNormalized,
    inviteHash: inviteDigest(code),
    inviteExpiresAt: expiresAt,
  });
  await cloudPutRow(ADMIN_USERS_KEY, data.users, actor);
  await cloudPutRow(STAFF_AUTH_KEY, data.auth, actor);
  return { user, code };
}

export async function renewStaffInvite(
  staffId: string,
  actor: string
): Promise<StaffInviteResult> {
  const data = await readStaffData();
  const index = data.users.findIndex((item) => item.id === staffId);
  if (index < 0) throw new Error("NOT_FOUND");
  const user = data.users[index];
  const code = createInviteCode();
  const expiresAt = new Date(Date.now() + INVITE_MAX_AGE_MS).toISOString();
  data.users[index] = {
    ...user,
    active: false,
    status: "invited",
    inviteExpiresAt: expiresAt,
  };
  const authIndex = data.auth.records.findIndex((item) => item.staffId === staffId);
  const authRecord: StaffAuthRecord = {
    staffId,
    emailNormalized: normalizeEmail(user.email),
    inviteHash: inviteDigest(code),
    inviteExpiresAt: expiresAt,
  };
  if (authIndex >= 0) data.auth.records[authIndex] = authRecord;
  else data.auth.records.push(authRecord);
  await cloudPutRow(ADMIN_USERS_KEY, data.users, actor);
  await cloudPutRow(STAFF_AUTH_KEY, data.auth, actor);
  return { user: data.users[index], code };
}

export async function inspectStaffInvite(code: string): Promise<{
  valid: boolean;
  name?: string;
  email?: string;
  expiresAt?: string;
}> {
  if (!code || code.length > 200) return { valid: false };
  const data = await readStaffData();
  const auth = data.auth.records.find(
    (item) => item.inviteHash === inviteDigest(code)
  );
  if (!auth || !auth.inviteExpiresAt || Date.parse(auth.inviteExpiresAt) <= Date.now()) {
    return { valid: false };
  }
  const user = data.users.find((item) => item.id === auth.staffId);
  if (!user || user.status !== "invited") return { valid: false };
  return {
    valid: true,
    name: user.name,
    email: user.email,
    expiresAt: auth.inviteExpiresAt,
  };
}

export async function acceptStaffInvite(
  code: string,
  password: string
): Promise<AdminUser> {
  if (password.length < 10 || password.length > 200) {
    throw new Error("INVALID_PASSWORD");
  }
  const data = await readStaffData();
  const digest = inviteDigest(code);
  const authIndex = data.auth.records.findIndex(
    (item) => item.inviteHash === digest
  );
  if (authIndex < 0) throw new Error("INVALID_INVITE");
  const auth = data.auth.records[authIndex];
  if (!auth.inviteExpiresAt || Date.parse(auth.inviteExpiresAt) <= Date.now()) {
    throw new Error("INVITE_EXPIRED");
  }
  const userIndex = data.users.findIndex((item) => item.id === auth.staffId);
  if (userIndex < 0 || data.users[userIndex].status !== "invited") {
    throw new Error("INVALID_INVITE");
  }
  const now = new Date().toISOString();
  const passwordData = await hashPassword(password);
  data.auth.records[authIndex] = {
    staffId: auth.staffId,
    emailNormalized: auth.emailNormalized,
    salt: passwordData.salt,
    hash: passwordData.hash,
    passwordUpdatedAt: now,
  };
  data.users[userIndex] = {
    ...data.users[userIndex],
    active: true,
    status: "active",
    inviteExpiresAt: undefined,
  };
  await cloudPutRow(STAFF_AUTH_KEY, data.auth, data.users[userIndex].email);
  await cloudPutRow(ADMIN_USERS_KEY, data.users, data.users[userIndex].email);
  return data.users[userIndex];
}

export async function authenticateStaff(
  email: string,
  password: string
): Promise<AdminUser | null> {
  const data = await readStaffData();
  const normalized = normalizeEmail(email);
  const auth = data.auth.records.find(
    (item) => item.emailNormalized === normalized
  );
  if (!auth?.salt || !auth.hash) {
    await burnPasswordCheck(password);
    return null;
  }
  const userIndex = data.users.findIndex((item) => item.id === auth.staffId);
  if (userIndex < 0) {
    await verifyPassword(password, auth.salt, auth.hash);
    return null;
  }
  const user = data.users[userIndex];
  const valid = await verifyPassword(password, auth.salt, auth.hash);
  if (!valid || !user.active || user.status !== "active") return null;
  const now = new Date().toISOString();
  data.users[userIndex] = { ...user, lastLoginAt: now };
  const authIndex = data.auth.records.findIndex((item) => item.staffId === user.id);
  data.auth.records[authIndex] = { ...auth, lastLoginAt: now };
  await Promise.all([
    cloudPutRow(ADMIN_USERS_KEY, data.users, user.email),
    cloudPutRow(STAFF_AUTH_KEY, data.auth, user.email),
  ]);
  return data.users[userIndex];
}

export async function updateStaffUser(
  staffId: string,
  patch: { name?: string; phone?: string; role?: StaffRole; status?: "active" | "suspended" },
  actor: string
): Promise<AdminUser> {
  const data = await readStaffData();
  const index = data.users.findIndex((item) => item.id === staffId);
  if (index < 0) throw new Error("NOT_FOUND");
  const current = data.users[index];
  const status = patch.status ?? current.status ?? (current.active ? "active" : "suspended");
  if (status === "active") {
    const auth = data.auth.records.find((item) => item.staffId === staffId);
    if (!auth?.salt || !auth.hash) throw new Error("INVITE_NOT_ACCEPTED");
  }
  const next: AdminUser = {
    ...current,
    ...(patch.name !== undefined ? { name: text(patch.name, 160) } : {}),
    ...(patch.phone !== undefined ? { phone: text(patch.phone, 40) } : {}),
    ...(patch.role !== undefined ? { role: patch.role } : {}),
    status,
    active: status === "active",
  };
  data.users[index] = next;
  await cloudPutRow(ADMIN_USERS_KEY, data.users, actor);
  return next;
}

export async function deleteStaffUser(staffId: string, actor: string): Promise<void> {
  const data = await readStaffData();
  if (!data.users.some((item) => item.id === staffId)) throw new Error("NOT_FOUND");
  data.users = data.users.filter((item) => item.id !== staffId);
  data.auth.records = data.auth.records.filter((item) => item.staffId !== staffId);
  data.permissionSets = data.permissionSets.filter((item) => item.adminId !== staffId);
  await Promise.all([
    cloudPutRow(ADMIN_USERS_KEY, data.users, actor),
    cloudPutRow(STAFF_AUTH_KEY, data.auth, actor),
    cloudPutRow(PERMISSIONS_KEY, data.permissionSets, actor),
  ]);
}

export async function saveStaffPermissions(
  staffId: string,
  permissions: string[],
  revoked: string[],
  actor: string
): Promise<AdminPermissionSet> {
  const data = await readStaffData();
  if (!data.users.some((item) => item.id === staffId)) throw new Error("NOT_FOUND");
  const clean = (values: string[]) =>
    Array.from(new Set(values.filter((key) => PERMISSION_KEYS.has(key))));
  const entry: AdminPermissionSet = {
    adminId: staffId,
    permissions: clean(permissions),
    revoked: clean(revoked),
    updatedAt: new Date().toISOString(),
    updatedBy: actor,
  };
  const index = data.permissionSets.findIndex((item) => item.adminId === staffId);
  if (index >= 0) data.permissionSets[index] = entry;
  else data.permissionSets.push(entry);
  await cloudPutRow(PERMISSIONS_KEY, data.permissionSets, actor);
  return entry;
}

export async function readStaffPermissions(): Promise<AdminPermissionSet[]> {
  return (await readStaffData()).permissionSets;
}
