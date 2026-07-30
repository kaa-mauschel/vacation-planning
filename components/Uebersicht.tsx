"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useItems } from "@/lib/useItems";
import { STYLE, cardStyle } from "@/lib/style";
import { guessFlag, SECTIONS } from "@/lib/types";
import { useHeaderColor, headerGradient } from "@/lib/theme";
import { MapPin, Sparkles, Home } from "lucide-react";
import WeatherWidget from "./WeatherWidget";

// Leaflet greift auf window/document zu und darf nicht auf dem Server gerendert werden.
const RealMap = dynamic(() => import("./RealMap"), {
  ssr: false,
  loading: () => <div style={{ height: 340, display: "flex", alignItems: "center", justifyContent: "center", color: "#9A9384", fontSize: 13 }}>Karte wird geladen…</div>,
});

function nights(von: string, bis: string): number | null {
  if (!von || !bis) return null;
  const a = new Date(von + "T00:00:00").getTime();
  const b = new Date(bis + "T00:00:00").getTime();
  const n = Math.round((b - a) / (1000 * 60 * 60 * 24));
  return n > 0 ? n : null;
}

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Uebersicht({ projectId, startDate }: { projectId: string; startDate: string | null }) {
  const { items: routeItems } = useItems(projectId, SECTIONS.ROUTE);
  const { items: unterkunftItems, loading: unterkunftLoading } = useItems(projectId, SECTIONS.UNTERKUNFT);
  const { items: notizItems, addItem: addNotiz, updateItem: updateNotiz } = useItems(projectId, SECTIONS.NOTIZ);

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

  // Reihenfolge exakt wie im Route-Tab (Position = dort festgelegte Reihenfolge, inkl.
  // Datum + manuellem Verschieben) – wichtig bei mehreren Etappen am selben Tag,
  // da sonst bei gleichem Datum keine eindeutige Reihenfolge bestünde.
  const sortedRoute = [...routeItems].sort((a, b) => a.position - b.position);

  // "Wo & wie lange" basiert auf den Unterkünften (die haben die richtigen An-/Abreisedaten).
  const stays = [...unterkunftItems].sort((a, b) => {
    if (a.data.von && b.data.von) return a.data.von.localeCompare(b.data.von);
    if (a.data.von) return -1;
    if (b.data.von) return 1;
    return 0;
  });

  const stayPoints = stays
    .filter((it) => it.data.lat && it.data.lon)
    .map((it) => ({
      id: it.id,
      name: it.data.station,
      lat: it.data.lat, lon: it.data.lon,
      country: it.data.country,
      symbol: it.data.symbol || "",
      arrival: it.data.von || null,
      departure: it.data.bis || null,
      isStay: true,
    }));
  const stayByName = new Map(stayPoints.map((p) => [(p.name || "").trim().toLowerCase(), p]));

  // Die Reihenfolge kommt jetzt direkt aus der Verkettung der Route (Start = "Von" der
  // allerersten Etappe, danach immer das "Nach" jeder weiteren Etappe der Reihe nach) –
  // das ist eindeutig, unabhängig vom Datum, und entspricht genau dem, was im Route-Tab
  // steht. Unterkünfte, deren Name zu einer Station passt, ersetzen den Punkt (mit
  // Aufenthaltsdauer statt nur Durchreise-Datum).
  const usedStayKeys = new Set<string>();
  const chainPoints: any[] = [];
  const pushChainPoint = (name: string, lat: string, lon: string, country: string, symbol: string, date: string | null) => {
    if (!name || !lat || !lon) return;
    const key = name.trim().toLowerCase();
    if (chainPoints.length && chainPoints[chainPoints.length - 1].key === key) return; // gleicher Ort wie zuvor
    const stay = stayByName.get(key);
    if (stay) {
      usedStayKeys.add(key);
      chainPoints.push({ ...stay, key, isStay: true });
    } else {
      chainPoints.push({ id: `chain-${key}-${chainPoints.length}`, key, name, lat, lon, country, symbol, arrival: null, departure: date, isStay: false });
    }
  };

  sortedRoute.forEach((leg) => {
    // Von-Punkt jeder Etappe (deckt auch Fälle ab, wo beim "Nach" der vorherigen Etappe
    // aus irgendeinem Grund keine Koordinaten gespeichert wurden)
    pushChainPoint(leg.data.from, leg.data.lat, leg.data.lon, leg.data.fromCountry || leg.data.land, leg.data.symbol || "", leg.data.date || null);
    // Nach-Punkt jeder Etappe
    pushChainPoint(leg.data.to, leg.data.toLat, leg.data.toLon, leg.data.toCountry, "", leg.data.date || null);
  });

  // Unterkünfte, die sich keiner Etappe zuordnen ließen (Name passt zu keiner Station),
  // hinten anhängen, nach Anreisedatum sortiert.
  const unmatchedStays = stayPoints.filter((p) => !usedStayKeys.has((p.name || "").trim().toLowerCase()));

  const combined = [...chainPoints, ...unmatchedStays];
  const geoStays = combined.map((s, i) => ({ ...s, listNumber: i + 1 }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {startDate && <Countdown startDate={startDate} />}

      {geoStays.length >= 2 && (
        <div style={cardStyle}>
          <SectionTitle icon={MapPin} text="Landkarte mit euren Stationen" />
          <div style={{ marginTop: 10, borderRadius: 12, overflow: "hidden", background: STYLE.paperDim }}>
            <RealMap stops={geoStays} accentColor={STYLE.accent} />
          </div>
          <p style={{ fontSize: 12, color: "#9A9384", margin: "8px 0 0" }}>
            Große Punkte = Unterkünfte (Aufenthaltsdauer), kleine Punkte = Zwischenstopps auf der Fahrt.
            Details zur Route findest du im Tab "Route".
          </p>
        </div>
      )}
      {geoStays.length < 2 && (stays.length > 0 || sortedRoute.length > 0) && (
        <div style={{ ...cardStyle, fontSize: 13, color: "#9A9384" }}>
          Trage bei mindestens 2 Unterkünften oder Route-Etappen Koordinaten ein (Button "Koordinaten finden" bzw. "berechnen"), um hier eine Landkarte zu sehen.
        </div>
      )}
      {stays.length === 0 && sortedRoute.length === 0 && !unterkunftLoading && (
        <div style={{ ...cardStyle, fontSize: 13, color: "#9A9384" }}>
          Noch keine Unterkünfte oder Route-Etappen eingetragen – dann erscheinen hier Karte und Aufenthaltsdauer.
        </div>
      )}

      {stays.length > 0 && (
        <div style={cardStyle}>
          <SectionTitle icon={Home} text="Wo & wie lange" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {stays.map((it, i) => {
              const n = nights(it.data.von, it.data.bis);
              return (
                <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", background: STYLE.paperDim, borderRadius: 10 }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%", background: it.data.lat && it.data.lon ? STYLE.accent : "#D8D2C4",
                    color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span>{it.data.country ? guessFlag(it.data.country) : ""} {it.data.symbol || ""} {it.data.station}</span>
                      {it.data.lat && it.data.lon && it.data.von && (
                        <WeatherWidget lat={it.data.lat} lon={it.data.lon} startDate={it.data.von} endDate={it.data.bis} />
                      )}
                    </div>
                    {(it.data.von || it.data.bis) && (
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: "#6B6558", marginTop: 1 }}>
                        {fmtDate(it.data.von)}{it.data.von && it.data.bis ? " – " : ""}{fmtDate(it.data.bis)}
                        {n ? ` · ${n} ${n === 1 ? "Nacht" : "Nächte"}` : ""}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
    <div style={{ background: headerGradient(headerColor), borderRadius: 16, padding: "18px 16px", color: STYLE.headerText }}>
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
