"use client";

import PageStyleScope from "@/components/builder/PageStyleScope";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { saveSession, type Session } from "@/lib/session";
import { useT } from "@/lib/i18n";

export default function LoginPage() {
  return (
    <PageStyleScope pageId="login">
      <LoginContent />
    </PageStyleScope>
  );
}

function LoginContent() {
  const t = useT();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** قراءة هدف التوجيه بعد إتمام تسجيل الدخول (مثل ?redirect=/add-property) */
  useEffect(() => {
    const target = new URLSearchParams(window.location.search).get("redirect");
    if (target && target.startsWith("/") && !target.startsWith("//")) {
      sessionStorage.setItem("aqaar-login-redirect", target);
    }
  }, []);

  const onSubmit = async (e: FormEvent) => {
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

    /* الهدف المحفوظ من ?redirect= — يُستخدم بعد الدخول ثم يُمسح */
    const requested = sessionStorage.getItem("aqaar-login-redirect");
    sessionStorage.removeItem("aqaar-login-redirect");
    const safeTarget =
      requested && requested.startsWith("/") && !requested.startsWith("//")
        ? requested
        : "/add-property";

    /* 1) دخول الأدمن: التحقق على السيرفر فقط، والنجاح يُثبّت كوكي موقّعًا
       لا يستطيع المتصفح قراءته أو تعديله. */
    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
        signal: controller.signal,
      });

      if (response.ok) {
        const data = (await response.json()) as {
          name?: string;
          email?: string;
          role?: "admin" | "super_admin";
        };
        saveSession({
          name: data.name || "مدير النظام",
          email: data.email || trimmedEmail,
          phone: "",
          accountType: "admin",
          verifiedAt: new Date().toISOString(),
          role: data.role === "admin" ? "admin" : "super_admin",
        });
        /* تنقّل كامل: يضمن إرسال الكوكي الجديد ولا يعلّق على كاش الراوتر */
        window.location.replace("/admin");
        return;
      }

      if (response.status === 429) {
        setError("محاولات كثيرة. استنى دقايق وحاول تاني.");
        setLoading(false);
        return;
      }

      if (response.status === 503) {
        setError("خدمة الدخول غير مهيأة على السيرفر. تواصل مع الدعم.");
        setLoading(false);
        return;
      }
    } catch (error) {
      /* مهلة/انقطاع: لا نترك الزر معلّقًا */
      if (error instanceof DOMException && error.name === "AbortError") {
        setError("السيرفر بطيء في الرد. حاول تاني بعد لحظات.");
        setLoading(false);
        return;
      }
    } finally {
      clearTimeout(abortTimer);
    }

    /* 2) أي حساب آخر: التحقق من الحساب المسجّل على السيرفر.
       لا تُنشأ أي جلسة إن لم يوجد بريد مسجّل بكلمة المرور الصحيحة. */
    const userController = new AbortController();
    const userTimer = setTimeout(() => userController.abort(), 15_000);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
        signal: userController.signal,
      });

      if (response.ok) {
        const data = (await response.json()) as {
          account?: {
            name?: string;
            email?: string;
            phone?: string;
            accountType?: string;
            role?: Session["role"];
            ownerToken?: string;
          };
        };
        const account = data.account;
        if (!account) {
          setError(t("login.error.invalid"));
          setLoading(false);
          return;
        }
        saveSession({
          name: account.name || trimmedEmail,
          email: account.email || trimmedEmail,
          phone: account.phone || "",
          accountType: account.accountType || "individual",
          verifiedAt: new Date().toISOString(),
          role: account.role === "agent" ? "agent" : "user",
          ...(account.ownerToken ? { ownerToken: account.ownerToken } : {}),
        });
        /* لا نوجّه المستخدم العادي إلى لوحة الإدارة */
        router.push(safeTarget === "/admin" ? "/add-property" : safeTarget);
        return;
      }

      if (response.status === 429) {
        setError("محاولات كثيرة. استنى دقايق وحاول تاني.");
        setLoading(false);
        return;
      }

      if (response.status === 503) {
        setError("خدمة الحسابات غير متاحة حاليًا. تواصل مع الدعم.");
        setLoading(false);
        return;
      }

      /* 401 أو أي رفض آخر: بيانات دخول غير صحيحة */
      setError(t("login.error.invalid"));
      setLoading(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setError("السيرفر بطيء في الرد. حاول تاني بعد لحظات.");
      } else {
        setError(t("login.error.invalid"));
      }
      setLoading(false);
    } finally {
      clearTimeout(userTimer);
    }
  };

  return (
    <div className="flex-1 bg-sand-50">
      <div className="mx-auto grid w-full max-w-[1080px] items-center gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:py-16">
        {/* ====================== FORM ====================== */}
        <div className="order-2 lg:order-1">
          <div className="overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-[0_36px_90px_-70px_rgba(20,26,51,0.65)]">
            <div className="border-b border-sand-200 bg-sand-50/60 px-5 py-4 sm:px-6">
              <p className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.2em] text-gold-600">
                <span aria-hidden className="h-px w-6 bg-gold-400/70" />
                {t("login.title")}
              </p>
              <h1 className="mt-1.5 text-[22px] font-black text-ocean-900">
                أهلاً بيك تاني 👋
              </h1>
              <p className="mt-1 text-[11.5px] leading-6 text-sand-700">
                {t("login.hero.desc")}
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-3.5 p-5 sm:p-6">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold text-sand-700">
                  <Mail className="h-3.5 w-3.5 text-gold-600" />
                  {t("login.email")}
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  className="w-full rounded-xl border border-sand-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-ocean-900 outline-none transition placeholder:font-medium placeholder:text-sand-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/60"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold text-sand-700">
                  <Lock className="h-3.5 w-3.5 text-gold-600" />
                  {t("login.password")}
                </span>
                <span className="relative block">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    dir="ltr"
                    className="w-full rounded-xl border border-sand-200 bg-white px-3.5 py-2.5 pe-11 text-[13px] font-semibold text-ocean-900 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-200/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
                    className="absolute end-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-sand-600 transition hover:bg-sand-100 hover:text-ocean-900"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </span>
              </label>

              {error && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11.5px] font-bold text-rose-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-black transition ${
                  loading
                    ? "cursor-not-allowed bg-sand-200 text-sand-600"
                    : "bg-gradient-to-l from-gold-500 to-gold-400 text-ocean-950 shadow-[0_18px_38px_-24px_rgba(201,146,42,0.95)] hover:-translate-y-0.5"
                }`}
              >
                {loading ? t("login.redirecting") : t("login.loginButton")}
                {!loading && <ArrowLeft className="h-4 w-4 rtl:rotate-180" />}
              </button>
            </form>

            <div className="border-t border-sand-200 bg-sand-50/60 px-5 py-3.5 text-center sm:px-6">
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-ocean-800 transition hover:text-gold-600"
              >
                <UserPlus className="h-3.5 w-3.5" />
                {t("login.createAccount")}
              </Link>
            </div>
          </div>
        </div>

        {/* ====================== BRAND PANEL ====================== */}
        <div className="order-1 lg:order-2">
          <div className="relative overflow-hidden rounded-3xl border border-ocean-900/10 theme-hero p-6 text-white shadow-[0_40px_100px_-70px_rgba(20,26,51,0.9)] sm:p-8">
            <span
              aria-hidden
              className="pointer-events-none absolute -end-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(217,185,92,0.3),transparent_65%)]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold-400 to-transparent"
            />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black text-gold-200">
                <Sparkles className="h-3.5 w-3.5" />
                عقار FAMILY · عقار أحلامك
              </span>

              <h2 className="mt-4 text-2xl font-black leading-9 sm:text-[28px] sm:leading-[42px]">
                حسابك بيفتح لك
                <br />
                <span className="text-gold-300">سوق موثّق بالكامل</span>
              </h2>

              <p className="mt-3 max-w-sm text-[12px] leading-7 text-white/70">
                أضف عقارك، تابع حالة المراجعة، وتواصل مع إدارة الموقع — كل ده من
                حساب واحد، وبياناتك محمية.
              </p>

              <ul className="mt-5 space-y-2.5">
                {[
                  "كل عرض بيتم التحقق من مستنداته وسلامته القانونية",
                  "بيانات المالك والمستندات محجوبة عن الزوار",
                  "التواصل والمعاينة عبر إدارة الموقع فقط",
                ].map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-2.5 text-[11.5px] font-semibold leading-6 text-white/85"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-500/90 text-ocean-950">
                      <ShieldCheck className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {line}
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap gap-2">
                {["رأس البر", "دمياط", "دمياط الجديدة", "فارسكور", "جمصة", "المنصورة الجديدة"].map(
                  (city) => (
                    <span
                      key={city}
                      className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white/75"
                    >
                      {city}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
