"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useItems } from "@/lib/useItems";
import { STYLE, cardStyle } from "@/lib/style";
import { guessFlag, SECTIONS } from "@/lib/types";
import { useHeaderColor } from "@/lib/theme";
import { MapPin, Sparkles } from "lucide-react";

// Leaflet greift auf window/document zu und darf nicht auf dem Server gerendert werden.
const RealMap = dynamic(() => import("./RealMap"), {
  ssr: false,
  loading: () => <div style={{ height: 340, display: "flex", alignItems: "center", justifyContent: "center", color: "#9A9384", fontSize: 13 }}>Karte wird geladen…</div>,
});

export default function Uebersicht({ projectId, startDate }: { projectId: string; startDate: string | null }) {
  const { items: routeItems, loading: routeLoading } = useItems(projectId, SECTIONS.ROUTE);
  const { items: notizItems, loading: notizLoading, addItem: addNotiz, updateItem: updateNotiz } = useItems(projectId, SECTIONS.NOTIZ);

  const notiz = notizItems[0];
  const [notizText, setNotizText] = useState("");

  useEffect(() => {
    setNotizText(notiz?.data?.text || "");
  }, [notiz?.data?.text]);

  const saveNotiz = () => {
    if (notiz) {
      if (notizText !== notiz.data.text) updateNotiz(notiz.id, { text: notizText });
    } else if (notizText.trim()) {
      addNotiz({ text: notizText });
    }
  };

  // Reihenfolge kommt bereits sortiert nach position aus useItems (= die Reihenfolge,
  // die im Route-Tab per Datum bzw. manuell mit den Pfeilen festgelegt wurde).
  const sortedRoute = routeItems;

  const totalKm = sortedRoute.reduce((sum, it) => {
    const n = parseFloat(String(it.data.km || "").replace(/[^\d.,]/g, "").replace(",", "."));
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const geoStops = sortedRoute
    .map((it, i) => ({ ...it, listNumber: i + 1 }))
    .filter((it) => it.data.lat && it.data.lon);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {startDate && <Countdown startDate={startDate} />}

      {geoStops.length >= 2 && (
        <div style={cardStyle}>
          <SectionTitle icon={MapPin} text="Landkarte mit eurer Route" />
          <div style={{ marginTop: 10, borderRadius: 12, overflow: "hidden", background: STYLE.paperDim }}>
            <RealMap stops={geoStops} accentColor={STYLE.accent} />
          </div>
          <p style={{ fontSize: 12, color: "#9A9384", margin: "8px 0 0" }}>
            Die gestrichelte Linie zeigt die Luftlinie zwischen den Stationen, keine exakte Straßenführung. Auf die Nummern tippen zeigt Details.
          </p>
        </div>
      )}
      {geoStops.length < 2 && sortedRoute.length > 0 && (
        <div style={{ ...cardStyle, fontSize: 13, color: "#9A9384" }}>
          Trage bei mindestens 2 Etappen im Tab "Route" Koordinaten (lat/lon) ein, um hier eine Landkarte zu sehen.
        </div>
      )}

      <div style={cardStyle}>
        <SectionTitle icon={MapPin} text="Eure Route" />
        {routeLoading ? (
          <p style={{ fontSize: 13.5, color: "#9A9384", marginTop: 8 }}>Lädt…</p>
        ) : sortedRoute.length === 0 ? (
          <p style={{ fontSize: 13.5, color: "#9A9384", marginTop: 8 }}>Noch keine Etappen im Tab "Route" eingetragen.</p>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              {sortedRoute.map((it, i) => (
                <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", background: STYLE.paperDim, borderRadius: 10 }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%", background: it.data.lat && it.data.lon ? STYLE.accent : "#D8D2C4",
                    color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1 }}>
                    {(it.data.fromCountry || it.data.land) ? guessFlag(it.data.fromCountry || it.data.land) : ""} {it.data.symbol || ""} {it.data.from} → {it.data.to}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: "#6B6558", flexShrink: 0 }}>
                    {it.data.km ? `${it.data.km}` : ""}{it.data.h ? ` · ${it.data.h}` : ""}
                  </span>
                </div>
              ))}
            </div>
            {totalKm > 0 && (
              <div style={{ marginTop: 10, fontSize: 12.5, color: "#6B6558" }}>
                Gesamtstrecke ungefähr: <strong>{totalKm.toLocaleString("de-DE")} km</strong>
              </div>
            )}
          </>
        )}
      </div>

      <div style={cardStyle}>
        <SectionTitle icon={Sparkles} text="Gut zu wissen" />
        <p style={{ fontSize: 12.5, color: "#9A9384", margin: "6px 0 10px" }}>
          Freier Platz für Notizen – z. B. mit wem ihr unterwegs seid, Besonderheiten, Erinnerungen für alle Mitreisenden.
        </p>
        <textarea
          value={notizText}
          onChange={(e) => setNotizText(e.target.value)}
          onBlur={saveNotiz}
          placeholder="z. B. Wir sind mit den Müllers unterwegs (Kinder 4 & 7 Jahre), ab dem 10.8. nur noch zu dritt…"
          rows={5}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #E0D9C6", fontSize: 13.5, resize: "vertical", fontFamily: "inherit" }}
        />
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Icon size={17} color={STYLE.ink} />
      <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17 }}>{text}</span>
    </div>
  );
}

function Countdown({ startDate }: { startDate: string }) {
  const headerColor = useHeaderColor();
  const target = new Date(startDate + "T00:00:00").getTime();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  const departed = diff <= 0;

  return (
    <div style={{ background: headerColor, borderRadius: 16, padding: "18px 16px", color: STYLE.headerText }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 1.5, opacity: 0.7, textTransform: "uppercase", marginBottom: 10 }}>
        {departed ? "Unterwegs seit" : "Abfahrt in"}
      </div>
      {departed ? (
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600 }}>Gute Reise! 🚗</div>
      ) : (
        <div style={{ display: "flex", gap: 18 }}>
          {[["Tage", days], ["Std.", hours], ["Min.", minutes], ["Sek.", seconds]].map(([label, val]) => (
            <div key={label as string}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 600, lineHeight: 1 }}>{String(val).padStart(2, "0")}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


