"use client";

import { toLocalISODate as toISO } from "./dateUtils";

// Kostenloser Wetterdienst ohne Anmeldung/API-Key (Open-Meteo).
// - Für Tage in den nächsten ca. 15 Tagen: echte stündliche Vorhersage
// - Für weiter entfernte Tage: Erfahrungswert aus den letzten 3 Jahren zum selben
//   Kalendertag (echte Vorhersagen gibt es logischerweise erst kurz vorher)

export type DayWeather = { date: string; tempMax: number; tempMin: number; code: number; isForecast: boolean; error?: string };

const WEATHER_CODES: Record<number, { icon: string; label: string }> = {
  0: { icon: "☀️", label: "Klar" },
  1: { icon: "🌤️", label: "Meist sonnig" },
  2: { icon: "⛅", label: "Teilweise bewölkt" },
  3: { icon: "☁️", label: "Bewölkt" },
  45: { icon: "🌫️", label: "Nebel" },
  48: { icon: "🌫️", label: "Nebel" },
  51: { icon: "🌦️", label: "Leichter Nieselregen" },
  53: { icon: "🌦️", label: "Nieselregen" },
  55: { icon: "🌧️", label: "Starker Nieselregen" },
  61: { icon: "🌦️", label: "Leichter Regen" },
  63: { icon: "🌧️", label: "Regen" },
  65: { icon: "🌧️", label: "Starker Regen" },
  71: { icon: "🌨️", label: "Leichter Schneefall" },
  73: { icon: "🌨️", label: "Schneefall" },
  75: { icon: "❄️", label: "Starker Schneefall" },
  80: { icon: "🌦️", label: "Regenschauer" },
  81: { icon: "🌧️", label: "Regenschauer" },
  82: { icon: "⛈️", label: "Heftige Regenschauer" },
  95: { icon: "⛈️", label: "Gewitter" },
  96: { icon: "⛈️", label: "Gewitter mit Hagel" },
  99: { icon: "⛈️", label: "Schweres Gewitter" },
};

export function weatherInfo(code: number) {
  return WEATHER_CODES[code] || { icon: "🌡️", label: "" };
}




export function datesBetween(start: string, end: string): string[] {
  const out: string[] = [];
  const a = new Date(start + "T00:00:00");
  const b = new Date((end || start) + "T00:00:00");
  const cur = new Date(a);
  while (cur <= b) {
    out.push(toISO(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

// --- Tageszeiten-Abschnitte ---
export const DAY_PERIODS = [
  { key: "morgens", label: "Morgens", hours: [6, 7, 8, 9, 10] },
  { key: "mittags", label: "Mittags", hours: [11, 12, 13] },
  { key: "nachmittags", label: "Nachmittags", hours: [14, 15, 16, 17] },
  { key: "abends", label: "Abends", hours: [18, 19, 20, 21] },
  { key: "nachts", label: "Nachts", hours: [22, 23, 0, 1, 2, 3, 4, 5] },
] as const;

export type PeriodWeather = { key: string; label: string; temp: number; code: number };
export type DayDetail = { date: string; isForecast: boolean; periods: PeriodWeather[]; error?: string };

async function fetchHourly(lat: number, lon: number, date: string, historical: boolean) {
  const base = historical ? "https://archive-api.open-meteo.com/v1/archive" : "https://api.open-meteo.com/v1/forecast";
  const url = `${base}?latitude=${lat}&longitude=${lon}&start_date=${date}&end_date=${date}&hourly=temperature_2m,weathercode&timezone=auto`;
  const res = await fetch(url);
  const data = await res.json();
  return data.hourly as { time: string[]; temperature_2m: number[]; weathercode: number[] } | undefined;
}

function bucketHourly(hourly: { time: string[]; temperature_2m: number[]; weathercode: number[] }): PeriodWeather[] {
  return DAY_PERIODS.map((p) => {
    const temps: number[] = [];
    const codes: number[] = [];
    hourly.time.forEach((t, i) => {
      const hour = parseInt(t.slice(11, 13), 10);
      if ((p.hours as readonly number[]).includes(hour)) {
        temps.push(hourly.temperature_2m[i]);
        codes.push(hourly.weathercode[i]);
      }
    });
    const temp = temps.length ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) : 0;
    const counts: Record<number, number> = {};
    codes.forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
    const code = codes.length ? Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) : 0;
    return { key: p.key, label: p.label, temp, code };
  });
}

// Detailliertes Wetter (5 Tageszeiten) für genau einen Tag
export async function getDayDetail(lat: number, lon: number, date: string): Promise<DayDetail> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date + "T00:00:00");
  const daysUntil = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil >= -1 && daysUntil <= 15) {
    try {
      const hourly = await fetchHourly(lat, lon, date, false);
      if (!hourly) return { date, isForecast: true, periods: [], error: "Keine Daten" };
      return { date, isForecast: true, periods: bucketHourly(hourly) };
    } catch {
      return { date, isForecast: true, periods: [], error: "Fehler beim Laden" };
    }
  }

  // Erfahrungswert: letzte 3 Jahre am selben Kalendertag, stündlich mitteln
  try {
    const now = new Date();
    const yearHourlies: { time: string[]; temperature_2m: number[]; weathercode: number[] }[] = [];
    for (let yearsAgo = 1; yearsAgo <= 3; yearsAgo++) {
      const histDate = new Date(target);
      histDate.setFullYear(target.getFullYear() - yearsAgo);
      if (histDate >= now) continue;
      const hourly = await fetchHourly(lat, lon, toISO(histDate), true);
      if (hourly) yearHourlies.push(hourly);
    }
    if (yearHourlies.length === 0) return { date, isForecast: false, periods: [], error: "Keine Erfahrungswerte" };

    const periods: PeriodWeather[] = DAY_PERIODS.map((p) => {
      const temps: number[] = [];
      const codes: number[] = [];
      yearHourlies.forEach((hourly) => {
        hourly.time.forEach((t, i) => {
          const hour = parseInt(t.slice(11, 13), 10);
          if ((p.hours as readonly number[]).includes(hour)) {
            temps.push(hourly.temperature_2m[i]);
            codes.push(hourly.weathercode[i]);
          }
        });
      });
      const temp = temps.length ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) : 0;
      const counts: Record<number, number> = {};
      codes.forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
      const code = codes.length ? Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) : 0;
      return { key: p.key, label: p.label, temp, code };
    });
    return { date, isForecast: false, periods };
  } catch {
    return { date, isForecast: false, periods: [], error: "Fehler beim Laden" };
  }
}

// Einfaches Tagesmaximum/-minimum (für kompakte Badges, z. B. in der Übersicht)
export async function getDayWeather(lat: number, lon: number, date: string): Promise<DayWeather> {
  const detail = await getDayDetail(lat, lon, date);
  if (detail.error || detail.periods.length === 0) {
    return { date, tempMax: 0, tempMin: 0, code: 0, isForecast: detail.isForecast, error: detail.error || "Keine Daten" };
  }
  const temps = detail.periods.map((p) => p.temp);
  const counts: Record<number, number> = {};
  detail.periods.forEach((p) => { counts[p.code] = (counts[p.code] || 0) + 1; });
  const mainCode = Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
  return { date, tempMax: Math.max(...temps), tempMin: Math.min(...temps), code: mainCode, isForecast: detail.isForecast };
}
