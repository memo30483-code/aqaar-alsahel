"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import {
  defaultPropertyFilters,
  PRICE_FILTER_MAX,
  PRICE_FILTER_MIN,
  City,
  PropertyFilters,
  Purpose,
  RoomsFilter,
} from "@/types/property";
import { useI18n } from "@/lib/i18n";
import {
  CITY_NAMES,
  cityCenter,
  cityLabel,
  cityMatches,
} from "@/lib/i18n/cities";
import { PROPERTY_TYPES, propertyTypeLabel } from "@/lib/i18n/taxonomy";
import { useCurrency } from "@/lib/currency";
import { MashrabiyaLayer } from "@/components/Ornaments";

export interface CityOption {
  id: City | "all";
  name: string;
  coords: [number, number];
  zoom: number;
}

const CITY_ZOOM = 12;

/** خيارات المدن للخريطة: "كل المدن" + المدن الست بالترتيب المعتمد */
export const cities: CityOption[] = [
  { id: "all", name: "كل المدن", coords: [31.5, 31.7], zoom: 9 },
  ...CITY_NAMES.map((name) => {
    const { lat, lng } = cityCenter(name);
    return {
      id: name,
      name,
      coords: [lat, lng] as [number, number],
      zoom: CITY_ZOOM,
    };
  }),
];

/** مطابقة مرنة لمدينة العقار مع خيار المدينة المحدد (مرادفات في cities.ts) */
export function matchesCity(propertyCity: string, city: CityOption): boolean {
  if (city.id === "all") return true;
  return cityMatches(propertyCity, city.id);
}

const ROOM_OPTIONS: { value: RoomsFilter; label: string }[] = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4+", label: "4+" },
];

const PURPOSE_OPTIONS: { value: Purpose; labelKey: "purpose.buy" | "purpose.rent" }[] = [
  { value: "بيع", labelKey: "purpose.buy" },
  { value: "إيجار", labelKey: "purpose.rent" },
];

const STEP = 50_000;

/** نمط موحّد لحقول الاختيار المضغوطة */
const SELECT_CLASS =
  "w-full rounded-xl border border-sand-300 bg-white px-2.5 py-2 text-xs font-semibold text-ocean-900 outline-none transition focus:border-ocean-500";

const LABEL_CLASS = "mb-1 block text-[11px] font-bold text-ocean-600";

/** شكل مقبض السلايدر على المتصفحات المختلفة */
const RANGE_BASE =
  "pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-ocean-700 [&::-moz-range-thumb]:shadow [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-ocean-700 [&::-webkit-slider-thumb]:shadow";

interface Props {
  applied: PropertyFilters;
  onApply: (filters: PropertyFilters) => void;
  onClear: () => void;
  /** نص البحث الحالي (غير مطبَّق بعد) */
  query: string;
  onQueryChange: (value: string) => void;
  /** تطبيق البحث على النتائج */
  onSearch: () => void;
  resultCount: number;
}

/**
 * كارت موحّد للبحث والفلاتر في العمود الجانبي.
 * مطويّ افتراضياً بحيث يقارب ارتفاع كارت الإعلان، وتُفتح لوحة الفلاتر عند الطلب.
 * الفلاتر تُطبَّق فوراً، والبحث يعمل عند الضغط على Enter.
 */
export default function Filters({
  applied,
  onApply,
  onClear,
  query,
  onQueryChange,
  onSearch,
  resultCount,
}: Props) {
  const { t } = useI18n();
  const { formatWithSymbol } = useCurrency();
  const [draft, setDraft] = useState<PropertyFilters>(applied);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setDraft(applied);
  }, [applied]);

  /** تحديث فلتر واحد وتطبيقه فوراً على النتائج */
  const update = (patch: Partial<PropertyFilters>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    onApply(next);
  };

  const setPriceMin = (raw: number) => {
    const next = Math.min(raw, draft.priceMax - STEP);
    update({
      priceMin: Math.max(PRICE_FILTER_MIN, next),
      priceActive: true,
    });
  };

  const setPriceMax = (raw: number) => {
    const next = Math.max(raw, draft.priceMin + STEP);
    update({
      priceMax: Math.min(PRICE_FILTER_MAX, next),
      priceActive: true,
    });
  };

  const minPercent =
    ((draft.priceMin - PRICE_FILTER_MIN) /
      (PRICE_FILTER_MAX - PRICE_FILTER_MIN)) *
    100;
  const maxPercent =
    ((draft.priceMax - PRICE_FILTER_MIN) /
      (PRICE_FILTER_MAX - PRICE_FILTER_MIN)) *
    100;

  const handleClear = () => {
    setDraft(defaultPropertyFilters);
    onClear();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onApply(draft);
    onSearch();
  };

  /** عدد الفلاتر المطبَّقة — يظهر كشارة على زر الفلاتر */
  const activeCount = [
    applied.city,
    applied.type,
    applied.purpose,
    applied.rooms,
    applied.priceActive,
  ].filter(Boolean).length;

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden rounded-3xl border border-sand-300 bg-white p-3.5 shadow-soft"
    >
      <MashrabiyaLayer tone="light" className="opacity-[0.05]" />
      <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-l from-transparent via-gold-400/60 to-transparent" />

      <div className="relative">
        <div className="space-y-2.5">
          {/* رأس الكارت: العنوان + عدد النتائج */}
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-ocean-900">
              {t("filters.title")}
            </h2>
            <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-bold text-ocean-700">
              {t("filters.results", { count: resultCount })}
            </span>
          </div>

          {/* البحث + زر الفلاتر */}
          <div className="flex items-stretch gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-600" />
              <input
                type="search"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder={t("home.search.label")}
                aria-label={t("home.search.label")}
                className="w-full rounded-xl border border-sand-300 bg-sand-50 py-2 pe-9 ps-3 text-sm font-semibold text-ocean-900 outline-none transition placeholder:font-normal placeholder:text-sand-600 focus:border-ocean-500 focus:bg-white"
              />
            </div>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="home-filters-panel"
              onClick={() => setOpen((value) => !value)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[11px] font-bold transition ${
                open
                  ? "border-ocean-700 bg-ocean-700 text-white"
                  : activeCount > 0
                    ? "border-gold-300 bg-gold-50 text-gold-800 hover:bg-gold-100"
                    : "border-sand-300 bg-white text-ocean-800 hover:border-gold-300"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
              {open ? t("filters.hide") : t("filters.toggle")}
              {activeCount > 0 && (
                <span
                  className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black ${
                    open ? "bg-white/20 text-white" : "bg-ocean-700 text-white"
                  }`}
                >
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* لوحة الفلاتر — تنفتح عند الضغط على الزر */}
        <div
          id="home-filters-panel"
          className={`grid overflow-hidden transition-all duration-300 ${
            open
              ? "visible grid-rows-[1fr] opacity-100"
              : "invisible grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0">
            <div className="space-y-2.5 pt-2.5">
              {/* نوع العرض + المدينة */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className={LABEL_CLASS}>{t("filters.purpose")}</p>
                  <div className="grid grid-cols-2 gap-1 rounded-xl bg-sand-100 p-1">
                    {PURPOSE_OPTIONS.map((option) => {
                      const active = draft.purpose === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            update({ purpose: active ? "" : option.value })
                          }
                          className={`rounded-lg px-1 py-1.5 text-[11px] font-bold transition ${
                            active
                              ? "bg-ocean-700 text-white shadow"
                              : "text-ocean-800 hover:bg-white"
                          }`}
                        >
                          {t(option.labelKey)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="block">
                  <span className={LABEL_CLASS}>{t("filters.city")}</span>
                  <select
                    value={draft.city}
                    onChange={(event) =>
                      update({
                        city: event.target.value as PropertyFilters["city"],
                      })
                    }
                    className={SELECT_CLASS}
                  >
                    <option value="">{t("city.all")}</option>
                    {CITY_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {cityLabel(name, t)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* نوع العقار + الغرف */}
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className={LABEL_CLASS}>{t("filters.types")}</span>
                  <select
                    value={draft.type}
                    onChange={(event) =>
                      update({
                        type: event.target.value as PropertyFilters["type"],
                      })
                    }
                    className={SELECT_CLASS}
                  >
                    <option value="">{t("filters.allTypes")}</option>
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {propertyTypeLabel(type, t)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={LABEL_CLASS}>{t("filters.rooms")}</span>
                  <select
                    value={draft.rooms}
                    onChange={(event) =>
                      update({ rooms: event.target.value as RoomsFilter })
                    }
                    className={SELECT_CLASS}
                  >
                    <option value="">{t("filters.anyRooms")}</option>
                    {ROOM_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* نطاق السعر */}
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold text-ocean-600">
                    {t("filters.priceRange")}
                  </p>
                  <p className="whitespace-nowrap text-[10px] font-semibold text-ocean-800">
                    {formatWithSymbol(draft.priceMin)} —{" "}
                    {formatWithSymbol(draft.priceMax)}
                  </p>
                </div>
                <div className="relative h-6">
                  <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-ocean-100" />
                  <div
                    className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-ocean-600"
                    style={{
                      left: `${minPercent}%`,
                      right: `${100 - maxPercent}%`,
                    }}
                  />
                  <input
                    type="range"
                    min={PRICE_FILTER_MIN}
                    max={PRICE_FILTER_MAX}
                    step={STEP}
                    value={draft.priceMin}
                    onChange={(event) => setPriceMin(Number(event.target.value))}
                    className={`${RANGE_BASE} z-20`}
                    aria-label={t("filters.priceFrom")}
                  />
                  <input
                    type="range"
                    min={PRICE_FILTER_MIN}
                    max={PRICE_FILTER_MAX}
                    step={STEP}
                    value={draft.priceMax}
                    onChange={(event) => setPriceMax(Number(event.target.value))}
                    className={`${RANGE_BASE} z-30`}
                    aria-label={t("filters.priceTo")}
                  />
                </div>
              </div>

              {/* مسح + إغلاق */}
              <div className="flex items-center justify-between border-t border-sand-200 pt-2.5">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[11px] font-semibold text-sand-600 transition hover:text-sand-900"
                >
                  {t("filters.clearAll")}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-[11px] font-bold text-ocean-700 transition hover:text-ocean-900"
                >
                  {t("filters.done")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
