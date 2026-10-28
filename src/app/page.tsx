"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronDown,
  FileText,
  Headset,
  Lock,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  CityOption,
  matchesCity,
  useCityOptions,
} from "@/components/Filters";
import PropertyCard from "@/components/PropertyCard";
import { FeaturedAdSlot } from "@/components/FeaturedAds";
import MarqueeStrip from "@/components/MarqueeStrip";
import AdSlider from "@/components/AdSlider";
import { AdBand, ProjectsSlider } from "@/components/ProjectsSlider";
import { OPEN_AI_EVENT } from "@/components/AssistantWidget";
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
import {
  isCustomBlockType,
  useHomeBlocks,
  type HomeBlock,
  type HomeBlockType,
} from "@/lib/home-builder-store";
import HomeCustomBlock from "@/components/home/HomeCustomBlock";
import { filterPublishedProperties } from "@/lib/public-listings";

type SortKey = "newest" | "priceDesc" | "priceAsc";

const SORT_OPTIONS: { value: SortKey; labelKey: MessageKey }[] = [
  { value: "newest", labelKey: "home.sort.newest" },
  { value: "priceDesc", labelKey: "home.sort.priceDesc" },
  { value: "priceAsc", labelKey: "home.sort.priceAsc" },
];

const BUDGETS = [1_000_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000];

const TYPE_PILLS: {
  key: string;
  labelKey: MessageKey;
  type?: Property["type"];
  purpose?: "بيع" | "إيجار";
}[] = [
  { key: "all", labelKey: "home.listings.filter.all" },
  { key: "apartments", labelKey: "home.listings.filter.apartments", type: "شقة" },
  { key: "villas", labelKey: "home.listings.filter.villas", type: "فيلا" },
  { key: "shops", labelKey: "home.listings.filter.shops", type: "محل" },
  { key: "lands", labelKey: "home.listings.filter.lands", type: "أرض" },
  { key: "rent", labelKey: "home.listings.filter.rent", purpose: "إيجار" },
];

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=2200&q=85";
const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=1800&q=80";

export default function HomePage() {
  const { t, locale } = useI18n();
  const { formatWithSymbol } = useCurrency();
  const cityOptions = useCityOptions();
  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [filters, setFilters] = useState<PropertyFilters>(defaultPropertyFilters);
  const [sort, setSort] = useState<SortKey>("newest");
  const [showAll, setShowAll] = useState(false);
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  /* ===== Builder الرئيسية: ترتيب وإظهار وإخفاء الأقسام من لوحة التحكم ===== */
  const layout = useHomeBlocks();

  const blockOf = (type: HomeBlockType): HomeBlock | undefined =>
    layout.find((block) => block.type === type);
  const showBlock = (type: HomeBlockType) => blockOf(type)?.visible ?? false;
  const orderOf = (type: HomeBlockType) => blockOf(type)?.order ?? 999;
  const content = (type: HomeBlockType): HomeBlock | undefined => {
    const block = blockOf(type);
    if (!block || !block.visible) return undefined;
    return block;
  };
  /** نص قابل للتعديل من Builder مع الرجوع لترجمة الموقع */
  const text = (type: HomeBlockType, field: "eyebrow" | "title" | "subtitle" | "body") => {
    const block = content(type);
    if (!block) return undefined;
    const ar = locale === "ar";
    const value =
      field === "eyebrow"
        ? ar
          ? block.eyebrowAr
          : block.eyebrowEn || block.eyebrowAr
        : field === "title"
          ? ar
            ? block.titleAr
            : block.titleEn || block.titleAr
          : field === "subtitle"
            ? ar
              ? block.subtitleAr
              : block.subtitleEn || block.subtitleAr
            : ar
              ? block.bodyAr
              : block.bodyEn || block.bodyAr;
    return value?.trim() ? value : undefined;
  };

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
    () =>
      /* لا يظهر للزوار إلا ما وافقت عليه إدارة المنصة */
      filterPublishedProperties([...userProperties, ...mockProperties]).map((property) => ({
        ...property,
        /* بيانات التواصل للمالك لا تُمرَّر لواجهة العرض — التواصل عبر إدارة الموقع */
        whatsapp: "",
      })),
    [userProperties]
  );

  const selectedCity: CityOption = useMemo(
    () =>
      cityOptions.find((city) => city.id === (filters.city || "all")) ??
      cityOptions[0],
    [filters.city, cityOptions]
  );

  const visible = useMemo(() => {
    const matched = filterProperties(allProperties, {
      city: "",
      priceMin: filters.priceActive ? filters.priceMin : 0,
      priceMax:
        filters.priceActive && filters.priceMax < PRICE_FILTER_MAX
          ? filters.priceMax
          : Number.MAX_SAFE_INTEGER,
      rooms: filters.rooms,
      query: search,
    }).filter((property) => matchesCity(property.city, selectedCity));

    const typed = filters.type
      ? matched.filter((property) => property.type === filters.type)
      : matched;

    const purposed = filters.purpose
      ? typed.filter((property) => (property.purpose ?? "بيع") === filters.purpose)
      : typed;

    if (sort === "priceDesc") {
      return [...purposed].sort((a, b) => b.price - a.price);
    }
    if (sort === "priceAsc") {
      return [...purposed].sort((a, b) => a.price - b.price);
    }
    return purposed;
  }, [allProperties, filters, search, selectedCity, sort]);

  const cityTitle = filters.city ? cityLabel(filters.city, t, locale) : t("city.all");

  const activeTags = useMemo(() => {
    const tags: { key: string; label: string; onRemove: () => void }[] = [];

    if (filters.city) {
      tags.push({
        key: "city",
        label: cityLabel(filters.city, t, locale),
        onRemove: () => setFilters((current) => ({ ...current, city: "" })),
      });
    }
    if (filters.type) {
      tags.push({
        key: "type",
        label: propertyTypeLabel(filters.type, t),
        onRemove: () => setFilters((current) => ({ ...current, type: "" })),
      });
    }
    if (filters.purpose) {
      tags.push({
        key: "purpose",
        label: t(filters.purpose === "بيع" ? "purpose.buy" : "purpose.rent"),
        onRemove: () => setFilters((current) => ({ ...current, purpose: "" })),
      });
    }
    if (filters.rooms) {
      tags.push({
        key: "rooms",
        label: `${t("filters.rooms")}: ${filters.rooms}`,
        onRemove: () => setFilters((current) => ({ ...current, rooms: "" })),
      });
    }
    if (filters.priceActive) {
      tags.push({
        key: "price",
        label: `${formatWithSymbol(filters.priceMin)} — ${formatWithSymbol(
          filters.priceMax
        )}`,
        onRemove: () =>
          setFilters((current) => ({
            ...current,
            priceMin: PRICE_FILTER_MIN,
            priceMax: PRICE_FILTER_MAX,
            priceActive: false,
          })),
      });
    }
    if (search) {
      tags.push({
        key: "search",
        label: search,
        onRemove: () => {
          setSearch("");
          setDraftSearch("");
        },
      });
    }

    return tags;
  }, [filters, search, t, locale, formatWithSymbol]);

  const handleClear = () => {
    setFilters(defaultPropertyFilters);
    setSearch("");
    setDraftSearch("");
    setShowAll(false);
  };

  const applyBudget = (value: number) => {
    if (value >= PRICE_FILTER_MAX) {
      setFilters((current) => ({
        ...current,
        priceMin: PRICE_FILTER_MIN,
        priceMax: PRICE_FILTER_MAX,
        priceActive: false,
      }));
      return;
    }
    setFilters((current) => ({
      ...current,
      priceMax: value,
      priceActive: true,
    }));
  };

  const activePill = filters.type
    ? filters.type === "شقة"
      ? "apartments"
      : filters.type === "فيلا"
        ? "villas"
        : filters.type === "محل"
          ? "shops"
          : filters.type === "أرض"
            ? "lands"
            : ""
    : filters.purpose === "إيجار"
      ? "rent"
      : "all";

  const openAi = () => window.dispatchEvent(new Event(OPEN_AI_EVENT));
  const shown = showAll ? visible : visible.slice(0, 6);
  const dossierProperty = visible[0];
  /** رقم توثيق مشتق من معرّف العقار المعروض — نموذج توضيحي حتى ربط قاعدة البيانات */
  const dossierRef = dossierProperty
    ? `VER-2026-${dossierProperty.id.replace(/-/g, "").toUpperCase()}`
    : "VER-2026-0000";

  return (
    <>
      <div className="flex w-full flex-col">
      {showBlock("hero") && (
      <div key="hero" style={{ order: orderOf("hero") }} className="w-full">
      {/* ====================== HERO ====================== */}
      <section className="relative overflow-hidden bg-ocean-950">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content("hero")?.imageUrl || HERO_IMAGE}
            alt={t("home.hero.imageAlt")}
            className="h-full w-full object-cover object-[center_42%]"
            onError={(event) => {
              event.currentTarget.src = HERO_FALLBACK;
            }}
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(270deg,rgba(20,26,51,0.92)_0%,rgba(20,26,51,0.72)_34%,rgba(20,26,51,0.28)_62%,rgba(20,26,51,0.06)_100%),linear-gradient(0deg,rgba(20,26,51,0.82)_0%,rgba(20,26,51,0)_45%)]"
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1240px] px-4 pb-28 pt-12 sm:px-6 lg:pb-32 lg:pt-16">
          <div className="max-w-[680px] text-white">
            <p className="flex items-center gap-2.5 text-xs font-bold tracking-wide text-gold-200">
              <span aria-hidden className="h-px w-8 bg-gold-400" />
              {text("hero", "eyebrow") ?? t("home.hero.eyebrow")}
            </p>

            <h1 className="mt-4 text-4xl font-black leading-[1.24] tracking-tight sm:text-5xl lg:text-[56px]">
              <span className="relative whitespace-nowrap text-gold-300">
                {text("hero", "title") ?? t("home.hero.titleGold")}
              </span>
              {!text("hero", "title") && (
                <>
                  <br />
                  {t("home.hero.titleRest")}
                </>
              )}
            </h1>

            <p className="mt-4 max-w-[600px] text-sm font-medium leading-8 text-[#e8ecf6] sm:text-base">
              {text("hero", "subtitle") ?? t("home.hero.description")}
            </p>

            <div className="mt-7 grid grid-cols-2 gap-y-5 sm:flex sm:flex-wrap sm:items-stretch">
              <div className="border-e border-white/[0.16] pe-4 sm:pe-7">
                <p className="text-2xl font-black leading-none text-white">
                  {allProperties.length}
                  <span className="text-lg text-gold-300">+</span>
                </p>
                <p className="mt-2 text-[10.5px] font-semibold text-[#b9c1d6]">
                  {t("home.hero.stat.listings")}
                </p>
              </div>
              <div className="ps-4 sm:border-e sm:border-white/[0.16] sm:px-7">
                <p className="text-2xl font-black leading-none text-white">
                  {cityOptions.length - 1}
                </p>
                <p className="mt-2 text-[10.5px] font-semibold text-[#b9c1d6]">
                  {t("home.hero.stat.cities")}
                </p>
              </div>
              <div className="border-e border-white/[0.16] pe-4 sm:pe-7">
                <p className="text-2xl font-black leading-none text-white">3</p>
                <p className="mt-2 max-w-[90px] text-[10.5px] font-semibold text-[#b9c1d6]">
                  {t("home.hero.stat.steps")}
                </p>
              </div>
              <div className="ps-4 sm:px-7">
                <p className="text-2xl font-black leading-none text-white">100%</p>
                <p className="mt-2 max-w-[110px] text-[10.5px] font-semibold text-[#b9c1d6]">
                  {t("home.hero.stat.management")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================== SEARCH CARD ====================== */}
      <div className="relative z-20 mx-auto -mt-28 w-full max-w-[1240px] px-4 sm:px-6 lg:-mt-24">
        <div className="rounded-[22px] border border-sand-200 bg-white p-4 shadow-[0_24px_60px_-18px_rgba(20,26,51,0.28)] sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-200 pb-3.5">
            <div className="flex gap-1 rounded-xl bg-sand-100 p-1">
              {[
                { key: "all", label: "home.search.allPurposes", value: "" },
                { key: "buy", label: "purpose.buy", value: "بيع" },
                { key: "rent", label: "purpose.rent", value: "إيجار" },
              ].map((item) => {
                const active = (filters.purpose || "") === item.value;
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        purpose: item.value as PropertyFilters["purpose"],
                      }))
                    }
                    className={`rounded-lg px-4 py-1.5 text-xs font-bold transition sm:px-5 ${
                      active
                        ? "bg-white text-ocean-900 shadow-[0_2px_8px_rgba(30,38,73,0.10)]"
                        : "text-ocean-700 hover:text-ocean-900"
                    }`}
                  >
                    {t(item.label as MessageKey)}
                  </button>
                );
              })}
            </div>

            <p className="hidden items-center gap-1.5 text-[11px] font-bold text-sand-700 sm:flex">
              <ShieldCheck className="h-4 w-4 text-gold-600" />
              {t("home.search.verified")}
            </p>
          </div>

          <div className="grid gap-3 pt-3.5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_0.85fr_auto] lg:items-end">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-extrabold text-ocean-600">
                {t("home.search.city")}
              </span>
              <span className="relative block">
                <select
                  value={filters.city}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      city: event.target.value as PropertyFilters["city"],
                    }))
                  }
                  className="h-12 w-full appearance-none rounded-xl border border-sand-300 bg-sand-50 px-3 pe-8 text-[13px] font-bold text-ocean-800 outline-none transition focus:border-ocean-500 focus:bg-white"
                >
                  <option value="">{t("home.search.allCities")}</option>
                  {cityOptions
                    .filter((city) => city.id !== "all")
                    .map((city) => (
                      <option key={city.id} value={city.id}>
                        {cityLabel(city.id, t, locale)}
                      </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-600" />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-extrabold text-ocean-600">
                {t("home.search.type")}
              </span>
              <span className="relative block">
                <select
                  value={filters.type}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      type: event.target.value as PropertyFilters["type"],
                    }))
                  }
                  className="h-12 w-full appearance-none rounded-xl border border-sand-300 bg-sand-50 px-3 pe-8 text-[13px] font-bold text-ocean-800 outline-none transition focus:border-ocean-500 focus:bg-white"
                >
                  <option value="">{t("home.search.allTypes")}</option>
                  {(["شقة", "فيلا", "محل", "أرض", "منزل", "شقة دوبلكس"] as const).map(
                    (type) => (
                      <option key={type} value={type}>
                        {propertyTypeLabel(type, t)}
                      </option>
                    )
                  )}
                </select>
                <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-600" />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-extrabold text-ocean-600">
                {t("home.search.budget")}
              </span>
              <span className="relative block">
                <select
                  value={filters.priceActive ? filters.priceMax : PRICE_FILTER_MAX}
                  onChange={(event) => applyBudget(Number(event.target.value))}
                  className="h-12 w-full appearance-none rounded-xl border border-sand-300 bg-sand-50 px-3 pe-8 text-[13px] font-bold text-ocean-800 outline-none transition focus:border-ocean-500 focus:bg-white"
                >
                  {BUDGETS.map((budget) => (
                    <option key={budget} value={budget}>
                      {t("home.search.upTo", { price: formatWithSymbol(budget) })}
                    </option>
                  ))}
                  <option value={PRICE_FILTER_MAX}>
                    {t("home.search.unlimitedBudget")}
                  </option>
                </select>
                <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-600" />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-extrabold text-ocean-600">
                {t("home.search.rooms")}
              </span>
              <span className="relative block">
                <select
                  value={filters.rooms}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      rooms: event.target.value as PropertyFilters["rooms"],
                    }))
                  }
                  className="h-12 w-full appearance-none rounded-xl border border-sand-300 bg-sand-50 px-3 pe-8 text-[13px] font-bold text-ocean-800 outline-none transition focus:border-ocean-500 focus:bg-white"
                >
                  <option value="">{t("home.search.anyRooms")}</option>
                  {["1", "2", "3", "4+"].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-600" />
              </span>
            </label>

            <a
              href="#properties"
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-ocean-700 to-ocean-950 px-6 text-sm font-extrabold text-white shadow-[0_12px_24px_-12px_rgba(20,26,51,0.75)] transition hover:from-ocean-800 hover:to-black"
            >
              <Search className="h-4 w-4" />
              {t("home.search.button")}
            </a>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] text-sand-600">
            <span className="font-semibold">{t("home.search.quick")}</span>
            {cityOptions
              .filter((chip) => chip.id !== "all")
              .slice(0, 3)
              .map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() =>
                    setFilters((current) => ({ ...current, city: chip.id }))
                  }
                  className="rounded-full border border-sand-200 bg-sand-100 px-3 py-1.5 text-[11px] font-bold text-ocean-700 transition hover:border-gold-300 hover:bg-gold-50"
                >
                  {cityLabel(chip.id, t, locale)}
                </button>
              ))}
            <button
              type="button"
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  priceActive: true,
                  priceMax: 2_000_000,
                }))
              }
              className="rounded-full border border-sand-200 bg-sand-100 px-3 py-1.5 text-[11px] font-bold text-ocean-700 transition hover:border-gold-300 hover:bg-gold-50"
            >
              {t("home.search.under2m")}
            </button>
            <button
              type="button"
              onClick={openAi}
              className="ms-auto inline-flex items-center gap-1.5 rounded-full bg-ocean-950 px-3 py-1.5 text-[10.5px] font-extrabold text-white shadow-[0_4px_10px_-4px_rgba(20,26,51,0.5)] transition hover:bg-black"
            >
              <Sparkles className="h-3.5 w-3.5 text-gold-300" />
              {t("home.search.askAi")}
            </button>
          </div>
        </div>
      </div>
      </div>
      )}

      {showBlock("verify_strip") && (
      <div key="verify_strip" style={{ order: orderOf("verify_strip") }} className="w-full">
      {/* ====================== VERIFY STRIP ====================== */}
      <section className="border-b border-sand-200 bg-white pb-6 pt-10">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-4 sm:px-6 xl:flex-row xl:items-center">
          <div className="flex flex-col gap-0.5 border-sand-200 pb-4 xl:min-w-[172px] xl:border-l xl:pb-0 xl:ps-6">
            <p className="text-[13px] font-black text-ocean-900">
              {text("verify_strip", "title") ?? t("home.verify.lead")}
            </p>
            <p className="text-[10.5px] font-semibold text-sand-700">
              {text("verify_strip", "subtitle") ?? t("home.verify.sub")}
            </p>
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-4 xl:gap-5">
            {[
              {
                number: "01",
                title: "home.verify.step1.title",
                desc: "home.verify.step1.desc",
              },
              {
                number: "02",
                title: "home.verify.step2.title",
                desc: "home.verify.step2.desc",
              },
              {
                number: "03",
                title: "home.verify.step3.title",
                desc: "home.verify.step3.desc",
              },
            ].map((step, index) => (
              <Fragment key={step.number}>
                {index > 0 && (
                  <span aria-hidden className="hidden h-px w-6 bg-sand-300 sm:block" />
                )}
                <div className="flex items-center gap-2.5">
                  <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] border border-gold-200 bg-gold-50 text-[11px] font-black text-gold-700">
                    {step.number}
                  </span>
                  <span>
                    <span className="block text-xs font-extrabold text-ocean-900">
                      {t(step.title as MessageKey)}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-medium text-sand-700">
                      {t(step.desc as MessageKey)}
                    </span>
                  </span>
                </div>
              </Fragment>
            ))}
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-sand-300 bg-sand-50 px-3.5 py-2.5">
            <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg bg-[#fbeeee] text-[#b4483f]">
              <X className="h-3.5 w-3.5" />
            </span>
            <span>
              <span className="block text-[12.5px] font-black text-ocean-900">
                {t("home.verify.reject.title")}
              </span>
              <span className="mt-0.5 block text-[9.5px] font-semibold text-sand-700">
                {t("home.verify.reject.desc")}
              </span>
            </span>
          </div>

          <Link
            href="/market-guide"
            className="inline-flex shrink-0 items-center gap-1 text-[11px] font-extrabold text-ocean-700 transition hover:text-gold-700"
          >
            {t("home.verify.link")}
            <ArrowLeft className="h-3 w-3" />
          </Link>
        </div>
      </section>
      </div>
      )}

      {showBlock("marquee") && (
      <div key="marquee" style={{ order: orderOf("marquee") }} className="w-full">
      {/* ====================== MARQUEE ====================== */}
      <MarqueeStrip />
      </div>
      )}

      {showBlock("featured_listings") && (
      <div key="featured_listings" style={{ order: orderOf("featured_listings") }} className="w-full">
      {/* ====================== LISTINGS ====================== */}
      <section id="properties" className="scroll-mt-24 bg-sand-50 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-2.5 text-xs font-bold text-gold-700">
                <span aria-hidden className="h-px w-8 bg-gold-400" />
                {text("featured_listings", "eyebrow") ?? t("home.listings.eyebrow")}
              </p>
              <h2 className="mt-2.5 text-2xl font-black tracking-tight text-ocean-900 sm:text-[33px]">
                {text("featured_listings", "title") ?? t("home.listings.heading")}
              </h2>
              <p className="mt-2 max-w-[560px] text-[13px] font-medium leading-6 text-sand-700">
                {text("featured_listings", "subtitle") ?? t("home.listings.sub")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-1.5 border-b border-sand-300 pb-1.5 text-[13px] font-extrabold text-ocean-700 transition hover:border-gold-400 hover:text-gold-700"
            >
              {t("home.listings.seeAll")}
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-sand-200 pb-5">
            {TYPE_PILLS.map((pill) => {
              const active = activePill === pill.key;
              return (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      type: pill.type ?? "",
                      purpose: pill.purpose ?? "",
                    }))
                  }
                  className={`rounded-full border px-4 py-1.5 text-xs font-bold transition ${
                    active
                      ? "border-ocean-900 bg-ocean-900 text-white"
                      : "border-sand-300 bg-white text-ocean-800 hover:border-gold-300 hover:bg-gold-50"
                  }`}
                >
                  {t(pill.labelKey)}
                </button>
              );
            })}

            <div className="ms-auto flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-sand-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(46,158,107,0.16)]" />
                <b className="font-black text-ocean-900">{visible.length}</b>
                {t("home.listings.liveSuffix")}
              </span>
              <label className="relative">
                <span className="sr-only">{t("home.sort.label")}</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  className="h-9 appearance-none rounded-xl border border-sand-300 bg-white px-3 pe-7 text-[11px] font-bold text-ocean-900 outline-none transition focus:border-ocean-500"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute end-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sand-600" />
              </label>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setSearch(draftSearch.trim());
              }}
              className="relative w-full max-w-[280px]"
            >
              <Search className="pointer-events-none absolute end-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gold-600" />
              <input
                type="search"
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
                placeholder={t("home.search.label")}
                aria-label={t("home.search.label")}
                className="h-9 w-full rounded-xl border border-sand-300 bg-white pe-8 ps-3 text-[11.5px] font-semibold text-ocean-900 outline-none transition placeholder:font-normal placeholder:text-sand-600 focus:border-ocean-500"
              />
            </form>

            {activeTags.map((tag) => (
              <button
                key={tag.key}
                type="button"
                onClick={tag.onRemove}
                className="inline-flex items-center gap-1 rounded-full border border-gold-200 bg-gold-50 px-3 py-1.5 text-[10.5px] font-bold text-gold-800 transition hover:bg-gold-100"
              >
                {tag.label}
                <X className="h-3 w-3" />
              </button>
            ))}
            {activeTags.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[10.5px] font-bold text-sand-600 underline transition hover:text-sand-900"
              >
                {t("home.filters.clearAll")}
              </button>
            )}
          </div>

          {visible.length === 0 ? (
            <div className="mt-7 rounded-3xl border border-sand-300 bg-white p-10 text-center">
              <p className="font-bold text-ocean-900">
                {t("home.empty.title", { city: cityTitle })}
              </p>
              <p className="mt-2 text-sm text-sand-700">
                {t("home.empty.hint", { all: t("city.all") })}
              </p>
              <button
                type="button"
                onClick={handleClear}
                className="mt-4 rounded-xl bg-ocean-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ocean-950"
              >
                {t("home.filters.clearAll")}
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((property, index) => (
                <Fragment key={property.id}>
                  <PropertyCard property={property} />
                  {index === 5 && showBlock("inline_ad") && (
                    <FeaturedAdSlot className="sm:col-span-2 lg:col-span-3" />
                  )}
                </Fragment>
              ))}
            </div>
          )}

          {!showAll && visible.length > 6 && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-ocean-900 px-6 py-3 text-sm font-extrabold text-white shadow-[0_10px_22px_-10px_rgba(30,38,73,0.6)] transition hover:bg-ocean-950"
              >
                {t("home.listings.cta")}
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>
      </div>
      )}

      {showBlock("ad_band") && (
      <div key="ad_band" style={{ order: orderOf("ad_band") }} className="w-full">
      {/* ====================== AD BAND ====================== */}
      <AdBand />
      </div>
      )}

      {showBlock("projects_slider") && (
      <div key="projects_slider" style={{ order: orderOf("projects_slider") }} className="w-full">
      {/* ====================== PROJECTS ====================== */}
      <ProjectsSlider />
      </div>
      )}

      {showBlock("ad_slider") && (
      <div key="ad_slider" style={{ order: orderOf("ad_slider") }} className="w-full">
      {/* ====================== AD SLIDER ====================== */}
      <AdSlider />
      </div>
      )}

      {showBlock("story_dossier") && (
      <div key="story_dossier" style={{ order: orderOf("story_dossier") }} className="w-full">
      {/* ====================== STORY + DOSSIER ====================== */}
      <section className="relative overflow-hidden bg-[radial-gradient(120%_120%_at_85%_0%,#273155_0%,#141a33_58%,#0f1428_100%)] py-12 text-white sm:py-14">
        <span
          aria-hidden
          className="pointer-events-none absolute -left-48 -top-64 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(201,146,42,0.18),transparent_62%)] blur-[10px]"
        />

        <div className="relative z-10 mx-auto grid w-full max-w-[1240px] items-center gap-8 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div>
            <p className="flex items-center gap-2.5 text-xs font-bold text-gold-300">
              <span aria-hidden className="h-px w-8 bg-gold-400" />
              {text("story_dossier", "eyebrow") ?? t("home.story.eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-black leading-[1.45] tracking-tight sm:text-[38px]">
              {text("story_dossier", "title") ? (
                <span className="text-gold-300">{text("story_dossier", "title")}</span>
              ) : (
                <>
                  {t("home.story.title1")}
                  <br />
                  <span className="text-gold-300">{t("home.story.title2")}</span>
                </>
              )}
            </h2>
            <p className="mt-4 max-w-[560px] text-sm font-medium leading-8 text-[#c2c9dd]">
              {text("story_dossier", "subtitle") ?? t("home.story.lead")}
            </p>

            <div className="mt-6 flex flex-col gap-4">
              {[
                {
                  number: "01",
                  title: "home.story.point1.title",
                  desc: "home.story.point1.desc",
                },
                {
                  number: "02",
                  title: "home.story.point2.title",
                  desc: "home.story.point2.desc",
                },
                {
                  number: "03",
                  title: "home.story.point3.title",
                  desc: "home.story.point3.desc",
                },
              ].map((point) => (
                <div key={point.number} className="flex items-start gap-3.5">
                  <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] border border-gold-400/45 bg-gold-400/10 text-[13px] font-black text-gold-300">
                    {point.number}
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-white">
                      {t(point.title as MessageKey)}
                    </p>
                    <p className="mt-1 max-w-[430px] text-xs leading-7 text-[#aab3cb]">
                      {t(point.desc as MessageKey)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 flex border-t border-white/10 pt-5">
              <div className="border-e border-white/10 pe-7">
                <p className="text-2xl font-black">{cityOptions.length - 1}</p>
                <p className="text-[10.5px] font-semibold text-[#98a2bb]">
                  {t("home.story.stat.cities")}
                </p>
              </div>
              <div className="border-e border-white/10 px-7">
                <p className="text-2xl font-black">3</p>
                <p className="text-[10.5px] font-semibold text-[#98a2bb]">
                  {t("home.story.stat.steps")}
                </p>
              </div>
              <div className="ps-7">
                <p className="text-2xl font-black text-gold-300">100%</p>
                <p className="text-[10.5px] font-semibold text-[#98a2bb]">
                  {t("home.story.stat.management")}
                </p>
              </div>
            </div>
          </div>

          {/* ملف العقار الموثّق — بديل صورة الشخص */}
          <div className="relative rounded-3xl border border-gold-400/30 bg-gradient-to-b from-white/10 to-white/[0.035] p-5 shadow-[0_34px_70px_-34px_rgba(0,0,0,0.8)] backdrop-blur">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-2.5 rounded-[18px] border border-white/[0.06]"
            />
            <div className="relative">
              <div className="flex items-center gap-3 border-b border-dashed border-white/[0.16] pb-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gold-400/45 bg-gold-400/10 text-gold-300">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-black text-white">
                    {t("home.dossier.title")}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-semibold text-[#9aa4bd]">
                    {dossierProperty
                      ? `${dossierProperty.type} · ${dossierProperty.area} ${t(
                          "common.sqm"
                        )} · ${cityLabel(dossierProperty.city, t, locale)}`
                      : t("home.dossier.sampleNote")}
                  </p>
                </div>
                <div className="ms-auto text-end text-[9px] font-bold leading-5 text-[#8f9ab3]">
                  {t("home.dossier.verificationId")}
                  <span
                    dir="ltr"
                    className="block text-[10.5px] font-black tracking-wider text-gold-300"
                  >
                    {dossierRef}
                  </span>
                  {t("home.dossier.lastReview")}: 12/10
                </div>
              </div>

              <p className="mt-3.5 flex items-start gap-1.5 text-[9.5px] font-bold text-[#9aa4bd]">
                <Lock className="mt-0.5 h-3 w-3 shrink-0 text-gold-400" />
                {t("home.dossier.hiddenTitle")}
              </p>

              <div className="mt-2.5 flex flex-col gap-1.5">
                {(
                  [
                    "home.dossier.doc1",
                    "home.dossier.doc2",
                    "home.dossier.doc3",
                    "home.dossier.doc4",
                  ] as MessageKey[]
                ).map((key) => (
                  <div
                    key={key}
                    className="flex items-center gap-2.5 rounded-[10px] border border-white/[0.08] bg-[#0f1428]/55 px-2.5 py-2"
                  >
                    <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md bg-gold-400/10 text-gold-300">
                      <Lock className="h-2.5 w-2.5" />
                    </span>
                    <span className="w-[92px] shrink-0 text-[10.5px] font-extrabold text-[#e6eaf4]">
                      {t(key)}
                    </span>
                    <span
                      aria-hidden
                      className="h-1.5 flex-1 rounded bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.20)_0_16px,rgba(255,255,255,0.05)_16px_24px)]"
                    />
                    <span className="shrink-0 rounded border border-white/[0.14] px-1.5 py-0.5 text-[8.5px] font-extrabold text-[#8f9ab3]">
                      {t("home.dossier.hidden")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3.5 flex flex-col gap-2">
                {(
                  [
                    ["home.dossier.check1", "home.dossier.check1.value"],
                    ["home.dossier.check2", "home.dossier.check2.value"],
                    ["home.dossier.check3", "home.dossier.check3.value"],
                  ] as [MessageKey, MessageKey][]
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 text-[10.5px] font-bold text-[#dfe4f0]"
                  >
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border border-emerald-400/40 bg-emerald-400/[0.18] text-emerald-300">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    {t(label)}
                    <span className="ms-auto text-[9px] font-bold text-[#8f9ab3]">
                      {t(value)}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-3.5 flex items-start gap-1.5 border-t border-dashed border-white/[0.16] pt-3 text-[9.5px] font-semibold leading-6 text-[#9aa4bd]">
                <ScanLine className="mt-0.5 h-3 w-3 shrink-0 text-gold-300" />
                {t("home.dossier.note")}
              </p>

              <button
                type="button"
                onClick={openAi}
                className="mt-3 flex h-[38px] w-full items-center justify-center gap-1.5 rounded-[10px] border border-gold-400/45 bg-gold-400/[0.14] text-[11px] font-black text-gold-200 transition hover:bg-gold-400/20"
              >
                <Headset className="h-3.5 w-3.5" />
                {t("home.dossier.cta")}
              </button>
            </div>
          </div>
        </div>
      </section>
      </div>
      )}

      {showBlock("manage_note") && (
      <div key="manage_note" style={{ order: orderOf("manage_note") }} className="w-full">
      {/* شريط صغير يذكّر بسياسة التواصل قبل الفوتر */}
      <section className="border-t border-sand-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-center gap-2 px-4 py-4 text-[11px] font-bold text-sand-700 sm:px-6">
          <BadgeCheck className="h-4 w-4 text-gold-600" />
          {text("manage_note", "title") ?? t("home.listings.manage")}
          <span aria-hidden className="text-sand-400">·</span>
          <FileText className="h-3.5 w-3.5 text-sand-500" />
          {text("manage_note", "body") ?? t("home.dossier.hiddenTitle")}
        </div>
      </section>
      </div>
      )}

      {/* أقسام مضافة من Builder الرئيسية */}
      {layout
        .filter((block) => block.visible && isCustomBlockType(block.type))
        .map((block) => (
          <div key={block.id} style={{ order: block.order }} className="w-full">
            <HomeCustomBlock block={block} />
          </div>
        ))}

      </div>
    </>
  );
}
