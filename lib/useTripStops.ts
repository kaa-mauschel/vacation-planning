"use client";

import { useItems } from "./useItems";
import { SECTIONS } from "./types";

export type TripStop = {
  id: string;
  key: string;
  name: string;
  lat: string;
  lon: string;
  country: string;
  symbol: string;
  arrival: string | null;
  departure: string | null;
  isStay: boolean;
  listNumber: number;
};

// Liefert alle Stationen eines Urlaubs (Unterkünfte + Zwischenstopps aus der Route) in
// der richtigen Reihenfolge: die Route wird von der ersten "Von"-Station an entlang
// verkettet, Unterkünfte mit passendem Namen ersetzen den jeweiligen Punkt (mit echter
// Aufenthaltsdauer statt nur Durchreise-Datum). Wird sowohl von der Übersicht als auch
// vom Wetter-Tab verwendet, damit beide exakt dieselbe Reihenfolge zeigen.
export function useTripStops(projectId: string) {
  const { items: routeItems, loading: routeLoading } = useItems(projectId, SECTIONS.ROUTE);
  const { items: unterkunftItems, loading: unterkunftLoading } = useItems(projectId, SECTIONS.UNTERKUNFT);

  const sortedRoute = [...routeItems].sort((a, b) => a.position - b.position);

  const stays = [...unterkunftItems].sort((a, b) => {
    if (a.data.von && b.data.von) return a.data.von.localeCompare(b.data.von);
    if (a.data.von) return -1;
    if (b.data.von) return 1;
    return 0;
  });

  const stayPoints = stays
    .filter((it) => it.data.lat && it.data.lon)
    .map((it) => ({
      id: it.id,
      name: it.data.station,
      lat: it.data.lat, lon: it.data.lon,
      country: it.data.country,
      symbol: it.data.symbol || "",
      arrival: it.data.von || null,
      departure: it.data.bis || null,
      isStay: true,
    }));
  const stayByName = new Map(stayPoints.map((p) => [(p.name || "").trim().toLowerCase(), p]));

  // Findet eine Unterkunft, deren Name zum Stationsnamen passt – auch wenn die
  // Formulierung nicht exakt gleich ist (z. B. Route "Bramberg" vs. Unterkunft
  // "Wildkogelresort Bramberg am Wildkogel").
  const findMatchingStay = (name: string) => {
    const key = name.trim().toLowerCase();
    if (stayByName.has(key)) return stayByName.get(key)!;
    for (const [stayKey, stay] of stayByName) {
      if (stayKey.includes(key) || key.includes(stayKey)) return stay;
    }
    return null;
  };

  const chainPoints: any[] = [];
  // isArrival = true, wenn "date" der Ankunftstag an diesem Ort ist (Ziel einer Etappe),
  // false, wenn es der Abfahrtstag ist (Start einer Etappe) – vorher wurden beide
  // fälschlich immer als "Abfahrt" behandelt.
  const pushChainPoint = (name: string, lat: string, lon: string, country: string, symbol: string, date: string | null, isArrival: boolean) => {
    if (!name || !lat || !lon) return;
    const key = name.trim().toLowerCase();
    const stay = findMatchingStay(name);
    const dedupKey = stay ? `stay:${stay.id}` : key;
    const last = chainPoints[chainPoints.length - 1];
    if (last && last.dedupKey === dedupKey) {
      // Gleicher Ort wie zuvor (z. B. Ankunft mit einer Etappe, Abfahrt mit der nächsten):
      // Datum ergänzen statt den Punkt zu verwerfen, damit beide Tage erhalten bleiben.
      if (!last.isStay) {
        if (isArrival && !last.arrival) last.arrival = date;
        if (!isArrival && !last.departure) last.departure = date;
      }
      return;
    }
    if (stay) {
      chainPoints.push({ ...stay, key, dedupKey, isStay: true });
    } else {
      chainPoints.push({
        id: `chain-${key}-${chainPoints.length}`, key, dedupKey, name, lat, lon, country, symbol,
        arrival: isArrival ? date : null,
        departure: isArrival ? null : date,
        isStay: false,
      });
    }
  };

  sortedRoute.forEach((leg) => {
    // "Von" der Etappe: das ist der Tag, an dem man von hier abfährt
    pushChainPoint(leg.data.from, leg.data.lat, leg.data.lon, leg.data.fromCountry || leg.data.land, leg.data.symbol || "", leg.data.date || null, false);
    // "Nach" der Etappe: das ist der Tag, an dem man hier ankommt
    pushChainPoint(leg.data.to, leg.data.toLat, leg.data.toLon, leg.data.toCountry, "", leg.data.date || null, true);
  });

  const usedStayIds = new Set(chainPoints.filter((p) => p.isStay).map((p) => p.id));
  const unmatchedStays = stayPoints.filter((p) => !usedStayIds.has(p.id));

  const combined = [...chainPoints, ...unmatchedStays];
  const stops: TripStop[] = combined.map((s, i) => ({ ...s, listNumber: i + 1 }));

  return { stops, stays, sortedRoute, loading: routeLoading || unterkunftLoading };
}
