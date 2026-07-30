export function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Gute Nacht";
  if (h < 11) return "Guten Morgen";
  if (h < 14) return "Guten Mittag";
  if (h < 18) return "Schönen Nachmittag";
  if (h < 22) return "Guten Abend";
  return "Gute Nacht";
}

export function timeEmoji(): string {
  const h = new Date().getHours();
  if (h < 6) return "🌙";
  if (h < 11) return "☀️";
  if (h < 18) return "🌤️";
  if (h < 22) return "🌇";
  return "🌙";
}
