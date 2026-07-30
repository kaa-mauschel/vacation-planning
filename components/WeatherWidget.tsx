"use client";

import { useState, useEffect } from "react";
import { getWeatherOutlook, weatherInfo } from "@/lib/weather";
import { STYLE } from "@/lib/style";

export default function WeatherWidget({ lat, lon, startDate, endDate }: { lat: string; lon: string; startDate: string; endDate?: string }) {
  const [loading, setLoading] = useState(true);
  const [outlook, setOutlook] = useState<Awaited<ReturnType<typeof getWeatherOutlook>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getWeatherOutlook(parseFloat(lat), parseFloat(lon), startDate, endDate || startDate).then((res) => {
      if (!cancelled) { setOutlook(res); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [lat, lon, startDate, endDate]);

  if (loading) return <span style={{ fontSize: 11.5, color: "#B0A996" }}>Wetter lädt…</span>;
  if (!outlook || outlook.error || outlook.days.length === 0) return null;

  // Durchschnitt über die verfügbaren Tage bilden (bei Erfahrungswerten mehrere Jahre,
  // bei echter Vorhersage mehrere Reisetage)
  const avgMax = Math.round(outlook.days.reduce((s, d) => s + d.tempMax, 0) / outlook.days.length);
  const avgMin = Math.round(outlook.days.reduce((s, d) => s + d.tempMin, 0) / outlook.days.length);
  // häufigster Wettercode
  const counts: Record<number, number> = {};
  outlook.days.forEach((d) => { counts[d.code] = (counts[d.code] || 0) + 1; });
  const mainCode = Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
  const info = weatherInfo(mainCode);

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, padding: "4px 9px", borderRadius: 20, background: "#EFEADC", color: "#6B6558", fontWeight: 600 }} title={outlook.isForecast ? "Wettervorhersage" : "Erfahrungswert (letzte Jahre, selbes Datum)"}>
      <span>{info.icon}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{avgMin}°–{avgMax}°</span>
      {!outlook.isForecast && <span style={{ opacity: 0.7 }}>Ø</span>}
    </span>
  );
}
