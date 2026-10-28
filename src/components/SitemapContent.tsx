"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Compass,
  FileText,
  Home,
  MapPin,
  Scale,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cityLabel } from "@/lib/i18n/cities";
import { useActiveCities } from "@/lib/cities-store";

interface Group {
  titleAr: string;
  titleEn: string;
  links: { ar: string; en: string; href: string; Icon: typeof Home }[];
}

const GROUPS: Group[] = [
  {
    titleAr: "الرئيسية",
    titleEn: "Home",
    links: [
      { ar: "الصفحة الرئيسية", en: "Home page", href: "/", Icon: Home },
      { ar: "أحدث العقارات", en: "Latest listings", href: "/#properties", Icon: Building2 },
      { ar: "المشاريع المميزة", en: "Featured projects", href: "/#projects", Icon: ShieldCheck },
    ],
  },
  {
    titleAr: "الخدمات",
    titleEn: "Services",
    links: [
      { ar: "البوصلة العقارية", en: "Market guide", href: "/market-guide", Icon: Compass },
      { ar: "الاستشارات القانونية", en: "Legal consultations", href: "/legal-consultational", Icon: Scale },
      { ar: "دليل المطورين", en: "Developers directory", href: "/developers", Icon: Building2 },
      { ar: "دليل المسوقين", en: "Marketers directory", href: "/brokers", Icon: UserPlus },
      { ar: "دليل المحامين", en: "Lawyers directory", href: "/lawyers", Icon: Scale },
      { ar: "انضم إلى الدليل", en: "Join the directory", href: "/login?redirect=%2Fjoin", Icon: ShieldCheck },
      { ar: "أضف عقارك", en: "List your property", href: "/add-property", Icon: FileText },
    ],
  },
  {
    titleAr: "الحساب",
    titleEn: "Account",
    links: [
      { ar: "تسجيل الدخول", en: "Sign in", href: "/login", Icon: Home },
      { ar: "إنشاء حساب موثّق", en: "Create verified account", href: "/register", Icon: UserPlus },
    ],
  },
  {
    titleAr: "معلومات قانونية",
    titleEn: "Legal",
    links: [
      { ar: "بيانات الشركة المالكة", en: "Company information", href: "/company", Icon: Building2 },
      { ar: "سياسة الخصوصية", en: "Privacy policy", href: "/privacy", Icon: ShieldCheck },
      { ar: "الشروط والأحكام", en: "Terms & conditions", href: "/terms", Icon: FileText },
    ],
  },
];

export default function SitemapContent() {
  const { t, locale } = useI18n();
  const cities = useActiveCities();
  const ar = locale === "ar";

  return (
    <div className="bg-sand-50">
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#141a33_0%,#242e5c_58%,#141a33_100%)]">
        <span
          aria-hidden
          className="pointer-events-none absolute -end-24 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(217,185,92,0.24),transparent_65%)]"
        />
        <div className="relative mx-auto w-full max-w-[1100px] px-4 py-12 sm:px-6 sm:py-16">
          <p className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.2em] text-gold-300">
            <span aria-hidden className="h-px w-6 bg-gold-400/70" />
            {ar ? "خريطة الموقع" : "Sitemap"}
          </p>
          <h1 className="mt-3 text-[26px] font-black leading-[44px] text-white sm:text-[34px]">
            {ar ? "كل صفحات عقار FAMILY" : "Every Aqaar FAMILY page"}
          </h1>
          <p className="mt-3 max-w-2xl text-[12.5px] leading-8 text-white/70">
            {ar
              ? "روابط سريعة لكل أقسام المنصة: العقارات، المدن المعتمدة، الخدمات، والحساب."
              : "Quick links to every part of the platform: listings, approved cities, services, and your account."}
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1100px] px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {GROUPS.map((group) => (
            <section
              key={group.titleEn}
              className="rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)]"
            >
              <h2 className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.18em] text-gold-600">
                <span aria-hidden className="h-px w-5 bg-gold-400/70" />
                {ar ? group.titleAr : group.titleEn}
              </h2>
              <ul className="mt-3 space-y-1">
                {group.links.map(({ ar: labelAr, en: labelEn, href, Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12px] font-semibold text-sand-800 transition hover:bg-sand-50 hover:text-gold-700"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sand-50 text-gold-600 transition group-hover:bg-gold-50">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {ar ? labelAr : labelEn}
                      <ArrowLeft className="ms-auto h-3.5 w-3.5 text-sand-400 transition group-hover:text-gold-600 rtl:rotate-180" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-4 rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)]">
          <h2 className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.18em] text-gold-600">
            <span aria-hidden className="h-px w-5 bg-gold-400/70" />
            {ar ? "المدن المعتمدة" : "Approved cities"}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {cities.map((city) => (
              <Link
                key={city.id}
                href="/#properties"
                className="inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-sand-50 px-3 py-1.5 text-[11px] font-bold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/60"
              >
                <MapPin className="h-3 w-3 text-gold-600" />
                {cityLabel(city.nameAr, t, locale)}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
