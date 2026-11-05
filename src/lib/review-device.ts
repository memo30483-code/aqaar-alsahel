import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

/**
 * هوية جهاز الزائر لمنع تكرار التقييم لنفس العنصر.
 *
 * الكوكي موقّع حتى لا يستطيع أحد تزوير هوية جهاز غيره. مسح الكوكي يسمح
 * بتقييم جديد، لذلك يبقى التحقق من الهاتف/CRM هو طبقة الثقة الحقيقية.
 */

export const REVIEW_DEVICE_COOKIE = "aqaar_review_device";
const MAX_AGE = 60 * 60 * 24 * 730;

function secret(): string {
  return (
    process.env.REVIEW_DEVICE_SECRET ??
    process.env.ADMIN_SESSION_SECRET ??
    ""
  );
}

function sign(value: string): string {
  return createHmac("sha256", `review:${secret()}`)
    .update(value)
    .digest("base64url");
}

function verify(value: string, signature: string): boolean {
  if (!secret()) return false;
  const expected = sign(value);
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  return left.length === right.length && timingSafeEqual(left, right);
}

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  return header.split(";").reduce<Record<string, string>>((acc, part) => {
    const index = part.indexOf("=");
    if (index === -1) return acc;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

/** يعيد هوية الجهاز إن كانت موجودة وموقّعة بشكل صحيح */
export function readReviewDevice(request: Request): string | null {
  const token = parseCookies(request.headers.get("cookie"))[REVIEW_DEVICE_COOKIE];
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return verify(id, signature) ? id : null;
}

/** ينشئ هوية جهاز جديدة ويعيد ترويسة الكوكي اللازمة لحفظها */
export function createReviewDevice(): { id: string; cookie: string } {
  const id = randomUUID();
  const token = `${id}.${sign(id)}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return {
    id,
    cookie: `${REVIEW_DEVICE_COOKIE}=${encodeURIComponent(
      token
    )}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; SameSite=Lax${secure}`,
  };
}
