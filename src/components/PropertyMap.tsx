"use client";

import { useEffect } from "react";
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
import { formatPrice } from "@/lib/format";
import { CityOption, cities } from "./Filters";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/** يحرّك الخريطة للمدينة المختارة بـ flyTo، ويلائم حدود النتائج عند "كل المدن" */
function FlyToCity({
  city,
  properties,
}: {
  city: CityOption;
  properties: Property[];
}) {
  const map = useMap();

  useEffect(() => {
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
  return (
    <MapContainer
      center={selectedCity.coords}
      zoom={selectedCity.zoom}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FlyToCity city={selectedCity} properties={properties} />
      {properties.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={markerIcon}>
          <Popup>
            <strong>{p.title}</strong>
            <br />
            {formatPrice(p.price)} ج.م
            <br />
            <span className="text-xs">
              {p.city} · {p.area} م²
            </span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
