// Ordnet jedem Namen (z. B. "Kaa", "Martin") automatisch und wiederkehrend dieselbe
// Farbe + denselben Emoji zu, ohne dass irgendwo extra etwas gespeichert werden muss –
// einfach anhand des Namens berechnet (derselbe Name ergibt immer dasselbe Ergebnis).

const PALETTE = [
  { color: "#5B9279", emoji: "🧑" }, // Salbeigrün
  { color: "#E0A45C", emoji: "👩" }, // Apricot
  { color: "#5FA3AE", emoji: "🧔" }, // Türkis
  { color: "#9584B8", emoji: "👨" }, // Lila
  { color: "#C98A3E", emoji: "🧑‍🦱" }, // Ocker
  { color: "#D97878", emoji: "👱" }, // Rosé
  { color: "#7A9E5C", emoji: "🧑‍🦰" }, // Moosgrün
  { color: "#B37FA0", emoji: "👩‍🦳" }, // Beere
];

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function personStyle(name: string): { color: string; emoji: string } {
  if (!name || name === "Allgemein") return { color: "#9A9384", emoji: "👥" };
  const idx = hashString(name) % PALETTE.length;
  return PALETTE[idx];
}
