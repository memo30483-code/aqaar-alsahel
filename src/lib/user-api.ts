import { cookies } from "next/headers";
import { USER_COOKIE, verifyUserToken, type UserTokenPayload } from "@/lib/user-session";

/** جلسة المستخدم الحالية داخل route handlers — تُقرأ من الكوكي الموقّع فقط */
export async function getUserApiSession(): Promise<UserTokenPayload | null> {
  const token = cookies().get(USER_COOKIE)?.value;
  return verifyUserToken(token);
}
