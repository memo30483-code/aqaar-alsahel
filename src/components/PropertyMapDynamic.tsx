"use client";

import dynamic from "next/dynamic";
import { Property } from "@/types/property";

const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl bg-ocean-100 text-sm text-ocean-600">
      جاري تحميل الخريطة...
    </div>
  ),
});

interface Props {
  properties: Property[];
}

export default function PropertyMapDynamic({ properties }: Props) {
  return (
    <div className="h-[360px] overflow-hidden rounded-2xl border border-ocean-100 shadow-soft sm:h-[420px]">
      <PropertyMap properties={properties} />
    </div>
  );
}
