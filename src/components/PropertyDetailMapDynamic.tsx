"use client";

import dynamic from "next/dynamic";
import { useI18n } from "@/lib/i18n";

/** هيكل تحميل الخريطة أثناء جلب مكوّن Leaflet */
function MapLoading() {
  const { t } = useI18n();
  return (
    <div className="flex h-full items-center justify-center bg-ocean-100 text-sm text-ocean-600">
      {t("property.mapLoadingShort")}
    </div>
  );
}

const PropertyDetailMap = dynamic(() => import("./PropertyDetailMap"), {
  ssr: false,
  loading: () => <MapLoading />,
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
