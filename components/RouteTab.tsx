"use client";

import { useState, useEffect, useRef } from "react";
import { useItems } from "@/lib/useItems";
import { STYLE, cardStyle } from "@/lib/style";
import { guessFlag } from "@/lib/types";
import { MapPin, Plus, X, Pencil, ArrowUp, ArrowDown } from "lucide-react";

function mapsDirectionsLink(from: string, to: string) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=driving`;
}

const EMPTY_FORM = { from: "", to: "", date: "", km: "", h: "", land: "", lat: "", lon: "" };

export default function RouteTab({ projectId }: { projectId: string }) {
  const { items, loading, addItem, updateItem, deleteItem, reload } = useItems(projectId, "route");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const normalizedOnce = useRef(false);

  // Items sind bereits nach position sortiert (kommt so aus useItems).
  const sorted = items;

  // Einmaliges Reparieren: falls Positionen durcheinander/gleich sind (z. B. alte Einträge,
  // die alle Position 0 hatten), nach Datum neu durchnummerieren.
  useEffect(() => {
    if (loading || normalizedOnce.current || items.length < 2) return;
    const positions = items.map((it) => it.position);
    const hasDuplicates = new Set(positions).size !== positions.length;
    if (!hasDuplicates) {
      normalizedOnce.current = true;
      return;
    }
    normalizedOnce.current = true;
    const byDate = [...items].sort((a, b) => {
      if (a.data.date && b.data.date) return a.data.date.localeCompare(b.data.date);
      if (a.data.date) return -1;
      if (b.data.date) return 1;
      return a.created_at.localeCompare(b.created_at);
    });
    reorderAll(byDate.map((it) => it.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, items.length]);

  const reorderAll = async (orderedIds: string[]) => {
    const { supabase } = await import("@/lib/supabaseClient");
    for (let i = 0; i < orderedIds.length; i++) {
      await supabase.from("items").update({ position: i }).eq("id", orderedIds[i]);
    }
    await reload();
  };

  if (loading) return <p style={{ color: "#9A9384", fontSize: 14 }}>Lädt…</p>;

  const submit = () => {
    if (!form.from.trim() || !form.to.trim()) return;
    // Chronologisch einsortieren: Position anhand des Datums bestimmen
    let insertAt = sorted.length;
    if (form.date) {
      insertAt = sorted.findIndex((it) => it.data.date && it.data.date > form.date);
      if (insertAt === -1) insertAt = sorted.length;
    }
    addItem(form, insertAt);
    setForm(EMPTY_FORM);
  };

  const startEdit = (it: any) => {
    setEditingId(it.id);
    setEditForm({
      from: it.data.from || "", to: it.data.to || "", date: it.data.date || "",
      km: it.data.km || "", h: it.data.h || "", land: it.data.land || "",
      lat: it.data.lat || "", lon: it.data.lon || "",
    });
  };

  const saveEdit = (id: string) => {
    updateItem(id, editForm);
    setEditingId(null);
  };

  const move = (index: number, direction: -1 | 1) => {
    const otherIndex = index + direction;
    if (otherIndex < 0 || otherIndex >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[otherIndex];
    // Positionen tauschen
    swapPositions(a.id, a.position, b.id, b.position);
  };

  const swapPositions = async (idA: string, posA: number, idB: string, posB: number) => {
    await Promise.all([
      supabaseUpdatePosition(idA, posB),
      supabaseUpdatePosition(idB, posA),
    ]);
    await reload(); // sofort sichtbar, nicht erst auf Realtime warten
  };

  const supabaseUpdatePosition = async (id: string, position: number) => {
    const { supabase } = await import("@/lib/supabaseClient");
    await supabase.from("items").update({ position }).eq("id", id);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={cardStyle}>
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17, marginBottom: 10 }}>Route</div>
        {sorted.length === 0 && <p style={{ fontSize: 13.5, color: "#9A9384" }}>Noch keine Etappen eingetragen.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map((it, index) => {
            const isEditing = editingId === it.id;
            if (isEditing) {
              return (
                <div key={it.id} style={{ padding: "10px", background: STYLE.paperDim, borderRadius: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input placeholder="Von" value={editForm.from} onChange={(e) => setEditForm({ ...editForm, from: e.target.value })} style={inputStyle} />
                    <input placeholder="Nach" value={editForm.to} onChange={(e) => setEditForm({ ...editForm, to: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} style={inputStyle} />
                    <input placeholder="Land" value={editForm.land} onChange={(e) => setEditForm({ ...editForm, land: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input placeholder="≈ km" value={editForm.km} onChange={(e) => setEditForm({ ...editForm, km: e.target.value })} style={inputStyle} />
                    <input placeholder="≈ Std." value={editForm.h} onChange={(e) => setEditForm({ ...editForm, h: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input placeholder="Breitengrad (lat, optional)" value={editForm.lat} onChange={(e) => setEditForm({ ...editForm, lat: e.target.value })} style={inputStyle} />
                    <input placeholder="Längengrad (lon, optional)" value={editForm.lon} onChange={(e) => setEditForm({ ...editForm, lon: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid #E0D9C6", background: "transparent", fontSize: 13 }}>Abbrechen</button>
                    <button onClick={() => saveEdit(it.id)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: STYLE.accent, color: "#fff", fontSize: 13, fontWeight: 600 }}>Speichern</button>
                  </div>
                </div>
              );
            }
            return (
              <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", background: STYLE.paperDim, borderRadius: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                  <button onClick={() => move(index, -1)} disabled={index === 0} style={{ background: "none", border: "none", color: index === 0 ? "#D8D2C4" : "#9A9384", padding: 0 }}><ArrowUp size={14} /></button>
                  <button onClick={() => move(index, 1)} disabled={index === sorted.length - 1} style={{ background: "none", border: "none", color: index === sorted.length - 1 ? "#D8D2C4" : "#9A9384", padding: 0 }}><ArrowDown size={14} /></button>
                </div>
                <a
                  href={mapsDirectionsLink(it.data.from, it.data.to)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "inherit", gap: 8, minWidth: 0 }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    {it.data.land ? guessFlag(it.data.land) : ""} {it.data.from} → {it.data.to} <MapPin size={12} color={STYLE.accent4} />
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: "#6B6558", textAlign: "right", flexShrink: 0 }}>
                    {it.data.date ? `${new Date(it.data.date).toLocaleDateString("de-DE")} · ` : ""}{it.data.km} {it.data.h && `· ${it.data.h}`}
                  </span>
                </a>
                <button onClick={() => startEdit(it)} style={{ background: "none", border: "none", color: "#9A9384", flexShrink: 0 }}><Pencil size={14} /></button>
                <button onClick={() => deleteItem(it.id)} style={{ background: "none", border: "none", color: "#B8AF9C", flexShrink: 0 }}><X size={15} /></button>
              </div>
            );
          })}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 10 }}>Etappe hinzufügen</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Von" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} style={inputStyle} />
            <input placeholder="Nach" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />
            <input placeholder="Land (z. B. Österreich)" value={form.land} onChange={(e) => setForm({ ...form, land: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="≈ km" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} style={inputStyle} />
            <input placeholder="≈ Std." value={form.h} onChange={(e) => setForm({ ...form, h: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Breitengrad (lat, optional – für Karte)" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} style={inputStyle} />
            <input placeholder="Längengrad (lon, optional – für Karte)" value={form.lon} onChange={(e) => setForm({ ...form, lon: e.target.value })} style={inputStyle} />
          </div>
          <p style={{ fontSize: 11.5, color: "#9A9384", margin: 0 }}>
            Mit Datum wird die Etappe automatisch an der richtigen Stelle einsortiert. Mit den Pfeilen ↑↓ links kannst du die Reihenfolge jederzeit von Hand anpassen.
          </p>
          <button onClick={submit} style={{ padding: "10px 0", borderRadius: 9, border: "none", background: STYLE.ink, color: "#fff", fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Plus size={14} /> Etappe speichern
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
  width: "100%",
  fontFamily: "inherit",
  minWidth: 0,
};
