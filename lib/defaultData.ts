// Diese Vorschläge werden automatisch angelegt, wenn ein neues Projekt (=Urlaub) erstellt wird.
// Der Nutzer kann danach beliebig Punkte hinzufügen, bearbeiten und löschen.

export const DEFAULT_PACKLIST: { category: string; text: string }[] = [
  { category: "Dokumente", text: "Ausweise / Reisepässe" },
  { category: "Dokumente", text: "Führerschein & Fahrzeugschein" },
  { category: "Dokumente", text: "Buchungsbestätigungen" },
  { category: "Dokumente", text: "Auslandskrankenversicherung" },
  { category: "Dokumente", text: "Bargeld & Kreditkarten" },

  { category: "Kleidung", text: "Badesachen" },
  { category: "Kleidung", text: "Regenjacke" },
  { category: "Kleidung", text: "Bequeme Schuhe" },
  { category: "Kleidung", text: "Ein schönes Outfit für Abende" },
  { category: "Kleidung", text: "Sonnenhut / Cap" },

  { category: "Gesundheit", text: "Sonnencreme" },
  { category: "Gesundheit", text: "Reiseapotheke" },
  { category: "Gesundheit", text: "Pflaster & Blasenpflaster" },
  { category: "Gesundheit", text: "Persönliche Medikamente" },
  { category: "Gesundheit", text: "Mückenschutz" },

  { category: "Technik", text: "Ladekabel & Powerbank" },
  { category: "Technik", text: "Kamera / Handy-Zubehör" },
  { category: "Technik", text: "Adapter/Steckdosenadapter" },
  { category: "Technik", text: "Kopfhörer" },
  { category: "Technik", text: "Offline-Karten heruntergeladen" },
];

export const DEFAULT_VORABREISE: { category: string; text: string }[] = [
  { category: "Zuhause", text: "Müll rausbringen" },
  { category: "Zuhause", text: "Pflanzen gießen (oder Nachbarn bitten)" },
  { category: "Zuhause", text: "Aufräumen" },
  { category: "Zuhause", text: "Fenster & Türen kontrollieren" },
  { category: "Zuhause", text: "Kühlschrank leeren" },

  { category: "Letzte Einkäufe", text: "Drogerie: Sonnencreme & Reiseapotheke auffüllen" },
  { category: "Letzte Einkäufe", text: "Snacks & Getränke fürs Auto" },
  { category: "Letzte Einkäufe", text: "Bargeld abheben" },
  { category: "Letzte Einkäufe", text: "Reiseadapter besorgen, falls nötig" },
  { category: "Letzte Einkäufe", text: "Sim-Karte/Roaming klären" },

  { category: "Organisation", text: "Haustierbetreuung klären" },
  { category: "Organisation", text: "Post/Pakete umleiten oder Nachbarn Bescheid geben" },
  { category: "Organisation", text: "Auto tanken/checken" },
  { category: "Organisation", text: "Wichtige Dokumente kopieren/digitalisieren" },
  { category: "Organisation", text: "Abwesenheitsnotiz einrichten" },
];

export const DEFAULT_TIPS: { title: string; text: string }[] = [
  { title: "Mautstrecken vorab prüfen", text: "Je nach Zielländern können Vignette, Autobahnmaut oder Péage anfallen – vorab online informieren." },
];
