import { redirect } from "next/navigation";

const PROFESSIONAL_ROLES = new Set([
  "developer",
  "marketer",
  "lawyer",
  "engineer",
]);

interface JoinPageProps {
  searchParams: Promise<{
    role?: string | string[];
    redirect?: string | string[];
  }>;
}

/**
 * نقطة دخول موحّدة: النموذج القديم كان يحفظ الطلب في localStorage فقط.
 * كل طلبات الانضمام تمر الآن عبر التسجيل المحمي وواجهة السيرفر الحقيقية.
 */
export default async function JoinPage({ searchParams }: JoinPageProps) {
  const query = await searchParams;
  const rawRole = Array.isArray(query.role) ? query.role[0] : query.role;
  const role = rawRole === "broker" ? "marketer" : rawRole;
  const rawRedirect = Array.isArray(query.redirect)
    ? query.redirect[0]
    : query.redirect;

  const target = new URLSearchParams();
  if (role && PROFESSIONAL_ROLES.has(role)) target.set("role", role);
  if (
    rawRedirect &&
    rawRedirect.startsWith("/") &&
    !rawRedirect.startsWith("//")
  ) {
    target.set("redirect", rawRedirect);
  }

  const suffix = target.toString();
  redirect(suffix ? `/register?${suffix}` : "/register");
}
