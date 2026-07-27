"use client";

import { useState, useEffect, useRef } from "react";
import { useItems } from "@/lib/useItems";
import { STYLE, cardStyle } from "@/lib/style";
import { guessFlag } from "@/lib/types";
import { MapPin, Plus, X, Pencil, GripVertical, Route as RouteIcon, Loader2 } from "lucide-react";
import { calculateLeg } from "@/lib/routing";

function mapsDirectionsLink(from: string, to: string) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=driving`;
}

const EMPTY_FORM = { from: "", fromAddress: "", to: "", toAddress: "", date: "", km: "", h: "", land: "", lat: "", lon: "" };

export default function RouteTab({ projectId }: { projectId: string }) {
  const { items, loading, addItem, updateItem, deleteItem, reload } = useItems(projectId, "route");
  const [form, setForm] = useState(EMPTY_FORM);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const normalizedOnce = useRef(false);

  // Lokale Reihenfolge fürs Drag & Drop (optimistisch, wird beim Loslassen gespeichert)
  const [order, setOrder] = useState<typeof items>([]);
  const dragIndexRef = useRef<number | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (draggingRef.current) return; // während des Ziehens nicht von außen überschreiben
    setOrder(items);
  }, [items]);

  // Einmaliges Reparieren: falls Positionen durcheinander/gleich sind (alte Einträge, die
  // alle Position 0 hatten), nach Datum neu durchnummerieren.
  useEffect(() => {
    if (loading || normalizedOnce.current || items.length < 2) return;
    const positions = items.map((it) => it.position);
    const hasDuplicates = new Set(positions).size !== positions.length;
    normalizedOnce.current = true;
    if (!hasDuplicates) return;
    const byDate = [...items].sort((a, b) => {
      if (a.data.date && b.data.date) return a.data.date.localeCompare(b.data.date);
      if (a.data.date) return -1;
      if (b.data.date) return 1;
      return a.created_at.localeCompare(b.created_at);
    });
    persistOrder(byDate.map((it) => it.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, items.length]);

  const persistOrder = async (orderedIds: string[]) => {
    const { supabase } = await import("@/lib/supabaseClient");
    await Promise.all(orderedIds.map((id, i) => supabase.from("items").update({ position: i }).eq("id", id)));
    await reload();
  };

  if (loading) return <p style={{ color: "#9A9384", fontSize: 14 }}>Lädt…</p>;

  const submit = () => {
    if (!form.from.trim() || !form.to.trim()) return;
    let insertAt = order.length;
    if (form.date) {
      insertAt = order.findIndex((it) => it.data.date && it.data.date > form.date);
      if (insertAt === -1) insertAt = order.length;
    }
    addItem(form, insertAt);
    setForm(EMPTY_FORM);
  };

  const handleCalculate = async () => {
    const fromQuery = form.fromAddress.trim() || form.from.trim();
    const toQuery = form.toAddress.trim() || form.to.trim();
    if (!fromQuery || !toQuery) {
      setCalcError("Bitte erst \"Von\"/\"Nach\" (oder die Adressfelder) ausfüllen.");
      return;
    }
    setCalculating(true);
    setCalcError("");
    const result = await calculateLeg(fromQuery, toQuery);
    setCalculating(false);
    if (result.error) {
      setCalcError(result.error);
      return;
    }
    setForm({ ...form, km: result.km, h: result.h, lat: result.lat, lon: result.lon });
  };

  const startEdit = (it: any) => {
    setEditingId(it.id);
    setEditForm({
      from: it.data.from || "", fromAddress: it.data.fromAddress || "",
      to: it.data.to || "", toAddress: it.data.toAddress || "",
      date: it.data.date || "", km: it.data.km || "", h: it.data.h || "", land: it.data.land || "",
      lat: it.data.lat || "", lon: it.data.lon || "",
    });
  };

  const saveEdit = (id: string) => {
    updateItem(id, editForm);
    setEditingId(null);
  };

  // --- Drag & Drop (Pointer Events, funktioniert mit Maus & Touch) ---

  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    e.preventDefault();
    draggingRef.current = true;
    dragIndexRef.current = index;
    setDraggingId(order[index].id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragIndexRef.current === null) return;
    const currentIndex = dragIndexRef.current;
    const pointerY = e.clientY;

    // Finde die Zeile, über der sich der Finger/Cursor gerade befindet
    let targetIndex = currentIndex;
    for (let i = 0; i < order.length; i++) {
      const el = rowRefs.current[order[i].id];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (pointerY < mid) {
        targetIndex = i;
        break;
      }
      targetIndex = i + 1;
    }
    targetIndex = Math.max(0, Math.min(order.length - 1, targetIndex));

    if (targetIndex !== currentIndex) {
      const next = [...order];
      const [moved] = next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, moved);
      setOrder(next);
      dragIndexRef.current = targetIndex;
    }
  };

  const handlePointerUp = () => {
    if (dragIndexRef.current === null) return;
    dragIndexRef.current = null;
    setDraggingId(null);
    draggingRef.current = false;
    persistOrder(order.map((it) => it.id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={cardStyle}>
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17, marginBottom: 10 }}>Route</div>
        {order.length === 0 && <p style={{ fontSize: 13.5, color: "#9A9384" }}>Noch keine Etappen eingetragen.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {order.map((it, index) => {
            const isEditing = editingId === it.id;
            if (isEditing) {
              return (
                <div key={it.id} style={{ padding: "10px", background: STYLE.paperDim, borderRadius: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input placeholder="Von" value={editForm.from} onChange={(e) => setEditForm({ ...editForm, from: e.target.value })} style={inputStyle} />
                    <input placeholder="Nach" value={editForm.to} onChange={(e) => setEditForm({ ...editForm, to: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input placeholder="Von-Adresse (optional, genauer)" value={editForm.fromAddress} onChange={(e) => setEditForm({ ...editForm, fromAddress: e.target.value })} style={{ ...inputStyle, fontSize: 12.5 }} />
                    <input placeholder="Nach-Adresse (optional, genauer)" value={editForm.toAddress} onChange={(e) => setEditForm({ ...editForm, toAddress: e.target.value })} style={{ ...inputStyle, fontSize: 12.5 }} />
                  </div>
                  <button
                    onClick={async () => {
                      const fromQuery = editForm.fromAddress.trim() || editForm.from.trim();
                      const toQuery = editForm.toAddress.trim() || editForm.to.trim();
                      if (!fromQuery || !toQuery) { setCalcError("Bitte erst \"Von\"/\"Nach\" (oder die Adressfelder) ausfüllen."); return; }
                      setCalculating(true);
                      setCalcError("");
                      const result = await calculateLeg(fromQuery, toQuery);
                      setCalculating(false);
                      if (result.error) { setCalcError(result.error); return; }
                      setEditForm({ ...editForm, km: result.km, h: result.h, lat: result.lat, lon: result.lon });
                    }}
                    disabled={calculating}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, border: `1px solid ${STYLE.accent4}`, background: "transparent", color: STYLE.accent4, fontSize: 12.5, fontWeight: 600, opacity: calculating ? 0.6 : 1 }}
                  >
                    {calculating ? <Loader2 size={13} className="animate-spin" /> : <RouteIcon size={13} />}
                    {calculating ? "Berechne…" : "km, Fahrzeit & Koordinaten berechnen"}
                  </button>
                  {calcError && <p style={{ fontSize: 11.5, color: STYLE.danger, margin: 0 }}>{calcError}</p>}
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} style={inputStyle} />
                    <input placeholder="Land" value={editForm.land} onChange={(e) => setEditForm({ ...editForm, land: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input placeholder="≈ km" value={editForm.km} onChange={(e) => setEditForm({ ...editForm, km: e.target.value })} style={inputStyle} />
                    <input placeholder="≈ Std." value={editForm.h} onChange={(e) => setEditForm({ ...editForm, h: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input placeholder="Breitengrad (lat)" value={editForm.lat} onChange={(e) => setEditForm({ ...editForm, lat: e.target.value })} style={inputStyle} />
                    <input placeholder="Längengrad (lon)" value={editForm.lon} onChange={(e) => setEditForm({ ...editForm, lon: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid #E0D9C6", background: "transparent", fontSize: 13 }}>Abbrechen</button>
                    <button onClick={() => saveEdit(it.id)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: STYLE.accent, color: "#fff", fontSize: 13, fontWeight: 600 }}>Speichern</button>
                  </div>
                </div>
              );
            }
            const isDragging = draggingId === it.id;
            return (
              <div
                key={it.id}
                ref={(el) => { rowRefs.current[it.id] = el; }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "8px 10px",
                  background: isDragging ? "#EFE6D8" : STYLE.paperDim, borderRadius: 10,
                  boxShadow: isDragging ? "0 4px 14px rgba(58,53,48,0.18)" : "none",
                  transform: isDragging ? "scale(1.02)" : "none",
                  transition: isDragging ? "none" : "background 0.15s",
                  touchAction: "none",
                }}
              >
                <div
                  onPointerDown={(e) => handlePointerDown(e, index)}
                  style={{ cursor: "grab", color: "#B0A996", flexShrink: 0, padding: "6px 2px", touchAction: "none" }}
                >
                  <GripVertical size={16} />
                </div>
                <a
                  href={mapsDirectionsLink(it.data.fromAddress || it.data.from, it.data.toAddress || it.data.to)}
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
        {order.length > 1 && (
          <p style={{ fontSize: 11.5, color: "#9A9384", marginTop: 10 }}>
            Am Griff-Symbol (⋮⋮) links ziehen, um die Reihenfolge zu ändern.
          </p>
        )}
      </div>

      <div style={cardStyle}>
        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 10 }}>Etappe hinzufügen</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Von (Ort, z. B. Berlin)" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} style={inputStyle} />
            <input placeholder="Nach (Ort)" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Von-Adresse (optional, genauer)" value={form.fromAddress} onChange={(e) => setForm({ ...form, fromAddress: e.target.value })} style={{ ...inputStyle, fontSize: 12.5 }} />
            <input placeholder="Nach-Adresse (optional, genauer)" value={form.toAddress} onChange={(e) => setForm({ ...form, toAddress: e.target.value })} style={{ ...inputStyle, fontSize: 12.5 }} />
          </div>
          <button
            onClick={handleCalculate}
            disabled={calculating}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 9, border: `1px solid ${STYLE.accent4}`, background: "transparent", color: STYLE.accent4, fontSize: 13, fontWeight: 600, opacity: calculating ? 0.6 : 1 }}
          >
            {calculating ? <Loader2 size={14} className="animate-spin" /> : <RouteIcon size={14} />}
            {calculating ? "Berechne…" : "km, Fahrzeit & Koordinaten automatisch berechnen"}
          </button>
          {calcError && <p style={{ fontSize: 12, color: STYLE.danger, margin: 0 }}>{calcError}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} />
            <input placeholder="Land (z. B. Österreich)" value={form.land} onChange={(e) => setForm({ ...form, land: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="≈ km" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} style={inputStyle} />
            <input placeholder="≈ Std." value={form.h} onChange={(e) => setForm({ ...form, h: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Breitengrad (lat)" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} style={inputStyle} />
            <input placeholder="Längengrad (lon)" value={form.lon} onChange={(e) => setForm({ ...form, lon: e.target.value })} style={inputStyle} />
          </div>
          <p style={{ fontSize: 11.5, color: "#9A9384", margin: 0 }}>
            "Von"/"Nach" ist der Name, der überall angezeigt wird (kurz halten). Die Adressfelder sind nur für die
            genaue Berechnung & den Google-Maps-Link – wenn leer, wird stattdessen "Von"/"Nach" verwendet.
            Mit Datum wird die Etappe automatisch an der richtigen Stelle einsortiert.
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
