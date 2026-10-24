"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Property } from "@/types/property";
import { useI18n } from "@/lib/i18n";
import { cityLabel } from "@/lib/i18n/cities";
import { useCurrency } from "@/lib/currency";
import { CityOption, cities } from "./Filters";

/**
 * أيقونة مرسومة بالـ CSS بدل صور بعيدة — لا طلبات شبكة إضافية للـ markers
 * فتظهر العلامات فوراً مع الخريطة.
 */
const markerIcon = L.divIcon({
  className: "",
  html: '<span style="display:block;width:20px;height:20px;border-radius:9999px;background:#111827;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -14],
});

/** هيكل تحميل الخريطة — يظهر فقط قبل جهوزية المتصفح */
function MapSkeleton() {
  const { t } = useI18n();
  return (
    <div className="flex h-full min-h-[400px] w-full animate-pulse items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
      <span className="text-sm font-medium">{t("property.mapLoading")}</span>
    </div>
  );
}

/** يحرّك الخريطة للمدينة المختارة بـ flyTo، ويلائم حدود النتائج عند "كل المدن" */
function FlyToCity({
  city,
  properties,
}: {
  city: CityOption;
  properties: Property[];
}) {
  const map = useMap();
  // عند أول تحميل لمدينة محددة تكون الخريطة متمركزة عليها بالفعل — نتخطى الحركة
  const skipFirstMove = useRef(city.id !== "all");

  useEffect(() => {
    if (skipFirstMove.current) {
      skipFirstMove.current = false;
      return;
    }

    if (city.id === "all") {
      if (properties.length === 1) {
        map.setView([properties[0].lat, properties[0].lng], 13);
      } else if (properties.length > 1) {
        const bounds = L.latLngBounds(
          properties.map((p) => [p.lat, p.lng] as [number, number])
        );
        map.fitBounds(bounds, { padding: [40, 40] });
      }
      return;
    }

    map.flyTo(city.coords, city.zoom, { duration: 1.5 });
  }, [map, city, properties]);

  return null;
}

interface Props {
  properties: Property[];
  selectedCity?: CityOption;
}

export default function PropertyMap({
  properties,
  selectedCity = cities[0],
}: Props) {
  const { t, locale } = useI18n();
  const { formatWithSymbol } = useCurrency();
  const numberFormat = new Intl.NumberFormat(
    locale === "ar" ? "ar-EG" : "en-US"
  );
  const [mounted, setMounted] = useState(false);
  // معرّف فريد لكل نسخة من الخريطة: يضمن أن Leaflet ينشئ الخريطة على عنصر DOM
  // جديد تماماً في كل مرة، فلا يظهر خطأ "Map container is already initialized"
  const instanceId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  // لا ننشئ MapContainer إلا في المتصفح وبعد جهوزية الـ DOM element
  if (!mounted) return <MapSkeleton />;

  return (
    <MapContainer
      key={instanceId}
      center={selectedCity.coords}
      zoom={selectedCity.zoom}
      scrollWheelZoom={false}
      fadeAnimation={false}
      markerZoomAnimation={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        updateWhenIdle={false}
        keepBuffer={4}
      />
      <FlyToCity city={selectedCity} properties={properties} />
      {properties.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={markerIcon}>
          <Popup>
            <strong>{p.title}</strong>
            <br />
            {formatWithSymbol(p.price)}
            <br />
            <span className="text-xs">
              {cityLabel(p.city, t)} · {numberFormat.format(p.area)}{" "}
              {t("common.sqm")}
            </span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
