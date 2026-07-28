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
  PERSON: "person",
} as const;

// Auswahlmöglichkeiten für die persönliche Farbe/das Emoji pro Person (Packliste etc.)
export const PERSON_COLORS = ["#5B9279", "#E0A45C", "#5FA3AE", "#9584B8", "#D97878", "#C98A3E", "#7A9E5C", "#B37FA0"];
export const PERSON_EMOJIS = ["🧑", "👩", "👨", "🧔", "👱‍♀️", "👱‍♂️", "🧑‍🦱", "👩‍🦰", "🧑‍🦰", "👩‍🦳", "🧑‍🦲", "👧", "👦", "👵", "👴", "🐶"];

// Icons für Packlisten-/Vorabreise-Kategorien: Vorschlag anhand des Namens, plus freie Auswahl
export const CATEGORY_ICONS = ["📄", "👕", "💊", "🔌", "🏠", "🛒", "🗂️", "🎒", "🧴", "🍼", "⚽", "🐾", "📷", "🕶️", "☂️", "📦"];

const CATEGORY_ICON_HINTS: [string, string][] = [
  ["dokument", "📄"], ["ausweis", "📄"], ["papier", "📄"],
  ["kleid", "👕"], ["schuh", "👕"],
  ["gesund", "💊"], ["apotheke", "💊"], ["medizin", "💊"],
  ["technik", "🔌"], ["elektro", "🔌"], ["kabel", "🔌"],
  ["zuhause", "🏠"], ["haus", "🏠"], ["wohnung", "🏠"],
  ["einkauf", "🛒"], ["einkäufe", "🛒"],
  ["organisation", "🗂️"],
  ["baby", "🍼"], ["kind", "🍼"],
  ["sport", "⚽"],
  ["haustier", "🐾"], ["hund", "🐾"], ["katze", "🐾"],
  ["kamera", "📷"], ["foto", "📷"],
];

export function guessCategoryIcon(name: string): string {
  const lower = name.trim().toLowerCase();
  const hit = CATEGORY_ICON_HINTS.find(([kw]) => lower.includes(kw));
  return hit ? hit[1] : "📦";
}

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

// ISO-3166-Ländercode für echte Flaggen-Bildchen (funktioniert überall zuverlässig,
// anders als Flaggen-Emojis, die z. B. unter Windows nur als Buchstabencode erscheinen).
export const COUNTRY_ISO2: Record<string, string> = {
  "deutschland": "de", "österreich": "at", "schweiz": "ch", "italien": "it",
  "frankreich": "fr", "spanien": "es", "portugal": "pt", "niederlande": "nl",
  "belgien": "be", "polen": "pl", "tschechien": "cz", "kroatien": "hr",
  "griechenland": "gr", "türkei": "tr", "dänemark": "dk", "schweden": "se",
  "norwegen": "no", "finnland": "fi", "ungarn": "hu", "slowenien": "si",
  "usa": "us", "kanada": "ca", "mexiko": "mx", "japan": "jp", "thailand": "th",
  "vereinigtes königreich": "gb", "irland": "ie", "island": "is",
};

export function guessIso2(country: string): string {
  return COUNTRY_ISO2[country.trim().toLowerCase()] || "";
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
