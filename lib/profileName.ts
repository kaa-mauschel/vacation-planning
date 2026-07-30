"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "urlaubsplaner-display-name";

export function getStoredName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY) || "";
}

export function setStoredName(name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, name.trim());
  window.dispatchEvent(new Event("displayname-changed"));
}

export function useDisplayName(): string {
  const [name, setName] = useState("");

  useEffect(() => {
    setName(getStoredName());
    const handler = () => setName(getStoredName());
    window.addEventListener("displayname-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("displayname-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return name;
}
