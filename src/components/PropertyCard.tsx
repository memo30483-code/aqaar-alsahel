"use client";

import Link from "next/link";
import { Property } from "@/types/property";
import { useI18n } from "@/lib/i18n";
import { cityLabel } from "@/lib/i18n/cities";
import { propertyTypeLabel } from "@/lib/i18n/taxonomy";
import { useCurrency } from "@/lib/currency";
import { VerifiedSeal } from "@/components/Ornaments";

/** رقم واتساب تجريبي يُستخدم عند عدم توفر رقم للعقار */
const DEMO_WHATSAPP = "201012345678";

interface Props {
  property: Property;
  /** نسخة مصغّرة (Compact Card) لعرض أكبر عدد من العقارات في التغذية الوسطى */
  compact?: boolean;
}

export default function PropertyCard({ property, compact = false }: Props) {
  const { t, locale } = useI18n();
  const { formatWithSymbol } = useCurrency();

  const pricePerMeter =
    property.area > 0 ? Math.round(property.price / property.area) : 0;
  const badge =
    property.type === "فيلا" || property.price >= 3_000_000
      ? t("property.badge.featured")
      : t("property.badge.ready");
  const areaValue = new Intl.NumberFormat(
    locale === "ar" ? "ar-EG" : "en-US"
  ).format(property.area);

  const whatsappHref = () => {
    const number = property.whatsapp?.replace(/\D/g, "") || DEMO_WHATSAPP;
    const message = encodeURIComponent(
      t("property.whatsappMessage", {
        title: property.title,
        district: property.district,
        city: cityLabel(property.city, t),
        price: formatWithSymbol(property.price),
      })
    );
    return `https://wa.me/${number}?text=${message}`;
  };

  return (
    <article className="group flex h-full flex-col transition duration-300 hover:-translate-y-1 hover:[filter:drop-shadow(0_16px_24px_rgba(30,38,73,0.18))]">
      <Link href={`/property/${property.id}`} className="block">
        {/* انحناءة علوية هادئة (Soft Curve) تحتضن صورة العقار داخل إطار ذهبي رقيق */}
        <div
          className={`relative overflow-hidden rounded-t-2xl bg-gradient-to-b from-gold-400 via-gold-500 to-gold-600 p-px ${
            compact ? "h-40" : "h-56"
          }`}
        >
          <div className="relative h-full w-full overflow-hidden rounded-t-[15px] bg-sand-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={property.image}
              alt={property.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            {/* خط ذهبي رفيع يفصل الصورة عن جسم الكارت */}
            <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-gold-400/70 to-transparent" />
          </div>
          <span
            title={t("seal.title")}
            className={`absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full border border-gold-300/80 bg-gradient-to-br from-gold-100 via-gold-200 to-gold-400 font-bold text-gold-900 shadow-sm ${
              compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
            }`}
          >
            <VerifiedSeal
              title={t("seal.title")}
              className={compact ? "h-3 w-3" : "h-3.5 w-3.5"}
            />
            {badge}
          </span>
          <span
            className={`absolute bottom-3 left-3 rounded-full border border-sand-200 bg-white/90 font-bold text-ocean-900 backdrop-blur ${
              compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
            }`}
          >
            {propertyTypeLabel(property.type, t)}
          </span>
        </div>
      </Link>

      <div className="relative flex flex-1 flex-col overflow-hidden rounded-b-2xl border-x border-sand-300 bg-white">
        <div className={`flex flex-1 flex-col ${compact ? "p-3" : "p-4"}`}>
          <Link href={`/property/${property.id}`} className="block">
            <h3
              className={`line-clamp-1 font-bold text-ocean-900 transition group-hover:text-ocean-600 ${
                compact ? "text-sm" : "text-base"
              }`}
            >
              {property.title}
            </h3>
          </Link>

          <p
            className={`mt-1 text-sand-700 ${
              compact ? "text-[11px]" : "text-sm"
            }`}
          >
            {property.district} · {cityLabel(property.city, t)} · {areaValue}{" "}
            {t("common.sqm")}
            {property.rooms > 0
              ? ` · ${t("property.roomsCount", { count: property.rooms })}`
              : ""}
          </p>

          <div
            className={`mt-2 border-t border-sand-200 ${
              compact ? "pt-2" : "pt-3"
            }`}
          >
            <p
              className={`font-black tracking-tight text-ocean-900 ${
                compact ? "text-lg" : "text-xl"
              }`}
            >
              {formatWithSymbol(property.price)}
            </p>
            <p
              className={`mt-0.5 text-sand-600 ${
                compact ? "text-[10px]" : "text-xs"
              }`}
            >
              {t("property.pricePerMeterEstimated")}{" "}
              <span className="font-bold text-sand-800">
                {formatWithSymbol(pricePerMeter)}
              </span>
            </p>
          </div>

          <a
            href={whatsappHref()}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-auto flex items-center justify-center gap-2 rounded-xl bg-[#25D366] font-bold text-white transition hover:bg-[#1ebe57] ${
              compact ? "pt-2 pb-2 px-3 text-xs" : "pt-2.5 pb-3 px-4 text-sm"
            }`}
          >
            <WhatsAppIcon />
            {t("property.whatsappCta")}
          </a>
        </div>

        {/* قاعدة فرعونية: خط سفلي متين بلمسة ذهبية ونحاسية عريضة */}
        <span
          aria-hidden
          className="block h-1.5 w-full shrink-0 bg-gradient-to-l from-gold-700 via-gold-400 to-gold-700"
        />
      </div>
    </article>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
