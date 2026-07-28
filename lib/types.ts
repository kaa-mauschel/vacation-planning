export type Project = {
  id: string;
  name: string;
  emoji: string;
  created_by: string;
  invite_code: string;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
};

export type Item = {
  id: string;
  project_id: string;
  section: string;
  data: Record<string, any>;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const SECTIONS = {
  PACKLISTE: "packliste",
  VORABREISE: "vorabreise",
  ROUTE: "route",
  UNTERKUNFT: "unterkunft",
  KOSTEN: "kosten",
  ESSEN: "essen",
  AKTIVITAET: "aktivitaet",
  MUSTDO: "mustdo",
  TAGESPLAN: "tagesplan",
  TIPP: "tipp",
  NOTIZ: "notiz",
  UMGEBUNG: "umgebung",
} as const;

// Land -> Flagge, für die Routen-Übersicht (einfache Zuordnung, erweiterbar)
export const COUNTRY_FLAGS: Record<string, string> = {
  "deutschland": "🇩🇪", "österreich": "🇦🇹", "schweiz": "🇨🇭", "italien": "🇮🇹",
  "frankreich": "🇫🇷", "spanien": "🇪🇸", "portugal": "🇵🇹", "niederlande": "🇳🇱",
  "belgien": "🇧🇪", "polen": "🇵🇱", "tschechien": "🇨🇿", "kroatien": "🇭🇷",
  "griechenland": "🇬🇷", "türkei": "🇹🇷", "dänemark": "🇩🇰", "schweden": "🇸🇪",
  "norwegen": "🇳🇴", "finnland": "🇫🇮", "ungarn": "🇭🇺", "slowenien": "🇸🇮",
  "usa": "🇺🇸", "kanada": "🇨🇦", "mexiko": "🇲🇽", "japan": "🇯🇵", "thailand": "🇹🇭",
  "vereinigtes königreich": "🇬🇧", "irland": "🇮🇪", "island": "🇮🇸",
};

export function guessFlag(country: string): string {
  return COUNTRY_FLAGS[country.trim().toLowerCase()] || "🌍";
}

// Kleine Symbol-Auswahl, um jeder Etappe/jedem Ort einen Charakter zuzuordnen
// (z. B. Berge für Österreich, Meer für Hyères) – wird vom Nutzer selbst gewählt.
export const PLACE_SYMBOLS = [
  { emoji: "🏔️", label: "Berge" },
  { emoji: "🌊", label: "Meer/Strand" },
  { emoji: "🏙️", label: "Stadt" },
  { emoji: "🍷", label: "Kulinarik" },
  { emoji: "🌲", label: "Natur" },
  { emoji: "🏛️", label: "Kultur" },
  { emoji: "⛷️", label: "Wintersport" },
  { emoji: "🏰", label: "Sehenswürdigkeit" },
  { emoji: "🛑", label: "Zwischenhalt" },
  { emoji: "🧑‍🤝‍🧑", label: "Freunde besuchen" },
  { emoji: "🛏️", label: "Nur Übernachten" },
  { emoji: "🏃", label: "Action/Sport" },
];
