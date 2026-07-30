"use client";

// Kostenloser Wetterdienst ohne Anmeldung/API-Key (Open-Meteo).
// - Für Reisen in den nächsten ca. 16 Tagen: echte Vorhersage
// - Für weiter entfernte Reisen: Erfahrungswerte aus den letzten 3 Jahren zum selben
//   Kalendertag (echte Vorhersagen gibt es logischerweise erst kurz vorher)

export type DayWeather = { date: string; tempMax: number; tempMin: number; code: number };
export type WeatherOutlook = { days: DayWeather[]; isForecast: boolean; error?: string };

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

export async function getWeatherOutlook(lat: number, lon: number, startDate: string, endDate: string): Promise<WeatherOutlook> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate + "T00:00:00");
  const daysUntil = Math.round((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil >= -1 && daysUntil <= 15) {
    // Innerhalb der Vorhersage-Reichweite -> echte Prognose
    const end = endDate && new Date(endDate) > start ? endDate : startDate;
    const cappedEnd = toISO(new Date(Math.min(new Date(end).getTime(), today.getTime() + 15 * 86400000)));
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${startDate}&end_date=${cappedEnd}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!data.daily) return { days: [], isForecast: true, error: "Keine Vorhersage verfügbar." };
      const days: DayWeather[] = data.daily.time.map((date: string, i: number) => ({
        date, tempMax: data.daily.temperature_2m_max[i], tempMin: data.daily.temperature_2m_min[i], code: data.daily.weathercode[i],
      }));
      return { days, isForecast: true };
    } catch {
      return { days: [], isForecast: true, error: "Vorhersage konnte nicht geladen werden." };
    }
  }

  // Zu weit in der Zukunft -> Erfahrungswerte der letzten 3 Jahre zum selben Kalendertag
  try {
    const results: DayWeather[] = [];
    const now = new Date();
    for (let yearsAgo = 1; yearsAgo <= 3; yearsAgo++) {
      const histDate = new Date(start);
      histDate.setFullYear(start.getFullYear() - yearsAgo);
      if (histDate >= now) continue;
      const dateStr = toISO(histDate);
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.daily?.time?.length) {
        results.push({
          date: data.daily.time[0],
          tempMax: data.daily.temperature_2m_max[0],
          tempMin: data.daily.temperature_2m_min[0],
          code: data.daily.weathercode[0],
        });
      }
    }
    if (results.length === 0) return { days: [], isForecast: false, error: "Keine Erfahrungswerte verfügbar." };
    return { days: results, isForecast: false };
  } catch {
    return { days: [], isForecast: false, error: "Erfahrungswerte konnten nicht geladen werden." };
  }
}
