"use client";

// Kostenlose, schlüssellose Dienste auf Basis von OpenStreetMap:
// - Nominatim: wandelt eine Adresse/einen Ortsnamen in Koordinaten um (Geocoding)
// - OSRM (Open Source Routing Machine): berechnet Autoroute, Distanz & Fahrzeit
// Beide sind öffentliche Demo-Server, gedacht für gelegentliche, private Nutzung wie hier.

export type GeoPoint = { lat: number; lon: number; displayName: string };

export async function geocode(query: string): Promise<GeoPoint | null> {
  if (!query.trim()) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), displayName: data[0].display_name };
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
export async function calculateLeg(fromQuery: string, toQuery: string): Promise<{
  km: string; h: string; lat: string; lon: string; error?: string;
}> {
  const from = await geocode(fromQuery);
  if (!from) return { km: "", h: "", lat: "", lon: "", error: `"${fromQuery}" konnte nicht gefunden werden.` };
  // Kurze Pause, um die kostenlose Nominatim-Nutzungsrichtlinie (max. 1 Anfrage/Sek.) einzuhalten
  await new Promise((r) => setTimeout(r, 1000));
  const to = await geocode(toQuery);
  if (!to) return { km: "", h: "", lat: String(from.lat), lon: String(from.lon), error: `"${toQuery}" konnte nicht gefunden werden.` };

  const route = await getDrivingRoute(from, to);
  if (!route) return { km: "", h: "", lat: String(from.lat), lon: String(from.lon), error: "Route konnte nicht berechnet werden." };

  return {
    km: `≈ ${Math.round(route.km)} km`,
    h: `≈ ${formatHours(route.hours)}`,
    lat: String(from.lat),
    lon: String(from.lon),
  };
}
