"use client";

import dynamic from "next/dynamic";
import { City } from "@/types/property";
import { useI18n } from "@/lib/i18n";

/** هيكل تحميل الخريطة أثناء جلب مكوّن Leaflet */
function MapLoading() {
  const { t } = useI18n();
  return (
    <div className="flex h-[280px] items-center justify-center rounded-xl bg-ocean-100 text-sm text-ocean-600 sm:h-[320px]">
      {t("property.mapLoadingShort")}
    </div>
  );
}

const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => <MapLoading />,
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
