"use client";

import dynamic from "next/dynamic";
import { City } from "@/types/property";

const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[280px] items-center justify-center rounded-xl bg-ocean-100 text-sm text-ocean-600 sm:h-[320px]">
      جاري تحميل الخريطة...
    </div>
  ),
});

interface Props {
  city: City | "";
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export default function LocationPickerDynamic(props: Props) {
  return <LocationPicker {...props} />;
}
