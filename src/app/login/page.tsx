"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { saveSession, MOCK_ADMIN } from "@/lib/session";
import { useT } from "@/lib/i18n";

export default function LoginPage() {
  const t = useT();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** قراءة هدف التوجيه بعد إتمام تسجيل الدخول (مثل ?redirect=/add-property) */
  useEffect(() => {
    const target = new URLSearchParams(window.location.search).get("redirect");
    if (target && target.startsWith("/") && !target.startsWith("//")) {
      sessionStorage.setItem("aqaar-login-redirect", target);
    }
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError(t("login.error.required"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail)) {
      setError(t("login.error.invalid"));
      return;
    }

    setLoading(true);
    setError(null);

    /** محاكاة عملية تسجيل الدخول عبر API — الآن عبر حسابات تجريبية */
    setTimeout(() => {
      /* الهدف المحفوظ من ?redirect= — يُستخدم بعد الدخول ثم يُمسح */
      const requested = sessionStorage.getItem("aqaar-login-redirect");
      sessionStorage.removeItem("aqaar-login-redirect");
      const safeTarget =
        requested && requested.startsWith("/") && !requested.startsWith("//")
          ? requested
          : "/add-property";

      if (trimmedEmail === MOCK_ADMIN.email && password === MOCK_ADMIN.password) {
        saveSession({
          name: MOCK_ADMIN.name,
          email: MOCK_ADMIN.email,
          phone: MOCK_ADMIN.phone,
          accountType: "individual",
          verifiedAt: new Date().toISOString(),
          role: MOCK_ADMIN.role,
        });
        router.push("/admin");
        return;
      }

      /** أي حساب آخر يُتعامل كمستخدم عادي موثق */
      saveSession({
        name: trimmedEmail,
        email: trimmedEmail,
        phone: "",
        accountType: "individual",
        verifiedAt: new Date().toISOString(),
      });
      /* لا نوجّه المستخدم العادي إلى لوحة الإدارة */
      router.push(safeTarget === "/admin" ? "/add-property" : safeTarget);
    }, 600);
  };

  return (
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          {/* Hero — شريط أسود مضغوط */}
          <section className="bg-black text-white py-2 md:py-3 px-6 text-right shrink-0">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-lg md:text-xl font-bold mt-0.5">
                {t("login.title")}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {t("login.hero.desc")}
              </p>
            </div>
          </section>

          {/* منطقة المحتوى — بطاقة تسجيل الدخول متمركزة في منتصف المساحة المتاحة */}
          <div className="flex-1 flex items-center justify-center px-3 py-1 shrink-0 min-h-0">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-5">
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-semibold text-gray-800"
              >
                {t("login.email")} <span className="text-rose-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-semibold text-gray-800"
              >
                {t("login.password")} <span className="text-rose-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-100"
              />
            </div>

            {error && <p className="text-xs font-medium text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-xl text-sm font-medium transition ${
                loading
                  ? "cursor-not-allowed bg-gray-200 text-gray-400"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              {loading ? t("login.redirecting") : t("login.loginButton")}
            </button>
          </form>

          <div className="mt-3 rounded-xl bg-gray-50 p-2.5 text-center">
            <p className="text-xs font-semibold text-gray-500">
              {t("login.demoAdminHint")}
            </p>
          </div>

          <p className="mt-3 text-center text-xs font-medium text-gray-500">
            <Link
              href="/register"
              className="font-bold text-ocean-700 underline-offset-4 hover:underline"
            >
              {t("login.createAccount")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
