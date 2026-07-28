"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { guessFlag } from "@/lib/types";

// Bekannter Bug beim Bundling von Leaflet mit Webpack/Next.js: die Standard-Marker-
// Icons finden ihren Bildpfad nicht automatisch. Wir laden sie stattdessen von einem
// CDN, damit sie zuverlässig angezeigt werden.
// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function numberedIcon(num: number, color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-family:monospace;font-size:13px;border:2.5px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,0.35);">${num}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

export default function RealMap({ stops, accentColor }: { stops: any[]; accentColor: string }) {
  const positions: [number, number][] = stops.map((s) => [parseFloat(s.data.lat), parseFloat(s.data.lon)]);
  if (positions.length === 0) return null;

  const center: [number, number] = [
    positions.reduce((a, p) => a + p[0], 0) / positions.length,
    positions.reduce((a, p) => a + p[1], 0) / positions.length,
  ];

  return (
    <MapContainer
      center={center}
      zoom={6}
      bounds={positions.length > 1 ? positions : undefined}
      boundsOptions={{ padding: [36, 36] }}
      scrollWheelZoom={false}
      style={{ height: 340, width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={positions} pathOptions={{ color: "#3A3530", weight: 3, dashArray: "6 8", opacity: 0.55 }} />
      {stops.map((s, i) => {
        const flagCountry = s.data.fromCountry || s.data.land;
        return (
          <Marker
            key={s.id}
            position={[parseFloat(s.data.lat), parseFloat(s.data.lon)]}
            icon={numberedIcon(s.listNumber ?? i + 1, accentColor)}
          >
            <Popup>
              <strong>
                {flagCountry ? guessFlag(flagCountry) : ""} {s.data.symbol || ""} {s.data.from}
              </strong>
              {s.data.date && (
                <div style={{ fontSize: 12, marginTop: 2 }}>
                  {new Date(s.data.date).toLocaleDateString("de-DE")}
                </div>
              )}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
