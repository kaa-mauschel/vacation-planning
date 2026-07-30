"use client";

import { useState, useEffect } from "react";

// Merkt sich, welche Kategorien/Bereiche ein- oder ausgeklappt sind – pro Gerät,
// projekt- und tab-spezifisch, damit es beim nächsten Öffnen genauso aussieht wie
// beim letzten Mal verlassen.
export function useCollapsed(storageKey: string) {
  const [collapsed, setCollapsedState] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setCollapsedState(JSON.parse(raw));
    } catch {}
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const setCollapsed = (next: Record<string, boolean>) => {
    setCollapsedState(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  };

  const toggle = (key: string) => {
    setCollapsed({ ...collapsed, [key]: !collapsed[key] });
  };

  return { collapsed: loaded ? collapsed : {}, setCollapsed, toggle };
}
