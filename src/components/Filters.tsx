"use client";

import { useEffect, useState } from "react";
import { cities } from "@/data/properties";
import {
  City,
  defaultPropertyFilters,
  PRICE_FILTER_MAX,
  PRICE_FILTER_MIN,
  PropertyFilters,
  RoomsFilter,
} from "@/types/property";
import { formatPrice } from "@/lib/format";

const ROOM_OPTIONS: { value: RoomsFilter; label: string }[] = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4+", label: "4+" },
];

const STEP = 50_000;

interface Props {
  applied: PropertyFilters;
  onApply: (filters: PropertyFilters) => void;
  onClear: () => void;
}

export default function Filters({ applied, onApply, onClear }: Props) {
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

  // المدينة تُطبَّق فوراً، والسعر وعدد الغرف ينتظران زر "تطبيق"
  const selectCity = (city: City | "") => {
    setDraft((d) => ({ ...d, city }));
    onApply({ ...applied, city });
  };

  return (
    <section className="rounded-2xl border border-ocean-100 bg-white p-4 shadow-soft sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-ocean-900 sm:text-lg">
          فلترة النتائج
        </h2>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs font-semibold text-ocean-500 transition hover:text-ocean-800"
        >
          مسح الفلاتر
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* المدينة */}
        <div>
          <p className="mb-2 text-xs font-bold text-ocean-600">المدينة</p>
          <div className="flex flex-wrap gap-2">
            <CityChip
              active={applied.city === ""}
              onClick={() => selectCity("")}
              label="كل المدن"
            />
            {cities.map((c) => (
              <CityChip
                key={c}
                active={applied.city === c}
                onClick={() => selectCity(c)}
                label={c}
              />
            ))}
          </div>
        </div>

        {/* الغرف */}
        <div>
          <p className="mb-2 text-xs font-bold text-ocean-600">عدد الغرف</p>
          <div className="flex flex-wrap gap-2">
            {ROOM_OPTIONS.map((opt) => {
              const active = draft.rooms === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      rooms: active ? "" : opt.value,
                    }))
                  }
                  className={`min-w-[2.75rem] rounded-xl border px-3 py-2 text-sm font-bold transition ${
                    active
                      ? "border-ocean-700 bg-ocean-700 text-white"
                      : "border-ocean-200 bg-white text-ocean-800 hover:border-ocean-400"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* السعر */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-ocean-600">نطاق السعر</p>
            <p className="text-xs font-semibold text-ocean-800">
              {formatPrice(draft.priceMin)} — {formatPrice(draft.priceMax)} ج.م
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
              aria-label="السعر من"
            />
            <input
              type="range"
              min={PRICE_FILTER_MIN}
              max={PRICE_FILTER_MAX}
              step={STEP}
              value={draft.priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="pointer-events-none absolute inset-0 z-30 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-ocean-700 [&::-moz-range-thumb]:shadow [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-ocean-700 [&::-webkit-slider-thumb]:shadow"
              aria-label="السعر إلى"
            />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-ocean-400">
            <span>500 ألف</span>
            <span>5 مليون</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-ocean-50 pt-4">
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="rounded-xl bg-ocean-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-ocean-800"
        >
          تطبيق
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-xl border border-ocean-200 bg-white px-5 py-2.5 text-sm font-bold text-ocean-700 transition hover:bg-ocean-50"
        >
          مسح الفلاتر
        </button>
      </div>
    </section>
  );
}

function CityChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-xs font-bold transition sm:text-sm ${
        active
          ? "border-ocean-700 bg-ocean-700 text-white"
          : "border-ocean-200 bg-white text-ocean-800 hover:border-ocean-400"
      }`}
    >
      {label}
    </button>
  );
}
