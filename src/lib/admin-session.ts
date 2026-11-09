/**
 * جلسة الأدمن على السيرفر.
 *
 * الكوكي موقّع بـ HMAC-SHA256، ومفتاح التوقيع من متغيّر بيئة على السيرفر فقط
 * (`ADMIN_SESSION_SECRET`) — لا يصل لكود المتصفح إطلاقًا.
 *
 * الملف يعمل في Edge (middleware) وNode (route handlers) لأنه يعتمد على
 * Web Crypto فقط، بلا أي اعتماد على `node:crypto`.
 */

export const ADMIN_COOKIE = "aqaar_admin";

/** مدة الجلسة: 8 ساعات */
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

export type AdminRole =
  | "agent"
  | "moderator"
  | "reviewer"
  | "admin"
  | "super_admin";

export interface AdminTokenPayload {
  /** بريد الأدمن */
  sub: string;
  /** معرّف سجل الموظف؛ root لحساب متغيرات البيئة. */
  uid: string;
  name: string;
  role: AdminRole;
  /** تاريخ الانتهاء بالثواني (Unix) */
  exp: number;
}

const encoder = new TextEncoder();

function sessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function signingKey(): Promise<CryptoKey | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** إنشاء توكن جلسة أدمن موقّع */
export async function createAdminToken(
  payload: Omit<AdminTokenPayload, "exp"> & { exp?: number }
): Promise<string> {
  const key = await signingKey();
  if (!key) {
    throw new Error("ADMIN_SESSION_SECRET غير مضبوط على السيرفر");
  }

  const body: AdminTokenPayload = {
    ...payload,
    exp: payload.exp ?? Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE,
  };
  const encoded = toBase64Url(encoder.encode(JSON.stringify(body)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(encoded)
  );

  return `${encoded}.${toBase64Url(new Uint8Array(signature))}`;
}

/** التحقق من توكن الجلسة — يرجع null لأي توكن تالف أو منتهي */
export async function verifyAdminToken(
  token: string | null | undefined
): Promise<AdminTokenPayload | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  const key = await signingKey();
  if (!key) return null;

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(parts[1]),
      encoder.encode(parts[0])
    );
    if (!valid) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(parts[0]))
    ) as Partial<AdminTokenPayload>;

    if (!payload || typeof payload.sub !== "string" || !payload.sub) return null;
    if (
      payload.role !== "agent" &&
      payload.role !== "moderator" &&
      payload.role !== "reviewer" &&
      payload.role !== "admin" &&
      payload.role !== "super_admin"
    ) return null;
    if (typeof payload.exp !== "number") return null;
    if (payload.exp * 1000 <= Date.now()) return null;

    return {
      sub: payload.sub,
      uid:
        typeof payload.uid === "string" && payload.uid
          ? payload.uid
          : payload.role === "super_admin"
            ? "root"
            : payload.sub,
      name: typeof payload.name === "string" ? payload.name : "",
      role: payload.role,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
