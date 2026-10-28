"use client";

import Link from "next/link";
import {
  Bath,
  BedDouble,
  Building2,
  Check,
  ChevronLeft,
  FileText,
  Headset,
  Home,
  Lock,
  MapPin,
  Ruler,
  ScanLine,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { Property } from "@/types/property";
import { useI18n } from "@/lib/i18n";
import { CITY_NAMES, cityLabel, cityMatches } from "@/lib/i18n/cities";
import { propertyTypeLabel, sellerTypeLabel } from "@/lib/i18n/taxonomy";
import { useCurrency } from "@/lib/currency";
import { useSiteSettings } from "@/lib/site-settings";
import ImageSlider from "./ImageSlider";
import InstallmentCard from "./InstallmentCard";
import PropertyDetailMapDynamic from "./PropertyDetailMapDynamic";

interface Props {
  property: Property;
}

/** عنوان صغير ذهبي فوق كل قسم — لغة بصرية موحدة مع الصفحة الرئيسية */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-gold-600">
      <span aria-hidden className="h-px w-6 bg-gold-400/70" />
      {children}
    </span>
  );
}

export default function PropertyDetail({ property }: Props) {
  const { t, locale } = useI18n();
  const { formatWithSymbol } = useCurrency();
  const site = useSiteSettings();

  const numberFormat = new Intl.NumberFormat(
    locale === "ar" ? "ar-EG" : "en-US"
  );
  const pricePerMeter =
    !property.priceByAdmin && property.area > 0
      ? Math.round(property.price / property.area)
      : 0;
  const badge =
    property.type === "فيلا" || property.price >= 3_000_000
      ? t("property.badge.featured")
      : t("property.badge.ready");
  const isRent = (property.purpose ?? "بيع") === "إيجار";
  const isApprovedCity =
    (CITY_NAMES as readonly string[]).includes(property.city) ||
    property.city === "دمياط القديمة";

  const verificationId = `AQ-${property.id.toUpperCase()}`;

  const specs = [
    {
      Icon: Ruler,
      label: t("property.area"),
      value: `${numberFormat.format(property.area)} ${t("common.sqm")}`,
    },
    {
      Icon: BedDouble,
      label: t("property.rooms"),
      value: property.rooms > 0 ? numberFormat.format(property.rooms) : "—",
    },
    {
      Icon: Bath,
      label: t("property.bathrooms"),
      value:
        property.bathrooms > 0 ? numberFormat.format(property.bathrooms) : "—",
    },
    {
      Icon: Home,
      label: t("property.type"),
      value: propertyTypeLabel(property.type, t),
    },
    {
      Icon: MapPin,
      label: t("property.district"),
      value: property.district,
    },
    {
      Icon: Building2,
      label: t("property.city"),
      value: cityLabel(property.city, t),
    },
    {
      Icon: Tag,
      label: t("property.pricePerMeter"),
      value: property.priceByAdmin
        ? t("property.priceByAdmin")
        : formatWithSymbol(pricePerMeter),
    },
    {
      Icon: ScanLine,
      label: t("property.seller"),
      value: sellerTypeLabel(property.sellerType, t),
    },
  ];

  const dossierChecks = [
    t("home.dossier.check1"),
    t("home.dossier.check2"),
    t("home.dossier.check3"),
  ];

  const managementMail = `mailto:${site.managementEmail}?subject=${encodeURIComponent(
    `${t("home.dossier.cta")} — ${property.title}`
  )}`;

  return (
    <div className="bg-sand-50">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 sm:py-9">
        {/* ====================== BREADCRUMB ====================== */}
        <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-2 text-[12px] text-sand-700">
          <Link href="/" className="transition hover:text-gold-600">
            {t("footer.home")}
          </Link>
          <ChevronLeft className="h-3.5 w-3.5 text-sand-400 rtl:rotate-180" />
          <Link
            href={{
              pathname: "/",
              query: { city: property.city },
            }}
            className="transition hover:text-gold-600"
          >
            {cityLabel(property.city, t)}
          </Link>
          <ChevronLeft className="h-3.5 w-3.5 text-sand-400 rtl:rotate-180" />
          <span className="max-w-[220px] truncate font-bold text-ocean-900 sm:max-w-none">
            {property.title}
          </span>
        </nav>

        {/* ====================== HEADER ====================== */}
        <header className="mt-4 overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-[0_26px_70px_-65px_rgba(20,26,51,0.55)]">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <Eyebrow>عقار FAMILY</Eyebrow>
              <h1 className="mt-2 text-[22px] font-black leading-8 text-ocean-900 sm:text-[27px] sm:leading-9">
                {property.title}
              </h1>

              <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-sand-700">
                <MapPin className="h-4 w-4 shrink-0 text-gold-500" />
                {property.district} · {cityLabel(property.city, t)}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-gold-300/70 bg-gold-50 px-2.5 py-1 text-[10.5px] font-extrabold text-gold-800">
                  <ShieldCheck className="h-3.5 w-3.5 text-gold-500" />
                  {t("home.listings.verified")}
                </span>
                <span className="rounded-lg bg-ocean-950 px-2.5 py-1 text-[10.5px] font-bold text-white">
                  {badge}
                </span>
                <span className="rounded-lg bg-ocean-50 px-2.5 py-1 text-[10.5px] font-bold text-ocean-700">
                  {propertyTypeLabel(property.type, t)}
                </span>
                <span className="rounded-lg border border-sand-200 bg-sand-50 px-2.5 py-1 text-[10.5px] font-bold text-sand-800">
                  {isRent ? t("home.listings.rentTag") : t("home.listings.sale")}
                </span>
                <span className="rounded-lg border border-sand-200 bg-sand-50 px-2.5 py-1 text-[10.5px] font-semibold text-sand-700">
                  {sellerTypeLabel(property.sellerType, t)}
                </span>
                {!property.priceByAdmin && property.negotiable !== undefined && (
                  <span
                    className={`rounded-lg px-2.5 py-1 text-[10.5px] font-bold ${
                      property.negotiable
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-sand-200 bg-sand-50 text-sand-700"
                    }`}
                  >
                    {property.negotiable
                      ? t("property.negotiable")
                      : t("property.nonNegotiable")}
                  </span>
                )}
                {property.priceByAdmin && (
                  <span className="rounded-lg border border-gold-300/70 bg-gold-50 px-2.5 py-1 text-[10.5px] font-bold text-gold-800">
                    {t("property.priceByAdmin")}
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 rounded-2xl border border-sand-200 bg-sand-50/70 p-4 lg:hidden">
              <p className="text-[11px] font-bold text-sand-600">
                {t("property.totalPrice")}
              </p>
              {property.priceByAdmin ? (
                <>
                  <p className="mt-1 text-[13.5px] font-black leading-6 text-gold-800">
                    {t("property.priceByAdmin")}
                  </p>
                  <p className="mt-1.5 text-[10.5px] font-semibold leading-5 text-sand-600">
                    {t("property.priceByAdminHint")}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-2xl font-black tracking-tight text-ocean-900">
                    {formatWithSymbol(property.price)}
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold text-sand-600">
                    {t("property.pricePerMeterEstimated")}{" "}
                    <span className="font-bold text-ocean-800">
                      {formatWithSymbol(pricePerMeter)}
                    </span>
                  </p>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ====================== GALLERY ====================== */}
        <div className="mt-4">
          <ImageSlider images={property.images} title={property.title} />
        </div>

        {/* ====================== BODY ====================== */}
        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[368px_minmax(0,1fr)] xl:grid-cols-[392px_minmax(0,1fr)]">
          {/* كارت السعر والتواصل — يظهر يمين الصفحة في RTL */}
          <InstallmentCard
            price={property.price}
            title={property.title}
            priceByAdmin={property.priceByAdmin}
            negotiable={property.negotiable}
          />

          <div className="min-w-0 space-y-5">
            {/* ---------- ملف التوثيق ---------- */}
            <section className="relative overflow-hidden rounded-3xl border border-gold-300/60 bg-[linear-gradient(135deg,rgba(201,146,42,0.12),rgba(255,255,255,0.92)_55%)] p-5 sm:p-6">
              <span
                aria-hidden
                className="pointer-events-none absolute -end-16 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(201,146,42,0.18),transparent_65%)]"
              />
              <div className="relative">
                <Eyebrow>{t("home.dossier.title")}</Eyebrow>
                <h2 className="mt-2 text-lg font-black text-ocean-900">
                  هذا العرض مرّ على 3 خطوات تحقق قبل النشر
                </h2>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {dossierChecks.map((check, i) => (
                    <div
                      key={check}
                      className="flex items-start gap-2 rounded-2xl border border-white/80 bg-white/85 p-3"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500 text-white">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      <div>
                        <p className="text-[11.5px] font-extrabold leading-5 text-ocean-900">
                          {check}
                        </p>
                        <p className="text-[10.5px] font-bold text-emerald-600">
                          {i === 2 ? t("home.dossier.check3.value") : "معتمد"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gold-300/40 pt-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-sand-800">
                    <FileText className="h-3.5 w-3.5 text-gold-600" />
                    {t("home.dossier.verificationId")}:
                    <span className="font-mono text-ocean-900" dir="ltr">
                      {verificationId}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-sand-700">
                    <Lock className="h-3.5 w-3.5 text-gold-600" />
                    {t("home.dossier.hiddenTitle")}
                  </span>
                </div>

                <a
                  href={managementMail}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-ocean-950 px-4 py-2.5 text-[12px] font-extrabold text-white transition hover:bg-ocean-900"
                >
                  <Headset className="h-4 w-4" />
                  {t("home.dossier.cta")}
                </a>
              </div>
            </section>

            {/* ---------- التفاصيل ---------- */}
            <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] sm:p-6">
              <Eyebrow>{t("property.details")}</Eyebrow>
              <h2 className="mt-2 text-lg font-black text-ocean-900">
                مواصفات العقار
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {specs.map(({ Icon, label, value }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-sand-200 bg-sand-50/70 p-3 transition hover:border-gold-300/70 hover:bg-gold-50/40"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-gold-600 shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="mt-2 text-[10.5px] font-bold text-sand-600">
                      {label}
                    </p>
                    <p className="mt-0.5 text-[12.5px] font-extrabold leading-5 text-ocean-900">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* ---------- الوصف ---------- */}
            <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] sm:p-6">
              <Eyebrow>{t("property.description")}</Eyebrow>
              <h2 className="mt-2 text-lg font-black text-ocean-900">
                تفاصيل يكتبها فريق عقار FAMILY
              </h2>
              <p className="mt-3 text-[13.5px] leading-8 text-ocean-800/90">
                {property.description}
              </p>
            </section>

            {/* ---------- المدينة والمنطقة ---------- */}
            <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Eyebrow>{t("property.cityAndDistrict")}</Eyebrow>
                  <h2 className="mt-2 text-lg font-black text-ocean-900">
                    {cityLabel(property.city, t)} · {property.district}
                  </h2>
                </div>
                {isApprovedCity && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-extrabold text-emerald-700">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    {t("property.approvedCity")}
                  </span>
                )}
              </div>

              <p className="mt-4 text-[11px] font-bold text-sand-600">
                {t("property.approvedCities")}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {CITY_NAMES.map((city) => {
                  const active = cityMatches(property.city, city);
                  return (
                    <span
                      key={city}
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                        active
                          ? "bg-ocean-950 text-white"
                          : "border border-sand-200 bg-sand-50 text-sand-700"
                      }`}
                    >
                      {cityLabel(city, t)}
                    </span>
                  );
                })}
              </div>
            </section>

            {/* ---------- الموقع على الخريطة ---------- */}
            <section className="overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)]">
              <div className="p-5 pb-4 sm:p-6 sm:pb-4">
                <Eyebrow>{t("property.location")}</Eyebrow>
                <h2 className="mt-2 text-lg font-black text-ocean-900">
                  موقع العقار على الخريطة
                </h2>
                <p className="mt-1 text-[12px] font-medium text-sand-700">
                  {property.district}، {cityLabel(property.city, t)} — العلامة الذهبية
                  تشير إلى الموقع التقريبي، والعنوان الدقيق يُنسَّق عبر إدارة الموقع
                  أثناء المعاينة.
                </p>
              </div>
              <div className="px-3 pb-3 sm:px-5 sm:pb-5">
                <PropertyDetailMapDynamic
                  lat={property.lat}
                  lng={property.lng}
                  title={property.title}
                />
              </div>
            </section>

            {/* ---------- تنبيه التواصل ---------- */}
            <section className="flex flex-col gap-3 rounded-3xl border border-ocean-900/10 bg-ocean-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-gold-300">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[13.5px] font-black">كل التواصل عبر إدارة الموقع</p>
                  <p className="mt-1 text-[11.5px] leading-6 text-white/70">
                    بيانات المالك والمستندات محجوبة تماماً — إدارة الموقع هي اللي
                    بتنسّق المعاينة والتفاوض.
                  </p>
                </div>
              </div>
              <Link
                href={{ pathname: "/", hash: "properties" }}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-white/25 px-4 py-2.5 text-[12px] font-bold text-white transition hover:border-gold-300 hover:text-gold-200"
              >
                {t("home.listings.seeAll")}
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
