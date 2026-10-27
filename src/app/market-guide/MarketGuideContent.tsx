"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { mockProperties, USER_PROPERTIES_KEY } from "@/data/properties";
import { City, Property, PropertyType } from "@/types/property";
import { useT, type MessageKey } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { cityLabel } from "@/lib/i18n/cities";
import { demandLabel } from "@/lib/i18n/taxonomy";

type Demand = "مرتفع" | "موسمي" | "مستقر";

interface CityProfile {
  city: City;
  demand: Demand;
  noteKey: MessageKey;
  summaryKey: MessageKey;
}

/** ترتيب وبيانات المدن المعتمدة الست — بيانات تحريرية خاصة بهذه الصفحة */
const CITY_PROFILES: CityProfile[] = [
  {
    city: "رأس البر",
    demand: "موسمي",
    noteKey: "marketGuide.city.rasElBar.note",
    summaryKey: "marketGuide.city.rasElBar.summary",
  },
  {
    city: "دمياط الجديدة",
    demand: "مرتفع",
    noteKey: "marketGuide.city.newDamietta.note",
    summaryKey: "marketGuide.city.newDamietta.summary",
  },
  {
    city: "دمياط القديمة",
    demand: "مستقر",
    noteKey: "marketGuide.city.oldDamietta.note",
    summaryKey: "marketGuide.city.oldDamietta.summary",
  },
  {
    city: "فارسكور",
    demand: "مستقر",
    noteKey: "marketGuide.city.faraskur.note",
    summaryKey: "marketGuide.city.faraskur.summary",
  },
  {
    city: "جمصة",
    demand: "موسمي",
    noteKey: "marketGuide.city.gamasa.note",
    summaryKey: "marketGuide.city.gamasa.summary",
  },
  {
    city: "المنصورة الجديدة",
    demand: "مرتفع",
    noteKey: "marketGuide.city.newMansoura.note",
    summaryKey: "marketGuide.city.newMansoura.summary",
  },
];

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
    (p) => p.type === type && p.area > 0
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
  const t = useT();
  const { formatWithSymbol } = useCurrency();

  /** إعلانات المستخدمين المحفوظة محلياً — تُضاف إلى مؤشر السوق */
  const [userProperties, setUserProperties] = useState<Property[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_PROPERTIES_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) setUserProperties(parsed as Property[]);
    } catch {
      setUserProperties([]);
    }
  }, []);

  const allProperties = useMemo(
    () => [...userProperties, ...mockProperties],
    [userProperties]
  );

  const totalListings = allProperties.length;
  const overallAvgMeter =
    allProperties.length > 0
      ? Math.round(
          allProperties.reduce(
            (sum, p) => sum + p.price / (p.area || 1),
            0
          ) / allProperties.length
        )
      : 0;

  const stats = CITY_PROFILES.map((profile) => {
    const listings = cityProperties(allProperties, profile.city);
    return {
      ...profile,
      listings: listings.length,
      apartments: avgPricePerMeter(allProperties, profile.city, "شقة"),
      villas: avgPricePerMeter(allProperties, profile.city, "فيلا"),
      districts: districtsOf(allProperties, profile.city),
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
        count: CITY_PROFILES.length,
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
      <section className="bg-black">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
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
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur"
              >
                <p className="text-xs font-semibold text-white/50">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-black text-white">
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
              <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
                {t("marketGuide.guide.heading")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-500">
                {t("marketGuide.guide.subheading")}
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-4 py-1.5 text-xs font-bold text-gray-600">
              {t("marketGuide.guide.mvpBadge")}
            </span>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {GUIDE_CARDS.map((card) => {
              const inner = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white transition group-hover:scale-105">
                      {card.icon}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${
                        card.href
                          ? "bg-gray-900 text-white ring-gray-900"
                          : "bg-gray-100 text-gray-500 ring-gray-200"
                      }`}
                    >
                      {t(card.badgeKey)}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-black text-gray-900">
                    {t(card.titleKey)}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-7 text-gray-600">
                    {t(card.descriptionKey)}
                  </p>

                  <span className="mt-5 flex items-center gap-1.5 text-sm font-bold text-gray-900">
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
                "group flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl";

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
              <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
                {t("marketGuide.meters.heading")}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {t("marketGuide.meters.subheading")}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {stats.map((row) => (
              <article
                key={row.city}
                className="flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-black text-gray-900">
                    {cityLabel(row.city, t)}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ring-1 ${DEMAND_STYLE[row.demand]}`}
                  >
                    {t("marketGuide.demandBadge", {
                      value: demandLabel(row.demand, t),
                    })}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5">
                  <div>
                    <p className="text-xs text-gray-500">
                      {t("marketGuide.meters.apartments")}
                    </p>
                    <p className="mt-1 text-xl font-black text-gray-900">
                      {row.apartments === null
                        ? "—"
                        : formatWithSymbol(row.apartments)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">
                      {t("marketGuide.meters.villas")}
                    </p>
                    <p className="mt-1 text-xl font-black text-gray-900">
                      {row.villas === null ? "—" : formatWithSymbol(row.villas)}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-gray-500">
                  {t("marketGuide.meters.listingsNote", {
                    count: row.listings,
                    note: t(row.noteKey),
                  })}
                </p>

                <div className="mt-auto pt-5">
                  <Link
                    href="/#properties"
                    className="flex items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
                  >
                    {t("marketGuide.meters.browseCity", {
                      city: cityLabel(row.city, t),
                    })}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* أعمدة المقارنة */}
        <section id="comparison" className="mt-14 scroll-mt-32">
          <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
            {t("marketGuide.comparison.heading")}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {t("marketGuide.comparison.subheading")}
          </p>

          <div className="mt-6 space-y-5 rounded-3xl border border-gray-200 bg-white p-5 sm:p-7">
            {stats.map((row) => (
              <div key={row.city}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-gray-900">
                    {cityLabel(row.city, t)}
                  </span>
                  <span className="text-xs font-bold text-gray-500">
                    {t("marketGuide.comparison.apartments")}
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-black"
                    style={{
                      width: `${Math.round(
                        ((row.apartments ?? 0) / maxMeter) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-gray-900">
                    {cityLabel(row.city, t)}
                  </span>
                  <span className="text-xs font-bold text-gray-500">
                    {t("marketGuide.comparison.villas")}
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-ocean-600"
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
          <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
            {t("marketGuide.cities.heading")}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {t("marketGuide.cities.subheading")}
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {stats.map((row) => (
              <article
                key={row.city}
                className="flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-black text-gray-900">
                    {cityLabel(row.city, t)}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ring-1 ${DEMAND_STYLE[row.demand]}`}
                  >
                    {t("marketGuide.demandBadge", {
                      value: demandLabel(row.demand, t),
                    })}
                  </span>
                </div>

                <p className="mt-3 flex-1 text-sm leading-7 text-gray-600">
                  {t(row.summaryKey)}
                </p>

                <div className="mt-5">
                  <p className="text-xs font-bold text-gray-500">
                    {t("marketGuide.cities.topDistricts")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {row.districts.map((district) => (
                      <span
                        key={district}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
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
            <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
              <h2 className="text-xl font-black text-gray-900">
                {t("marketGuide.method.heading")}
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-gray-600">
                <li>{t("marketGuide.method.item1")}</li>
                <li>{t("marketGuide.method.item2")}</li>
                <li>{t("marketGuide.method.item3")}</li>
                <li>{t("marketGuide.method.item4")}</li>
                <li>{t("marketGuide.method.item5")}</li>
              </ul>
            </div>

            <div className="flex flex-col justify-between rounded-3xl bg-black p-6 text-white sm:p-8">
              <div>
                <h2 className="text-xl font-black">
                  {t("marketGuide.add.heading")}
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  {t("marketGuide.add.description")}
                </p>
              </div>
              <Link
                href="/add-property"
                className="mt-6 flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-white/90"
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
