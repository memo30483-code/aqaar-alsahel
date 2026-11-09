import { cookies } from "next/headers";
import { USER_COOKIE, verifyUserToken, type UserTokenPayload } from "@/lib/user-session";
import { normalizeEmail, readAccounts } from "@/lib/auth/accounts";

/** جلسة المستخدم الحالية داخل route handlers — تُقرأ من الكوكي الموقّع فقط */
export async function getUserApiSession(): Promise<UserTokenPayload | null> {
  const token = cookies().get(USER_COOKIE)?.value;
  const payload = await verifyUserToken(token);
  if (!payload) return null;
  try {
    const store = await readAccounts();
    const account = store.file.accounts.find((item) => item.id === payload.sub);
    if (
      !account ||
      account.status !== "approved" ||
      normalizeEmail(account.email) !== normalizeEmail(payload.email)
    ) return null;
    return payload;
  } catch {
    return null;
  }
}
