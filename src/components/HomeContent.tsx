"use client";

import { useEffect, useMemo, useState } from "react";
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
import Filters from "./Filters";
import SearchBar from "./SearchBar";
import PropertyGrid from "./PropertyGrid";
import PropertyMapDynamic from "./PropertyMapDynamic";

export default function HomeContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<PropertyFilters>(defaultPropertyFilters);
  const [userProperties, setUserProperties] = useState<Property[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(USER_PROPERTIES_KEY);
    if (stored) setUserProperties(JSON.parse(stored));
  }, []);

  const allProperties = useMemo(
    () => [...userProperties, ...mockProperties],
    [userProperties]
  );

  const filtered = useMemo(
    () =>
      filterProperties(allProperties, {
        ...filters,
        query: searchQuery,
      }),
    [allProperties, filters, searchQuery]
  );

  const handleClear = () => {
    setFilters(defaultPropertyFilters);
    setSearchQuery("");
  };

  return (
    <>
      <section className="relative z-10 -mt-8 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={() => setSearchQuery(searchQuery.trim())}
            resultCount={filtered.length}
          />
          <Filters
            applied={filters}
            onApply={setFilters}
            onClear={handleClear}
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ocean-900 sm:text-2xl">
              الخريطة التفاعلية
            </h2>
            <p className="mt-1 text-sm text-ocean-500">
              النتائج تظهر على الخريطة حسب الفلاتر والبحث
            </p>
          </div>
        </div>
        <PropertyMapDynamic properties={filtered} />
      </section>

      <section
        id="properties"
        className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-16 sm:px-6"
      >
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ocean-900 sm:text-2xl">
              العقارات المتاحة
            </h2>
            <p className="mt-1 text-sm text-ocean-500">
              {filtered.length} نتيجة من أصل {allProperties.length}
            </p>
          </div>
        </div>
        <PropertyGrid properties={filtered} />
      </section>
    </>
  );
}
