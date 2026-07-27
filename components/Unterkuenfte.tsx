"use client";

import { useState } from "react";
import { useItems } from "@/lib/useItems";
import { STYLE, cardStyle } from "@/lib/style";
import { MapPin, Plus, X, Pencil } from "lucide-react";

function mapsSearchLink(name: string, context: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${context}`)}`;
}

const EMPTY = { station: "", von: "", bis: "", name: "", link: "", verpflegung: "", extras: "" };

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Unterkuenfte({ projectId }: { projectId: string }) {
  const { items, loading, addItem, updateItem, deleteItem } = useItems(projectId, "unterkunft");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY);

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
      extras: it.data.extras || "",
    });
  };

  const saveEdit = (id: string) => {
    updateItem(id, editForm);
    setEditingId(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map((it) => {
        const isEditing = editingId === it.id;
        if (isEditing) {
          return (
            <div key={it.id} style={{ ...cardStyle, border: `1px solid ${STYLE.accent}55`, display: "flex", flexDirection: "column", gap: 8 }}>
              <input placeholder="Ort/Station" value={editForm.station} onChange={(e) => setEditForm({ ...editForm, station: e.target.value })} style={inputStyle} />
              <div style={{ display: "flex", gap: 8 }}>
                <input type="date" value={editForm.von} onChange={(e) => setEditForm({ ...editForm, von: e.target.value })} style={inputStyle} />
                <input type="date" value={editForm.bis} onChange={(e) => setEditForm({ ...editForm, bis: e.target.value })} style={inputStyle} />
              </div>
              <input placeholder="Name der Unterkunft" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} />
              <input placeholder="Link (Buchungsseite)" value={editForm.link} onChange={(e) => setEditForm({ ...editForm, link: e.target.value })} style={inputStyle} />
              <input placeholder="Verpflegung (z. B. Halbpension)" value={editForm.verpflegung} onChange={(e) => setEditForm({ ...editForm, verpflegung: e.target.value })} style={inputStyle} />
              <input placeholder="Extras, kommagetrennt (Pool, WLAN, …)" value={editForm.extras} onChange={(e) => setEditForm({ ...editForm, extras: e.target.value })} style={inputStyle} />
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
                <div style={{ fontWeight: 700, fontSize: 15.5 }}>{it.data.station}</div>
                {(it.data.von || it.data.bis) && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6B6558", marginTop: 2 }}>
                    {fmtDate(it.data.von)}{it.data.von && it.data.bis ? " – " : ""}{fmtDate(it.data.bis)}
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
          <input placeholder="Link (Buchungsseite)" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} style={inputStyle} />
          <input placeholder="Verpflegung (z. B. Halbpension)" value={form.verpflegung} onChange={(e) => setForm({ ...form, verpflegung: e.target.value })} style={inputStyle} />
          <input placeholder="Extras, kommagetrennt (Pool, WLAN, …)" value={form.extras} onChange={(e) => setForm({ ...form, extras: e.target.value })} style={inputStyle} />
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
