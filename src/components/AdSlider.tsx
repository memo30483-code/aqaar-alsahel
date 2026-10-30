"use client";

import Link from "next/link";
import { ArrowLeft, Building2, MapPin, Megaphone } from "lucide-react";
import { useI18n, type MessageKey } from "@/lib/i18n";
import type { HomeBlock } from "@/lib/home-builder-store";

interface SponsorAd {
  name: string;
  city: string;
  image: string;
  link?: string;
  translatedCity?: boolean;
}

/**
 * شرائط إعلانية منزلقة (شبيهة بأسلوب ناوي) — تُستخدم لاستغلال المساحات
 * الفارغة كمساحات إعلانية موسومة بكلمة «إعلان».
 */
const SPONSOR_ADS: SponsorAd[] = [
  {
    name: "لاجونا رأس البر",
    city: "city.rasElBar",
    translatedCity: true,
    image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=75",
  },
  {
    name: "ذا ليكس دمياط الجديدة",
    city: "city.newDamietta",
    translatedCity: true,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=75",
  },
  {
    name: "بلو باي جمصة",
    city: "city.gamasa",
    translatedCity: true,
    image: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=75",
  },
  {
    name: "وادي يمم ريزيدنس",
    city: "city.newMansoura",
    translatedCity: true,
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=75",
  },
];

function AdCard({
  ad,
  ghost = false,
  cardWidth,
}: {
  ad: SponsorAd;
  ghost?: boolean;
  cardWidth?: number;
}) {
  const { t } = useI18n();

  const inner = (
    <div
      style={cardWidth ? { width: cardWidth } : undefined}
      className="flex w-[286px] shrink-0 items-center gap-3 rounded-2xl border border-sand-200 bg-white p-2.5 shadow-[0_16px_36px_-32px_rgba(20,26,51,0.6)] transition duration-200 group-hover:-translate-y-0.5 group-hover:border-gold-300"
    >
      <span className="relative h-[74px] w-[92px] shrink-0 overflow-hidden rounded-xl bg-sand-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ad.image}
          alt={ad.name}
          loading="lazy"
          className="hb-media h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute start-1.5 top-1.5 rounded bg-white/92 px-1.5 py-0.5 text-[8px] font-black text-sand-700">
          {t("ads.label")}
        </span>
      </span>

      <span className="min-w-0">
        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-gold-600">
          <Building2 className="h-3 w-3" />
          {t("ads.devBadge")}
        </span>
        <span className="mt-0.5 block truncate text-[12.5px] font-extrabold text-ocean-900">
          {ad.name}
        </span>
        <span className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-sand-600">
          <MapPin className="h-3 w-3 text-gold-500" />
          {ad.translatedCity ? t(ad.city as MessageKey) : ad.city}
        </span>
        <span className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-extrabold text-ocean-800 group-hover:text-gold-700">
          {t("ads.exploreProject")}
          <ArrowLeft className="h-3 w-3 rtl:rotate-180" />
        </span>
      </span>
    </div>
  );

  if (ghost) return inner;

  return (
    <Link href={ad.link || "/#projects"} aria-label={ad.name} className="group block">
      {inner}
    </Link>
  );
}

export default function AdSlider({ block }: { block?: HomeBlock }) {
  const { t, locale } = useI18n();
  const customAds: SponsorAd[] = (block?.items ?? []).map((item) => ({
    name: locale === "ar" ? item.titleAr : item.titleEn || item.titleAr,
    city:
      (locale === "ar" ? item.textAr : item.textEn || item.textAr) || "",
    image:
      item.imageUrl ||
      block?.imageUrl ||
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=75",
    link: item.linkUrl || block?.linkUrl,
  }));
  const ads = customAds.length > 0 ? customAds : SPONSOR_ADS;
  const title =
    (locale === "ar" ? block?.titleAr : block?.titleEn || block?.titleAr) ||
    t("home.adstrip.title");
  const subtitle =
    (locale === "ar"
      ? block?.subtitleAr
      : block?.subtitleEn || block?.subtitleAr) || t("home.adstrip.sub");
  const cta =
    (locale === "ar"
      ? block?.linkLabelAr
      : block?.linkLabelEn || block?.linkLabelAr) || t("home.adstrip.cta");

  return (
    <section
      aria-label={t("home.adstrip.title")}
      className="relative overflow-hidden border-y border-sand-200 bg-gradient-to-l from-sand-50 via-white to-sand-50 py-5"
    >
      <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-ocean-950 text-gold-300">
            <Megaphone className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[12px] font-black text-ocean-900">
              <span className="hb-title">{title}</span>
            </p>
            <p className="text-[9.5px] font-bold text-sand-600">
              <span className="hb-body">{subtitle}</span>
            </p>
          </div>
          <span className="ms-1 rounded bg-gold-500 px-1.5 py-0.5 text-[8.5px] font-black text-ocean-950">
            {t("ads.label")}
          </span>
        </div>

        <Link
          href={block?.linkUrl || "/#projects"}
          className="hidden shrink-0 items-center gap-1 text-[11px] font-extrabold text-ocean-700 transition hover:text-gold-700 sm:flex"
        >
          {cta}
          <ArrowLeft className="h-3 w-3 rtl:rotate-180" />
        </Link>
      </div>

      <div className="relative mt-3 px-3">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 start-0 z-[2] w-16 bg-gradient-to-l from-white to-transparent"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 end-0 z-[2] w-16 bg-gradient-to-r from-white to-transparent"
        />
        <div className="marquee-track flex w-max items-center">
          {[...ads, ...ads].map((ad, index) => {
            const duplicate = index >= ads.length;
            return (
              <span
                key={`${ad.name}-${index}`}
                aria-hidden={duplicate || undefined}
                className="me-3 shrink-0"
              >
                <AdCard
                  ad={ad}
                  ghost={duplicate}
                  cardWidth={block?.style?.cardWidth}
                />
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
