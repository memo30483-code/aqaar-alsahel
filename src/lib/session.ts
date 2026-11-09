/** مفتاح localStorage لجلسة المستخدم الموثّق */
export const SESSION_KEY = "aqaar-session";

/** أدوار المستخدمين المعتمدة في المنصة */
export type UserRole =
  | "user"
  | "agent"
  | "moderator"
  | "reviewer"
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
  /** الصلاحيات الفعلية القادمة من السيرفر لجلسات الطاقم */
  permissions?: string[];
  /** معرّف حساب الطاقم على السيرفر */
  staffId?: string;
  /** حالة عضوية الموقع (للأعضاء المسجلين) */
  memberStatus?: "pending" | "approved" | "rejected" | "suspended";
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
    /* الدور يأتي من الجلسة كما حُفظت. صلاحية الإدارة الفعلية تُتحقق على
       السيرفر عبر كوكي موقّع (src/middleware.ts) — لا يُرقّى أي حساب هنا
       بناءً على بريده فقط. */
    const role = session.role;
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

/** أدوار الطاقم التي يُسمح لها بالدخول إلى لوحة الإدارة */
export function isStaffRole(
  role: unknown
): role is "agent" | "moderator" | "reviewer" | "admin" | "super_admin" {
  return (
    role === "agent" ||
    role === "moderator" ||
    role === "reviewer" ||
    role === "admin" ||
    role === "super_admin"
  );
}

/** هل الجلسة الحالية تخصّ مديراً (admin أو super_admin) */
export function hasAdminAccess(session: Session | null): boolean {
  return isAdminRole(session?.role);
}
