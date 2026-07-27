export type Project = {
  id: string;
  name: string;
  emoji: string;
  created_by: string;
  invite_code: string;
  created_at: string;
  start_date: string | null;
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
