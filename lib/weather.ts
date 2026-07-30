"use client";

// Kostenloser Wetterdienst ohne Anmeldung/API-Key (Open-Meteo).
// - Für Tage in den nächsten ca. 15 Tagen: echte Vorhersage
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

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
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

// Wetter für genau einen Tag (Vorhersage falls nah genug dran, sonst Ø aus letzten 3 Jahren)
export async function getDayWeather(lat: number, lon: number, date: string): Promise<DayWeather> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date + "T00:00:00");
  const daysUntil = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil >= -1 && daysUntil <= 15) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${date}&end_date=${date}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.daily?.time?.length) return { date, tempMax: 0, tempMin: 0, code: 0, isForecast: true, error: "Keine Daten" };
      return {
        date, isForecast: true,
        tempMax: data.daily.temperature_2m_max[0], tempMin: data.daily.temperature_2m_min[0], code: data.daily.weathercode[0],
      };
    } catch {
      return { date, tempMax: 0, tempMin: 0, code: 0, isForecast: true, error: "Fehler beim Laden" };
    }
  }

  // Erfahrungswert: letzte 3 Jahre am selben Kalendertag mitteln
  try {
    const now = new Date();
    const samples: { tempMax: number; tempMin: number; code: number }[] = [];
    for (let yearsAgo = 1; yearsAgo <= 3; yearsAgo++) {
      const histDate = new Date(target);
      histDate.setFullYear(target.getFullYear() - yearsAgo);
      if (histDate >= now) continue;
      const dateStr = toISO(histDate);
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.daily?.time?.length) {
        samples.push({ tempMax: data.daily.temperature_2m_max[0], tempMin: data.daily.temperature_2m_min[0], code: data.daily.weathercode[0] });
      }
    }
    if (samples.length === 0) return { date, tempMax: 0, tempMin: 0, code: 0, isForecast: false, error: "Keine Erfahrungswerte" };
    const avgMax = Math.round(samples.reduce((s, d) => s + d.tempMax, 0) / samples.length);
    const avgMin = Math.round(samples.reduce((s, d) => s + d.tempMin, 0) / samples.length);
    const counts: Record<number, number> = {};
    samples.forEach((d) => { counts[d.code] = (counts[d.code] || 0) + 1; });
    const mainCode = Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
    return { date, tempMax: avgMax, tempMin: avgMin, code: mainCode, isForecast: false };
  } catch {
    return { date, tempMax: 0, tempMin: 0, code: 0, isForecast: false, error: "Fehler beim Laden" };
  }
}
