"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Gift,
  Headset,
  Lock,
  MapPin,
  Percent,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  getActiveOffers,
  getOffersSettings,
  type Offer,
} from "@/lib/admin-system";
import { mockProperties, USER_PROPERTIES_KEY } from "@/data/properties";
import type { Property } from "@/types/property";
import { useI18n } from "@/lib/i18n";
import { cityLabel } from "@/lib/i18n/cities";
import { useCurrency } from "@/lib/currency";
import { telHref, useSiteSettings } from "@/lib/site-settings";
import { filterPublishedProperties } from "@/lib/public-listings";

/** قراءة إعلانات المستخدم المحفوظة محلياً — تُستخدم لربط العروض بأصحابها */
function readUserProperties(): Property[] {
  try {
    const stored = localStorage.getItem(USER_PROPERTIES_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? (parsed as Property[]) : [];
  } catch {
    return [];
  }
}

export default function OffersPage() {
  const { t, locale } = useI18n();
  const { formatWithSymbol } = useCurrency();
  const site = useSiteSettings();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [settings, setSettings] = useState(getOffersSettings());
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettings(getOffersSettings());
    setOffers(getActiveOffers());
    setUserProperties(readUserProperties());
    setLoaded(true);
  }, []);

  const allProperties = useMemo(
    () => filterPublishedProperties([...userProperties, ...mockProperties]),
    [userProperties]
  );

  const ar = locale === "ar";

  if (!loaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-sand-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-sand-300 border-t-gold-500" />
      </div>
    );
  }

  /* ====================== الحالة: الصفحة غير مفعّلة ====================== */
  if (!settings.enabled || offers.length === 0) {
    return (
      <div className="bg-sand-50">
        <div className="mx-auto w-full max-w-[980px] px-4 py-12 sm:px-6 sm:py-16">
          <div className="relative overflow-hidden rounded-3xl border border-sand-200 bg-white p-6 text-center shadow-[0_34px_90px_-70px_rgba(20,26,51,0.6)] sm:p-10">
            <span
              aria-hidden
              className="pointer-events-none absolute -end-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(201,146,42,0.16),transparent_65%)]"
            />
            <div className="relative">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-ocean-800 to-ocean-950 text-gold-300">
                <Gift className="h-7 w-7" />
              </span>

              <p className="mt-4 flex items-center justify-center gap-2 text-[10.5px] font-black uppercase tracking-[0.2em] text-gold-600">
                <span aria-hidden className="h-px w-6 bg-gold-400/70" />
                {ar ? "صفحة العروض" : "Offers page"}
              </p>
              <h1 className="mt-2 text-2xl font-black text-ocean-900 sm:text-[30px]">
                {ar ? settings.pageTitleAr : settings.pageTitleEn}
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-[12.5px] leading-7 text-sand-700">
                {ar ? settings.disabledMessageAr : settings.disabledMessageEn}
              </p>

              <div className="mx-auto mt-5 flex max-w-md items-start gap-2 rounded-2xl border border-sand-200 bg-sand-50/70 px-4 py-3 text-start">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                <p className="text-[11px] font-bold leading-6 text-sand-800">
                  {ar
                    ? "العروض الموسمية تُفتح تلقائياً خلال فترة العرض فقط — وتُدار بالكامل من لوحة التحكم."
                    : "Seasonal offers open automatically only during the offer window — fully managed from the dashboard."}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-gold-500 to-gold-400 px-6 py-3 text-[12.5px] font-black text-ocean-950 shadow-[0_18px_38px_-24px_rgba(201,146,42,0.95)] transition hover:-translate-y-0.5"
                >
                  {ar ? "العودة للرئيسية" : "Back to home"}
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </Link>
                <a
                  href={telHref(site.managementPhone)}
                  className="inline-flex items-center gap-2 rounded-full border border-sand-200 bg-white px-6 py-3 text-[12.5px] font-bold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/50"
                  dir="ltr"
                >
                  <Headset className="h-4 w-4 text-gold-600" />
                  {site.managementPhone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ====================== الحالة: العروض متاحة ====================== */
  const windowText =
    settings.startDate || settings.endDate
      ? [
          settings.startDate
            ? `${ar ? "من" : "From"} ${settings.startDate}`
            : null,
          settings.endDate ? `${ar ? "إلى" : "To"} ${settings.endDate}` : null,
        ]
          .filter(Boolean)
          .join(" — ")
      : ar
        ? "متاحة الآن"
        : "Available now";

  return (
    <div className="bg-sand-50">
      {/* ====================== HERO ====================== */}
      <section className="relative overflow-hidden theme-hero">
        <span
          aria-hidden
          className="pointer-events-none absolute -end-24 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(217,185,92,0.26),transparent_65%)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold-400 to-transparent"
        />

        <div className="relative mx-auto w-full max-w-[1180px] px-4 py-12 sm:px-6 sm:py-16">
          <p className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.2em] text-gold-300">
            <span aria-hidden className="h-px w-6 bg-gold-400/70" />
            {ar ? "عروض موسمية" : "Seasonal offers"}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black text-gold-200">
              <Sparkles className="h-3.5 w-3.5" />
              {ar ? "عروض حصرية" : "Exclusive offers"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white/70">
              <CalendarDays className="h-3.5 w-3.5 text-gold-300" />
              <span dir="ltr">{windowText}</span>
            </span>
            <span className="rounded-full bg-gold-500 px-2.5 py-1 text-[10px] font-black text-ocean-950">
              {ar ? "إعلان" : "Ad"}
            </span>
          </div>

          <h1 className="mt-4 text-[28px] font-black leading-[44px] tracking-tight text-white sm:text-[38px] sm:leading-[54px]">
            {ar ? settings.pageTitleAr : settings.pageTitleEn}
          </h1>
          <p className="mt-3 max-w-2xl text-[12.5px] leading-8 text-white/70 sm:text-[13px]">
            {ar ? settings.pageDescAr : settings.pageDescEn}
          </p>

          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[10.5px] font-bold text-white/70">
            <ShieldCheck className="h-3.5 w-3.5 text-gold-300" />
            {ar
              ? "كل عرض مرتبط بعقار موثّق، والتواصل عبر إدارة الموقع"
              : "Every offer is tied to a verified listing; contact via site management"}
          </p>
        </div>
      </section>

      {/* ====================== GRID ====================== */}
      <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {offers.map((offer) => {
            const linkedProperty = offer.propertyId
              ? allProperties.find((property) => property.id === offer.propertyId)
              : undefined;
            const title = ar ? offer.titleAr : offer.titleEn || offer.titleAr;
            const description = ar
              ? offer.descriptionAr
              : offer.descriptionEn || offer.descriptionAr;
            const badge = ar
              ? offer.badgeTextAr
              : offer.badgeTextEn || offer.badgeTextAr;

            return (
              <article
                key={offer.id}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] transition hover:-translate-y-1 hover:border-gold-300/70 hover:shadow-[0_30px_60px_-45px_rgba(20,26,51,0.4)]"
              >
                {/* شريط ذهبي علوي + وسم إعلان */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-l from-gold-600 via-gold-300 to-gold-200"
                />
                <span className="absolute end-4 top-4 rounded-md border border-sand-200 bg-sand-50 px-2 py-0.5 text-[9.5px] font-black text-sand-600">
                  {ar ? "إعلان" : "Ad"}
                </span>

                <div className="flex flex-1 flex-col p-5 pt-6">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-ocean-800 to-ocean-950 text-gold-300">
                      {offer.discountPercent ? (
                        <Percent className="h-5 w-5" />
                      ) : (
                        <Gift className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0 pe-10">
                      <h2 className="text-[14.5px] font-black leading-6 text-ocean-900">
                        {title}
                      </h2>
                      {badge && (
                        <span className="mt-1 inline-flex rounded-full border border-gold-300/70 bg-gold-50 px-2.5 py-0.5 text-[10px] font-extrabold text-gold-800">
                          {badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-[11.5px] leading-6 text-sand-700">
                    {description}
                  </p>

                  {/* الأسعار */}
                  {(offer.oldPrice || offer.newPrice) && (
                    <div className="mt-3.5 flex flex-wrap items-center gap-2.5 rounded-2xl border border-sand-200 bg-sand-50/70 px-3.5 py-2.5">
                      {offer.oldPrice && (
                        <span className="text-[12px] font-semibold text-sand-500 line-through">
                          {formatWithSymbol(offer.oldPrice)}
                        </span>
                      )}
                      {offer.newPrice && (
                        <span className="text-[16px] font-black text-ocean-900">
                          {formatWithSymbol(offer.newPrice)}
                        </span>
                      )}
                      {offer.discountPercent && (
                        <span className="ms-auto rounded-full bg-gold-500 px-2.5 py-1 text-[10.5px] font-black text-ocean-950">
                          {ar ? `خصم ${offer.discountPercent}%` : `${offer.discountPercent}% off`}
                        </span>
                      )}
                    </div>
                  )}

                  {/* العقار المرتبط */}
                  {linkedProperty ? (
                    <div className="mt-3 rounded-2xl border border-sand-200 bg-white p-3">
                      <p className="text-[9.5px] font-black uppercase tracking-[0.14em] text-gold-600">
                        {ar ? "مرتبط بعقار" : "Linked listing"}
                      </p>
                      <p className="mt-1 truncate text-[11.5px] font-extrabold text-ocean-900">
                        {linkedProperty.title}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10.5px] font-semibold text-sand-600">
                        <MapPin className="h-3 w-3 text-gold-500" />
                        {linkedProperty.district} ·{" "}
                        {cityLabel(linkedProperty.city, t, locale)}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-2xl border border-dashed border-sand-300 bg-sand-50/60 p-3">
                      <p className="text-[10.5px] font-bold leading-5 text-sand-600">
                        {ar
                          ? "عرض عام من إدارة الموقع — التفاصيل والتطبيق عبر التواصل مع الإدارة."
                          : "A general offer from site management — details and redemption via management."}
                      </p>
                    </div>
                  )}
                </div>

                {/* التذييل */}
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-sand-200 px-5 py-3.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-sand-600">
                    <CalendarDays className="h-3.5 w-3.5 text-gold-500" />
                    <span dir="ltr">
                      {offer.startDate && offer.endDate
                        ? `${offer.startDate} — ${offer.endDate}`
                        : offer.endDate
                          ? `${ar ? "حتى" : "Until"} ${offer.endDate}`
                          : offer.startDate
                            ? `${ar ? "يبدأ" : "Starts"} ${offer.startDate}`
                            : ar
                              ? "مفتوح"
                              : "Open"}
                    </span>
                  </span>

                  {linkedProperty ? (
                    <Link
                      href={`/property/${linkedProperty.id}`}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ocean-950 px-4 py-2 text-[11px] font-black text-white transition hover:bg-ocean-900"
                    >
                      {ar ? "شوف العقار" : "View listing"}
                      <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                    </Link>
                  ) : (
                    <a
                      href={telHref(site.managementPhone)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-l from-gold-500 to-gold-400 px-4 py-2 text-[11px] font-black text-ocean-950 transition hover:-translate-y-0.5"
                      dir="ltr"
                    >
                      <Headset className="h-3.5 w-3.5" />
                      {site.managementPhone}
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* ====================== TRUST BAND ====================== */}
        <div className="mt-8 flex flex-col gap-3 rounded-3xl border border-ocean-900/10 bg-ocean-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-gold-300">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[13px] font-black">
                {ar ? "العروض بتتحقق قبل النشر" : "Offers are verified before publishing"}
              </p>
              <p className="mt-1 max-w-xl text-[11px] leading-6 text-white/70">
                {ar
                  ? "العروض الموسمية بتتراجع من إدارة الموقع وبتترتبط بعقار موثّق — وكل تواصل أو تطبيق للعرض بيتم عبر الإدارة فقط."
                  : "Seasonal offers are reviewed by site management and linked to a verified listing — all contact or redemption goes through management only."}
              </p>
            </div>
          </div>
          <Link
            href="/#properties"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-white/25 px-4 py-2.5 text-[11.5px] font-bold text-white transition hover:border-gold-300 hover:text-gold-200"
          >
            {ar ? "تصفح العقارات" : "Browse listings"}
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </section>
    </div>
  );
}
