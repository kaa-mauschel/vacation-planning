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

// Hellt/dunkelt eine Hex-Farbe ab, für sanfte Farbverläufe (z. B. bei Kopfzeilen).
// percent negativ = dunkler, positiv = heller.
export function shadeColor(hex: string, percent: number): string {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function headerGradient(hex: string): string {
  return `linear-gradient(135deg, ${shadeColor(hex, 6)}, ${shadeColor(hex, -7)})`;
}

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

// --- Reihenfolge der Reiter in einem Urlaubsprojekt, individuell pro Gerät ---
export const DEFAULT_TAB_ORDER = [
  "uebersicht", "route", "wetter", "unterkuenfte", "kosten", "vorabreise",
  "packliste", "mustdo", "aktivitaeten", "umgebung", "essen", "tipps",
];

const TAB_ORDER_STORAGE = "urlaubsplaner-tab-order";

export function getStoredTabOrder(): string[] {
  if (typeof window === "undefined") return DEFAULT_TAB_ORDER;
  try {
    const raw = window.localStorage.getItem(TAB_ORDER_STORAGE);
    if (!raw) return DEFAULT_TAB_ORDER;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_TAB_ORDER;
    // Falls sich die verfügbaren Reiter mal ändern: unbekannte rausfiltern, neue hinten anhängen
    const known = parsed.filter((id: string) => DEFAULT_TAB_ORDER.includes(id));
    const missing = DEFAULT_TAB_ORDER.filter((id) => !known.includes(id));
    return [...known, ...missing];
  } catch {
    return DEFAULT_TAB_ORDER;
  }
}

export function setStoredTabOrder(order: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TAB_ORDER_STORAGE, JSON.stringify(order));
  window.dispatchEvent(new Event("taborder-changed"));
}

export function useTabOrder(): string[] {
  const [order, setOrder] = useState<string[]>(DEFAULT_TAB_ORDER);

  useEffect(() => {
    setOrder(getStoredTabOrder());
    const handler = () => setOrder(getStoredTabOrder());
    window.addEventListener("taborder-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("taborder-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return order;
}
