"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { cities } from "@/components/Filters";
import { PropertyType } from "@/types/property";

const PROPERTY_TYPES: PropertyType[] = ["شقة", "فيلا", "محل", "أرض"];

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

const REVIEW_POINTS = [
  {
    title: "تأكيد ملكية البائع",
    text: "مراجعة عقد الملكية والمستندات الأصلية والتأكد من عدم وجود شريك أو ورثة شركاء في العقار.",
  },
  {
    title: "فحص الرهون والحجوزات",
    text: "الاستعلام عن أي رهن أو حجز إداري أو نزاع قضائي على الوحدة قبل توقيع العقد أو دفع المقدم.",
  },
  {
    title: "مراجعة بنود العقد",
    text: "ضبط مواعيد التسليم، الغرامات، المواصفات المتفق عليها، وشروط التقسيط وفسخ العقد.",
  },
  {
    title: "تراخيص ورسوم المطور",
    text: "التحقق من تراخيص المشروع ورخصة البناء ومطابقة الوحدة للرخصة قبل الشراء على الخريطة.",
  },
];

const STEPS = [
  "املأ بيانات الطلب وحدد نوع العقار والمدينة",
  "يتم تعيين محامٍ معتمد من نفس المنطقة",
  "ترسل صورة العقد والمستندات للمراجعة",
  "مكالمة استشارية 30 دقيقة مع تقرير مكتوب",
];

export default function LegalConsultationalPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType | "">("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const legalCities = useMemo(
    () => cities.filter((c) => c.id !== "all"),
    []
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !propertyType || !city) {
      setError("من فضلك أكمل كل الحقول المطلوبة.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("رقم الهاتف غير صحيح، اكتب 11 رقماً مثل 01xxxxxxxxx.");
      return;
    }

    setError("");
    setSubmitted(true);
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setPropertyType("");
    setCity("");
    setError("");
    setSubmitted(false);
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-black py-20 sm:py-24">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-gradient-to-br from-blue-600/30 to-transparent blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-blue-200">
            مراجعة قانونية قبل الدفع
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
            الاستشارات القانونية والمحامين المعتمدين
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-gray-300 sm:text-lg">
            قبل ما تدفع مقدم أي عقار، خلّي عقدك يتفحص. ساعة مراجعة قانونية توفر
            عليك سنوات من النزاعات: بنتحقق من الملكية، الرهون، تراخيص المطور،
            وبنود العقد والغرامات.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#consult-form"
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-gray-900 transition hover:bg-gray-100"
            >
              احجز استشارة قانونية
            </a>
            <Link
              href="/#properties"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              تصفح العقارات
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { value: "4", label: "محامون معتمدون" },
              { value: "5", label: "مدن مغطاة" },
              { value: "24 ساعة", label: "متوسط الرد على الطلب" },
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
          لماذا المراجعة القانونية قبل الشراء؟
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">
          أغلب مشاكل العقارات في الساحل لا تظهر في الصور، بل في الأوراق: عقد غير
          مسجل، وارث لم يوقّع، أو حجز على الوحدة. المراجعة القانونية تكشف هذا
          قبل ما تتحرك فلوسك.
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
                {point.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {point.text}
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
              احجز استشارتك القانونية
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              ابعت بياناتك ويتم التواصل معاك لتحديد الموعد مع محامٍ معتمد.
            </p>

            {submitted ? (
              <div className="mt-6 rounded-3xl border border-green-200 bg-white p-6">
                <p className="text-lg font-bold text-green-700">
                  تم استلام طلبك بنجاح
                </p>
                <p className="mt-2 text-sm leading-7 text-gray-600">
                  أهلاً {name}، تم تسجيل طلب استشارة لـ«{propertyType}» في{" "}
                  {city} على رقم {phone}. سيتم التواصل معاك خلال 24 ساعة.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={`https://wa.me/201000000001?text=${encodeURIComponent(
                      `طلب استشارة قانونية — ${name} — ${propertyType} في ${city} — ${phone}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-700"
                  >
                    تواصل فوري على واتساب
                  </a>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                  >
                    طلب جديد
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
                      الاسم بالكامل
                    </label>
                    <input
                      id="legal-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: محمد أحمد"
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-black"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="legal-phone"
                      className="mb-1.5 block text-xs font-bold text-gray-700"
                    >
                      رقم الهاتف
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
                      نوع العقار
                    </label>
                    <select
                      id="legal-type"
                      value={propertyType}
                      onChange={(e) =>
                        setPropertyType(e.target.value as PropertyType | "")
                      }
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                    >
                      <option value="">اختر نوع العقار</option>
                      {PROPERTY_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="legal-city"
                      className="mb-1.5 block text-xs font-bold text-gray-700"
                    >
                      المدينة
                    </label>
                    <select
                      id="legal-city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
                    >
                      <option value="">اختر المدينة</option>
                      {legalCities.map((option) => (
                        <option key={option.id} value={option.name}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {error && (
                  <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="mt-6 w-full rounded-full bg-black px-6 py-3.5 text-sm font-bold text-white transition hover:bg-gray-800 sm:w-auto"
                >
                  إرسال طلب الاستشارة
                </button>
                <p className="mt-3 text-xs text-gray-500">
                  بياناتك تُستخدم للتواصل بشأن الطلب فقط.
                </p>
              </form>
            )}
          </div>

          <aside className="lg:col-span-1">
            <div className="rounded-3xl border border-gray-200 bg-white p-5">
              <h3 className="text-base font-bold text-gray-900">
                كيف تعمل الخدمة؟
              </h3>
              <ol className="mt-4 space-y-4">
                {STEPS.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-6 text-gray-600">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-4 rounded-3xl bg-blue-50 p-5">
              <p className="text-sm font-bold text-gray-900">
                تكلفة المراجعة
              </p>
              <p className="mt-1 text-2xl font-black text-gray-900">750 ج.م</p>
              <p className="mt-2 text-xs leading-6 text-gray-600">
                لمراجعة عقد واحد وتقرير مكتوب — تُخصم من أتعاب التوثيق لو أكملت
                الشراء.
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
              المحامون المعتمدون
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              محامون مرخصون يغطون مدن الساحل الخمس، وتقدر تتواصل معاهم مباشرة.
            </p>
          </div>
          <span className="rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white">
            محامي معتمد
          </span>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {LAWYERS.map((lawyer) => (
            <div
              key={lawyer.license}
              className="flex flex-col rounded-3xl border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ocean-600 to-ocean-900 text-lg font-bold text-white">
                  {lawyer.name.replace("أ. ", "").charAt(0)}
                </span>
                <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700">
                  محامي معتمد
                </span>
              </div>

              <h3 className="mt-4 text-base font-bold text-gray-900">
                {lawyer.name}
              </h3>
              <p className="mt-1 text-xs leading-5 text-gray-600">
                {lawyer.specialty}
              </p>

              <dl className="mt-4 space-y-1.5 text-xs text-gray-500">
                <div className="flex justify-between gap-2">
                  <dt>رقم الكارنيه</dt>
                  <dd className="font-bold text-gray-800">{lawyer.license}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>الخبرة</dt>
                  <dd className="font-semibold text-gray-800">
                    {lawyer.experience}
                  </dd>
                </div>
              </dl>

              <p className="mt-3 text-[11px] text-gray-500">
                يغطي: {lawyer.coverage}
              </p>

              <a
                href={`https://wa.me/${lawyer.whatsapp}?text=${encodeURIComponent(
                  `السلام عليكم ${lawyer.name}، أرغب في استشارة قانونية بخصوص عقد عقار.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 rounded-full bg-green-600 px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-green-700"
              >
                تواصل عبر واتساب
              </a>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-gray-400">
          بيانات المحامين وأرقام التواصل تجريبية لأغراض العرض في نسخة الـ MVP.
        </p>
      </section>
    </>
  );
}
