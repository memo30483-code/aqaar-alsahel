import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin-session";

/**
 * بوابة الأدمن على مستوى السيرفر.
 *
 * تُنفَّذ قبل تحميل أي صفحة إدارة، فالوصول لا يعتمد على جلسة localStorage
 * (القابلة للتلاعب من أدوات المتصفح) بل على كوكي موقّع لا يستطيع المتصفح
 * قراءته أو تعديله.
 */

/** مسارات عامة لا تحتاج جلسة (تسجيل الدخول والخروج وفحص الحالة) */
const PUBLIC_ADMIN_PATHS = new Set([
  "/api/admin/login",
  "/api/admin/logout",
  "/api/admin/session",
  "/api/admin/join",
  "/admin/join",
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ADMIN_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const session = await verifyAdminToken(token);

  if (session) {
    return NextResponse.next();
  }

  /* واجهات API ترجع 401 بدل تحويل */
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  /* صفحات الإدارة: تحويل لتسجيل الدخول مع حفظ الوجهة */
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = `?redirect=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
