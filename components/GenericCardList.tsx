"use client";

import { useState } from "react";
import { useItems } from "@/lib/useItems";
import { STYLE, cardStyle } from "@/lib/style";
import { getAiSuggestions } from "@/lib/aiSuggestions";
import { getStoredApiKey } from "@/lib/theme";
import { MapPin, Star, Heart, Plus, X, Pencil, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";

function mapsSearchLink(name: string, context: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${context}`)}`;
}

const EMPTY_FORM = { name: "", type: "", group: "", note: "", context: "", rating: "" };

export default function GenericCardList({
  projectId,
  section,
  groupLabel = "Gruppe",
  extraFieldLabel = "Ort/Kontext",
  aiKind,
  projectName = "",
  routeContext = "",
}: {
  projectId: string;
  section: string;
  groupLabel?: string;
  extraFieldLabel?: string;
  aiKind?: "essen" | "aktivitaet" | "mustdo";
  projectName?: string;
  routeContext?: string;
}) {
  const { items, loading, addItem, updateItem, deleteItem } = useItems(projectId, section);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  if (loading) return <p style={{ color: "#9A9384", fontSize: 14 }}>Lädt…</p>;


  const groups = Array.from(new Set(items.map((it) => it.data.group || "Allgemein")));

  const startEdit = (it: any) => {
    setEditingId(it.id);
    setEditForm({
      name: it.data.name || "", type: it.data.type || "", group: it.data.group || "",
      note: it.data.note || "", context: it.data.context || "", rating: it.data.rating || "",
    });
  };

  const saveEdit = (it: any) => {
    updateItem(it.id, { ...it.data, ...editForm });
    setEditingId(null);
  };

  const handleAiSuggest = async () => {
    if (!aiKind) return;
    setAiLoading(true);
    setAiError("");
    const { suggestions, error } = await getAiSuggestions({ projectName, routeContext, kind: aiKind });
    setAiLoading(false);
    if (error) {
      setAiError(error);
      return;
    }
    for (const s of suggestions) {
      await addItem({ name: s.name, type: s.type, group: s.group, context: s.context, note: s.note, rating: s.rating || "" });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => setShowForm(true)}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", borderRadius: 12, border: `1px dashed #C9C2B0`, background: "transparent", color: STYLE.ink, fontSize: 14, fontWeight: 600 }}
        >
          <Plus size={16} /> Eintrag hinzufügen
        </button>
        {aiKind && (
          <button
            onClick={handleAiSuggest}
            disabled={aiLoading}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", borderRadius: 12, border: "none", background: STYLE.accent3, color: "#fff", fontSize: 14, fontWeight: 600, opacity: aiLoading ? 0.7 : 1 }}
          >
            {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {aiLoading ? "Lädt…" : "KI-Vorschläge"}
          </button>
        )}
      </div>

      {aiError && (
        <div style={{ fontSize: 12.5, color: STYLE.danger, background: "#FBEAEA", borderRadius: 8, padding: "8px 10px" }}>
          {aiError} {aiError.includes("Einstellungen") && <Link href="/settings" style={{ color: STYLE.accent4, fontWeight: 600 }}>Zu den Einstellungen</Link>}
        </div>
      )}


      {showForm && (
        <CardForm
          form={EMPTY_FORM}
          groupLabel={groupLabel}
          extraFieldLabel={extraFieldLabel}
          onCancel={() => setShowForm(false)}
          onSave={async (data) => { await addItem(data); setShowForm(false); }}
        />
      )}

      {groups.length === 0 && !showForm && (
        <p style={{ fontSize: 14, color: "#9A9384", textAlign: "center" }}>Noch keine Einträge – füg den ersten hinzu!</p>
      )}

      {groups.map((group) => {
        const groupItems = items.filter((it) => (it.data.group || "Allgemein") === group);
        return (
          <div key={group}>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17, marginBottom: 10 }}>{group}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {groupItems.map((it) => {
                if (editingId === it.id) {
                  return (
                    <CardForm
                      key={it.id}
                      form={editForm}
                      groupLabel={groupLabel}
                      extraFieldLabel={extraFieldLabel}
                      onChange={setEditForm}
                      onCancel={() => setEditingId(null)}
                      onSave={() => saveEdit(it)}
                    />
                  );
                }
                return (
                  <div key={it.id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{it.data.name}</div>
                        {it.data.type && <div style={{ fontSize: 12, color: "#9A9384", marginTop: 1 }}>{it.data.type}</div>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        {it.data.rating ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <Star size={13} fill={STYLE.accent} color={STYLE.accent} />
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600 }}>{it.data.rating}</span>
                          </div>
                        ) : null}
                        <button onClick={() => updateItem(it.id, { ...it.data, favorite: !it.data.favorite })} style={{ background: "none", border: "none" }}>
                          <Heart size={17} fill={it.data.favorite ? STYLE.danger : "none"} color={it.data.favorite ? STYLE.danger : "#C9C2B0"} />
                        </button>
                        <button onClick={() => startEdit(it)} style={{ background: "none", border: "none", color: "#9A9384" }}>
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => deleteItem(it.id)} style={{ background: "none", border: "none", color: "#C9C2B0" }}>
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                    {it.data.note && <p style={{ fontSize: 13.5, color: "#4A453C", lineHeight: 1.55, margin: "8px 0 0" }}>{it.data.note}</p>}
                    <a
                      href={mapsSearchLink(it.data.name, it.data.context || group)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 9, fontSize: 12.5, fontWeight: 600, color: STYLE.accent, textDecoration: "none" }}
                    >
                      <MapPin size={13} /> In Google Maps öffnen
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CardForm({
  form,
  onChange,
  onSave,
  onCancel,
  groupLabel,
  extraFieldLabel,
}: {
  form: typeof EMPTY_FORM;
  onChange?: (f: typeof EMPTY_FORM) => void;
  onSave: (data: Record<string, any>) => void;
  onCancel: () => void;
  groupLabel: string;
  extraFieldLabel: string;
}) {
  const [local, setLocal] = useState(form);
  const set = (next: typeof EMPTY_FORM) => {
    setLocal(next);
    onChange?.(next);
  };

  return (
    <div style={{ ...cardStyle, border: `1px solid ${STYLE.accent}55` }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input placeholder="Name" value={local.name} onChange={(e) => set({ ...local, name: e.target.value })} style={inputStyle} />
        <input placeholder="Art (z. B. Restaurant, Café…)" value={local.type} onChange={(e) => set({ ...local, type: e.target.value })} style={inputStyle} />
        <input placeholder={groupLabel} value={local.group} onChange={(e) => set({ ...local, group: e.target.value })} style={inputStyle} />
        <input placeholder={extraFieldLabel} value={local.context} onChange={(e) => set({ ...local, context: e.target.value })} style={inputStyle} />
        <input placeholder="Bewertung (z. B. 4.8, optional)" value={local.rating} onChange={(e) => set({ ...local, rating: e.target.value })} style={inputStyle} />
        <textarea placeholder="Notiz (optional)" value={local.note} onChange={(e) => set({ ...local, note: e.target.value })} rows={2} style={inputStyle} />
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "1px solid #E0D9C6", background: "transparent", fontSize: 13.5 }}>Abbrechen</button>
          <button
            onClick={() => local.name.trim() && onSave(local)}
            style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "none", background: STYLE.ink, color: "#fff", fontSize: 13.5, fontWeight: 600 }}
          >
            Speichern
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
};
