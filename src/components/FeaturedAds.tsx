"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, Building2, MapPin, Megaphone, Sparkles, TrendingUp } from "lucide-react";
import { useI18n, type MessageKey } from "@/lib/i18n";
import {
  MashrabiyaLayer,
  OrnateFrame,
  VerifiedSeal,
} from "@/components/Ornaments";

/** بانر إعلاني عائم أسفل الشاشة — يظهر بعد لحظة قصيرة وقابل للإغلاق */
export default function FeaturedAds() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed) return null;

  return (
    <div
      className={`fixed inset-x-3 bottom-3 z-40 transition duration-500 sm:inset-x-auto sm:left-6 sm:w-[22rem] ${
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
    >
      <div className="relative overflow-hidden rounded-3xl border border-gold-400/30 bg-ocean-950 p-4 shadow-2xl sm:p-5">
        <MashrabiyaLayer tone="dark" className="opacity-[0.07]" />
        <OrnateFrame tone="dark" className="inset-1.5" radiusClassName="rounded-[1.25rem]" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-gold-400/30 to-transparent blur-2xl" />

        <div className="relative flex items-start gap-3">
          <span className="rounded-xl bg-gradient-to-br from-ocean-600 to-ocean-800 px-2.5 py-1 text-[11px] font-bold text-white">
            {t("ads.label")}
          </span>
          <div className="flex-1">
            <p className="text-[11px] font-bold text-gold-300">
              {t("ads.sponsoredDevelopers")}
            </p>
            <p className="mt-1 text-sm font-bold text-white">
              {t("ads.developerProjects")}
            </p>
            <p className="mt-1 text-xs leading-5 text-sand-300">
              {t("ads.floatingBody")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label={t("ads.close")}
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="relative mt-4 flex items-center gap-2">
          <Link
            href="/#properties"
            className="flex-1 rounded-full bg-white px-4 py-2.5 text-center text-sm font-bold text-gray-900 transition hover:bg-gray-100"
          >
            {t("ads.exploreProject")}
          </Link>
          <Link
            href="/legal-consultational"
            className="rounded-full border border-white/15 px-4 py-2.5 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            {t("ads.freeConsultation")}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** مساحة إعلانية داخل شبكة العقارات في الصفحة الرئيسية */
export function FeaturedAdSlot({
  variant = "soft",
  className = "",
}: {
  variant?: "soft" | "bold";
  className?: string;
}) {
  const { t } = useI18n();
  const isBold = variant === "bold";

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 ${
        isBold
          ? "border-gold-400/30 bg-ocean-950"
          : "border-gold-200 bg-gradient-to-l from-sand-100 via-white to-white"
      } ${className}`}
    >
      <MashrabiyaLayer
        tone={isBold ? "dark" : "light"}
        className={isBold ? "opacity-[0.07]" : "opacity-[0.05]"}
      />
      <OrnateFrame
        tone={isBold ? "dark" : "light"}
        className="inset-2"
        radiusClassName="rounded-[1.25rem]"
      />
      <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-gold-400/25 to-transparent blur-2xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                isBold
                  ? "bg-gradient-to-br from-gold-400 to-gold-600 text-gold-900"
                  : "bg-gradient-to-br from-ocean-600 to-ocean-800 text-white"
              }`}
            >
              {t("ads.featured")}
            </span>
            <span
              className={`text-[11px] font-bold ${
                isBold ? "text-gold-300" : "text-gold-700"
              }`}
            >
              {t("ads.developerSponsorships")}
            </span>
          </div>
          <p
            className={`mt-2 text-base font-bold ${
              isBold ? "text-white" : "text-ocean-900"
            }`}
          >
            {t("ads.developerProjects")}
          </p>
          <p
            className={`mt-1 text-sm ${
              isBold ? "text-sand-300" : "text-sand-700"
            }`}
          >
            {t("ads.slotBody")}
          </p>
        </div>

        <Link
          href="/#properties"
          className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
            isBold
              ? "bg-gold-400 text-gold-900 hover:bg-gold-300"
              : "bg-ocean-700 text-white hover:bg-ocean-800"
          }`}
        >
          {t("ads.exploreProject")}
        </Link>
      </div>
    </div>
  );
}

/** نقاط المزايا داخل الصندوق الإعلاني الجانبي */
const SIDEBAR_POINTS: { key: MessageKey; Icon: typeof Sparkles }[] = [
  { key: "ads.sidebar.point1", Icon: Sparkles },
  { key: "ads.sidebar.point2", Icon: TrendingUp },
  { key: "ads.sidebar.point3", Icon: BarChart3 },
];

/** صندوق إعلاني مخصّص للشركات والمطورين — يُثبَّت أسفل العمود الجانبي */
export function SponsoredSidebarAd({ className = "" }: { className?: string }) {
  const { t } = useI18n();

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-gold-400/40 bg-gradient-to-br from-ocean-900 via-ocean-950 to-slate-950 p-5 text-white shadow-soft ${className}`}
    >
      <MashrabiyaLayer tone="dark" className="opacity-[0.07]" />
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-gold-400/30 to-transparent blur-2xl" />
      {/* خط ذهبي رفيع أعلى الإطار الإعلاني */}
      <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-gold-400/70 to-transparent" />
      <OrnateFrame tone="dark" className="inset-1.5" radiusClassName="rounded-[1.25rem]" />

      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-300/50 bg-gold-400/15 px-2.5 py-1 text-[11px] font-bold text-gold-200">
          <Building2 className="h-3.5 w-3.5" />
          {t("ads.label")}
        </span>

        <p className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-gold-200">
          <VerifiedSeal title={t("seal.title")} className="h-4 w-4" />
          {t("seal.label")}
        </p>

        <h3 className="mt-3 text-base font-bold leading-6">
          {t("ads.sidebar.title")}
        </h3>
        <p className="mt-2 text-xs leading-6 text-sand-300">
          {t("ads.sidebar.body")}
        </p>

        <ul className="mt-4 space-y-2">
          {SIDEBAR_POINTS.map(({ key, Icon }) => (
            <li key={key} className="flex items-center gap-2 text-xs text-sand-200">
              <Icon className="h-3.5 w-3.5 shrink-0 text-gold-300" />
              {t(key)}
            </li>
          ))}
        </ul>

        <Link
          href="/register?redirect=/add-property"
          className="mt-5 block rounded-full bg-gradient-to-br from-gold-300 to-gold-500 px-4 py-2.5 text-center text-sm font-bold text-gold-900 transition hover:from-gold-200 hover:to-gold-400"
        >
          {t("ads.sidebar.cta")}
        </Link>
      </div>
    </div>
  );
}

/** مطورون برعاية — كروت عرض مميزة أعلى شبكة العقارات */
const FEATURED_DEVELOPERS: { name: MessageKey; project: MessageKey; city: MessageKey }[] = [
  { name: "ads.dev.0.name", project: "ads.dev.0.project", city: "ads.dev.0.city" },
  { name: "ads.dev.1.name", project: "ads.dev.1.project", city: "ads.dev.1.city" },
  { name: "ads.dev.2.name", project: "ads.dev.2.project", city: "ads.dev.2.city" },
];

export function FeaturedDevelopers() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden rounded-3xl border border-gold-200 bg-gradient-to-l from-sand-100 via-white to-white p-4 shadow-soft sm:p-5">
      {/* نقشة إسلامية هندسية شفافة داخل الشريط */}
      <MashrabiyaLayer tone="light" className="opacity-[0.06]" />
      {/* فاصل هندسي ذهبي رفيع */}
      <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-gold-400/60 to-transparent" />
      <div className="relative flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-ocean-900">
            <VerifiedSeal title={t("seal.title")} className="h-4 w-4" />
            {t("ads.featuredDevelopers")}
          </h2>
          <p className="mt-1 text-xs text-sand-700">
            {t("ads.featuredDevelopersDesc")}
          </p>
        </div>
        <span className="rounded-full bg-gradient-to-br from-ocean-600 to-ocean-800 px-3 py-1 text-[11px] font-bold text-white">
          {t("ads.label")}
        </span>
      </div>

      <div className="relative mt-4 grid gap-3 sm:grid-cols-3">
        {FEATURED_DEVELOPERS.map(({ name, project, city }) => (
          <Link
            key={name}
            href="/#properties"
            className="group relative overflow-hidden rounded-2xl border border-sand-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-lg"
          >
            <OrnateFrame
              tone="light"
              className="inset-1.5"
              radiusClassName="rounded-xl"
            />
            <p className="relative flex items-center gap-1.5 text-[10px] font-bold text-gold-700">
              <VerifiedSeal title={t("seal.title")} className="h-4 w-4" />
              {t("ads.devBadge")}
            </p>
            <p className="relative mt-1 line-clamp-2 text-sm font-bold text-ocean-900">
              {t(project)}
            </p>
            <p className="relative mt-2 text-xs font-semibold text-sand-700">
              {t(name)}
            </p>
            <p className="relative mt-1 flex items-center gap-1 text-[11px] text-sand-500">
              <MapPin className="h-3 w-3" />
              {t(city)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** تدرجات بصرية لكروت المطورين في المساحة الإعلانية الرئيسية */
const AD_GRADIENTS = [
  "from-ocean-700 via-ocean-800 to-ocean-950",
  "from-ocean-800 via-slate-900 to-black",
];

/** المساحة الإعلانية الرئيسية (العمود الأيسر) — كروت مطورين كبيرة ومثبّتة */
export function MainDeveloperAds({ className = "" }: { className?: string }) {
  const { t } = useI18n();

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative overflow-hidden rounded-3xl border border-gold-200 bg-white p-4 shadow-soft">
        <MashrabiyaLayer tone="light" className="opacity-[0.06]" />
        <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-gold-400/60 to-transparent" />
        <h2 className="relative flex items-center gap-2 text-sm font-bold text-ocean-900">
          <Megaphone className="h-4 w-4 text-gold-600" />
          {t("ads.mainPlacement")}
        </h2>
        <p className="relative mt-1 text-[11px] leading-5 text-sand-700">
          {t("ads.mainPlacementDesc")}
        </p>
      </div>

      {FEATURED_DEVELOPERS.slice(0, 2).map(({ name, project, city }, index) => (
        <Link
          key={name}
          href="/#properties"
          className="group block transition duration-300 hover:-translate-y-0.5 hover:[filter:drop-shadow(0_14px_20px_rgba(30,38,73,0.18))]"
        >
          {/* انحناءة علوية هادئة لرأس كرت المطور مع نقشة مشربية ذهبية */}
          <div className="relative h-24 overflow-hidden rounded-t-2xl bg-gradient-to-b from-gold-400 via-gold-500 to-gold-600 p-px">
            <div
              className={`relative h-full w-full overflow-hidden rounded-t-[15px] bg-gradient-to-br ${
                AD_GRADIENTS[index % AD_GRADIENTS.length]
              }`}
            >
              <MashrabiyaLayer tone="dark" className="opacity-[0.12]" />
              <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-gold-400/70 to-transparent" />
              <span className="absolute bottom-3 end-3 inline-flex items-center gap-1 rounded-full border border-gold-300/60 bg-black/45 px-2.5 py-1 text-[10px] font-bold text-gold-200 backdrop-blur">
                <VerifiedSeal title={t("seal.title")} className="h-3.5 w-3.5" />
                {t("ads.devBadge")}
              </span>
            </div>
          </div>

          <div className="relative flex flex-col overflow-hidden rounded-b-2xl border-x border-sand-300 bg-white">
            <div className="p-4">
              <p className="line-clamp-2 text-sm font-bold text-ocean-900">
                {t(project)}
              </p>
              <p className="mt-1 text-xs font-semibold text-sand-700">
                {t(name)}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-sand-500">
                <MapPin className="h-3 w-3" />
                {t(city)}
              </p>
              <span className="mt-3 block rounded-full bg-ocean-700 px-3 py-2 text-center text-xs font-bold text-white transition group-hover:bg-ocean-800">
                {t("ads.exploreProject")}
              </span>
            </div>

            {/* قاعدة ذهبية/نحاسية عريضة */}
            <span
              aria-hidden
              className="block h-1.5 w-full shrink-0 bg-gradient-to-l from-gold-700 via-gold-400 to-gold-700"
            />
          </div>
        </Link>
      ))}

      <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-gold-300 bg-sand-50 p-4 text-center">
        <MashrabiyaLayer tone="light" className="opacity-[0.05]" />
        <p className="relative text-sm font-bold text-ocean-900">
          {t("ads.yourAdHere")}
        </p>
        <p className="relative mt-1 text-[11px] leading-5 text-sand-700">
          {t("ads.yourAdHereDesc")}
        </p>
        <Link
          href="/register?redirect=/add-property"
          className="relative mt-3 block rounded-full bg-ocean-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-ocean-800"
        >
          {t("ads.sidebar.cta")}
        </Link>
      </div>
    </div>
  );
}
