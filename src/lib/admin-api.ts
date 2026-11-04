import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  verifyAdminToken,
  type AdminTokenPayload,
} from "@/lib/admin-session";

/** مصدر الحقيقة الوحيد لحماية Route Handlers الإدارية. */
export async function getAdminApiSession(): Promise<AdminTokenPayload | null> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  return verifyAdminToken(token);
}

export function adminActor(session: AdminTokenPayload): string {
  return session.name.trim() || session.sub;
}
