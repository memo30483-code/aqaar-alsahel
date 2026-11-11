/**
 * جلسة المستخدم العادي على السيرفر.
 *
 * حتى الآن كانت جلسة المستخدم محفوظة في `localStorage` فقط، وهو ما يصلح
 * للواجهة لكنه لا يصلح لربط طلب العقار بحساب صاحبه. هذا الملف يضيف كوكي
 * موقّعاً بـHMAC-SHA256 (httpOnly) بجانب الجلسة المحلية، بنفس أسلوب جلسة
 * الأدمن، ليعرف السيرفر هوية مقدّم الطلب دون الوثوق بأي بيانات من المتصفح.
 */

export const USER_COOKIE = "aqaar_user";

/** مدة جلسة المستخدم: 30 يوماً */
export const USER_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export interface UserTokenPayload {
  /** معرّف الحساب في aqaar-accounts */
  sub: string;
  email: string;
  name: string;
  kind: "user";
  /** نسخة الجلسة الحالية في الحساب؛ اختلافها يُبطل التوكن فورًا. */
  ver: number;
  /** تاريخ الانتهاء بالثواني (Unix) */
  exp: number;
}

const encoder = new TextEncoder();

function userSecret(): string {
  const dedicated = process.env.USER_SESSION_SECRET;
  if (dedicated && dedicated.trim()) return `user:${dedicated}`;
  const fallback = process.env.ADMIN_SESSION_SECRET;
  return fallback && fallback.trim() ? `user:${fallback}` : "";
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
  const secret = userSecret();
  if (!secret) return null;
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createUserToken(
  payload: Omit<UserTokenPayload, "exp" | "kind"> & { exp?: number }
): Promise<string> {
  const key = await signingKey();
  if (!key) {
    throw new Error("مفتاح جلسة المستخدم غير مضبوط على السيرفر");
  }

  const body: UserTokenPayload = {
    ...payload,
    kind: "user",
    exp: payload.exp ?? Math.floor(Date.now() / 1000) + USER_SESSION_MAX_AGE,
  };
  const encoded = toBase64Url(encoder.encode(JSON.stringify(body)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(encoded)
  );

  return `${encoded}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyUserToken(
  token: string | null | undefined
): Promise<UserTokenPayload | null> {
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
    ) as Partial<UserTokenPayload>;

    if (!payload || payload.kind !== "user") return null;
    if (typeof payload.sub !== "string" || !payload.sub) return null;
    if (typeof payload.email !== "string" || !payload.email) return null;
    if (
      typeof payload.ver !== "number" ||
      !Number.isSafeInteger(payload.ver) ||
      payload.ver < 1
    ) return null;
    if (typeof payload.exp !== "number") return null;
    if (payload.exp * 1000 <= Date.now()) return null;

    return {
      sub: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : "",
      kind: "user",
      ver: payload.ver,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
