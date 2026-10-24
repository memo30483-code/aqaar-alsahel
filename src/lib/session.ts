/** مفتاح localStorage لجلسة المستخدم الموثّق */
export const SESSION_KEY = "aqaar-session";

export interface Session {
  name: string;
  email: string;
  phone: string;
  accountType: string;
  verifiedAt: string;
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
    return typeof session.phone === "string" ? (session as Session) : null;
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
