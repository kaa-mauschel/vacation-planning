"use client";

import { guessIso2 } from "@/lib/types";

// Zeigt eine echte Flaggen-Grafik statt eines Flaggen-Emojis (funktioniert auf allen
// Geräten zuverlässig gleich, z. B. auch unter Windows, wo Emoji-Flaggen sonst nur als
// Buchstabencode wie "AT" angezeigt werden).
export default function FlagIcon({ country, size = 16 }: { country: string; size?: number }) {
  const iso2 = guessIso2(country);
  if (!iso2) return <span style={{ fontSize: size * 0.8 }}>🌍</span>;
  return (
    <img
      src={`https://flagcdn.com/24x18/${iso2}.png`}
      alt={country}
      width={size}
      height={Math.round(size * 0.75)}
      style={{ display: "inline-block", borderRadius: 2, verticalAlign: "middle", boxShadow: "0 0 0 1px rgba(0,0,0,0.08)" }}
    />
  );
}
