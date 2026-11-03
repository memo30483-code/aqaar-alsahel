"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  ChevronDown,
  Heart,
  Lock,
  Map as MapIcon,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import AppShowcase from "@/components/app/AppShowcase";
import AppInterestForm from "@/components/app/AppInterestForm";
import StoreButtons from "@/components/app/StoreButtons";
import { PhoneDetail, PhoneHome, PhoneMap } from "@/components/app/AppMockup";
import {
  resolveAppSettings,
  type AppFeatureIcon,
} from "@/lib/app-settings";
import { useSiteSettings } from "@/lib/site-settings";

const ICONS: Record<AppFeatureIcon, LucideIcon> = {
  bell: Bell,
  map: MapIcon,
  heart: Heart,
  shield: ShieldCheck,
};

const SCREENS = [
  {
    key: "home",
    label: "الرئيسية",
    desc: "بحث وفلترة سريعة + عقارات موثّقة قريبة منك.",
    phone: <PhoneHome className="h-[470px] w-[226px]" />,
  },
  {
    key: "detail",
    label: "تفاصيل العقار",
    desc: "السعر والمواصفات وشارة فحص المستندات وزر التواصل مع الإدارة.",
    phone: <PhoneDetail className="h-[470px] w-[226px]" />,
  },
  {
    key: "map",
    label: "الخريطة",
    desc: "دبابيس الأسعار على الخريطة وشيت سفلي بأقرب العقارات.",
    phone: <PhoneMap className="h-[470px] w-[226px]" />,
  },
];

const FAQ = [
  {
    q: "التطبيق متاح للتحميل الآن؟",
    a: "التطبيق في مرحلة الإطلاق. تقدر تسجّل اهتمامك وهنبعتلك أول ما ينزل على App Store و Google Play — وتقدر تستخدم المنصة على الموبايل من المتصفح دلوقتي.",
  },
  {
    q: "البيانات والتوثيق نفس الموقع؟",
    a: "أيوه. التطبيق يقرأ نفس العقارات ونفس حالة فحص المستندات من نفس قاعدة البيانات، فمفيش نسخة قديمة أو بيانات مختلفة.",
  },
  {
    q: "هل هشوف أرقام الملاك أو الوسطاء؟",
    a: "لأ. زي الموقع بالظبط: كل التواصل عبر إدارة عقار FAMILY فقط، وبيانات المالك ومستنداته لا تظهر لأي مستخدم.",
  },
  {
    q: "التطبيق هيكون على أندرويد وآيفون؟",
    a: "أيوه — نسخة واحدة بنفس التجربة على النظامين، وبنفس الهوية والألوان اللي تختارها إدارة الموقع.",
  },
];

export default function AppPage() {
  const site = useSiteSettings();
  const app = resolveAppSettings(site.app);

  return (
    <div className="bg-sand-50">
      {/* ================= الهيرو ================= */}
      <section className="relative overflow-hidden bg-[linear-gradient(160deg,#0b1229_0%,#141a33_46%,#0a1024_100%)] text-white">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:22px_22px]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -start-24 top-10 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(201,146,42,0.2),transparent_65%)] blur-2xl"
        />
        <div className="relative mx-auto grid w-full max-w-[1240px] items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:py-20">
          <div>
            <p className="flex items-center gap-2.5 text-xs font-bold text-gold-200">
              <span aria-hidden className="h-px w-8 bg-gold-400" />
              {app.eyebrowAr}
            </p>
            <h1 className="font-heading mt-4 text-4xl font-black leading-[1.22] tracking-tight sm:text-5xl">
              {app.titleAr}
              <br />
              <span className="text-gold-300">{app.subtitleAr}</span>
            </h1>
            <p className="mt-4 max-w-[560px] text-sm font-medium leading-8 text-[#dbe2f2] sm:text-base">
              {app.descriptionAr}
            </p>

            <ul className="mt-5 flex flex-wrap gap-2">
              {["تنبيهات فورية", "بحث بالخريطة", "تواصل مع الإدارة فقط"].map(
                (item) => (
                  <li
                    key={item}
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold"
                  >
                    <BadgeCheck className="h-3.5 w-3.5 text-gold-300" />
                    {item}
                  </li>
                )
              )}
            </ul>

            <div className="mt-6">
              <StoreButtons app={app} />
            </div>

            <div className="mt-6 max-w-[560px]">
              <AppInterestForm app={app} />
            </div>
          </div>

          <AppShowcase />
        </div>
      </section>

      {/* ================= الميزات ================= */}
      <section className="border-b border-sand-200 bg-white py-14">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-2.5 text-xs font-bold text-gold-700">
                <span aria-hidden className="h-px w-8 bg-gold-500" />
                ليه التطبيق؟
              </p>
              <h2 className="font-heading mt-2.5 text-2xl font-black tracking-tight text-ocean-900 sm:text-[33px]">
                نفس التوثيق… أسرع
              </h2>
            </div>
            <Link
              href="/#app"
              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-ocean-700 transition hover:text-gold-700"
            >
              شوف القسم في الرئيسية
              <ArrowLeft className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {app.features.map((feature) => {
              const Icon = ICONS[feature.icon] ?? Bell;
              return (
                <div
                  key={feature.id}
                  className="rounded-2xl border border-sand-200 bg-sand-50/60 p-5"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-100 text-gold-700">
                    <Icon className="h-5 w-5" strokeWidth={1.9} />
                  </span>
                  <p className="mt-3 text-sm font-black text-ocean-900">
                    {feature.titleAr}
                  </p>
                  <p className="mt-1.5 text-[12px] leading-6 text-sand-700">
                    {feature.descAr}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-700" />
            <p className="max-w-[860px] text-[12px] font-semibold leading-6 text-emerald-900">
              كل إعلان في التطبيق موسوم «إعلان»، وحالة المستندات مفحوصة مستقلة عن
              صاحب الإعلان. بيانات المالك والمستندات لا تُعرض — والتواصل عبر الإدارة فقط.
            </p>
          </div>
        </div>
      </section>

      {/* ================= الشاشات ================= */}
      <section className="bg-sand-50 py-14">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-bold text-gold-700">شكل التطبيق</p>
            <h2 className="font-heading mt-2 text-2xl font-black tracking-tight text-ocean-900 sm:text-[32px]">
              ثلاث شاشات… كل اللي تحتاجه
            </h2>
          </div>
          <div className="mt-9 flex flex-wrap items-start justify-center gap-8">
            {SCREENS.map((screen) => (
              <div key={screen.key} className="text-center">
                {screen.phone}
                <p className="mt-4 text-sm font-black text-ocean-900">
                  {screen.label}
                </p>
                <p className="mx-auto mt-1 max-w-[230px] text-[11px] leading-5 text-sand-700">
                  {screen.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= الأسئلة الشائعة ================= */}
      <section className="border-y border-sand-200 bg-white py-14">
        <div className="mx-auto w-full max-w-[860px] px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-bold text-gold-700">قبل ما تسأل</p>
            <h2 className="font-heading mt-2 text-2xl font-black tracking-tight text-ocean-900 sm:text-[30px]">
              أسئلة شائعة
            </h2>
          </div>
          <div className="mt-7 space-y-2.5">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-sand-200 bg-sand-50/50 p-4 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-black text-ocean-900">
                  {item.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-sand-600 transition group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-[12px] leading-7 text-sand-700">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="relative overflow-hidden bg-ocean-950 py-14 text-white">
        <span
          aria-hidden
          className="pointer-events-none absolute -end-24 -top-24 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(201,146,42,0.22),transparent_65%)]"
        />
        <div className="relative mx-auto flex w-full max-w-[900px] flex-col items-center gap-5 px-4 text-center sm:px-6">
          <Smartphone className="h-6 w-6 text-gold-300" />
          <h2 className="font-heading text-2xl font-black sm:text-[30px]">
            كن أول من يجرّب التطبيق
          </h2>
          <p className="max-w-[560px] text-[13px] leading-7 text-[#c6cee1]">
            سجّل اهتمامك وهنبعتلك أول ما ينزل — وهتلاقي نفس العقارات الموثّقة
            اللي شوفتها على الموقع.
          </p>
          <AppInterestForm app={app} />
          <div className="mt-1 flex items-center gap-1.5 text-[10.5px] font-semibold text-[#9aa6c3]">
            <Lock className="h-3 w-3" />
            بياناتك تُستخدم لإشعار الإطلاق فقط.
          </div>
        </div>
      </section>
    </div>
  );
}
