"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/useUser";
import { STYLE, FONTS_IMPORT, cardStyle } from "@/lib/style";
import { PASTEL_COLORS, getStoredHeaderColor, setStoredHeaderColor, getStoredApiKey, setStoredApiKey, useHeaderColor } from "@/lib/theme";
import { ArrowLeft, Check, Key, ExternalLink } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const headerColor = useHeaderColor();
  const [selected, setSelected] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [savedHint, setSavedHint] = useState(false);

  useEffect(() => {
    setSelected(getStoredHeaderColor());
    setApiKey(getStoredApiKey());
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
