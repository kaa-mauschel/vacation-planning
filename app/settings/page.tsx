"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/useUser";
import { STYLE, FONTS_IMPORT, cardStyle } from "@/lib/style";
import { PASTEL_COLORS, getStoredHeaderColor, setStoredHeaderColor, getStoredApiKey, setStoredApiKey, useHeaderColor, getStoredTabOrder, setStoredTabOrder, DEFAULT_TAB_ORDER } from "@/lib/theme";
import { ArrowLeft, Check, Key, ExternalLink, GripVertical, ListOrdered } from "lucide-react";

const TAB_LABELS: Record<string, string> = {
  uebersicht: "Übersicht",
  packliste: "Packliste",
  vorabreise: "Vor der Abreise",
  route: "Route",
  wetter: "Wetter",
  unterkuenfte: "Unterkünfte",
  kosten: "Kosten",
  essen: "Essen & Trinken",
  aktivitaeten: "Aktivitäten",
  umgebung: "Umgebung",
  mustdo: "Must-Dos",
  tagesplan: "Tagesplanung",
  tipps: "Tipps",
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const headerColor = useHeaderColor();
  const [selected, setSelected] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [savedHint, setSavedHint] = useState(false);
  const [tabOrder, setTabOrder] = useState<string[]>(DEFAULT_TAB_ORDER);
  const dragIndexRef = useRef<number | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    setSelected(getStoredHeaderColor());
    setApiKey(getStoredApiKey());
    setTabOrder(getStoredTabOrder());
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const pickColor = (value: string) => {
    setSelected(value);
    setStoredHeaderColor(value);
  };

  const saveApiKey = () => {
    setStoredApiKey(apiKey.trim());
    setSavedHint(true);
    setTimeout(() => setSavedHint(false), 1800);
  };

  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    e.preventDefault();
    dragIndexRef.current = index;
    setDraggingId(tabOrder[index]);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragIndexRef.current === null) return;
    const currentIndex = dragIndexRef.current;
    const pointerY = e.clientY;
    let targetIndex = currentIndex;
    for (let i = 0; i < tabOrder.length; i++) {
      const el = rowRefs.current[tabOrder[i]];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (pointerY < mid) { targetIndex = i; break; }
      targetIndex = i + 1;
    }
    targetIndex = Math.max(0, Math.min(tabOrder.length - 1, targetIndex));
    if (targetIndex !== currentIndex) {
      const next = [...tabOrder];
      const [moved] = next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, moved);
      setTabOrder(next);
      dragIndexRef.current = targetIndex;
    }
  };

  const handlePointerUp = () => {
    if (dragIndexRef.current === null) return;
    dragIndexRef.current = null;
    setDraggingId(null);
    setStoredTabOrder(tabOrder);
  };

  if (loading || !user) return <div style={{ minHeight: "100vh", background: STYLE.paperDim }} />;

  return (
    <div style={{ minHeight: "100vh", background: STYLE.paperDim, paddingBottom: 40 }}>
      <style>{FONTS_IMPORT}</style>

      <div style={{ background: headerColor, color: STYLE.headerText, padding: "20px 16px" }}>
        <button onClick={() => router.push("/projects")} style={{ background: "none", border: "none", color: STYLE.headerText, display: "flex", alignItems: "center", gap: 6, fontSize: 13, opacity: 0.75 }}>
          <ArrowLeft size={16} /> Zurück
        </button>
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 24, marginTop: 10 }}>Einstellungen</div>
      </div>

      <div style={{ padding: "20px 16px", maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <ListOrdered size={17} color={STYLE.ink} />
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17 }}>Reihenfolge der Reiter</div>
          </div>
          <p style={{ fontSize: 13, color: "#6B6558", margin: "6px 0 12px" }}>
            Am Griff-Symbol ziehen, um die Reihenfolge zu ändern – gilt für alle deine Urlaube auf diesem Gerät.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {tabOrder.map((id, index) => (
              <div
                key={id}
                ref={(el) => { rowRefs.current[id] = el; }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
                  background: draggingId === id ? "#EFE6D8" : STYLE.paperDim,
                  boxShadow: draggingId === id ? "0 4px 14px rgba(58,53,48,0.18)" : "none",
                  touchAction: "none",
                }}
              >
                <div onPointerDown={(e) => handlePointerDown(e, index)} style={{ cursor: "grab", color: "#B0A996", touchAction: "none" }}>
                  <GripVertical size={16} />
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{index + 1}. {TAB_LABELS[id] || id}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17, marginBottom: 4 }}>Farbe der Kopfzeile</div>
          <p style={{ fontSize: 13, color: "#6B6558", marginBottom: 14 }}>
            Gilt auf diesem Gerät für alle deine Urlaube. Jede Person kann sich ihre eigene Farbe einstellen.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {PASTEL_COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => pickColor(c.value)}
                style={{
                  aspectRatio: "1", borderRadius: 14, background: c.value, border: selected === c.value ? `3px solid ${STYLE.ink}` : "1px solid rgba(0,0,0,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
                }}
                title={c.label}
              >
                {selected === c.value && <Check size={20} color={STYLE.ink} />}
              </button>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Key size={17} color={STYLE.ink} />
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17 }}>KI-Vorschläge (optional)</div>
          </div>
          <p style={{ fontSize: 13, color: "#6B6558", margin: "6px 0 12px", lineHeight: 1.6 }}>
            Trag hier deinen eigenen Anthropic-API-Key ein, um bei Essen & Trinken, Aktivitäten und Must-Dos
            automatisch Vorschläge für dein Reiseziel generieren zu lassen. Der Key wird nur auf deinem Gerät
            gespeichert (nicht auf unserem Server) und nur für diese Anfragen verwendet. Kosten für die
            Nutzung trägst du selbst über dein Anthropic-Konto.
          </p>
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: STYLE.accent4, marginBottom: 12, textDecoration: "none" }}
          >
            API-Key erstellen <ExternalLink size={12} />
          </a>
          <input
            type="password"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #E0D9C6", fontSize: 14, marginBottom: 10, fontFamily: "monospace" }}
          />
          <button
            onClick={saveApiKey}
            style={{ padding: "10px 20px", borderRadius: 9, border: "none", background: STYLE.ink, color: "#fff", fontSize: 13.5, fontWeight: 600 }}
          >
            {savedHint ? "Gespeichert ✓" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
