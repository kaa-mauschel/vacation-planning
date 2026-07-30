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

  const chainPoints: any[] = [];
  const pushChainPoint = (name: string, lat: string, lon: string, country: string, symbol: string, date: string | null) => {
    if (!name || !lat || !lon) return;
    const key = name.trim().toLowerCase();
    if (chainPoints.length && chainPoints[chainPoints.length - 1].key === key) return;
    const stay = stayByName.get(key);
    if (stay) {
      chainPoints.push({ ...stay, key, isStay: true });
    } else {
      chainPoints.push({ id: `chain-${key}-${chainPoints.length}`, key, name, lat, lon, country, symbol, arrival: null, departure: date, isStay: false });
    }
  };

  sortedRoute.forEach((leg) => {
    pushChainPoint(leg.data.from, leg.data.lat, leg.data.lon, leg.data.fromCountry || leg.data.land, leg.data.symbol || "", leg.data.date || null);
    pushChainPoint(leg.data.to, leg.data.toLat, leg.data.toLon, leg.data.toCountry, "", leg.data.date || null);
  });

  const usedKeys = new Set(chainPoints.map((p) => p.key));
  const unmatchedStays = stayPoints.filter((p) => !usedKeys.has((p.name || "").trim().toLowerCase()));

  const combined = [...chainPoints, ...unmatchedStays];
  const stops: TripStop[] = combined.map((s, i) => ({ ...s, listNumber: i + 1 }));

  return { stops, stays, sortedRoute, loading: routeLoading || unterkunftLoading };
}
