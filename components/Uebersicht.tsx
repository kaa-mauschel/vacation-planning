"use client";

import { useState, useEffect } from "react";
import { useItems } from "@/lib/useItems";
import { STYLE, cardStyle } from "@/lib/style";
import { guessFlag, SECTIONS } from "@/lib/types";
import { MapPin, Sparkles } from "lucide-react";

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

  // Route chronologisch sortiert (nach Datum, sonst nach Position/Erstellung)
  const sortedRoute = [...routeItems].sort((a, b) => {
    if (a.data.date && b.data.date) return a.data.date.localeCompare(b.data.date);
    return (a.position ?? 0) - (b.position ?? 0);
  });

  const totalKm = sortedRoute.reduce((sum, it) => {
    const n = parseFloat(String(it.data.km || "").replace(/[^\d.,]/g, "").replace(",", "."));
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const geoStops = sortedRoute.filter((it) => it.data.lat && it.data.lon);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {startDate && <Countdown startDate={startDate} />}

      {geoStops.length >= 2 && (
        <div style={cardStyle}>
          <SectionTitle icon={MapPin} text="Landkarte mit eurer Route" />
          <div style={{ marginTop: 10, borderRadius: 12, overflow: "hidden", background: STYLE.paperDim }}>
            <RouteMap stops={geoStops} />
          </div>
          <p style={{ fontSize: 12, color: "#9A9384", margin: "8px 0 0" }}>
            Schematische Übersicht (Luftlinie), keine exakte Straßenführung.
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
              {sortedRoute.map((it) => (
                <div key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 11px", background: STYLE.paperDim, borderRadius: 10 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>
                    {it.data.land ? guessFlag(it.data.land) : ""} {it.data.from} → {it.data.to}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: "#6B6558" }}>
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
    <div style={{ background: STYLE.headerBg, borderRadius: 16, padding: "18px 16px", color: STYLE.headerText }}>
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

function RouteMap({ stops }: { stops: any[] }) {
  const width = 340;
  const height = 380;
  const lats = stops.map((s) => parseFloat(s.data.lat));
  const lons = stops.map((s) => parseFloat(s.data.lon));
  const latMin = Math.min(...lats) - 1, latMax = Math.max(...lats) + 1;
  const lonMin = Math.min(...lons) - 1, lonMax = Math.max(...lons) + 1;

  const project = (lat: number, lon: number): [number, number] => {
    const x = ((lon - lonMin) / (lonMax - lonMin || 1)) * width;
    const y = ((latMax - lat) / (latMax - latMin || 1)) * height;
    return [x, y];
  };

  const points = stops.map((s) => project(parseFloat(s.data.lat), parseFloat(s.data.lon)));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <path d={pathD} fill="none" stroke={STYLE.ink} strokeWidth="2.5" strokeDasharray="6 6" opacity="0.4" />
      {stops.map((s, i) => {
        const [x, y] = points[i];
        const labelRight = x < width / 2;
        return (
          <g key={s.id}>
            <circle cx={x} cy={y} r="7" fill={STYLE.accent} stroke={STYLE.paper} strokeWidth="2.5" />
            <text
              x={x + (labelRight ? 11 : -11)}
              y={y + 4}
              fontSize="11.5"
              fontFamily="'Inter', sans-serif"
              fontWeight="700"
              fill={STYLE.ink}
              textAnchor={labelRight ? "start" : "end"}
            >
              {s.data.land ? guessFlag(s.data.land) : ""} {s.data.from}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
