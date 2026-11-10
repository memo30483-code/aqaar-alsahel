import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  verifyAdminToken,
  type AdminTokenPayload,
} from "@/lib/admin-session";
import {
  resolveStaffSession,
  sessionCan,
  type ServerStaffSession,
} from "@/lib/staff-server";

/** مصدر الحقيقة الوحيد لحماية Route Handlers الإدارية. */
export async function getAdminApiSession(): Promise<ServerStaffSession | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const payload = await verifyAdminToken(token);
  if (!payload) return null;
  try {
    return await resolveStaffSession(payload);
  } catch {
    /* فشل التحقق السحابي يُغلق الوصول بدل الوثوق بكوكي موظف قديم. */
    return payload.role === "super_admin"
      ? resolveStaffSession(payload)
      : null;
  }
}

export function adminActor(session: AdminTokenPayload): string {
  return session.name.trim() || session.sub;
}

export function adminCan(
  session: ServerStaffSession,
  permission: string
): boolean {
  return sessionCan(session, permission);
}
