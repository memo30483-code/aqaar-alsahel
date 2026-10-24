"use client";

import { useEffect, useState } from "react";
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

interface Props {
  applied: PropertyFilters;
  onApply: (filters: PropertyFilters) => void;
  onClear: () => void;
}

const chipClass = (active: boolean) =>
  `rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
    active
      ? "border-ocean-700 bg-ocean-700 text-white"
      : "border-sand-300 bg-white text-ocean-800 hover:border-gold-300"
  }`;

/** لوحة الفلاتر الجانبية: نوع العرض، نوع العقار، المدينة، الغرف، ونطاق السعر */
export default function Filters({ applied, onApply, onClear }: Props) {
  const { t } = useI18n();
  const { formatWithSymbol } = useCurrency();
  const [draft, setDraft] = useState<PropertyFilters>(applied);

  useEffect(() => {
    setDraft(applied);
  }, [applied]);

  const setPriceMin = (raw: number) => {
    const next = Math.min(raw, draft.priceMax - STEP);
    setDraft((d) => ({
      ...d,
      priceMin: Math.max(PRICE_FILTER_MIN, next),
    }));
  };

  const setPriceMax = (raw: number) => {
    const next = Math.max(raw, draft.priceMin + STEP);
    setDraft((d) => ({
      ...d,
      priceMax: Math.min(PRICE_FILTER_MAX, next),
    }));
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

  return (
    <section className="relative rounded-3xl border border-sand-300 bg-white p-4 shadow-soft sm:p-5">
      {/* رأس القائمة الجانبية: نقشة إسلامية شفافة (مقصوصة داخل حواف الكارت دون قصّ القوائم المنسدلة) */}
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <MashrabiyaLayer tone="light" className="opacity-[0.05]" />
      </span>
      <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-gold-400/60 to-transparent" />
      <div className="relative mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-ocean-900">
          {t("filters.title")}
        </h2>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs font-semibold text-sand-600 transition hover:text-sand-900"
        >
          {t("filters.clearAll")}
        </button>
      </div>

      {/* نوع العرض */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-bold text-ocean-600">
          {t("filters.purpose")}
        </p>
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-sand-100 p-1">
          {PURPOSE_OPTIONS.map((opt) => {
            const active = draft.purpose === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    purpose: active ? "" : opt.value,
                  }))
                }
                className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                  active
                    ? "bg-ocean-700 text-white shadow"
                    : "text-ocean-800 hover:bg-white"
                }`}
              >
                {t(opt.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* نوع العقار */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-bold text-ocean-600">
          {t("filters.types")}
        </p>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((type) => {
            const active = draft.type === type;
            return (
              <button
                key={type}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setDraft((d) => ({ ...d, type: active ? "" : type }))
                }
                className={chipClass(active)}
              >
                {propertyTypeLabel(type, t)}
              </button>
            );
          })}
        </div>
      </div>

      {/* المدينة */}
      <div className="mb-5">
        <label
          htmlFor="filter-city"
          className="mb-2 block text-xs font-bold text-ocean-600"
        >
          {t("filters.city")}
        </label>
        <select
          id="filter-city"
          value={draft.city}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              city: e.target.value as PropertyFilters["city"],
            }))
          }
          className="w-full rounded-2xl border border-sand-300 bg-white px-3 py-2.5 text-sm font-semibold text-ocean-900 outline-none transition focus:border-ocean-500"
        >
          <option value="">{t("city.all")}</option>
          {CITY_NAMES.map((name) => (
            <option key={name} value={name}>
              {cityLabel(name, t)}
            </option>
          ))}
        </select>
      </div>

      {/* الغرف */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-bold text-ocean-600">
          {t("filters.rooms")}
        </p>
        <div className="flex flex-wrap gap-2">
          {ROOM_OPTIONS.map((opt) => {
            const active = draft.rooms === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    rooms: active ? "" : opt.value,
                  }))
                }
                className={`min-w-[2.5rem] rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                  active
                    ? "border-ocean-700 bg-ocean-700 text-white"
                    : "border-sand-300 bg-white text-ocean-800 hover:border-gold-300"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* نطاق السعر */}
      <div className="mb-2">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-ocean-600">
            {t("filters.priceRange")}
          </p>
          <p className="text-[11px] font-semibold text-ocean-800">
            {formatWithSymbol(draft.priceMin)} — {formatWithSymbol(draft.priceMax)}
          </p>
        </div>
        <div className="relative mt-4 h-8">
          <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-ocean-100" />
          <div
            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-ocean-600"
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
            onChange={(e) => setPriceMin(Number(e.target.value))}
            className="pointer-events-none absolute inset-0 z-20 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-ocean-700 [&::-moz-range-thumb]:shadow [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-ocean-700 [&::-webkit-slider-thumb]:shadow"
            aria-label={t("filters.priceFrom")}
          />
          <input
            type="range"
            min={PRICE_FILTER_MIN}
            max={PRICE_FILTER_MAX}
            step={STEP}
            value={draft.priceMax}
            onChange={(e) => setPriceMax(Number(e.target.value))}
            className="pointer-events-none absolute inset-0 z-30 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-ocean-700 [&::-moz-range-thumb]:shadow [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-ocean-700 [&::-webkit-slider-thumb]:shadow"
            aria-label={t("filters.priceTo")}
          />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-ocean-400">
          <span>{t("filters.boundMin")}</span>
          <span>{t("filters.boundMax")}</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-sand-200 pt-4">
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="flex-1 rounded-full bg-ocean-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-ocean-800"
        >
          {t("filters.apply")}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-full border border-sand-300 bg-white px-5 py-2.5 text-sm font-bold text-sand-800 transition hover:bg-sand-50"
        >
          {t("filters.clearAll")}
        </button>
      </div>
    </section>
  );
}
