"use client";

import { FormEvent, Fragment, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import Filters, {
  CityOption,
  cities,
  matchesCity,
} from "@/components/Filters";
import PropertyCard from "@/components/PropertyCard";
import PropertyMapDynamic from "@/components/PropertyMapDynamic";
import {
  FeaturedAdSlot,
  FeaturedDevelopers,
  MainDeveloperAds,
  SponsoredSidebarAd,
} from "@/components/FeaturedAds";
import { MashrabiyaLayer, PharaonicDivider } from "@/components/Ornaments";
import {
  filterProperties,
  mockProperties,
  USER_PROPERTIES_KEY,
} from "@/data/properties";
import {
  defaultPropertyFilters,
  PRICE_FILTER_MAX,
  PRICE_FILTER_MIN,
  Property,
  PropertyFilters,
} from "@/types/property";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { cityLabel } from "@/lib/i18n/cities";
import { propertyTypeLabel } from "@/lib/i18n/taxonomy";
import { useCurrency } from "@/lib/currency";

type SortKey = "newest" | "priceDesc" | "priceAsc";

const SORT_OPTIONS: { value: SortKey; labelKey: MessageKey }[] = [
  { value: "newest", labelKey: "home.sort.newest" },
  { value: "priceDesc", labelKey: "home.sort.priceDesc" },
  { value: "priceAsc", labelKey: "home.sort.priceAsc" },
];

export default function HomePage() {
  const { t } = useI18n();
  const { formatWithSymbol } = useCurrency();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<PropertyFilters>(defaultPropertyFilters);
  const [sort, setSort] = useState<SortKey>("newest");
  const [userProperties, setUserProperties] = useState<Property[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_PROPERTIES_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) setUserProperties(parsed);
    } catch {
      setUserProperties([]);
    }
  }, []);

  const allProperties = useMemo(
    () => [...userProperties, ...mockProperties],
    [userProperties]
  );

  /* المدينة المختارة للخريطة — مشتقة من فلتر المدينة */
  const selectedCity: CityOption = useMemo(
    () => cities.find((c) => c.id === (filters.city || "all")) ?? cities[0],
    [filters.city]
  );

  const visible = useMemo(() => {
    const matched = filterProperties(allProperties, {
      city: "",
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      rooms: filters.rooms,
      query: search,
    }).filter((p) => matchesCity(p.city, selectedCity));

    const typed = filters.type
      ? matched.filter((p) => p.type === filters.type)
      : matched;

    const purposed = filters.purpose
      ? typed.filter((p) => (p.purpose ?? "بيع") === filters.purpose)
      : typed;

    if (sort === "priceDesc") {
      return [...purposed].sort((a, b) => b.price - a.price);
    }
    if (sort === "priceAsc") {
      return [...purposed].sort((a, b) => a.price - b.price);
    }
    return purposed;
  }, [allProperties, filters, search, selectedCity, sort]);

  const averagePricePerMeter = useMemo(() => {
    if (visible.length === 0) return null;
    const total = visible.reduce((sum, p) => sum + p.price / p.area, 0);
    return Math.round(total / visible.length);
  }, [visible]);

  const activeTags = useMemo(() => {
    const tags: { key: string; label: string; onRemove: () => void }[] = [];

    if (filters.city) {
      tags.push({
        key: "city",
        label: cityLabel(filters.city, t),
        onRemove: () => setFilters((f) => ({ ...f, city: "" })),
      });
    }
    if (filters.type) {
      tags.push({
        key: "type",
        label: propertyTypeLabel(filters.type, t),
        onRemove: () => setFilters((f) => ({ ...f, type: "" })),
      });
    }
    if (filters.purpose) {
      tags.push({
        key: "purpose",
        label: t(filters.purpose === "بيع" ? "purpose.buy" : "purpose.rent"),
        onRemove: () => setFilters((f) => ({ ...f, purpose: "" })),
      });
    }
    if (filters.rooms) {
      tags.push({
        key: "rooms",
        label: `${t("filters.rooms")}: ${filters.rooms}`,
        onRemove: () => setFilters((f) => ({ ...f, rooms: "" })),
      });
    }
    if (
      filters.priceMin !== PRICE_FILTER_MIN ||
      filters.priceMax !== PRICE_FILTER_MAX
    ) {
      tags.push({
        key: "price",
        label: `${formatWithSymbol(filters.priceMin)} — ${formatWithSymbol(
          filters.priceMax
        )}`,
        onRemove: () =>
          setFilters((f) => ({
            ...f,
            priceMin: PRICE_FILTER_MIN,
            priceMax: PRICE_FILTER_MAX,
          })),
      });
    }
    if (search) {
      tags.push({
        key: "search",
        label: search,
        onRemove: () => {
          setSearch("");
          setQuery("");
        },
      });
    }

    return tags;
  }, [filters, search, t, formatWithSymbol]);

  const handleClear = () => {
    setFilters(defaultPropertyFilters);
    setSearch("");
    setQuery("");
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearch(query.trim());
  };

  const cityTitle = filters.city ? cityLabel(filters.city, t) : t("city.all");

  return (
    <>
      {/* بانر علوي مضغوط (شريط رفيع) */}
      <section className="relative overflow-hidden border-b border-sand-300 bg-gradient-to-l from-sand-100 via-white to-white">
        <MashrabiyaLayer tone="light" className="opacity-[0.05]" />
        <div className="relative mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black text-ocean-900 sm:text-lg">
              {t("brand.name")}
            </h1>
            <span className="hidden text-[11px] text-sand-700 sm:inline">
              {t("home.hero.subtitle")}
            </span>
          </div>
          <p className="text-[11px] font-bold text-gold-700">
            {t("home.listings.results", {
              count: visible.length,
              total: allProperties.length,
            })}
          </p>
        </div>
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-gold-400/70 to-transparent" />
      </section>

      {/* الهيكلة الثلاثية: عمود أيمن (بحث + فلاتر) / تغذية وسطى / عمود أيسر (إعلانات) */}
      <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
          {/* العمود الأيمن: البحث ثم الفلاتر ثم المساحة الإعلانية الثانوية */}
          <aside className="lg:col-span-3">
            <div className="space-y-4 lg:sticky lg:top-20">
              <form
                onSubmit={handleSearch}
                className="relative overflow-hidden rounded-3xl border border-sand-300 bg-white p-3 shadow-soft"
              >
                {/* رأس القائمة الجانبية: نقشة إسلامية شفافة */}
                <MashrabiyaLayer tone="light" className="opacity-[0.05]" />
                <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-gold-400/60 to-transparent" />
                <label htmlFor="home-search" className="sr-only">
                  {t("home.search.label")}
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-600" />
                  <input
                    id="home-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("home.search.label")}
                    className="w-full rounded-2xl border border-sand-300 bg-sand-50 py-2.5 pe-9 ps-3 text-sm font-semibold text-ocean-900 outline-none transition placeholder:font-normal placeholder:text-sand-600 focus:border-ocean-500 focus:bg-white"
                  />
                </div>
                <div className="relative mt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-full bg-ocean-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-ocean-800"
                  >
                    {t("home.search.button")}
                  </button>
                  {(query || search) && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setSearch("");
                      }}
                      className="rounded-full border border-sand-300 bg-white px-4 py-2 text-xs font-bold text-sand-700 transition hover:bg-sand-50"
                    >
                      {t("home.filters.clearAll")}
                    </button>
                  )}
                </div>
              </form>

              <Filters
                applied={filters}
                onApply={setFilters}
                onClear={handleClear}
              />

              {/* مساحة إعلانية ثانوية أسفل الفلاتر */}
              <SponsoredSidebarAd />
            </div>
          </aside>

          {/* التغذية الوسطى: قائمة العقارات المتحركة */}
          <div className="lg:col-span-6">
            {/* الشريط العلوي: النتائج + الفلاتر النشطة + الترتيب */}
            <section className="mb-4 rounded-3xl border border-sand-300 bg-white p-4 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-ocean-900 sm:text-lg">
                    {t("home.listings.title", { city: cityTitle })}
                  </h2>
                  <p className="mt-1 text-xs text-sand-700">
                    {t("home.listings.results", {
                      count: visible.length,
                      total: allProperties.length,
                    })}
                  </p>
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-ocean-700">
                  <span className="whitespace-nowrap">
                    {t("home.sort.label")}
                  </span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="rounded-2xl border border-sand-300 bg-white px-3 py-2 text-xs font-bold text-ocean-900 outline-none transition focus:border-ocean-500"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {activeTags.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-sand-200 pt-3">
                  <span className="text-[11px] font-bold text-sand-600">
                    {t("home.filters.active")}
                  </span>
                  {activeTags.map((tag) => (
                    <button
                      key={tag.key}
                      type="button"
                      onClick={tag.onRemove}
                      className="inline-flex items-center gap-1 rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-[11px] font-bold text-gold-800 transition hover:bg-gold-100"
                    >
                      {tag.label}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-[11px] font-bold text-sand-600 underline transition hover:text-sand-900"
                  >
                    {t("home.filters.clearAll")}
                  </button>
                </div>
              )}
            </section>

            <PharaonicDivider />

            {/* شريط المطورين المعتمدين */}
            <div className="mb-4">
              <FeaturedDevelopers />
            </div>

            {/* شبكة العقارات — كروت مصغّرة */}
            {visible.length === 0 ? (
              <div className="rounded-3xl border border-sand-300 bg-white p-10 text-center">
                <p className="font-bold text-ocean-900">
                  {t("home.empty.title", { city: cityTitle })}
                </p>
                <p className="mt-2 text-sm text-sand-700">
                  {t("home.empty.hint", { all: t("city.all") })}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {visible.map((property, index) => (
                  <Fragment key={property.id}>
                    <PropertyCard property={property} compact />
                    {index === 3 && (
                      <FeaturedAdSlot className="sm:col-span-2" />
                    )}
                    {index === 9 && (
                      <FeaturedAdSlot variant="bold" className="sm:col-span-2" />
                    )}
                  </Fragment>
                ))}
              </div>
            )}

            <PharaonicDivider />

            {/* الخريطة + دليل السوق */}
            <section className="space-y-4">
              <PropertyMapDynamic
                properties={visible}
                selectedCity={selectedCity}
              />

              <div className="relative overflow-hidden rounded-3xl border border-sand-300 bg-sand-100 p-5">
                <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-gold-400/60 to-transparent" />
                <h3 className="text-base font-bold text-ocean-900">
                  {t("home.market.title", { city: cityTitle })}
                </h3>
                <p className="mt-2 text-sm text-sand-700">
                  {t("home.market.avg")}
                </p>
                <p className="mt-1 text-2xl font-black text-ocean-900">
                  {averagePricePerMeter === null
                    ? "—"
                    : formatWithSymbol(averagePricePerMeter)}
                </p>
                <p className="mt-2 text-xs text-sand-600">
                  {t("home.market.basedOn", { count: visible.length })}
                </p>
              </div>
            </section>
          </div>

          {/* العمود الأيسر: المساحة الإعلانية الرئيسية للمطورين والشركات */}
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-20">
              <MainDeveloperAds />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
