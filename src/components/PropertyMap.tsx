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
import { CITY_CENTERS } from "@/data/properties";

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

function FitBounds({ properties }: { properties: Property[] }) {
  const map = useMap();

  useEffect(() => {
    if (properties.length === 0) {
      const c = CITY_CENTERS["دمياط الجديدة"];
      map.setView([c.lat, c.lng], 13);
      return;
    }
    if (properties.length === 1) {
      map.setView([properties[0].lat, properties[0].lng], 14);
      return;
    }
    const bounds = L.latLngBounds(
      properties.map((p) => [p.lat, p.lng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, properties]);

  return null;
}

interface Props {
  properties: Property[];
}

export default function PropertyMap({ properties }: Props) {
  const center = CITY_CENTERS["دمياط الجديدة"];

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds properties={properties} />
      {properties.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={markerIcon}>
          <Popup>
            <strong>{p.title}</strong>
            <br />
            {formatPrice(p.price)} ج.م
            <br />
            <span className="text-xs">
              {p.district} · {p.type}
            </span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
