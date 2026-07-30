// WICHTIG: NIEMALS date.toISOString().slice(0,10) für ein lokales Datum verwenden!
// toISOString() rechnet zuerst in UTC um – bei Zeitzonen vor UTC (z. B. Berlin,
// Sommerzeit UTC+2) verschiebt das jedes Datum um einen Tag nach vorne (z. B. wird aus
// dem 1. August plötzlich der 31. Juli). Diese Funktion nimmt stattdessen die lokalen
// Datumsanteile (Jahr/Monat/Tag), ohne Zeitzonen-Umrechnung.
export function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toLocalISODate(new Date());
}
