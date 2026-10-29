"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { mockProperties, USER_PROPERTIES_KEY } from "@/data/properties";
import { City, Property, PropertyType } from "@/types/property";
import { useT, type MessageKey, useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { cityLabel } from "@/lib/i18n/cities";
import { useActiveCities } from "@/lib/cities-store";
import { demandLabel } from "@/lib/i18n/taxonomy";
import { getApprovedListingIds, getDefaultApprovedIds } from "@/lib/admin-system";

type Demand = "مرتفع" | "موسمي" | "مستقر";

interface EditorialProfile {
  demand: Demand;
  noteKey: MessageKey;
  summaryKey: MessageKey;
}

/**
 * بيانات تحريرية اختيارية للمدن المعروفة.
 * أي مدينة يضيفها الأدمن وتغيب عن هذه الخريطة تظهر تلقائياً بوصف عام
 * أو بالوصف المخصّص المحفوظ في سجل المدن.
 */
const CITY_EDITORIAL: Record<string, EditorialProfile> = {
  "رأس البر": {
    demand: "موسمي",
    noteKey: "marketGuide.city.rasElBar.note",
    summaryKey: "marketGuide.city.rasElBar.summary",
  },
  "دمياط الجديدة": {
    demand: "مرتفع",
    noteKey: "marketGuide.city.newDamietta.note",
    summaryKey: "marketGuide.city.newDamietta.summary",
  },
  "دمياط القديمة": {
    demand: "مستقر",
    noteKey: "marketGuide.city.oldDamietta.note",
    summaryKey: "marketGuide.city.oldDamietta.summary",
  },
  "فارسكور": {
    demand: "مستقر",
    noteKey: "marketGuide.city.faraskur.note",
    summaryKey: "marketGuide.city.faraskur.summary",
  },
  "جمصة": {
    demand: "موسمي",
    noteKey: "marketGuide.city.gamasa.note",
    summaryKey: "marketGuide.city.gamasa.summary",
  },
  "المنصورة الجديدة": {
    demand: "مرتفع",
    noteKey: "marketGuide.city.newMansoura.note",
    summaryKey: "marketGuide.city.newMansoura.summary",
  },
};

const DEMAND_STYLE: Record<Demand, string> = {
  مرتفع: "bg-rose-50 text-rose-700 ring-rose-100",
  موسمي: "bg-amber-50 text-amber-700 ring-amber-100",
  مستقر: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

interface GuideCard {
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  badgeKey: MessageKey;
  href?: string;
  icon: ReactNode;
}

/** كروت قسم «اعرف» — مستوحاة من تجربة عقار ماب */
const GUIDE_CARDS: GuideCard[] = [
  {
    titleKey: "marketGuide.card.meters.title",
    descriptionKey: "marketGuide.card.meters.description",
    badgeKey: "marketGuide.card.meters.badge",
    href: "#meters",
    icon: <ChartIcon />,
  },
  {
    titleKey: "marketGuide.card.demand.title",
    descriptionKey: "marketGuide.card.demand.description",
    badgeKey: "marketGuide.card.demand.badge",
    href: "#comparison",
    icon: <TrendIcon />,
  },
  {
    titleKey: "marketGuide.card.compounds.title",
    descriptionKey: "marketGuide.card.compounds.description",
    badgeKey: "marketGuide.card.compounds.badge",
    href: "#cities",
    icon: <BuildingIcon />,
  },
  {
    titleKey: "marketGuide.card.askLocals.title",
    descriptionKey: "marketGuide.card.askLocals.description",
    badgeKey: "marketGuide.card.askLocals.badge",
    icon: <ChatIcon />,
  },
  {
    titleKey: "marketGuide.card.research.title",
    descriptionKey: "marketGuide.card.research.description",
    badgeKey: "marketGuide.card.research.badge",
    href: "#methodology",
    icon: <DocIcon />,
  },
  {
    titleKey: "marketGuide.card.legal.title",
    descriptionKey: "marketGuide.card.legal.description",
    badgeKey: "marketGuide.card.legal.badge",
    href: "/legal-consultational",
    icon: <ScaleIcon />,
  },
];

function cityProperties(properties: Property[], city: City) {
  return properties.filter((p) => p.city === city);
}

function avgPricePerMeter(
  properties: Property[],
  city: City,
  type: PropertyType
): number | null {
  const items = cityProperties(properties, city).filter(
    (p) => p.type === type && p.area > 0 && !p.priceByAdmin
  );
  if (items.length === 0) return null;
  const total = items.reduce((sum, p) => sum + p.price / p.area, 0);
  return Math.round(total / items.length);
}

function districtsOf(properties: Property[], city: City): string[] {
  return Array.from(
    new Set(cityProperties(properties, city).map((p) => p.district))
  );
}

export default function MarketGuideContent() {
  const { locale } = useI18n();
  const t = useT();
  const { formatWithSymbol } = useCurrency();

  /** إعلانات المستخدمين المحفوظة محلياً — تُضاف إلى مؤشر السوق */
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  /* نفس الحالة الافتراضية التي يرسمها السيرفر — لتفادي اختلاف الترطيب */
  const [approvedIds, setApprovedIds] = useState<string[]>(() => getDefaultApprovedIds());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_PROPERTIES_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) setUserProperties(parsed as Property[]);
    } catch {
      setUserProperties([]);
    }
    setApprovedIds(getApprovedListingIds());
  }, []);

  const allProperties = useMemo(() => {
    const approved = new Set(approvedIds);
    return [...userProperties, ...mockProperties].filter((property) =>
      approved.has(property.id)
    );
  }, [userProperties, approvedIds]);

  const totalListings = allProperties.length;
  const pricedProperties = allProperties.filter(
    (p) => !p.priceByAdmin && p.area > 0
  );
  const overallAvgMeter =
    pricedProperties.length > 0
      ? Math.round(
          pricedProperties.reduce(
            (sum, p) => sum + p.price / (p.area || 1),
            0
          ) / pricedProperties.length
        )
      : 0;

  const cityRecords = useActiveCities();

  const stats = cityRecords.map((record) => {
    const editorial = CITY_EDITORIAL[record.nameAr];
    const customSummary =
      locale === "en" ? record.summaryEn : record.summaryAr;
    const listings = cityProperties(allProperties, record.nameAr);
    return {
      city: record.nameAr,
      demand: editorial?.demand ?? record.demand ?? "مستقر",
      note: editorial
        ? t(editorial.noteKey)
        : t("marketGuide.city.generic.note"),
      summary:
        customSummary ||
        (editorial
          ? t(editorial.summaryKey)
          : t("marketGuide.city.generic.summary")),
      listings: listings.length,
      apartments: avgPricePerMeter(allProperties, record.nameAr, "شقة"),
      villas: avgPricePerMeter(allProperties, record.nameAr, "فيلا"),
      districts: districtsOf(allProperties, record.nameAr),
    };
  });

  const maxMeter = Math.max(
    1,
    ...stats.map((s) => s.apartments ?? 0),
    ...stats.map((s) => s.villas ?? 0)
  );

  const heroStats = [
    {
      label: t("marketGuide.stat.approvedCities"),
      value: t("marketGuide.stat.citiesValue", {
        count: stats.length,
      }),
    },
    {
      label: t("marketGuide.stat.listings"),
      value: t("marketGuide.stat.listingsValue", { count: totalListings }),
    },
    {
      label: t("marketGuide.stat.avgMeter"),
      value: formatWithSymbol(overallAvgMeter),
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#141a33_0%,#242e5c_58%,#141a33_100%)]">
        <span
          aria-hidden
          className="pointer-events-none absolute -end-24 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(217,185,92,0.26),transparent_65%)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold-400 to-transparent"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.2em] text-gold-300">
            {t("marketGuide.hero.eyebrow")}
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">
            {t("marketGuide.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
            {t("marketGuide.hero.description")}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-4 backdrop-blur"
              >
                <p className="text-[10.5px] font-bold text-white/50">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-black text-gold-200">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {/* قسم «اعرف» — الكروت الاستشارية */}
        <section id="guide" className="scroll-mt-32">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-ocean-900 sm:text-[28px]">
                {t("marketGuide.guide.heading")}
              </h2>
              <p className="mt-2 max-w-2xl text-[12.5px] leading-7 text-sand-700">
                {t("marketGuide.guide.subheading")}
              </p>
            </div>
            <span className="rounded-full border border-sand-200 bg-sand-100 px-4 py-1.5 text-[11px] font-bold text-sand-700">
              {t("marketGuide.guide.mvpBadge")}
            </span>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {GUIDE_CARDS.map((card) => {
              const inner = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#141a33,#2d3875)] text-gold-300 transition group-hover:scale-105">
                      {card.icon}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${
                        card.href
                          ? "bg-ocean-950 text-white ring-ocean-950"
                          : "bg-sand-100 text-sand-600 ring-sand-200"
                      }`}
                    >
                      {t(card.badgeKey)}
                    </span>
                  </div>

                  <h3 className="mt-5 text-[16px] font-black text-ocean-900">
                    {t(card.titleKey)}
                  </h3>
                  <p className="mt-2 flex-1 text-[12.5px] leading-7 text-sand-800">
                    {t(card.descriptionKey)}
                  </p>

                  <span className="mt-5 flex items-center gap-1.5 text-[12px] font-extrabold text-gold-700">
                    {card.href
                      ? t("marketGuide.cta.learnMore")
                      : t("marketGuide.cta.comingSoon")}
                    {card.href && (
                      <span className="transition group-hover:-translate-x-1">
                        ←
                      </span>
                    )}
                  </span>
                </>
              );

              const className =
                "group flex h-full flex-col rounded-3xl border border-sand-200 bg-white p-6 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] transition hover:-translate-y-1 hover:border-gold-300/70 hover:shadow-[0_28px_60px_-40px_rgba(20,26,51,0.35)]";

              if (card.href?.startsWith("#")) {
                return (
                  <a key={card.titleKey} href={card.href} className={className}>
                    {inner}
                  </a>
                );
              }

              return card.href ? (
                <Link key={card.titleKey} href={card.href} className={className}>
                  {inner}
                </Link>
              ) : (
                <div key={card.titleKey} className={className}>
                  {inner}
                </div>
              );
            })}
          </div>
        </section>

        {/* كروت متوسطات أسعار المتر */}
        <section id="meters" className="mt-14 scroll-mt-32">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-ocean-900 sm:text-[28px]">
                {t("marketGuide.meters.heading")}
              </h2>
              <p className="mt-2 text-[12.5px] leading-7 text-sand-700">
                {t("marketGuide.meters.subheading")}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {stats.map((row) => (
              <article
                key={row.city}
                className="flex h-full flex-col rounded-3xl border border-sand-200 bg-white p-6 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] transition hover:-translate-y-1 hover:border-gold-300/70 hover:shadow-[0_28px_60px_-40px_rgba(20,26,51,0.35)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[16px] font-black text-ocean-900">
                    {cityLabel(row.city, t, locale)}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ring-1 ${DEMAND_STYLE[row.demand]}`}
                  >
                    {t("marketGuide.demandBadge", {
                      value: demandLabel(row.demand, t),
                    })}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-sand-200 pt-5">
                  <div>
                    <p className="text-[10.5px] font-bold text-sand-600">
                      {t("marketGuide.meters.apartments")}
                    </p>
                    <p className="mt-1 text-lg font-black text-ocean-900">
                      {row.apartments === null
                        ? "—"
                        : formatWithSymbol(row.apartments)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10.5px] font-bold text-sand-600">
                      {t("marketGuide.meters.villas")}
                    </p>
                    <p className="mt-1 text-lg font-black text-ocean-900">
                      {row.villas === null ? "—" : formatWithSymbol(row.villas)}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-[10.5px] font-bold text-sand-600">
                  {t("marketGuide.meters.listingsNote", {
                    count: row.listings,
                    note: row.note,
                  })}
                </p>

                <div className="mt-auto pt-5">
                  <Link
                    href="/#properties"
                    className="flex items-center justify-center rounded-xl bg-ocean-950 px-4 py-3 text-[12px] font-black text-white transition hover:bg-ocean-900"
                  >
                    {t("marketGuide.meters.browseCity", {
                      city: cityLabel(row.city, t, locale),
                    })}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* أعمدة المقارنة */}
        <section id="comparison" className="mt-14 scroll-mt-32">
          <h2 className="text-2xl font-black text-ocean-900 sm:text-[28px]">
            {t("marketGuide.comparison.heading")}
          </h2>
          <p className="mt-2 text-[12.5px] leading-7 text-sand-700">
            {t("marketGuide.comparison.subheading")}
          </p>

          <div className="mt-6 space-y-5 rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] sm:p-7">
            {stats.map((row) => (
              <div key={row.city}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12.5px] font-extrabold text-ocean-900">
                    {cityLabel(row.city, t, locale)}
                  </span>
                  <span className="text-[10.5px] font-bold text-sand-600">
                    {t("marketGuide.comparison.apartments")}
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-sand-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-gold-500 to-gold-300"
                    style={{
                      width: `${Math.round(
                        ((row.apartments ?? 0) / maxMeter) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[12.5px] font-extrabold text-ocean-900">
                    {cityLabel(row.city, t, locale)}
                  </span>
                  <span className="text-[10.5px] font-bold text-sand-600">
                    {t("marketGuide.comparison.villas")}
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-sand-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-ocean-700 to-ocean-400"
                    style={{
                      width: `${Math.round(
                        ((row.villas ?? 0) / maxMeter) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* تفاصيل المدن ورأي الخبراء */}
        <section id="cities" className="mt-14 scroll-mt-32">
          <h2 className="text-2xl font-black text-ocean-900 sm:text-[28px]">
            {t("marketGuide.cities.heading")}
          </h2>
          <p className="mt-2 text-[12.5px] leading-7 text-sand-700">
            {t("marketGuide.cities.subheading")}
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {stats.map((row) => (
              <article
                key={row.city}
                className="flex h-full flex-col rounded-3xl border border-sand-200 bg-white p-6 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] transition hover:-translate-y-1 hover:border-gold-300/70 hover:shadow-[0_28px_60px_-40px_rgba(20,26,51,0.35)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-black text-ocean-900">
                    {cityLabel(row.city, t, locale)}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ring-1 ${DEMAND_STYLE[row.demand]}`}
                  >
                    {t("marketGuide.demandBadge", {
                      value: demandLabel(row.demand, t),
                    })}
                  </span>
                </div>

                <p className="mt-3 flex-1 text-[12.5px] leading-7 text-sand-800">
                  {row.summary}
                </p>

                <div className="mt-5">
                  <p className="text-[10.5px] font-bold text-sand-600">
                    {t("marketGuide.cities.topDistricts")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {row.districts.map((district) => (
                      <span
                        key={district}
                        className="rounded-full border border-sand-200 bg-sand-50 px-3 py-1 text-[10.5px] font-bold text-sand-800"
                      >
                        {district}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* المنهجية + دعوة للإضافة */}
        <section id="methodology" className="mt-14 scroll-mt-32">
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] sm:p-8">
              <h2 className="text-lg font-black text-ocean-900">
                {t("marketGuide.method.heading")}
              </h2>
              <ul className="mt-4 space-y-3 text-[12.5px] leading-7 text-sand-800">
                <li>{t("marketGuide.method.item1")}</li>
                <li>{t("marketGuide.method.item2")}</li>
                <li>{t("marketGuide.method.item3")}</li>
                <li>{t("marketGuide.method.item4")}</li>
                <li>{t("marketGuide.method.item5")}</li>
              </ul>
            </div>

            <div className="flex flex-col justify-between rounded-3xl bg-[linear-gradient(140deg,#141a33_0%,#242e5c_100%)] p-6 text-white shadow-[0_30px_80px_-60px_rgba(20,26,51,0.9)] sm:p-8">
              <div>
                <h2 className="text-xl font-black">
                  {t("marketGuide.add.heading")}
                </h2>
                <p className="mt-3 text-[12px] leading-7 text-white/70">
                  {t("marketGuide.add.description")}
                </p>
              </div>
              <Link
                href="/add-property"
                className="mt-6 flex items-center justify-center rounded-xl bg-gradient-to-l from-gold-500 to-gold-400 px-5 py-3 text-[12.5px] font-black text-ocean-950 transition hover:-translate-y-0.5"
              >
                {t("marketGuide.add.cta")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function ChartIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 20V10m5 10V4m5 16v-7m5 7V8"
      />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 17l6-6 4 4 8-8m0 0h-5m5 0v5"
      />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 21h18M5 21V5a2 2 0 012-2h6a2 2 0 012 2v16M15 21V9h3a2 2 0 012 2v10M8 7h2M8 11h2M8 15h2"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10h8M8 14h5M21 12a8 8 0 01-11.6 7.1L4 21l1.9-5.4A8 8 0 1121 12z"
      />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 3v5h5M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM9 13h6M9 17h4"
      />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v18M7 21h10M5 7l-3 6h6l-3-6zm14 0l-3 6h6l-3-6zM5 7l7-2 7 2"
      />
    </svg>
  );
}
