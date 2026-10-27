"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/** علامة على شكل بيت صغير بهوية الموقع — تُثبّت على موقع العقار */
const markerIcon = L.divIcon({
  className: "property-detail-marker",
  html: `<span style="display:block;position:relative;width:34px;height:44px;filter:drop-shadow(0 6px 10px rgba(20,26,51,.35))">
    <svg viewBox="0 0 34 44" width="34" height="44" aria-hidden="true">
      <path d="M17 1C8.2 1 1 8.1 1 16.9 1 28.4 17 43 17 43s16-14.6 16-26.1C33 8.1 25.8 1 17 1Z" fill="#141a33" stroke="#f2dca6" stroke-width="2"/>
      <path d="M9.5 18.5 17 11l7.5 7.5" fill="none" stroke="#e2c688" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 18v8h10v-8" fill="none" stroke="#e2c688" stroke-width="2.2" stroke-linejoin="round"/>
      <rect x="15" y="21" width="4" height="5" rx="1" fill="#e2c688"/>
    </svg>
  </span>`,
  iconSize: [34, 44],
  iconAnchor: [17, 44],
  popupAnchor: [0, -40],
});

interface Props {
  lat: number;
  lng: number;
  title: string;
}

export default function PropertyDetailMap({ lat, lng, title }: Props) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      dragging
      doubleClickZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={markerIcon}>
        <Popup>{title}</Popup>
      </Marker>
    </MapContainer>
  );
}
