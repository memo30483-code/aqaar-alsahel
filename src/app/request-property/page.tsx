"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  LockKeyhole,
  MapPin,
  SearchCheck,
  Send,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { useActiveCities } from "@/lib/cities-store";
import { useI18n } from "@/lib/i18n";
import { PROPERTY_TYPES } from "@/lib/i18n/taxonomy";
import { getSession } from "@/lib/session";
import { useSiteSettings } from "@/lib/site-settings";
import {
  CONTACT_PREFERENCE_LABEL,
  DEFAULT_PROPERTY_REQUEST_SETTINGS,
  DELIVERY_OPTIONS,
  emptyPropertyRequestBrief,
  normalizePropertyRequestSettings,
  type ContactPreference,
  type PropertyRequestBrief,
  type PropertyRequestsSettings,
} from "@/lib/property-requests";
import {
  FINISH_STATES,
  SALE_REASONS,
  type FinishState,
  type PropertyType,
  type SaleReason,
} from "@/types/property";

const INPUT =
  "w-full rounded-2xl border border-sand-200 bg-white px-3.5 py-3 text-sm font-semibold text-ocean-900 outline-none transition placeholder:text-sand-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/60 disabled:bg-sand-50 disabled:text-sand-500";

interface PublicMatch {
  propertyId: string;
  score: number;
  title: string;
  city: string;
  district: string;
  type: string;
  reasons: string[];
}

interface SubmitResult {
  reference: string;
  summary: string;
  matches: PublicMatch[];
}

function numberValue(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function toggleItem<T extends string>(items: T[], item: T): T[] {
  return items.includes(item)
    ? items.filter((value) => value !== item)
    : [...items, item];
}

function ChoiceButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-extrabold transition ${
        active
          ? "border-gold-400 bg-gold-50 text-gold-800 shadow-sm"
          : "border-sand-200 bg-white text-sand-700 hover:border-gold-300 hover:text-ocean-900"
      }`}
    >
      {active && <Check className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

export default function RequestPropertyPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const cities = useActiveCities();
  const site = useSiteSettings();
  const localSettings = normalizePropertyRequestSettings(site.propertyRequests);

  const [settings, setSettings] = useState<PropertyRequestsSettings>(
    DEFAULT_PROPERTY_REQUEST_SETTINGS
  );
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [brief, setBrief] = useState<PropertyRequestBrief>(
    emptyPropertyRequestBrief()
  );
  const [districts, setDistricts] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    setSettings(localSettings);
  }, [site.propertyRequests]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const local = getSession();
    if (local) {
      setName(local.name || "");
      setPhone(local.phone || "");
      setEmail(local.email || "");
    }

    let cancelled = false;
    void fetch("/api/property-requests", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as {
          settings?: PropertyRequestsSettings;
          authenticated?: boolean;
          account?: { name?: string; email?: string } | null;
        };
        if (cancelled) return;
        if (data.settings) setSettings(normalizePropertyRequestSettings(data.settings));
        setAuthenticated(Boolean(data.authenticated));
        if (data.account) {
          setName(data.account.name || local?.name || "");
          setEmail(data.account.email || local?.email || "");
        }
      })
      .catch(() => {
        if (!cancelled) setAuthenticated(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const title = ar ? settings.pageTitleAr : settings.pageTitleEn;
  const subtitle = ar ? settings.pageSubtitleAr : settings.pageSubtitleEn;
  const contactNote = ar ? settings.contactNoteAr : settings.contactNoteEn;
  const needsLogin = settings.audience === "signed_in" && !authenticated;
  const cityNames = useMemo(() => cities.map((city) => city.nameAr), [cities]);

  const update = <K extends keyof PropertyRequestBrief>(
    key: K,
    value: PropertyRequestBrief[K]
  ) => setBrief((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    if (!accepted) {
      setError(
        ar
          ? "وافق على سياسة الخصوصية والتواصل أولًا."
          : "Please accept the privacy and contact policy first."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/property-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          brief: {
            ...brief,
            districts: districts
              .split(/[,،\n]/)
              .map((item) => item.trim())
              .filter(Boolean),
          },
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        code?: string;
        request?: { reference?: string; summary?: string };
        matches?: PublicMatch[];
      };
      if (!response.ok || !data.request?.reference) {
        if (data.code === "sign_in_required") setAuthenticated(false);
        throw new Error(data.error || "تعذر إرسال الطلب");
      }
      setResult({
        reference: data.request.reference,
        summary: data.request.summary || "",
        matches: Array.isArray(data.matches) ? data.matches : [],
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : ar
            ? "تعذر إرسال الطلب"
            : "Unable to send the request"
      );
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center bg-sand-50">
        <Loader2 className="h-8 w-8 animate-spin text-gold-600" />
      </div>
    );
  }

  if (!settings.enabled) {
    return (
      <section className="flex-1 bg-sand-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-sand-200 bg-white p-8 text-center shadow-sm">
          <SearchCheck className="mx-auto h-12 w-12 text-gold-600" />
          <h1 className="mt-4 text-2xl font-black text-ocean-900">
            {ar ? "الخدمة متوقفة مؤقتًا" : "Service temporarily unavailable"}
          </h1>
          <p className="mt-2 text-sm leading-7 text-sand-700">
            {ar
              ? "تقدر تتصفح العقارات المنشورة، وسنفتح استقبال الطلبات قريبًا."
              : "You can browse published listings. Requests will reopen soon."}
          </p>
          <Link
            href="/#properties"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ocean-900 px-5 py-3 text-sm font-extrabold text-white"
          >
            {ar ? "تصفح العقارات" : "Browse listings"}
          </Link>
        </div>
      </section>
    );
  }

  if (needsLogin) {
    return (
      <section className="flex-1 bg-[radial-gradient(circle_at_top_right,rgba(201,146,42,0.12),transparent_40%),#f7f4ed] px-4 py-12 sm:py-16">
        <div className="mx-auto grid max-w-4xl overflow-hidden rounded-[2rem] border border-sand-200 bg-white shadow-[0_30px_90px_-55px_rgba(20,26,51,.6)] md:grid-cols-[1fr_.82fr]">
          <div className="p-7 sm:p-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-50 px-3 py-1.5 text-xs font-black text-gold-700">
              <Sparkles className="h-4 w-4" /> {ar ? "العقار المطلوب" : "Property request"}
            </span>
            <h1 className="mt-5 text-3xl font-black leading-tight text-ocean-900">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-8 text-sand-700">{subtitle}</p>
            <div className="mt-7 grid gap-3 text-sm font-bold text-ocean-800">
              {[
                [Building2, ar ? "سجّل كل المواصفات والميزانية" : "Save all specs and budget"],
                [SearchCheck, ar ? "مطابقة مع الإعلانات المعتمدة" : "Match approved listings"],
                [BellRing, ar ? "تنبيهك عند ظهور عقار مناسب" : "Get alerts for new matches"],
              ].map(([Icon, label]) => {
                const ItemIcon = Icon as typeof Building2;
                return (
                  <div key={String(label)} className="flex items-center gap-3 rounded-2xl bg-sand-50 p-3.5">
                    <ItemIcon className="h-5 w-5 text-gold-600" />
                    <span>{String(label)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col justify-center bg-ocean-950 p-7 text-white sm:p-10">
            <LockKeyhole className="h-10 w-10 text-gold-300" />
            <h2 className="mt-4 text-xl font-black">
              {ar ? "سجّل دخولك للمتابعة" : "Sign in to continue"}
            </h2>
            <p className="mt-2 text-sm leading-7 text-sand-200">
              {ar
                ? "الطلب مرتبط بحسابك حتى تتابع حالته وتشوف الترشيحات بأمان."
                : "Your request is linked to your account for secure tracking and matches."}
            </p>
            <Link
              href="/login?redirect=%2Frequest-property"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gold-500 px-5 py-3 text-sm font-black text-ocean-950 transition hover:bg-gold-400"
            >
              <UserRoundCheck className="h-4 w-4" />
              {ar ? "تسجيل الدخول" : "Sign in"}
            </Link>
            <Link
              href="/register?redirect=%2Frequest-property"
              className="mt-3 text-center text-xs font-bold text-sand-200 underline decoration-gold-400/60 underline-offset-4"
            >
              {ar ? "ليس لديك حساب؟ أنشئ حسابًا" : "No account? Create one"}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (result) {
    return (
      <section className="flex-1 bg-sand-50 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-emerald-200 bg-white p-6 text-center shadow-sm sm:p-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </span>
          <h1 className="mt-5 text-3xl font-black text-ocean-900">
            {ar ? "تم استلام طلبك بنجاح" : "Your request was received"}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-8 text-sand-700">
            {ar ? settings.successNoteAr : settings.successNoteEn}
          </p>
          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-gold-200 bg-gold-50 p-4">
            <p className="text-xs font-bold text-gold-700">
              {ar ? "الرقم المرجعي" : "Reference number"}
            </p>
            <p dir="ltr" className="mt-1 text-2xl font-black tracking-wider text-ocean-900">
              {result.reference}
            </p>
            {result.summary && (
              <p className="mt-2 text-xs font-semibold text-sand-700">{result.summary}</p>
            )}
          </div>
          {result.matches.length > 0 && (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-xs font-black text-violet-700">
              <Sparkles className="h-4 w-4" />
              {ar
                ? `وجدنا ${result.matches.length} ترشيحات أولية — راجعها في طلباتي`
                : `${result.matches.length} initial matches found — view My Requests`}
            </p>
          )}
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/my-requests"
              className="inline-flex items-center gap-2 rounded-xl bg-ocean-900 px-5 py-3 text-sm font-black text-white"
            >
              <BellRing className="h-4 w-4" />
              {ar ? "متابعة طلباتي" : "Track my requests"}
            </Link>
            <button
              type="button"
              onClick={() => {
                setBrief(emptyPropertyRequestBrief());
                setDistricts("");
                setAccepted(false);
                setResult(null);
              }}
              className="rounded-xl border border-sand-200 px-5 py-3 text-sm font-black text-ocean-800"
            >
              {ar ? "طلب جديد" : "New request"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="flex-1 bg-sand-50">
      <section className="border-b border-sand-200 bg-[radial-gradient(circle_at_10%_20%,rgba(201,146,42,.18),transparent_36%),linear-gradient(135deg,#10172c,#1b3152)] px-4 py-10 text-white sm:py-14">
        <div className="mx-auto max-w-5xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-300/30 bg-white/10 px-3 py-1.5 text-xs font-black text-gold-200">
            <SearchCheck className="h-4 w-4" />
            {ar ? "العقار المطلوب" : "Property request"}
          </span>
          <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-8 text-sand-200 sm:text-base">
            {subtitle}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold text-sand-100">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-gold-300" /> بياناتك للإدارة فقط
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
              <BellRing className="h-4 w-4 text-gold-300" /> تنبيهات عند ظهور تطابق
            </span>
          </div>
        </div>
      </section>

      <form onSubmit={submit} className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-50 font-black text-gold-700">١</span>
            <div>
              <h2 className="text-lg font-black text-ocean-900">بيانات التواصل</h2>
              <p className="mt-1 text-xs leading-6 text-sand-600">{contactNote}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1.5 text-xs font-extrabold text-ocean-800">
              <span>الاسم الكامل *</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className={INPUT} required minLength={2} disabled={authenticated} />
            </label>
            <label className="space-y-1.5 text-xs font-extrabold text-ocean-800">
              <span>رقم الهاتف / واتساب *</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT} required inputMode="tel" dir="ltr" placeholder="01xxxxxxxxx" />
            </label>
            <label className="space-y-1.5 text-xs font-extrabold text-ocean-800">
              <span>البريد الإلكتروني *</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT} required type="email" dir="ltr" disabled={authenticated} />
            </label>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs font-extrabold text-ocean-800">طريقة التواصل المفضلة</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CONTACT_PREFERENCE_LABEL) as ContactPreference[]).map((item) => (
                <ChoiceButton key={item} active={brief.contactPreference === item} onClick={() => update("contactPreference", item)}>
                  {CONTACT_PREFERENCE_LABEL[item]}
                </ChoiceButton>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-50 font-black text-gold-700">٢</span>
            <div>
              <h2 className="text-lg font-black text-ocean-900">مواصفات العقار</h2>
              <p className="mt-1 text-xs text-sand-600">اختر كل البدائل المقبولة لزيادة فرص المطابقة.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-extrabold text-ocean-800">الغرض *</p>
              <div className="flex gap-2">
                {(["بيع", "إيجار"] as const).map((purpose) => (
                  <ChoiceButton key={purpose} active={brief.purpose === purpose} onClick={() => update("purpose", purpose)}>
                    {purpose === "بيع" ? "شراء" : "إيجار"}
                  </ChoiceButton>
                ))}
              </div>
            </div>

            {brief.purpose === "بيع" && (
              <div>
                <p className="mb-2 text-xs font-extrabold text-ocean-800">نوع فرصة البيع</p>
                <div className="flex flex-wrap gap-2">
                  <ChoiceButton active={!brief.saleReason} onClick={() => update("saleReason", "")}>أي فرصة</ChoiceButton>
                  {SALE_REASONS.map((reason) => (
                    <ChoiceButton key={reason} active={brief.saleReason === reason} onClick={() => update("saleReason", reason as SaleReason)}>
                      {reason}
                    </ChoiceButton>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-extrabold text-ocean-800">نوع العقار * <span className="font-semibold text-sand-500">(يمكن اختيار أكثر من نوع)</span></p>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((type) => (
                  <ChoiceButton key={type} active={brief.types.includes(type)} onClick={() => update("types", toggleItem(brief.types, type as PropertyType))}>
                    {type}
                  </ChoiceButton>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-ocean-800"><MapPin className="h-4 w-4 text-gold-600" /> المدن المطلوبة *</p>
              <div className="flex flex-wrap gap-2">
                {cityNames.map((city) => (
                  <ChoiceButton key={city} active={brief.cities.includes(city)} onClick={() => update("cities", toggleItem(brief.cities, city))}>
                    {city}
                  </ChoiceButton>
                ))}
              </div>
              <input value={districts} onChange={(e) => setDistricts(e.target.value)} className={`${INPUT} mt-3`} placeholder="مناطق مفضلة — افصل بينها بفاصلة (اختياري)" />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-50 font-black text-gold-700">٣</span>
            <div>
              <h2 className="text-lg font-black text-ocean-900">الميزانية والتفاصيل</h2>
              <p className="mt-1 text-xs text-sand-600">اترك أي حقل فارغًا لو كنت مرنًا فيه.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1.5 text-xs font-extrabold text-ocean-800"><span>الميزانية من (جنيه)</span><input type="number" min={0} className={INPUT} value={brief.priceMin ?? ""} onChange={(e) => update("priceMin", numberValue(e.target.value))} /></label>
            <label className="space-y-1.5 text-xs font-extrabold text-ocean-800"><span>الميزانية حتى (جنيه)</span><input type="number" min={0} className={INPUT} value={brief.priceMax ?? ""} onChange={(e) => update("priceMax", numberValue(e.target.value))} /></label>
            <label className="space-y-1.5 text-xs font-extrabold text-ocean-800"><span>المساحة من (م²)</span><input type="number" min={0} className={INPUT} value={brief.areaMin ?? ""} onChange={(e) => update("areaMin", numberValue(e.target.value))} /></label>
            <label className="space-y-1.5 text-xs font-extrabold text-ocean-800"><span>المساحة حتى (م²)</span><input type="number" min={0} className={INPUT} value={brief.areaMax ?? ""} onChange={(e) => update("areaMax", numberValue(e.target.value))} /></label>
            <label className="space-y-1.5 text-xs font-extrabold text-ocean-800"><span>أقل عدد غرف</span><input type="number" min={0} max={20} className={INPUT} value={brief.roomsMin ?? ""} onChange={(e) => update("roomsMin", numberValue(e.target.value))} /></label>
            <label className="space-y-1.5 text-xs font-extrabold text-ocean-800"><span>أقل عدد حمامات</span><input type="number" min={0} max={20} className={INPUT} value={brief.bathroomsMin ?? ""} onChange={(e) => update("bathroomsMin", numberValue(e.target.value))} /></label>
            <label className="space-y-1.5 text-xs font-extrabold text-ocean-800 sm:col-span-2"><span>موعد الاستلام</span><select className={INPUT} value={brief.delivery} onChange={(e) => update("delivery", e.target.value)}>{DELIVERY_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-extrabold text-ocean-800">حالة التشطيب المقبولة</p>
            <div className="flex flex-wrap gap-2">
              {(FINISH_STATES as FinishState[]).map((finish) => (
                <ChoiceButton key={finish} active={brief.finishes.includes(finish)} onClick={() => update("finishes", toggleItem(brief.finishes, finish))}>
                  {finish}
                </ChoiceButton>
              ))}
            </div>
          </div>

          <label className="mt-5 block space-y-1.5 text-xs font-extrabold text-ocean-800">
            <span>ملاحظات أو مواصفات إضافية</span>
            <textarea rows={4} className={INPUT} value={brief.notes} maxLength={2000} onChange={(e) => update("notes", e.target.value)} placeholder="مثال: دور متوسط، قريب من البحر، يوجد أسانسير…" />
          </label>
        </section>

        <section className="rounded-3xl border border-gold-200 bg-gold-50/60 p-5 sm:p-6">
          <label className="flex cursor-pointer items-start gap-3 text-sm font-bold leading-7 text-ocean-900">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1.5 h-4 w-4 accent-gold-600" />
            <span>أوافق على تواصل إدارة عقار FAMILY معي بخصوص هذا الطلب، وأعلم أن بياناتي خاصة بالإدارة ولا تظهر للزوار أو أصحاب الإعلانات.</span>
          </label>
          {error && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
          <div className="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="flex items-center gap-2 text-xs font-semibold text-sand-700"><LockKeyhole className="h-4 w-4 text-emerald-600" /> لن نعرض رقمك أو بريدك لأي طرف.</p>
            <button type="submit" disabled={loading} className="inline-flex min-w-[210px] items-center justify-center gap-2 rounded-xl bg-ocean-900 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-ocean-900/15 transition hover:bg-ocean-800 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {loading ? "جاري الإرسال…" : ar ? settings.ctaLabelAr : settings.ctaLabelEn}
              {!loading && <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
