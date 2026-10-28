"use client";

import Link from "next/link";
import { ArrowLeft, Headset, MapPin, ShieldCheck } from "lucide-react";
import { Property } from "@/types/property";
import { useI18n } from "@/lib/i18n";
import { cityLabel } from "@/lib/i18n/cities";
import { propertyTypeLabel } from "@/lib/i18n/taxonomy";
import { useCurrency } from "@/lib/currency";

interface Props {
  property: Property;
  /** نسخة مصغّرة — تُستخدم عند الحاجة لشبكة أكثر كثافة */
  compact?: boolean;
}

export default function PropertyCard({ property, compact = false }: Props) {
  const { t, locale } = useI18n();
  const { formatWithSymbol } = useCurrency();

  const pricePerMeter =
    property.area > 0 ? Math.round(property.price / property.area) : 0;
  const areaValue = new Intl.NumberFormat(
    locale === "ar" ? "ar-EG" : "en-US"
  ).format(property.area);
  const roomsValue = new Intl.NumberFormat(
    locale === "ar" ? "ar-EG" : "en-US"
  ).format(property.rooms);
  const isRent = (property.purpose ?? "بيع") === "إيجار";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:border-gold-300/70 hover:shadow-[0_24px_50px_-24px_rgba(20,26,51,0.35)]">
      <Link
        href={`/property/${property.id}`}
        className={`relative block overflow-hidden bg-sand-200 ${
          compact ? "h-40" : "h-52"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={property.image}
          alt={property.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ocean-950/45 via-transparent to-transparent"
        />

        {/* شارة التوثيق */}
        <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-lg border border-gold-400/50 bg-white/95 px-2.5 py-1 text-[10.5px] font-extrabold text-gold-900 backdrop-blur">
          <ShieldCheck className="h-3.5 w-3.5 text-gold-500" />
          {t("home.listings.verified")}
        </span>

        {/* نوع العرض */}
        <span className="absolute left-3 top-3 z-10 rounded-lg bg-ocean-950/75 px-2.5 py-1 text-[10.5px] font-bold text-white backdrop-blur">
          {isRent ? t("home.listings.rentTag") : t("home.listings.sale")}
        </span>
      </Link>

      <div className={`flex flex-1 flex-col ${compact ? "p-3.5" : "p-4"}`}>
        <div className="flex items-baseline justify-between gap-2">
          {property.priceByAdmin ? (
            <p className="text-[12px] font-black leading-5 text-gold-700">
              {t("property.priceByAdmin")}
            </p>
          ) : (
            <p className="text-xl font-black tracking-tight text-ocean-900">
              {formatWithSymbol(property.price)}
            </p>
          )}
          {!property.priceByAdmin && (
            <p className="whitespace-nowrap text-[10.5px] font-semibold text-sand-600">
              {formatWithSymbol(pricePerMeter)}/{t("common.sqm")}
            </p>
          )}
        </div>

        <Link href={`/property/${property.id}`}>
          <h3 className="mt-2 line-clamp-1 text-[15px] font-extrabold leading-6 text-ocean-900 transition group-hover:text-ocean-600">
            {property.title}
          </h3>
        </Link>

        <p className="mt-1.5 flex items-center gap-1 text-[11.5px] font-semibold text-sand-700">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-gold-500" />
          <span className="line-clamp-1">
            {cityLabel(property.city, t, locale)} · {property.district}
          </span>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {property.rooms > 0 && (
            <span className="rounded-md bg-ocean-50 px-2 py-1 text-[10.5px] font-bold text-ocean-700">
              {t("property.roomsCount", { count: roomsValue })}
            </span>
          )}
          <span className="rounded-md bg-ocean-50 px-2 py-1 text-[10.5px] font-bold text-ocean-700">
            {areaValue} {t("common.sqm")}
          </span>
          <span className="rounded-md bg-ocean-50 px-2 py-1 text-[10.5px] font-bold text-ocean-700">
            {propertyTypeLabel(property.type, t)}
          </span>
          {!property.priceByAdmin && property.negotiable !== undefined && (
            <span
              className={`rounded-md px-2 py-1 text-[10.5px] font-bold ${
                property.negotiable
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-sand-100 text-sand-700"
              }`}
            >
              {property.negotiable
                ? t("property.negotiable")
                : t("property.nonNegotiable")}
            </span>
          )}
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-sand-600">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-gold-500" />
          {t("home.listings.manage")}
        </p>

        <div className="mt-auto flex items-center gap-2 border-t border-sand-200 pt-3">
          <Link
            href={`/property/${property.id}`}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-ocean-900 text-xs font-extrabold text-white transition hover:bg-ocean-950"
          >
            {t("home.listings.details")}
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/property/${property.id}`}
            title={t("home.listings.manageShort")}
            aria-label={t("home.listings.manageShort")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold-200 bg-gold-50 text-gold-600 transition hover:border-gold-300 hover:bg-gold-100"
          >
            <Headset className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
