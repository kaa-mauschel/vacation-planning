"use client";

import { useState } from "react";
import { useItems } from "@/lib/useItems";
import { STYLE, cardStyle } from "@/lib/style";
import { Plus, X, Pencil } from "lucide-react";

const KATEGORIEN = ["Unterkunft", "Essen", "Aktivität", "Tanken", "Transport", "Einkauf", "Sonstiges"];
const EMPTY = { kategorie: "", betrag: "", ort: "" };

export default function Kosten({ projectId }: { projectId: string }) {
  const { items, loading, addItem, updateItem, deleteItem } = useItems(projectId, "kosten");
  const { items: unterkuenfte } = useItems(projectId, "unterkunft");
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY);

  if (loading) return <p style={{ color: "#9A9384", fontSize: 14 }}>Lädt…</p>;

  const total = items.reduce((sum, it) => sum + (Number(it.data.betrag) || 0), 0);
  const orte = Array.from(new Set(unterkuenfte.map((it) => it.data.station).filter(Boolean)));

  const submit = () => {
    if (!form.kategorie.trim() || !form.betrag) return;
    addItem(form);
    setForm(EMPTY);
  };

  const startEdit = (it: any) => {
    setEditingId(it.id);
    setEditForm({ kategorie: it.data.kategorie || "", betrag: it.data.betrag || "", ort: it.data.ort || "" });
  };

  const saveEdit = (id: string) => {
    updateItem(id, editForm);
    setEditingId(null);
  };

  const byKategorie = KATEGORIEN.filter((k) => items.some((it) => it.data.kategorie === k))
    .concat(Array.from(new Set(items.map((it) => it.data.kategorie).filter((k) => !KATEGORIEN.includes(k)))));

  const CategoryPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {KATEGORIEN.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          style={{
            padding: "6px 11px", borderRadius: 20, fontSize: 12.5, fontWeight: 600,
            border: value === k ? `1.5px solid ${STYLE.accent}` : "1px solid #E0D9C6",
            background: value === k ? "#E4EFE7" : "#fff", color: value === k ? STYLE.accent : STYLE.ink,
          }}
        >
          {k}
        </button>
      ))}
    </div>
  );

  const OrtPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
      <option value="">Ort (optional)</option>
      {orte.map((o) => <option key={o} value={o}>{o}</option>)}
      <option value="__custom__">Anderer Ort…</option>
    </select>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={cardStyle}>
        <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17 }}>Gesamtkosten</span>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 600, marginTop: 8 }}>
          {total.toLocaleString("de-DE")} €
        </div>
      </div>

      {byKategorie.map((kat) => {
        const katItems = items.filter((it) => it.data.kategorie === kat);
        const katTotal = katItems.reduce((sum, it) => sum + (Number(it.data.betrag) || 0), 0);
        return (
          <div key={kat} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14.5 }}>{kat}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#6B6558" }}>{katTotal.toLocaleString("de-DE")} €</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {katItems.map((it) => {
                if (editingId === it.id) {
                  return (
                    <div key={it.id} style={{ padding: "8px", background: STYLE.paperDim, borderRadius: 9, display: "flex", flexDirection: "column", gap: 6 }}>
                      <CategoryPicker value={editForm.kategorie} onChange={(v) => setEditForm({ ...editForm, kategorie: v })} />
                      <div style={{ display: "flex", gap: 6 }}>
                        <input placeholder="€" type="number" value={editForm.betrag} onChange={(e) => setEditForm({ ...editForm, betrag: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                        <OrtPicker value={editForm.ort} onChange={(v) => setEditForm({ ...editForm, ort: v })} />
                      </div>
                      {editForm.ort === "__custom__" && (
                        <input placeholder="Ort eingeben" value="" onChange={(e) => setEditForm({ ...editForm, ort: e.target.value })} style={inputStyle} />
                      )}
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "1px solid #E0D9C6", background: "transparent", fontSize: 12.5 }}>Abbrechen</button>
                        <button onClick={() => saveEdit(it.id)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", background: STYLE.accent, color: "#fff", fontSize: 12.5, fontWeight: 600 }}>Speichern</button>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, flex: 1 }}>{it.data.ort || <span style={{ color: "#C9C2B0" }}>—</span>}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13.5, fontWeight: 600 }}>{Number(it.data.betrag).toLocaleString("de-DE")} €</span>
                    <button onClick={() => startEdit(it)} style={{ background: "none", border: "none", color: "#9A9384" }}><Pencil size={14} /></button>
                    <button onClick={() => deleteItem(it.id)} style={{ background: "none", border: "none", color: "#B8AF9C" }}><X size={15} /></button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={cardStyle}>
        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 10 }}>Ausgabe hinzufügen</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <CategoryPicker value={form.kategorie} onChange={(v) => setForm({ ...form, kategorie: v })} />
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="€" type="number" value={form.betrag} onChange={(e) => setForm({ ...form, betrag: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
            <div style={{ flex: 2 }}><OrtPicker value={form.ort} onChange={(v) => setForm({ ...form, ort: v })} /></div>
          </div>
          {form.ort === "__custom__" && (
            <input placeholder="Ort eingeben" value="" onChange={(e) => setForm({ ...form, ort: e.target.value })} style={inputStyle} />
          )}
          <button onClick={submit} style={{ padding: "10px 0", borderRadius: 9, border: "none", background: STYLE.ink, color: "#fff", fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Plus size={14} /> Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "9px 11px",
  borderRadius: 9,
  border: "1px solid #E0D9C6",
  fontSize: 13.5,
  fontFamily: "inherit",
  minWidth: 0,
  width: "100%",
};
