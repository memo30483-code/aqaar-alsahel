"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  FileSearch,
  Headset,
  Landmark,
  Lock,
  MapPin,
  Phone,
  Scale,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useCityOptions } from "@/components/Filters";
import { PropertyType } from "@/types/property";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { cityLabel } from "@/lib/i18n/cities";
import { PROPERTY_TYPES, propertyTypeLabel } from "@/lib/i18n/taxonomy";
import { useCurrency } from "@/lib/currency";
import { telHref, useSiteSettings } from "@/lib/site-settings";

interface Lawyer {
  name: string;
  specialty: string;
  license: string;
  experience: string;
  coverage: string;
}

/** كروت محامين تجريبية (بيانات وهمية للعرض) — بدون أي أرقام تواصل مباشرة */
const LAWYERS: Lawyer[] = [
  {
    name: "أ. محمود عبد السلام",
    specialty: "عقود البيع الابتدائي والتصرفات العقارية",
    license: "CAR-1284",
    experience: "14 سنة خبرة",
    coverage: "دمياط الجديدة — رأس البر",
  },
  {
    name: "أ. هدى الشربيني",
    specialty: "فحص الملكية والرهون والحجوزات",
    license: "CAR-2091",
    experience: "11 سنة خبرة",
    coverage: "دمياط القديمة — جمصة",
  },
  {
    name: "أ. كريم الدسوقي",
    specialty: "عقود المطورين ووحدات التقسيط",
    license: "CAR-3377",
    experience: "9 سنوات خبرة",
    coverage: "المنصورة الجديدة — دمياط الجديدة",
  },
  {
    name: "أ. سارة النحاس",
    specialty: "التسجيل العقاري والشهر العقاري",
    license: "CAR-4160",
    experience: "7 سنوات خبرة",
    coverage: "رأس البر — جمصة — دمياط",
  },
];

/** حقول بيانات المحامي النصية التي تحتاج ترجمة */
type LawyerTextField = "name" | "specialty" | "experience" | "coverage";

/** مفتاح ترجمة لحقل نصي من بيانات محامٍ معيّن */
const lawyerTextKey = (index: number, field: LawyerTextField): MessageKey =>
  `legal.lawyer.${index}.${field}` as MessageKey;

const REVIEW_POINTS: {
  title: MessageKey;
  text: MessageKey;
  Icon: typeof Scale;
}[] = [
  { title: "legal.review.0.title", text: "legal.review.0.text", Icon: UserCheck },
  { title: "legal.review.1.title", text: "legal.review.1.text", Icon: Landmark },
  { title: "legal.review.2.title", text: "legal.review.2.text", Icon: ScrollText },
  { title: "legal.review.3.title", text: "legal.review.3.text", Icon: FileSearch },
];

const STEPS: MessageKey[] = [
  "legal.steps.0",
  "legal.steps.1",
  "legal.steps.2",
  "legal.steps.3",
];

const FIELD =
  "w-full rounded-xl border border-sand-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-ocean-900 outline-none transition placeholder:font-medium placeholder:text-sand-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/60";
const LABEL = "mb-1.5 block text-[11px] font-extrabold text-sand-700";

/** عنوان صغير ذهبي فوق كل قسم */
function Eyebrow({
  children,
  tone = "gold",
}: {
  children: React.ReactNode;
  tone?: "gold" | "light";
}) {
  const color = tone === "light" ? "text-gold-300" : "text-gold-600";
  const line = tone === "light" ? "bg-gold-400/70" : "bg-gold-400/70";
  return (
    <span
      className={`flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.2em] ${color}`}
    >
      <span aria-hidden className={`h-px w-6 ${line}`} />
      {children}
    </span>
  );
}

export default function LegalConsultationalPage() {
  const { t, locale } = useI18n();
  const { formatWithSymbol } = useCurrency();
  const site = useSiteSettings();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType | "">("");
  const [city, setCity] = useState("");
  const [error, setError] = useState<MessageKey | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const cityOptions = useCityOptions();
  const legalCities = useMemo(
    () => cityOptions.filter((c) => c.id !== "all"),
    [cityOptions]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !propertyType || !city) {
      setError("legal.form.errorRequired");
      return;
    }
    /** أرقام مصرية: 010xxxxxxxx أو 2010xxxxxxxx أو 10xxxxxxxx */
    if (!/^(20)?0?1[0125]\d{8}$/.test(phone.replace(/\D/g, ""))) {
      setError("legal.form.errorPhone");
      return;
    }

    setError(null);
    setSubmitted(true);
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setPropertyType("");
    setCity("");
    setError(null);
    setSubmitted(false);
  };

  return (
    <div className="bg-sand-50">
      {/* ====================== HERO ====================== */}
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#141a33_0%,#242e5c_58%,#141a33_100%)]">
        <span
          aria-hidden
          className="pointer-events-none absolute -end-24 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(217,185,92,0.26),transparent_65%)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold-400 to-transparent"
        />

        <div className="relative mx-auto max-w-[1180px] px-4 py-14 sm:px-6 sm:py-20">
          <Eyebrow tone="light">{t("legal.eyebrow")}</Eyebrow>

          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black text-gold-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("legal.badge")}
          </span>

          <h1 className="mt-4 max-w-3xl text-[28px] font-black leading-[44px] tracking-tight text-white sm:text-[40px] sm:leading-[58px]">
            {t("legal.hero.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-[12.5px] leading-8 text-white/70 sm:text-[13.5px]">
            {t("legal.hero.subtitle")}
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <a
              href="#consult-form"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-gold-500 to-gold-400 px-6 py-3 text-[12.5px] font-black text-ocean-950 shadow-[0_20px_44px_-26px_rgba(201,146,42,0.95)] transition hover:-translate-y-0.5"
            >
              {t("legal.hero.book")}
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </a>
            <Link
              href="/#properties"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-[12.5px] font-bold text-white transition hover:border-gold-300 hover:text-gold-200"
            >
              {t("legal.hero.browse")}
            </Link>
          </div>

          <div className="mt-9 grid gap-3 sm:grid-cols-3">
            {[
              { value: String(LAWYERS.length), label: t("legal.stat.lawyers") },
              { value: String(legalCities.length), label: t("legal.stat.cities") },
              {
                value: t("legal.stat.responseValue"),
                label: t("legal.stat.response"),
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur"
              >
                <p className="text-2xl font-black text-gold-200">{stat.value}</p>
                <p className="mt-1 text-[10.5px] font-bold text-white/50">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================== WHY ====================== */}
      <section className="mx-auto max-w-[1180px] px-4 py-12 sm:px-6 sm:py-16">
        <Eyebrow>{t("legal.why.eyebrow")}</Eyebrow>
        <h2 className="mt-2 text-2xl font-black text-ocean-900 sm:text-[28px]">
          {t("legal.why.title")}
        </h2>
        <p className="mt-2 max-w-2xl text-[12.5px] leading-7 text-sand-700">
          {t("legal.why.subtitle")}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REVIEW_POINTS.map((point, index) => {
            const Icon = point.Icon;
            return (
              <div
                key={point.title}
                className="group rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] transition hover:-translate-y-1 hover:border-gold-300/70"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#141a33,#2d3875)] text-gold-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[11px] font-black text-sand-400">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-3 text-[13.5px] font-black text-ocean-900">
                  {t(point.title)}
                </h3>
                <p className="mt-1.5 text-[11.5px] leading-6 text-sand-700">
                  {t(point.text)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ====================== FORM ====================== */}
      <section
        id="consult-form"
        className="scroll-mt-28 border-y border-sand-200 bg-sand-100/50 py-12 sm:py-16"
      >
        <div className="mx-auto grid max-w-[1180px] gap-5 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_332px]">
          <div className="min-w-0">
            <Eyebrow>{t("legal.form.eyebrow")}</Eyebrow>
            <h2 className="mt-2 text-2xl font-black text-ocean-900 sm:text-[26px]">
              {t("legal.form.title")}
            </h2>
            <p className="mt-2 max-w-xl text-[12.5px] leading-7 text-sand-700">
              {t("legal.form.subtitle")}
            </p>

            {submitted ? (
              <div className="mt-5 overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)]">
                <div className="flex items-center gap-2.5 border-b border-emerald-100 bg-emerald-50 px-5 py-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                  <p className="text-[13.5px] font-black text-emerald-800">
                    {t("legal.form.successTitle")}
                  </p>
                </div>

                <div className="p-5 sm:p-6">
                  <p className="text-[12.5px] leading-7 text-sand-800">
                    {t("legal.form.successBody", {
                      name,
                      propertyType: propertyTypeLabel(propertyType, t),
                      city: cityLabel(city, t, locale),
                      phone,
                    })}
                  </p>

                  <div className="mt-4 rounded-2xl border border-sand-200 bg-sand-50/70 p-4">
                    <p className="flex items-start gap-2 text-[11px] font-bold leading-6 text-sand-800">
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" />
                      {t("legal.management.desc")}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2.5">
                    <a
                      href={telHref(site.managementPhone)}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-gold-500 to-gold-400 px-5 py-2.5 text-[12px] font-black text-ocean-950 transition hover:-translate-y-0.5"
                      dir="ltr"
                    >
                      <Phone className="h-4 w-4" />
                      {site.managementPhone}
                    </a>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-full border border-sand-200 bg-white px-5 py-2.5 text-[12px] font-bold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/50"
                    >
                      {t("legal.form.newRequest")}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-5 rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] sm:p-6"
              >
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <label className="block">
                    <span className={LABEL}>{t("legal.form.name")}</span>
                    <input
                      id="legal-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("legal.form.namePlaceholder")}
                      className={FIELD}
                    />
                  </label>

                  <label className="block">
                    <span className={LABEL}>{t("legal.form.phone")}</span>
                    <input
                      id="legal-phone"
                      value={phone}
                      inputMode="tel"
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      dir="ltr"
                      className={FIELD}
                    />
                  </label>

                  <label className="block">
                    <span className={LABEL}>{t("legal.form.propertyType")}</span>
                    <select
                      id="legal-type"
                      value={propertyType}
                      onChange={(e) =>
                        setPropertyType(e.target.value as PropertyType | "")
                      }
                      className={FIELD}
                    >
                      <option value="">
                        {t("legal.form.propertyTypePlaceholder")}
                      </option>
                      {PROPERTY_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {propertyTypeLabel(type, t)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className={LABEL}>{t("legal.form.city")}</span>
                    <select
                      id="legal-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={FIELD}
                    >
                      <option value="">{t("legal.form.cityPlaceholder")}</option>
                      {legalCities.map((option) => (
                        <option key={option.id} value={option.name}>
                          {cityLabel(option.name, t, locale)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {error && (
                  <p className="mt-3.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[11.5px] font-bold text-rose-700">
                    {t(error)}
                  </p>
                )}

                <button
                  type="submit"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold-500 to-gold-400 px-6 py-3 text-[12.5px] font-black text-ocean-950 shadow-[0_18px_38px_-24px_rgba(201,146,42,0.95)] transition hover:-translate-y-0.5 sm:w-auto"
                >
                  {t("legal.form.submit")}
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </button>
                <p className="mt-2.5 flex items-start gap-1.5 text-[10.5px] font-medium leading-5 text-sand-600">
                  <Lock className="mt-0.5 h-3 w-3 shrink-0 text-gold-600" />
                  {t("legal.form.privacy")}
                </p>
              </form>
            )}
          </div>

          {/* ---------- SIDEBAR ---------- */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-3xl border border-sand-200 bg-white p-5">
              <p className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.18em] text-gold-600">
                <span aria-hidden className="h-px w-5 bg-gold-400/70" />
                {t("legal.steps.title")}
              </p>
              <ol className="mt-4 space-y-3.5">
                {STEPS.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold-300/70 bg-gold-50 text-[11px] font-black text-gold-700">
                      {index + 1}
                    </span>
                    <span className="text-[11.5px] font-semibold leading-6 text-sand-800">
                      {t(step)}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="relative overflow-hidden rounded-3xl border border-ocean-900/10 bg-ocean-950 p-5 text-white">
              <span
                aria-hidden
                className="pointer-events-none absolute -end-12 -top-14 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(217,185,92,0.24),transparent_65%)]"
              />
              <div className="relative">
                <Eyebrow tone="light">{t("legal.cost.title")}</Eyebrow>
                <p className="mt-2 text-[26px] font-black leading-tight text-gold-200">
                  {formatWithSymbol(750)}
                </p>
                <p className="mt-2 text-[11px] leading-6 text-white/70">
                  {t("legal.cost.note")}
                </p>
                <p className="mt-3 flex items-center gap-1.5 border-t border-white/10 pt-3 text-[10.5px] font-bold text-white/60">
                  <Sparkles className="h-3.5 w-3.5 text-gold-300" />
                  {t("legal.lawyers.management")}
                </p>
              </div>
            </section>
          </aside>
        </div>
      </section>

      {/* ====================== LAWYERS ====================== */}
      <section id="lawyers" className="mx-auto max-w-[1180px] px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>{t("legal.lawyers.eyebrow")}</Eyebrow>
            <h2 className="mt-2 text-2xl font-black text-ocean-900 sm:text-[26px]">
              {t("legal.lawyers.title")}
            </h2>
            <p className="mt-1.5 max-w-2xl text-[12px] leading-7 text-sand-700">
              {t("legal.lawyers.subtitle")}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-300/70 bg-gold-50 px-3 py-1.5 text-[10.5px] font-extrabold text-gold-800">
            <ShieldCheck className="h-3.5 w-3.5 text-gold-500" />
            {t("legal.lawyers.badge")}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LAWYERS.map((lawyer, index) => (
            <div
              key={lawyer.license}
              className="flex flex-col rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] transition hover:-translate-y-1 hover:border-gold-300/70"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#141a33,#2d3875)] text-[15px] font-black text-gold-300 ring-2 ring-gold-200/40">
                  {t(lawyerTextKey(index, "name")).replace("أ. ", "").charAt(0)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700">
                  <Check className="h-3 w-3" strokeWidth={3} />
                  {t("legal.lawyers.badge")}
                </span>
              </div>

              <h3 className="mt-3.5 text-[13.5px] font-black text-ocean-900">
                {t(lawyerTextKey(index, "name"))}
              </h3>
              <p className="mt-1 text-[11px] leading-5 text-sand-700">
                {t(lawyerTextKey(index, "specialty"))}
              </p>

              <dl className="mt-3.5 space-y-1.5 rounded-2xl border border-sand-200 bg-sand-50/70 p-3 text-[10.5px]">
                <div className="flex items-center justify-between gap-2">
                  <dt className="font-bold text-sand-600">
                    {t("legal.lawyers.license")}
                  </dt>
                  <dd className="font-mono font-bold text-ocean-900" dir="ltr">
                    {lawyer.license}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="font-bold text-sand-600">
                    {t("legal.lawyers.experience")}
                  </dt>
                  <dd className="font-bold text-ocean-900">
                    {t(lawyerTextKey(index, "experience"))}
                  </dd>
                </div>
              </dl>

              <p className="mt-2.5 flex items-start gap-1.5 text-[10.5px] leading-5 text-sand-600">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-gold-500" />
                {t("legal.lawyers.coverage", {
                  coverage: t(lawyerTextKey(index, "coverage")),
                })}
              </p>

              <a
                href="#consult-form"
                className="mt-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-sand-200 bg-white px-4 py-2.5 text-[11.5px] font-extrabold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/60"
              >
                {t("legal.lawyers.request")}
                <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              </a>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[10.5px] leading-5 text-sand-500">
          {t("legal.lawyers.note")}
        </p>
      </section>

      {/* ====================== MANAGEMENT BAND ====================== */}
      <section className="mx-auto max-w-[1180px] px-4 pb-14 sm:px-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-ocean-900/10 bg-[linear-gradient(140deg,#141a33_0%,#242e5c_100%)] p-5 text-white shadow-[0_30px_80px_-60px_rgba(20,26,51,0.9)] sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-gold-300">
              <Headset className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[14px] font-black">{t("legal.management.title")}</p>
              <p className="mt-1 max-w-xl text-[11.5px] leading-6 text-white/70">
                {t("legal.management.desc")}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <a
              href={telHref(site.managementPhone)}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-gold-500 to-gold-400 px-5 py-2.5 text-[11.5px] font-black text-ocean-950 transition hover:-translate-y-0.5"
              dir="ltr"
            >
              <Phone className="h-3.5 w-3.5" />
              {site.managementPhone}
            </a>
            <a
              href="#consult-form"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-5 py-2.5 text-[11.5px] font-bold text-white transition hover:border-gold-300 hover:text-gold-200"
            >
              {t("legal.management.cta")}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
