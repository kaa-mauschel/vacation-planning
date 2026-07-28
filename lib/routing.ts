"use client";

// Kostenlose, schlüssellose Dienste auf Basis von OpenStreetMap:
// - Nominatim: wandelt eine Adresse/einen Ortsnamen in Koordinaten um (Geocoding)
// - OSRM (Open Source Routing Machine): berechnet Autoroute, Distanz & Fahrzeit
// Beide sind öffentliche Demo-Server, gedacht für gelegentliche, private Nutzung wie hier.

export type GeoPoint = { lat: number; lon: number; displayName: string; country: string };

export async function geocode(query: string): Promise<GeoPoint | null> {
  if (!query.trim()) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const item = data[0];
  const country = item.address?.country || item.display_name?.split(",").pop()?.trim() || "";
  return { lat: parseFloat(item.lat), lon: parseFloat(item.lon), displayName: item.display_name, country };
}

export type DrivingRoute = { km: number; hours: number };

export async function getDrivingRoute(from: GeoPoint, to: GeoPoint): Promise<DrivingRoute | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const route = data?.routes?.[0];
  if (!route) return null;
  return { km: route.distance / 1000, hours: route.duration / 3600 };
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} Min.`;
  if (m === 0) return `${h} Std.`;
  return `${h} Std. ${m} Min.`;
}

// Führt Geocoding + Routenberechnung für eine Etappe in einem Schritt aus.
// Gibt Koordinaten & erkanntes Land für BEIDE Punkte zurück (Start und Ziel) –
// so lässt sich später auch der Zielort auf der Karte anzeigen und die
// Aufenthaltsdauer pro Ort berechnen.
export async function calculateLeg(fromQuery: string, toQuery: string): Promise<{
  km: string; h: string;
  lat: string; lon: string; fromCountry: string;
  toLat: string; toLon: string; toCountry: string;
  error?: string;
}> {
  const empty = { km: "", h: "", lat: "", lon: "", fromCountry: "", toLat: "", toLon: "", toCountry: "" };
  const from = await geocode(fromQuery);
  if (!from) return { ...empty, error: `"${fromQuery}" konnte nicht gefunden werden.` };
  // Kurze Pause, um die kostenlose Nominatim-Nutzungsrichtlinie (max. 1 Anfrage/Sek.) einzuhalten
  await new Promise((r) => setTimeout(r, 1000));
  const to = await geocode(toQuery);
  if (!to) return { ...empty, lat: String(from.lat), lon: String(from.lon), fromCountry: from.country, error: `"${toQuery}" konnte nicht gefunden werden.` };

  const route = await getDrivingRoute(from, to);
  const base = {
    lat: String(from.lat), lon: String(from.lon), fromCountry: from.country,
    toLat: String(to.lat), toLon: String(to.lon), toCountry: to.country,
  };
  if (!route) return { ...empty, ...base, error: "Route konnte nicht berechnet werden." };

  return {
    ...base,
    km: `≈ ${Math.round(route.km)} km`,
    h: `≈ ${formatHours(route.hours)}`,
  };
}
