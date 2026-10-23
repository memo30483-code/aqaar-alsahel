"use client";

import dynamic from "next/dynamic";

const PropertyDetailMap = dynamic(() => import("./PropertyDetailMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-ocean-100 text-sm text-ocean-600">
      جاري تحميل الخريطة...
    </div>
  ),
});

interface Props {
  lat: number;
  lng: number;
  title: string;
}

export default function PropertyDetailMapDynamic(props: Props) {
  return (
    <div className="h-56 overflow-hidden rounded-xl border border-ocean-100 sm:h-64">
      <PropertyDetailMap {...props} />
    </div>
  );
}
