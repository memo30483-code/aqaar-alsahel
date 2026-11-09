/**
 * حسابات المستخدمين — طبقة السيرفر فقط.
 *
 * كلمات المرور لا تُخزَّن أبدًا كنص صريح: لكل حساب ملح عشوائي (salt) وبصمة
 * scrypt. الحسابات تُحفظ في مفتاح `aqaar-accounts` داخل `app_state`، وهو مفتاح
 * **خاص** (public: false) لا يُحقن في HTML ولا يُرجع لغير الأدمن.
 *
 * كل عمليات القراءة/الكتابة هنا تستخدم service_role على السيرفر فقط.
 */

import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cloudEnabled, cloudGetRows, cloudPutRow } from "@/lib/cloud/server";

const scrypt = promisify(scryptCallback);

export const ACCOUNTS_KEY = "aqaar-accounts";
export const ACCOUNTS_VERSION = 1;

export const ACCOUNT_TYPES = [
  "individual",
  "developer",
  "marketer",
  "lawyer",
  "engineer",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];
export type AccountRole = "user" | "agent";
export type MemberStatus = "pending" | "approved" | "rejected" | "suspended";

export interface AccountRecord {
  id: string;
  name: string;
  /** البريد كما كتبه المستخدم (للعرض) */
  email: string;
  /** البريد بحروف صغيرة للمطابقة — يمنع تكرار الحساب بحالات مختلفة */
  emailNormalized: string;
  phone: string;
  accountType: AccountType;
  role: AccountRole;
  /** رمز ملكية السجل المهني — لا يُرجع إلا بعد التحقق من كلمة المرور */
  ownerToken?: string;
  salt: string;
  hash: string;
  createdAt: string;
  status: MemberStatus;
  statusUpdatedAt?: string;
  statusUpdatedBy?: string;
  statusNote?: string;
}

interface AccountsFile {
  version: number;
  accounts: AccountRecord[];
}

/** بيانات الحساب الآمنة للإرجاع للمتصفح بعد نجاح الدخول */
export interface PublicAccount {
  name: string;
  email: string;
  phone: string;
  accountType: AccountType;
  role: AccountRole;
  status: MemberStatus;
  ownerToken?: string;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isAccountType(value: unknown): value is AccountType {
  return (
    typeof value === "string" &&
    (ACCOUNT_TYPES as readonly string[]).includes(value)
  );
}

function parseFile(value: unknown): AccountsFile {
  if (!value || typeof value !== "object") {
    return { version: ACCOUNTS_VERSION, accounts: [] };
  }
  const source = value as Record<string, unknown>;
  const rawAccounts = Array.isArray(source.accounts) ? source.accounts : [];
  const accounts: AccountRecord[] = [];

  for (const entry of rawAccounts) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const email = typeof item.email === "string" ? item.email : "";
    const emailNormalized =
      typeof item.emailNormalized === "string"
        ? item.emailNormalized
        : normalizeEmail(email);
    const salt = typeof item.salt === "string" ? item.salt : "";
    const hash = typeof item.hash === "string" ? item.hash : "";
    if (!emailNormalized || !salt || !hash) continue;
    accounts.push({
      id: typeof item.id === "string" && item.id ? item.id : randomUUID(),
      name: typeof item.name === "string" ? item.name : "",
      email,
      emailNormalized,
      phone: typeof item.phone === "string" ? item.phone : "",
      accountType: isAccountType(item.accountType) ? item.accountType : "individual",
      role: item.role === "agent" ? "agent" : "user",
      ownerToken: typeof item.ownerToken === "string" ? item.ownerToken : undefined,
      salt,
      hash,
      createdAt:
        typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
      status:
        item.status === "pending" ||
        item.status === "rejected" ||
        item.status === "suspended"
          ? item.status
          : "approved",
      statusUpdatedAt:
        typeof item.statusUpdatedAt === "string" ? item.statusUpdatedAt : undefined,
      statusUpdatedBy:
        typeof item.statusUpdatedBy === "string" ? item.statusUpdatedBy : undefined,
      statusNote:
        typeof item.statusNote === "string" ? item.statusNote.slice(0, 1000) : undefined,
    });
  }

  return { version: ACCOUNTS_VERSION, accounts };
}

export interface AccountStore {
  enabled: boolean;
  file: AccountsFile;
}

/** قراءة كل الحسابات — تُرجع enabled=false إذا لم تكن السحابة مضبوطة */
export async function readAccounts(): Promise<AccountStore> {
  if (!cloudEnabled()) {
    return { enabled: false, file: { version: ACCOUNTS_VERSION, accounts: [] } };
  }
  const rows = await cloudGetRows({ keys: [ACCOUNTS_KEY], timeoutMs: 8_000 });
  const row = rows.find((item) => item.key === ACCOUNTS_KEY);
  return { enabled: true, file: parseFile(row?.value) };
}

export async function writeAccounts(file: AccountsFile): Promise<void> {
  await cloudPutRow(ACCOUNTS_KEY, file, null);
}

/** إنشاء ملح + بصمة scrypt لكلمة المرور */
export async function hashPassword(
  password: string
): Promise<{ salt: string; hash: string }> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return { salt, hash: derived.toString("hex") };
}

/** مقارنة ثابتة الزمن بين كلمة المرور والبصمة المحفوظة */
export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  try {
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    const expected = Buffer.from(expectedHash, "hex");
    if (expected.length !== derived.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/**
 * حساب وهمي يُستخدم عند عدم وجود البريد، حتى يستغرق الرد نفس زمن الحساب
 * الحقيقي ولا يُستدل على وجود البريد من فرق التوقيت.
 */
export async function burnPasswordCheck(password: string): Promise<void> {
  try {
    const derived = (await scrypt(password, "aqaar-dummy-salt", 64)) as Buffer;
    derived.fill(0);
  } catch {
    /* لا شيء */
  }
}

export function toPublicAccount(record: AccountRecord): PublicAccount {
  return {
    name: record.name,
    email: record.email,
    phone: record.phone,
    accountType: record.accountType,
    role: record.role,
    status: record.status,
    ...(record.ownerToken ? { ownerToken: record.ownerToken } : {}),
  };
}

/** بيانات عضو آمنة للوحة الإدارة — بلا ملح أو بصمة كلمة المرور أو رمز الملكية. */
export interface AdminMemberAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountType: AccountType;
  role: AccountRole;
  status: MemberStatus;
  createdAt: string;
  statusUpdatedAt?: string;
  statusUpdatedBy?: string;
  statusNote?: string;
}

export function toAdminMember(record: AccountRecord): AdminMemberAccount {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone,
    accountType: record.accountType,
    role: record.role,
    status: record.status,
    createdAt: record.createdAt,
    statusUpdatedAt: record.statusUpdatedAt,
    statusUpdatedBy: record.statusUpdatedBy,
    statusNote: record.statusNote,
  };
}
