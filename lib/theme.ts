"use client";

import { useEffect, useState } from "react";

export const PASTEL_COLORS = [
  { id: "mint", label: "Minzgrün", value: "#CBE7DD" },
  { id: "peach", label: "Apricot", value: "#F4D9C6" },
  { id: "sky", label: "Himmelblau", value: "#CBE0EF" },
  { id: "lilac", label: "Lila", value: "#DED2EC" },
  { id: "rose", label: "Rosé", value: "#F3D6DC" },
  { id: "butter", label: "Butter", value: "#F5E6B8" },
  { id: "sage", label: "Salbei", value: "#D9E4D0" },
  { id: "sand", label: "Sand", value: "#EDE0CC" },
];

const STORAGE_KEY = "urlaubsplaner-header-color";
const DEFAULT_COLOR = PASTEL_COLORS[0].value;

export function getStoredHeaderColor(): string {
  if (typeof window === "undefined") return DEFAULT_COLOR;
  return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_COLOR;
}

export function setStoredHeaderColor(value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, value);
  window.dispatchEvent(new Event("headercolor-changed"));
}

// Liefert die aktuell gewählte Kopfzeilen-Pastellfarbe, reagiert live auf Änderungen
// (z. B. wenn in den Einstellungen eine neue Farbe gewählt wird).
export function useHeaderColor(): string {
  const [color, setColor] = useState(DEFAULT_COLOR);

  useEffect(() => {
    setColor(getStoredHeaderColor());
    const handler = () => setColor(getStoredHeaderColor());
    window.addEventListener("headercolor-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("headercolor-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return color;
}

// --- Anthropic API Key (für optionale KI-Vorschläge), nur lokal auf dem Gerät gespeichert ---
const API_KEY_STORAGE = "urlaubsplaner-anthropic-key";

export function getStoredApiKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(API_KEY_STORAGE) || "";
}

export function setStoredApiKey(value: string) {
  if (typeof window === "undefined") return;
  if (value) window.localStorage.setItem(API_KEY_STORAGE, value);
  else window.localStorage.removeItem(API_KEY_STORAGE);
}
