/** مفتاح localStorage لجلسة المستخدم الموثّق */
export const SESSION_KEY = "aqaar-session";

/** أدوار المستخدمين المعتمدة في المنصة */
export type UserRole =
  | "user"
  | "agent"
  | "moderator"
  | "admin"
  | "super_admin";

export interface Session {
  name: string;
  email: string;
  phone: string;
  accountType: string;
  verifiedAt: string;
  /** دور المستخدم — غياب القيمة يعني مستخدماً عادياً */
  role?: UserRole;
  /**
   * رمز ملكية يُنشأ عند التسجيل ويُربط بالسجل المهني.
   * يمنع دخول أي شخص للوحة مهني عبر كتابة بريده فقط.
   */
  ownerToken?: string;
}

/** إنشاء رمز ملكية جديد للسجل المهني/الحساب */
export function newOwnerToken(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // متصفح قديم — نرجع للبديل أدناه
  }
  return `own-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** بيانات الأدمن التجريبي للتطوير */
export const MOCK_ADMIN = {
  email: "admin@aqaar.com",
  password: "admin123",
  name: "مدير النظام التجريبي",
  phone: "01000000000",
  role: "admin" as UserRole,
};

/** قراءة الجلسة الحالية — ترجع null في حالة عدم وجود تسجيل دخول نشط */
export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const session = parsed as Partial<Session>;
    if (typeof session.phone !== "string") return null;
    const email = typeof session.email === "string" ? session.email : "";
    /* حساب العرض التجريبي: يضمن بقاء صلاحية الإدارة حتى لو كانت الجلسة
       قديمة/أُنشئت من مسار آخر بلا دور — يُزال مع ربط المصادقة الحقيقية */
    const role = email.trim().toLowerCase() === MOCK_ADMIN.email ? MOCK_ADMIN.role : session.role;
    /* تطبيع الحقول النصية حتى لا تتعطل الواجهة (Header) على جلسة قديمة أو تالفة */
    return {
      ...(session as Session),
      name: typeof session.name === "string" ? session.name : "",
      email,
      role,
    };
  } catch {
    return null;
  }
}

/** حفظ جلسة المستخدم بعد إتمام التوثيق */
export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // تجاهل أخطاء التخزين (الوضع الخاص أو امتلاء المساحة)
  }
}

/** إنهاء الجلسة الحالية */
export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // تجاهل أخطاء التخزين
  }
}

/** هل الدور الممرّر يمنح صلاحية الدخول إلى لوحة تحكم المدير */
export function isAdminRole(role: unknown): role is "admin" | "super_admin" {
  return role === "admin" || role === "super_admin";
}

/** هل الجلسة الحالية تخصّ مديراً (admin أو super_admin) */
export function hasAdminAccess(session: Session | null): boolean {
  return isAdminRole(session?.role);
}
