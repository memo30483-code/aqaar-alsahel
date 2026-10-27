"use client";

import Link from "next/link";
import { Property } from "@/types/property";
import { useI18n } from "@/lib/i18n";
import { CITY_NAMES, cityLabel, cityMatches } from "@/lib/i18n/cities";
import { propertyTypeLabel, sellerTypeLabel } from "@/lib/i18n/taxonomy";
import { useCurrency } from "@/lib/currency";
import ImageSlider from "./ImageSlider";
import InstallmentCard from "./InstallmentCard";
import PropertyDetailMapDynamic from "./PropertyDetailMapDynamic";

interface Props {
  property: Property;
}

export default function PropertyDetail({ property }: Props) {
  const { t, locale } = useI18n();
  const { formatWithSymbol } = useCurrency();

  const numberFormat = new Intl.NumberFormat(
    locale === "ar" ? "ar-EG" : "en-US"
  );
  const pricePerMeter =
    property.area > 0 ? Math.round(property.price / property.area) : 0;
  const badge =
    property.type === "فيلا" || property.price >= 3_000_000
      ? t("property.badge.featured")
      : t("property.badge.ready");
  const isApprovedCity =
    (CITY_NAMES as readonly string[]).includes(property.city) ||
    property.city === "دمياط القديمة";

  const specs = [
    {
      label: t("property.area"),
      value: `${numberFormat.format(property.area)} ${t("common.sqm")}`,
    },
    {
      label: t("property.rooms"),
      value: property.rooms > 0 ? numberFormat.format(property.rooms) : "—",
    },
    {
      label: t("property.bathrooms"),
      value:
        property.bathrooms > 0 ? numberFormat.format(property.bathrooms) : "—",
    },
    { label: t("property.type"), value: propertyTypeLabel(property.type, t) },
    { label: t("property.district"), value: property.district },
    { label: t("property.city"), value: cityLabel(property.city, t) },
    {
      label: t("property.pricePerMeter"),
      value: formatWithSymbol(pricePerMeter),
    },
    {
      label: t("property.seller"),
      value: sellerTypeLabel(property.sellerType, t),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-ocean-500">
        <Link href="/" className="hover:text-ocean-800">
          {t("footer.home")}
        </Link>
        <span>/</span>
        <span className="text-ocean-400">{cityLabel(property.city, t)}</span>
        <span>/</span>
        <span className="font-medium text-ocean-800 line-clamp-1">
          {property.title}
        </span>
      </nav>

      <ImageSlider images={property.images} title={property.title} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr] lg:items-start xl:grid-cols-[380px_1fr]">
        {/* في RTL العمود الأول يظهر يمين — كارت السعر والتواصل */}
        <InstallmentCard price={property.price} title={property.title} />

        <div className="space-y-6">
          <header className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-black px-2.5 py-1 text-xs font-bold text-white">
                {badge}
              </span>
              <span className="rounded-lg bg-ocean-100 px-2.5 py-1 text-xs font-bold text-ocean-800">
                {propertyTypeLabel(property.type, t)}
              </span>
              <span className="rounded-lg bg-ocean-50 px-2.5 py-1 text-xs font-semibold text-ocean-600">
                {sellerTypeLabel(property.sellerType, t)}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold text-ocean-900 sm:text-3xl">
              {property.title}
            </h1>
            <p className="mt-2 text-sm text-ocean-500">
              {property.district} · {cityLabel(property.city, t)}
            </p>
            <p className="mt-3 text-lg font-bold text-ocean-700 lg:hidden">
              {formatWithSymbol(property.price)}
            </p>
            <p className="mt-1 text-xs text-ocean-500 lg:hidden">
              {t("property.pricePerMeterEstimated")}{" "}
              <span className="font-bold text-ocean-700">
                {formatWithSymbol(pricePerMeter)}
              </span>
            </p>
          </header>

          <section className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-bold text-ocean-900">
              {t("property.details")}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {specs.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-ocean-50 bg-ocean-50/40 px-3 py-3"
                >
                  <p className="text-xs font-semibold text-ocean-500">
                    {s.label}
                  </p>
                  <p className="mt-1 text-sm font-bold text-ocean-900">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-ocean-900">
                {t("property.cityAndDistrict")}
              </h2>
              {isApprovedCity && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  {t("property.approvedCity")}
                </span>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-ocean-50 bg-ocean-50/40 px-4 py-3">
                <p className="text-xs font-semibold text-ocean-500">
                  {t("property.city")}
                </p>
                <p className="mt-1 text-sm font-bold text-ocean-900">
                  {cityLabel(property.city, t)}
                </p>
              </div>
              <div className="rounded-xl border border-ocean-50 bg-ocean-50/40 px-4 py-3">
                <p className="text-xs font-semibold text-ocean-500">
                  {t("property.district")}
                </p>
                <p className="mt-1 text-sm font-bold text-ocean-900">
                  {property.district}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs font-semibold text-ocean-500">
              {t("property.approvedCities")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CITY_NAMES.map((city) => (
                <span
                  key={city}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    cityMatches(property.city, city)
                      ? "bg-ocean-700 text-white"
                      : "bg-ocean-50 text-ocean-600"
                  }`}
                >
                  {cityLabel(city, t)}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-bold text-ocean-900">
              {t("property.description")}
            </h2>
            <p className="mt-3 leading-8 text-ocean-700">
              {property.description}
            </p>
          </section>

          <section className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-bold text-ocean-900">
              {t("property.location")}
            </h2>
            <p className="mt-1 text-sm text-ocean-500">
              {property.district}، {cityLabel(property.city, t)}
            </p>
            <div className="mt-4">
              <PropertyDetailMapDynamic
                lat={property.lat}
                lng={property.lng}
                title={property.title}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
