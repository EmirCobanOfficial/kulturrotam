"use client";

import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import { divIcon } from "leaflet";
import type { RouteStop } from "@/lib/types";

function pin(label: string, meal: boolean) {
  return divIcon({
    className: "",
    html: `<div class="stop-pin${meal ? " stop-pin--meal" : ""}">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function RouteMap({ stops }: { stops: RouteStop[] }) {
  if (stops.length === 0) return null;

  const points = stops.map((s) => [s.place.lat, s.place.lng] as [number, number]);
  const center = points[Math.floor(points.length / 2)];

  return (
    <MapContainer
      center={center}
      zoom={14}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={points} color="#146b5c" weight={4} opacity={0.7} />
      {stops.map((s, i) => (
        <Marker
          key={s.place.id + i}
          position={[s.place.lat, s.place.lng]}
          icon={pin(s.isMeal ? "🍽" : String(i + 1), s.isMeal)}
        >
          <Popup>
            <strong>{s.place.name_tr}</strong>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
