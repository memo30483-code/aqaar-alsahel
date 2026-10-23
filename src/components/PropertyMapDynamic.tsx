"use client";

import dynamic from "next/dynamic";
import { Property } from "@/types/property";
import { CityOption, cities } from "./Filters";

/** سيرفرات بلاطات OpenStreetMap — تُسخّن مسبقاً لتظهر الخريطة أسرع */
const TILE_ORIGINS = [
  "https://a.tile.openstreetmap.org",
  "https://b.tile.openstreetmap.org",
  "https://c.tile.openstreetmap.org",
];

const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[400px] w-full animate-pulse items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
      <span className="text-sm font-medium">جاري تحميل خريطة العقارات...</span>
    </div>
  ),
});

interface Props {
  properties: Property[];
  selectedCity?: CityOption;
}

export default function PropertyMapDynamic({
  properties,
  selectedCity = cities[0],
}: Props) {
  return (
    <div className="relative h-[420px] overflow-hidden rounded-3xl border border-gray-200 bg-slate-100 shadow-2xl lg:h-[520px]">
      {TILE_ORIGINS.map((origin) => (
        <link key={origin} rel="preconnect" href={origin} />
      ))}
      <PropertyMap properties={properties} selectedCity={selectedCity} />
    </div>
  );
}
