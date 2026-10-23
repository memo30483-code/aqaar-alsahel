"use client";

import { FormEvent, Fragment, useEffect, useMemo, useState } from "react";
import Filters, {
  CityOption,
  cities,
  matchesCity,
} from "@/components/Filters";
import PropertyCard from "@/components/PropertyCard";
import PropertyMapDynamic from "@/components/PropertyMapDynamic";
import { FeaturedAdSlot } from "@/components/FeaturedAds";
import {
  filterProperties,
  mockProperties,
  USER_PROPERTIES_KEY,
} from "@/data/properties";
import {
  defaultPropertyFilters,
  Property,
  PropertyFilters,
} from "@/types/property";
import { formatPrice } from "@/lib/format";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80";

export default function HomePage() {
  const [selectedCity, setSelectedCity] = useState<CityOption>(cities[0]);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<PropertyFilters>(defaultPropertyFilters);
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

  const visible = useMemo(
    () =>
      filterProperties(allProperties, {
        ...filters,
        city: "",
        query: search,
      }).filter((p) => matchesCity(p.city, selectedCity)),
    [allProperties, filters, search, selectedCity]
  );

  const averagePricePerMeter = useMemo(() => {
    if (visible.length === 0) return null;
    const total = visible.reduce((sum, p) => sum + p.price / p.area, 0);
    return Math.round(total / visible.length);
  }, [visible]);

  const handleClear = () => {
    setFilters(defaultPropertyFilters);
    setSearch("");
    setQuery("");
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearch(query.trim());
  };

  return (
    <>
      {/* Hero */}
      <section className="relative h-[540px] bg-black sm:h-[600px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-4 text-center sm:px-6">
          <h1 className="text-5xl font-black text-white sm:text-6xl">
            عقار الساحل
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/80 sm:text-lg">
            عقارات دمياط والساحل — شقق، فلل وشاليهات بأسعار شفافة
          </p>
          <form
            onSubmit={handleSearch}
            className="mt-8 flex w-full max-w-xl items-center gap-2 rounded-full bg-white p-2 shadow-2xl"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بمدينة أو حي أو نوع العقار..."
              className="flex-1 rounded-full bg-transparent px-5 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
            <button
              type="submit"
              className="rounded-full bg-black px-6 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
            >
              ابحث
            </button>
          </form>
        </div>
      </section>

      {/* الفلاتر + النتائج + الخريطة */}
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <Filters
          applied={filters}
          onApply={setFilters}
          onClear={handleClear}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
        />

        <section id="properties" className="scroll-mt-32 pt-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  عقارات {selectedCity.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {visible.length} نتيجة من أصل {allProperties.length}
                </p>
              </div>

              {visible.length === 0 ? (
                <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center">
                  <p className="font-bold text-gray-900">
                    لا توجد عقارات في {selectedCity.name} حالياً
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    جرّب مدينة أخرى أو اضغط «كل المدن» لعرض جميع العقارات.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {visible.map((property, index) => (
                    <Fragment key={property.id}>
                      <PropertyCard property={property} />
                      {index === 1 && (
                        <FeaturedAdSlot className="sm:col-span-2" />
                      )}
                      {index === 5 && (
                        <FeaturedAdSlot
                          variant="bold"
                          className="sm:col-span-2"
                        />
                      )}
                    </Fragment>
                  ))}
                </div>
              )}
            </div>

            <aside className="lg:col-span-1">
              <div className="space-y-4 lg:sticky lg:top-[145px]">
                <PropertyMapDynamic
                  properties={visible}
                  selectedCity={selectedCity}
                />

                <div className="rounded-2xl bg-blue-50 p-5">
                  <h3 className="text-base font-bold text-gray-900">
                    دليل منطقة {selectedCity.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">متوسط سعر المتر</p>
                  <p className="mt-1 text-2xl font-black text-gray-900">
                    {averagePricePerMeter === null
                      ? "—"
                      : `${formatPrice(averagePricePerMeter)} ج.م`}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    محسوب من {visible.length} عقار معروض
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </>
  );
}
