"use client";

import { useState } from "react";
import { useItems } from "@/lib/useItems";
import { STYLE, cardStyle } from "@/lib/style";
import { Plus, X } from "lucide-react";

export default function Tagesplanung({ projectId }: { projectId: string }) {
  const { items, loading, addItem, updateItem, deleteItem } = useItems(projectId, "tagesplan");
  const [newDate, setNewDate] = useState("");

  if (loading) return <p style={{ color: "#9A9384", fontSize: 14 }}>Lädt…</p>;

  const addDay = () => {
    if (!newDate.trim()) return;
    addItem({ date: newDate.trim(), note: "" }, items.length);
    setNewDate("");
  };

  const sorted = [...items].sort((a, b) => (a.data.date || "").localeCompare(b.data.date || ""));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sorted.map((it) => (
        <div key={it.id} style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13 }}>
              {it.data.date ? new Date(it.data.date).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" }) : ""}
            </span>
            <button onClick={() => deleteItem(it.id)} style={{ background: "none", border: "none", color: "#B8AF9C" }}><X size={15} /></button>
          </div>
          <textarea
            placeholder="Was steht heute an?"
            defaultValue={it.data.note}
            onBlur={(e) => updateItem(it.id, { ...it.data, note: e.target.value })}
            rows={2}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 9, border: "1px solid #E0D9C6", fontSize: 13.5, resize: "vertical", fontFamily: "inherit" }}
          />
        </div>
      ))}

      <div style={{ ...cardStyle, display: "flex", gap: 8 }}>
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          style={{ flex: 1, padding: "9px 11px", borderRadius: 9, border: "1px solid #E0D9C6", fontSize: 13.5, minWidth: 0 }}
        />
        <button onClick={addDay} style={{ padding: "0 16px", borderRadius: 9, border: "none", background: STYLE.ink, color: "#fff", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
          <Plus size={14} /> Tag
        </button>
      </div>
    </div>
  );
}
