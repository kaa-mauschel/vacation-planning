"use client";

import { useState, useEffect, useMemo } from "react";
import { useTripStops } from "@/lib/useTripStops";
import { useItems } from "@/lib/useItems";
import { getDayDetail, weatherInfo, type DayDetail } from "@/lib/weather";
import { timeGreeting, timeEmoji } from "@/lib/greeting";
import { STYLE, cardStyle } from "@/lib/style";
import { guessFlag, SECTIONS } from "@/lib/types";
import { useHeaderColor, headerGradient } from "@/lib/theme";
import { MapPin, Sparkles, ArrowRight } from "lucide-react";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });
}

// Wählt anhand des heutigen Datums deterministisch einen Eintrag aus (bleibt also den
// ganzen Tag über gleich, ändert sich aber von Tag zu Tag).
function pickForToday<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  const seed = todayISO().split("-").reduce((s, n) => s + parseInt(n, 10), 0);
  return items[seed % items.length];
}

export default function HeuteCard({ projectId }: { projectId: string }) {
  const headerColor = useHeaderColor();
  const { stops, loading: stopsLoading } = useTripStops(projectId);
  const { items: aktivitaeten } = useItems(projectId, SECTIONS.AKTIVITAET);
  const { items: mustdos } = useItems(projectId, SECTIONS.MUSTDO);
  const [weather, setWeather] = useState<DayDetail | null>(null);

  const today = todayISO();

  // Aktueller Ort: eine Unterkunft, in der man laut An-/Abreisedatum heute ist, sonst
  // die Route-Etappe mit heutigem Datum, sonst der zeitlich nächstgelegene Punkt.
  const currentStop = useMemo(() => {
    const stay = stops.find((s) => s.isStay && s.arrival && s.departure && today >= s.arrival && today < s.departure);
    if (stay) return stay;
    const exact = stops.find((s) => s.arrival === today || s.departure === today);
    if (exact) return exact;
    return null;
  }, [stops, today]);

  // Nächste Station (für "weiter geht's nach…")
  const nextStop = useMemo(() => {
    if (!currentStop) return null;
    const idx = stops.findIndex((s) => s.id === currentStop.id);
    return idx >= 0 && idx < stops.length - 1 ? stops[idx + 1] : null;
  }, [stops, currentStop]);

  useEffect(() => {
    if (!currentStop?.lat || !currentStop?.lon) { setWeather(null); return; }
    let cancelled = false;
    getDayDetail(parseFloat(currentStop.lat), parseFloat(currentStop.lon), today).then((res) => {
      if (!cancelled) setWeather(res);
    });
    return () => { cancelled = true; };
  }, [currentStop, today]);

  const recommendation = useMemo(() => {
    if (!currentStop) return null;
    const linked = [...aktivitaeten, ...mustdos].filter(
      (it) => it.data.unterkunftId === currentStop.id || it.data.routeId === currentStop.id
    );
    const pool = linked.length > 0 ? linked : [...aktivitaeten, ...mustdos];
    return pickForToday(pool);
  }, [aktivitaeten, mustdos, currentStop]);

  if (stopsLoading) return null;
  if (!currentStop) return null; // heute liegt außerhalb des erkennbaren Reiseverlaufs

  const daysLeftHere = currentStop.isStay && currentStop.departure
    ? Math.round((new Date(currentStop.departure + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86400000)
    : null;

  return (
    <div style={{ background: headerGradient(headerColor), borderRadius: 16, padding: "18px 16px", color: STYLE.headerText }}>
      <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 19 }}>
        {timeGreeting()}! {timeEmoji()}
      </div>
      <div style={{ fontSize: 12.5, opacity: 0.75, marginTop: 2, textTransform: "capitalize" }}>{fmtDate(today)}</div>

      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <MapPin size={16} />
        <span style={{ fontSize: 15, fontWeight: 700 }}>
          {currentStop.country ? guessFlag(currentStop.country) : ""} {currentStop.symbol || ""} {currentStop.name}
        </span>
      </div>
      {daysLeftHere !== null && (
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
          {daysLeftHere === 0 ? "Heute geht's weiter" : daysLeftHere === 1 ? "Noch 1 Nacht hier" : `Noch ${daysLeftHere} Nächte hier`}
          {nextStop && ` · weiter nach ${nextStop.name}`}
        </div>
      )}

      {weather && !weather.error && weather.periods.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: 14, overflowX: "auto" }}>
          {weather.periods.map((p) => {
            const info = weatherInfo(p.code);
            return (
              <div key={p.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "rgba(255,255,255,0.5)", borderRadius: 8, padding: "7px 9px", minWidth: 58, flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.8 }}>{p.label}</span>
                <span style={{ fontSize: 17 }}>{info.icon}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700 }}>{p.temp}°</span>
              </div>
            );
          })}
        </div>
      )}

      {recommendation && (
        <div style={{ marginTop: 14, background: "rgba(255,255,255,0.55)", borderRadius: 12, padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            <Sparkles size={12} /> Für heute vorgeschlagen
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{recommendation.data.name}</div>
          {recommendation.data.note && <div style={{ fontSize: 12.5, marginTop: 2, opacity: 0.85 }}>{recommendation.data.note}</div>}
        </div>
      )}
    </div>
  );
}
