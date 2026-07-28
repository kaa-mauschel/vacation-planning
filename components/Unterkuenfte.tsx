"use client";

import { useState } from "react";
import { useItems } from "@/lib/useItems";
import { STYLE, cardStyle } from "@/lib/style";
import { guessFlag, PLACE_SYMBOLS } from "@/lib/types";
import { geocode } from "@/lib/routing";
import { MapPin, Plus, X, Pencil, Loader2, LocateFixed } from "lucide-react";

function mapsSearchLink(name: string, context: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${context}`)}`;
}

const EMPTY = { station: "", von: "", bis: "", name: "", link: "", verpflegung: "", extras: "", lat: "", lon: "", country: "", symbol: "" };

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function nights(von: string, bis: string): number | null {
  if (!von || !bis) return null;
  const a = new Date(von + "T00:00:00").getTime();
  const b = new Date(bis + "T00:00:00").getTime();
  const n = Math.round((b - a) / (1000 * 60 * 60 * 24));
  return n > 0 ? n : null;
}

export default function Unterkuenfte({ projectId }: { projectId: string }) {
  const { items, loading, addItem, updateItem, deleteItem } = useItems(projectId, "unterkunft");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");

  if (loading) return <p style={{ color: "#9A9384", fontSize: 14 }}>Lädt…</p>;

  const submit = () => {
    if (!form.station.trim()) return;
    addItem(form, items.length);
    setForm(EMPTY);
    setShowForm(false);
  };

  const startEdit = (it: any) => {
    setEditingId(it.id);
    setEditForm({
      station: it.data.station || "", von: it.data.von || "", bis: it.data.bis || "",
      name: it.data.name || "", link: it.data.link || "", verpflegung: it.data.verpflegung || "",
      extras: it.data.extras || "", lat: it.data.lat || "", lon: it.data.lon || "",
      country: it.data.country || "", symbol: it.data.symbol || "",
    });
  };

  const saveEdit = (id: string) => {
    updateItem(id, editForm);
    setEditingId(null);
  };

  const locate = async (target: "form" | "edit") => {
    const f = target === "form" ? form : editForm;
    const query = f.name.trim() || f.station.trim();
    if (!query) { setLocateError("Bitte erst Ort/Station oder Name der Unterkunft ausfüllen."); return; }
    setLocating(true);
    setLocateError("");
    const result = await geocode(query);
    setLocating(false);
    if (!result) { setLocateError(`"${query}" konnte nicht gefunden werden.`); return; }
    const next = { ...f, lat: String(result.lat), lon: String(result.lon), country: result.country };
    if (target === "form") setForm(next); else setEditForm(next);
  };

  const SymbolPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div>
      <div style={{ fontSize: 11.5, color: "#9A9384", marginBottom: 5 }}>Charakter des Ortes (optional)</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {PLACE_SYMBOLS.map((s) => (
          <button
            key={s.emoji}
            type="button"
            onClick={() => onChange(value === s.emoji ? "" : s.emoji)}
            title={s.label}
            style={{ width: 34, height: 34, borderRadius: 8, fontSize: 16, border: value === s.emoji ? `2px solid ${STYLE.accent}` : "1px solid #E0D9C6", background: value === s.emoji ? "#E4EFE7" : "#fff" }}
          >
            {s.emoji}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map((it) => {
        const isEditing = editingId === it.id;
        const n = nights(it.data.von, it.data.bis);
        if (isEditing) {
          return (
            <div key={it.id} style={{ ...cardStyle, border: `1px solid ${STYLE.accent}55`, display: "flex", flexDirection: "column", gap: 8 }}>
              <input placeholder="Ort/Station" value={editForm.station} onChange={(e) => setEditForm({ ...editForm, station: e.target.value })} style={inputStyle} />
              <div style={{ display: "flex", gap: 8 }}>
                <input type="date" value={editForm.von} onChange={(e) => setEditForm({ ...editForm, von: e.target.value })} style={inputStyle} />
                <input type="date" value={editForm.bis} onChange={(e) => setEditForm({ ...editForm, bis: e.target.value })} style={inputStyle} />
              </div>
              <input placeholder="Name der Unterkunft" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} />
              <button
                type="button"
                onClick={() => locate("edit")}
                disabled={locating}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, border: `1px solid ${STYLE.accent4}`, background: "transparent", color: STYLE.accent4, fontSize: 12.5, fontWeight: 600, opacity: locating ? 0.6 : 1 }}
              >
                {locating ? <Loader2 size={13} className="animate-spin" /> : <LocateFixed size={13} />}
                {locating ? "Suche…" : "Koordinaten & Land finden (für die Karte)"}
              </button>
              {locateError && <p style={{ fontSize: 11.5, color: STYLE.danger, margin: 0 }}>{locateError}</p>}
              <input placeholder="Link (Buchungsseite)" value={editForm.link} onChange={(e) => setEditForm({ ...editForm, link: e.target.value })} style={inputStyle} />
              <input placeholder="Verpflegung (z. B. Halbpension)" value={editForm.verpflegung} onChange={(e) => setEditForm({ ...editForm, verpflegung: e.target.value })} style={inputStyle} />
              <input placeholder="Extras, kommagetrennt (Pool, WLAN, …)" value={editForm.extras} onChange={(e) => setEditForm({ ...editForm, extras: e.target.value })} style={inputStyle} />
              <SymbolPicker value={editForm.symbol} onChange={(v) => setEditForm({ ...editForm, symbol: v })} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "1px solid #E0D9C6", background: "transparent", fontSize: 13.5 }}>Abbrechen</button>
                <button onClick={() => saveEdit(it.id)} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "none", background: STYLE.accent, color: "#fff", fontSize: 13.5, fontWeight: 600 }}>Speichern</button>
              </div>
            </div>
          );
        }
        return (
          <div key={it.id} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15.5 }}>
                  {it.data.country ? guessFlag(it.data.country) : ""} {it.data.symbol || ""} {it.data.station}
                </div>
                {(it.data.von || it.data.bis) && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6B6558", marginTop: 2 }}>
                    {fmtDate(it.data.von)}{it.data.von && it.data.bis ? " – " : ""}{fmtDate(it.data.bis)}
                    {n ? ` · ${n} ${n === 1 ? "Nacht" : "Nächte"}` : ""}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button onClick={() => startEdit(it)} style={{ background: "none", border: "none", color: "#9A9384" }}><Pencil size={15} /></button>
                <button onClick={() => deleteItem(it.id)} style={{ background: "none", border: "none", color: "#C9C2B0" }}><X size={16} /></button>
              </div>
            </div>
            {it.data.name && <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8 }}>{it.data.name}</div>}
            {it.data.verpflegung && (
              <div style={{ fontSize: 13, background: STYLE.paperDim, borderRadius: 10, padding: "9px 11px", marginTop: 8 }}>
                <span style={{ fontWeight: 700 }}>Verpflegung: </span>{it.data.verpflegung}
              </div>
            )}
            {it.data.extras && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {String(it.data.extras).split(",").map((ex: string) => ex.trim()).filter(Boolean).map((ex: string) => (
                  <span key={ex} style={{ fontSize: 11.5, padding: "4px 9px", borderRadius: 20, background: "#EFEADC", color: "#6B6558", fontWeight: 600 }}>{ex}</span>
                ))}
              </div>
            )}
            <a
              href={mapsSearchLink(it.data.name || it.data.station, it.data.station)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, fontSize: 12.5, fontWeight: 600, color: STYLE.accent4, textDecoration: "none" }}
            >
              <MapPin size={13} /> In Google Maps öffnen
            </a>
            {it.data.link && (
              <div style={{ marginTop: 6 }}>
                <a href={it.data.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: STYLE.accent4, wordBreak: "break-all" }}>{it.data.link}</a>
              </div>
            )}
            {!it.data.lat && (
              <p style={{ fontSize: 11.5, color: "#C98A3E", marginTop: 8 }}>
                Noch keine Koordinaten – zum Bearbeiten öffnen und "Koordinaten & Land finden" klicken, damit dieser Ort auf der Karte in der Übersicht erscheint.
              </p>
            )}
          </div>
        );
      })}

      {showForm ? (
        <div style={{ ...cardStyle, border: `1px solid ${STYLE.accent}55`, display: "flex", flexDirection: "column", gap: 8 }}>
          <input placeholder="Ort/Station" value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value })} style={inputStyle} />
          <div style={{ display: "flex", gap: 8 }}>
            <input type="date" value={form.von} onChange={(e) => setForm({ ...form, von: e.target.value })} style={inputStyle} />
            <input type="date" value={form.bis} onChange={(e) => setForm({ ...form, bis: e.target.value })} style={inputStyle} />
          </div>
          <input placeholder="Name der Unterkunft" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <button
            type="button"
            onClick={() => locate("form")}
            disabled={locating}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 9, border: `1px solid ${STYLE.accent4}`, background: "transparent", color: STYLE.accent4, fontSize: 13, fontWeight: 600, opacity: locating ? 0.6 : 1 }}
          >
            {locating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
            {locating ? "Suche…" : "Koordinaten & Land finden (für die Karte)"}
          </button>
          {locateError && <p style={{ fontSize: 12, color: STYLE.danger, margin: 0 }}>{locateError}</p>}
          <input placeholder="Link (Buchungsseite)" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} style={inputStyle} />
          <input placeholder="Verpflegung (z. B. Halbpension)" value={form.verpflegung} onChange={(e) => setForm({ ...form, verpflegung: e.target.value })} style={inputStyle} />
          <input placeholder="Extras, kommagetrennt (Pool, WLAN, …)" value={form.extras} onChange={(e) => setForm({ ...form, extras: e.target.value })} style={inputStyle} />
          <SymbolPicker value={form.symbol} onChange={(v) => setForm({ ...form, symbol: v })} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "1px solid #E0D9C6", background: "transparent", fontSize: 13.5 }}>Abbrechen</button>
            <button onClick={submit} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "none", background: STYLE.ink, color: "#fff", fontSize: 13.5, fontWeight: 600 }}>Speichern</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", borderRadius: 12, border: `1px dashed #C9C2B0`, background: "transparent", color: STYLE.ink, fontSize: 14, fontWeight: 600 }}
        >
          <Plus size={16} /> Unterkunft hinzufügen
        </button>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "9px 11px",
  borderRadius: 9,
  border: "1px solid #E0D9C6",
  fontSize: 13.5,
  width: "100%",
  fontFamily: "inherit",
};
