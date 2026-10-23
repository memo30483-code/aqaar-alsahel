"use client";

import dynamic from "next/dynamic";
import { Property } from "@/types/property";
import { CityOption, cities } from "./Filters";

const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[420px] items-center justify-center bg-gray-100 text-sm text-gray-500">
      جاري تحميل الخريطة...
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
    <div className="h-[420px] overflow-hidden rounded-3xl border border-gray-200 shadow-2xl lg:h-[520px]">
      <PropertyMap properties={properties} selectedCity={selectedCity} />
    </div>
  );
}
