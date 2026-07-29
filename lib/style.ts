import type { CSSProperties } from "react";

export const STYLE = {
  ink: "#3A3530",              // dunkler Text (statt tiefschwarz-grün)
  paper: "#FFFDF9",
  paperDim: "#F5F0E4",
  accent: "#5B9279",           // Salbeigrün
  accent2: "#E0A45C",          // sanftes Apricot
  accent3: "#9584B8",          // Pastelllila
  accent4: "#5FA3AE",          // Pastellblau/Türkis
  warn: "#C98A3E",
  danger: "#D97878",
  // Pastellfarbene Kopfzeilen/Akzentflächen (dunkler Text statt weißer Text)
  headerBg: "#CBE7DD",         // pastelliges Minzgrün
  headerBg2: "#F4D9C6",        // pastelliges Apricot (z. B. für Login)
  headerText: "#3A3530",
  // Für dezente Rahmen/Trennlinien statt harter Volltonfarben
  hairline: "rgba(58,53,48,0.09)",
  radius: 18,
};

export const FONTS_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');";

// Zweischichtiger, weicher Schatten (nah + weiträumig) statt eines einzelnen harten
// Schattens – wirkt hochwertiger/"schwebender", ähnlich wie bei nativen iOS-Karten.
export const cardStyle: CSSProperties = {
  background: STYLE.paper,
  borderRadius: STYLE.radius,
  padding: 17,
  border: `1px solid ${STYLE.hairline}`,
  boxShadow: "0 1px 2px rgba(58,53,48,0.05), 0 6px 20px -8px rgba(58,53,48,0.14)",
};
