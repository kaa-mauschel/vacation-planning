"use client";

import { useState, useEffect } from "react";
import { useTripStops } from "@/lib/useTripStops";
import { getDayWeather, datesBetween, weatherInfo, type DayWeather } from "@/lib/weather";
import { STYLE, cardStyle } from "@/lib/style";
import { guessFlag } from "@/lib/types";
import { CloudSun } from "lucide-react";

function fmtDay(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function StopWeather({ stop }: { stop: any }) {
  const [days, setDays] = useState<DayWeather[] | null>(null);

  // Bei einer Unterkunft: jeder Tag von Anreise bis Abreise. Bei einem reinen
  // Zwischenstopp: nur der eine Tag, an dem man dort ist.
  const dates = stop.isStay
    ? datesBetween(stop.arrival, stop.departure || stop.arrival)
    : [stop.departure || stop.arrival].filter(Boolean);

  useEffect(() => {
    let cancelled = false;
    setDays(null);
    Promise.all(dates.map((d: string) => getDayWeather(parseFloat(stop.lat), parseFloat(stop.lon), d))).then((res) => {
      if (!cancelled) setDays(res);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stop.lat, stop.lon, stop.arrival, stop.departure]);

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{
          width: 24, height: 24, borderRadius: "50%", background: STYLE.accent, color: "#fff", fontSize: 12, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'JetBrains Mono', monospace",
        }}>
          {stop.listNumber}
        </span>
        <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 16 }}>
          {stop.country ? guessFlag(stop.country) : ""} {stop.symbol || ""} {stop.name}
        </span>
      </div>

      {days === null ? (
        <p style={{ fontSize: 13, color: "#9A9384", margin: 0 }}>Lädt…</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {days.map((d) => {
            if (d.error) return null;
            const info = weatherInfo(d.code);
            return (
              <div key={d.date} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: STYLE.paperDim, borderRadius: 9 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, width: 82, flexShrink: 0 }}>{fmtDay(d.date)}</span>
                <span style={{ fontSize: 18 }}>{info.icon}</span>
                <span style={{ fontSize: 12, color: "#6B6558", flex: 1 }}>{info.label}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700 }}>{d.tempMin}°–{d.tempMax}°</span>
                {!d.isForecast && <span style={{ fontSize: 10.5, color: "#B0A996", fontWeight: 600 }} title="Erfahrungswert der letzten 3 Jahre, echte Vorhersage gibt's erst ~2 Wochen vorher">Ø</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function WeatherTab({ projectId }: { projectId: string }) {
  const { stops, loading } = useTripStops(projectId);
  const geoStops = stops.filter((s) => s.lat && s.lon);

  if (loading) return <p style={{ color: "#9A9384", fontSize: 14 }}>Lädt…</p>;

  if (geoStops.length === 0) {
    return (
      <div style={{ ...cardStyle, textAlign: "center", padding: "28px 20px", color: "#B0A996" }}>
        <CloudSun size={30} style={{ opacity: 0.6, marginBottom: 8 }} />
        <p style={{ fontSize: 14, margin: 0, color: STYLE.ink }}>
          Noch keine Orte mit Koordinaten – trag bei Unterkünften oder Route-Etappen Koordinaten ein
          (Button "Koordinaten finden" bzw. "berechnen"), dann erscheint hier das Wetter.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={{ fontSize: 12.5, color: "#9A9384", margin: 0 }}>
        Für Tage in den nächsten ~2 Wochen: echte Vorhersage. Für weiter entfernte Tage: Ø-Erfahrungswert
        der letzten 3 Jahre zum selben Kalendertag (markiert mit "Ø").
      </p>
      {geoStops.map((stop) => (
        <StopWeather key={stop.id} stop={stop} />
      ))}
    </div>
  );
}
