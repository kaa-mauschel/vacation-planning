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

function numberedIcon(num: number, color: string, isStay: boolean) {
  const size = isStay ? 28 : 20;
  const fontSize = isStay ? 13 : 10;
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};opacity:${isStay ? 1 : 0.8};color:#fff;width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-family:monospace;font-size:${fontSize}px;border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,0.35);">${num}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 2],
  });
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

// Jeder "stop" ist entweder ein Aufenthalt (isStay: true, mit Ankunft/Abreise) oder ein
// kurzer Zwischenstopp auf der Fahrt (isStay: false, meist nur ein Datum).
export default function RealMap({ stops, accentColor }: { stops: any[]; accentColor: string }) {
  const positions: [number, number][] = stops.map((s) => [parseFloat(s.lat), parseFloat(s.lon)]);
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
        let dateInfo = "";
        if (s.isStay && s.arrival && s.departure) dateInfo = `${fmtDate(s.arrival)} – ${fmtDate(s.departure)}`;
        else if (s.isStay && s.departure) dateInfo = `ab ${fmtDate(s.departure)}`;
        else if (s.isStay && s.arrival) dateInfo = `ab ${fmtDate(s.arrival)}`;
        else if (s.departure) dateInfo = `Zwischenstopp · ${fmtDate(s.departure)}`;
        else if (s.arrival) dateInfo = `Zwischenstopp · ${fmtDate(s.arrival)}`;
        else dateInfo = "Zwischenstopp";

        return (
          <Marker
            key={s.id}
            position={[parseFloat(s.lat), parseFloat(s.lon)]}
            icon={numberedIcon(s.listNumber ?? i + 1, accentColor, !!s.isStay)}
          >
            <Popup>
              <strong>
                {s.country ? guessFlag(s.country) : ""} {s.symbol || ""} {s.name}
              </strong>
              {dateInfo && <div style={{ fontSize: 12, marginTop: 2 }}>{dateInfo}</div>}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
