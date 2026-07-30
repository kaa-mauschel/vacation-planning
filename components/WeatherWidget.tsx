"use client";

import { useState, useEffect } from "react";
import { getDayWeather, datesBetween, weatherInfo, type DayWeather } from "@/lib/weather";

// Kleines Übersichts-Badge (z. B. für die "Wo & wie lange"-Liste): Durchschnitt über
// den Aufenthalt. Für Tag-für-Tag-Werte siehe den eigenen Wetter-Tab.
export default function WeatherWidget({ lat, lon, startDate, endDate }: { lat: string; lon: string; startDate: string; endDate?: string }) {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<DayWeather[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const dates = datesBetween(startDate, endDate || startDate).slice(0, 10); // Obergrenze gegen sehr lange Aufenthalte
    Promise.all(dates.map((d) => getDayWeather(parseFloat(lat), parseFloat(lon), d))).then((results) => {
      if (!cancelled) { setDays(results.filter((r) => !r.error)); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [lat, lon, startDate, endDate]);

  if (loading) return <span style={{ fontSize: 11.5, color: "#B0A996" }}>Wetter lädt…</span>;
  if (days.length === 0) return null;

  const avgMax = Math.round(days.reduce((s, d) => s + d.tempMax, 0) / days.length);
  const avgMin = Math.round(days.reduce((s, d) => s + d.tempMin, 0) / days.length);
  const counts: Record<number, number> = {};
  days.forEach((d) => { counts[d.code] = (counts[d.code] || 0) + 1; });
  const mainCode = Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
  const info = weatherInfo(mainCode);
  const allForecast = days.every((d) => d.isForecast);

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, padding: "4px 9px", borderRadius: 20, background: "#EFEADC", color: "#6B6558", fontWeight: 600 }} title={allForecast ? "Wettervorhersage (Durchschnitt) – Details im Wetter-Tab" : "Erfahrungswert (Durchschnitt) – Details im Wetter-Tab"}>
      <span>{info.icon}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{avgMin}°–{avgMax}°</span>
      {!allForecast && <span style={{ opacity: 0.7 }}>Ø</span>}
    </span>
  );
}
