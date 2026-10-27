"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { cities } from "@/components/Filters";
import { PropertyType } from "@/types/property";
import { useT, type MessageKey } from "@/lib/i18n";
import { cityLabel } from "@/lib/i18n/cities";
import { PROPERTY_TYPES, propertyTypeLabel } from "@/lib/i18n/taxonomy";
import { useCurrency } from "@/lib/currency";

interface Lawyer {
  name: string;
  specialty: string;
  license: string;
  experience: string;
  coverage: string;
  whatsapp: string;
}

/** كروت محامين تجريبية (بيانات وهمية للعرض) */
const LAWYERS: Lawyer[] = [
  {
    name: "أ. محمود عبد السلام",
    specialty: "عقود البيع الابتدائي والتصرفات العقارية",
    license: "CAR-1284",
    experience: "14 سنة خبرة",
    coverage: "دمياط الجديدة — رأس البر",
    whatsapp: "201000000001",
  },
  {
    name: "أ. هدى الشربيني",
    specialty: "فحص الملكية والرهون والحجوزات",
    license: "CAR-2091",
    experience: "11 سنة خبرة",
    coverage: "دمياط القديمة — جمصة",
    whatsapp: "201000000002",
  },
  {
    name: "أ. كريم الدسوقي",
    specialty: "عقود المطورين ووحدات التقسيط",
    license: "CAR-3377",
    experience: "9 سنوات خبرة",
    coverage: "المنصورة الجديدة — دمياط الجديدة",
    whatsapp: "201000000003",
  },
  {
    name: "أ. سارة النحاس",
    specialty: "التسجيل العقاري والشهر العقاري",
    license: "CAR-4160",
    experience: "7 سنوات خبرة",
    coverage: "رأس البر — جمصة — دمياط",
    whatsapp: "201000000004",
  },
];

/** حقول بيانات المحامي النصية التي تحتاج ترجمة */
type LawyerTextField = "name" | "specialty" | "experience" | "coverage";

/** مفتاح ترجمة لحقل نصي من بيانات محامٍ معيّن */
const lawyerTextKey = (index: number, field: LawyerTextField): MessageKey =>
  `legal.lawyer.${index}.${field}` as MessageKey;

const REVIEW_POINTS: { title: MessageKey; text: MessageKey }[] = [
  { title: "legal.review.0.title", text: "legal.review.0.text" },
  { title: "legal.review.1.title", text: "legal.review.1.text" },
  { title: "legal.review.2.title", text: "legal.review.2.text" },
  { title: "legal.review.3.title", text: "legal.review.3.text" },
];

const STEPS: MessageKey[] = [
  "legal.steps.0",
  "legal.steps.1",
  "legal.steps.2",
  "legal.steps.3",
];

export default function LegalConsultationalPage() {
  const t = useT();
  const { formatWithSymbol } = useCurrency();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType | "">("");
  const [city, setCity] = useState("");
  const [error, setError] = useState<MessageKey | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const legalCities = useMemo(
    () => cities.filter((c) => c.id !== "all"),
    []
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
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-black py-20 sm:py-24">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-gradient-to-br from-blue-600/30 to-transparent blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-blue-200">
            {t("legal.badge")}
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
            {t("legal.hero.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-gray-300 sm:text-lg">
            {t("legal.hero.subtitle")}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#consult-form"
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-gray-900 transition hover:bg-gray-100"
            >
              {t("legal.hero.book")}
            </a>
            <Link
              href="/#properties"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              {t("legal.hero.browse")}
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { value: String(LAWYERS.length), label: t("legal.stat.lawyers") },
              {
                value: String(legalCities.length),
                label: t("legal.stat.cities"),
              },
              { value: t("legal.stat.responseValue"), label: t("legal.stat.response") },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="mt-1 text-xs text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* أهمية المراجعة القانونية */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {t("legal.why.title")}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">
          {t("legal.why.subtitle")}
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {REVIEW_POINTS.map((point, index) => (
            <div
              key={point.title}
              className="rounded-3xl border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-sm font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 text-base font-bold text-gray-900">
                {t(point.title)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {t(point.text)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* نموذج حجز الاستشارة */}
      <section
        id="consult-form"
        className="scroll-mt-28 border-y border-gray-200 bg-gray-50 py-14"
      >
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {t("legal.form.title")}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t("legal.form.subtitle")}
            </p>

            {submitted ? (
              <div className="mt-6 rounded-3xl border border-green-200 bg-white p-6">
                <p className="text-lg font-bold text-green-700">
                  {t("legal.form.successTitle")}
                </p>
                <p className="mt-2 text-sm leading-7 text-gray-600">
                  {t("legal.form.successBody", {
                    name,
                    propertyType: propertyTypeLabel(propertyType, t),
                    city: cityLabel(city, t),
                    phone,
                  })}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={`https://wa.me/${LAWYERS[0]?.whatsapp ?? "201000000001"}?text=${encodeURIComponent(
                      t("legal.form.whatsappText", {
                        name,
                        propertyType: propertyTypeLabel(propertyType, t),
                        city: cityLabel(city, t),
                        phone,
                      })
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-700"
                  >
                    {t("legal.form.whatsappNow")}
                  </a>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                  >
                    {t("legal.form.newRequest")}
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 sm:p-6"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="legal-name"
                      className="mb-1.5 block text-xs font-bold text-gray-700"
                    >
                      {t("legal.form.name")}
                    </label>
                    <input
                      id="legal-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("legal.form.namePlaceholder")}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="legal-phone"
                      className="mb-1.5 block text-xs font-bold text-gray-700"
                    >
                      {t("legal.form.phone")}
                    </label>
                    <input
                      id="legal-phone"
                      value={phone}
                      inputMode="tel"
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="legal-type"
                      className="mb-1.5 block text-xs font-bold text-gray-700"
                    >
                      {t("legal.form.propertyType")}
                    </label>
                    <select
                      id="legal-type"
                      value={propertyType}
                      onChange={(e) =>
                        setPropertyType(e.target.value as PropertyType | "")
                      }
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
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
                  </div>

                  <div>
                    <label
                      htmlFor="legal-city"
                      className="mb-1.5 block text-xs font-bold text-gray-700"
                    >
                      {t("legal.form.city")}
                    </label>
                    <select
                      id="legal-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                    >
                      <option value="">{t("legal.form.cityPlaceholder")}</option>
                      {legalCities.map((option) => (
                        <option key={option.id} value={option.name}>
                          {cityLabel(option.name, t)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {error && (
                  <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {t(error)}
                  </p>
                )}

                <button
                  type="submit"
                  className="mt-6 w-full rounded-full bg-black px-6 py-3.5 text-sm font-bold text-white transition hover:bg-gray-800 sm:w-auto"
                >
                  {t("legal.form.submit")}
                </button>
                <p className="mt-3 text-xs text-gray-500">
                  {t("legal.form.privacy")}
                </p>
              </form>
            )}
          </div>

          <aside className="lg:col-span-1">
            <div className="rounded-3xl border border-gray-200 bg-white p-5">
              <h3 className="text-base font-bold text-gray-900">
                {t("legal.steps.title")}
              </h3>
              <ol className="mt-4 space-y-4">
                {STEPS.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-6 text-gray-600">
                      {t(step)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-4 rounded-3xl bg-blue-50 p-5">
              <p className="text-sm font-bold text-gray-900">
                {t("legal.cost.title")}
              </p>
              <p className="mt-1 text-2xl font-black text-gray-900">
                {formatWithSymbol(750)}
              </p>
              <p className="mt-2 text-xs leading-6 text-gray-600">
                {t("legal.cost.note")}
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* المحامون المعتمدون */}
      <section id="lawyers" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {t("legal.lawyers.title")}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t("legal.lawyers.subtitle")}
            </p>
          </div>
          <span className="rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white">
            {t("legal.lawyers.badge")}
          </span>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {LAWYERS.map((lawyer, index) => (
            <div
              key={lawyer.license}
              className="flex flex-col rounded-3xl border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ocean-600 to-ocean-900 text-lg font-bold text-white">
                  {t(lawyerTextKey(index, "name"))
                    .replace("أ. ", "")
                    .charAt(0)}
                </span>
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700">
                  {t("legal.lawyers.badge")}
                </span>
              </div>

              <h3 className="mt-4 text-base font-bold text-gray-900">
                {t(lawyerTextKey(index, "name"))}
              </h3>
              <p className="mt-1 text-xs leading-5 text-gray-600">
                {t(lawyerTextKey(index, "specialty"))}
              </p>

              <dl className="mt-4 space-y-1.5 text-xs text-gray-500">
                <div className="flex justify-between gap-2">
                  <dt>{t("legal.lawyers.license")}</dt>
                  <dd className="font-bold text-gray-800">{lawyer.license}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>{t("legal.lawyers.experience")}</dt>
                  <dd className="font-semibold text-gray-800">
                    {t(lawyerTextKey(index, "experience"))}
                  </dd>
                </div>
              </dl>

              <p className="mt-3 text-[11px] text-gray-500">
                {t("legal.lawyers.coverage", {
                  coverage: t(lawyerTextKey(index, "coverage")),
                })}
              </p>

              <a
                href={`https://wa.me/${lawyer.whatsapp}?text=${encodeURIComponent(
                  t("legal.lawyers.whatsappText", {
                    name: t(lawyerTextKey(index, "name")),
                  })
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 rounded-full bg-green-600 px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-green-700"
              >
                {t("legal.lawyers.whatsapp")}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-gray-400">
          {t("legal.lawyers.note")}
        </p>
      </section>
    </>
  );
}
