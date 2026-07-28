"use client";

import { useState } from "react";
import { useItems } from "@/lib/useItems";
import { STYLE, cardStyle } from "@/lib/style";
import { getAiSuggestions } from "@/lib/aiSuggestions";
import { calculateDistanceTo } from "@/lib/routing";
import { SECTIONS, guessFlag } from "@/lib/types";
import { MapPin, Star, Heart, Plus, X, Pencil, Sparkles, Loader2, ChevronDown, ChevronUp, Ruler, Home } from "lucide-react";
import Link from "next/link";

function mapsSearchLink(name: string, context: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${context}`)}`;
}

const EMPTY_FORM = { name: "", type: "", group: "", note: "", context: "", rating: "", unterkunftId: "", unterkunftName: "", routeId: "", routeName: "", distance: "" };

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
  const { items: unterkuenfte } = useItems(projectId, SECTIONS.UNTERKUNFT);
  const { items: routeItems } = useItems(projectId, SECTIONS.ROUTE);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => setCollapsed({ ...collapsed, [group]: !collapsed[group] });

  if (loading) return <p style={{ color: "#9A9384", fontSize: 14 }}>Lädt…</p>;

  // Gruppierung: Einträge mit verknüpfter Unterkunft oder Route-Etappe werden nach
  // Land + Ort gruppiert und chronologisch sortiert. Einträge ohne Verknüpfung
  // behalten das freie "group"-Textfeld als Gruppe (unsortiert, danach angehängt).
  const groupKeyOf = (it: any) => {
    if (it.data.unterkunftId) return `acc:${it.data.unterkunftId}`;
    if (it.data.routeId) return `route:${it.data.routeId}`;
    return `grp:${it.data.group || "Allgemein"}`;
  };
  const groupLabelOf = (it: any) => {
    if (it.data.unterkunftId) {
      const acc = unterkuenfte.find((a) => a.id === it.data.unterkunftId);
      if (acc) {
        const country = acc.data.country || "";
        const flag = country ? guessFlag(country) : "";
        return `${flag} ${country || "Unbekanntes Land"} (${acc.data.station})`.trim();
      }
    }
    if (it.data.routeId) {
      const leg = routeItems.find((r) => r.id === it.data.routeId);
      if (leg) {
        const country = leg.data.fromCountry || leg.data.land || "";
        const flag = country ? guessFlag(country) : "";
        return `${flag} ${country || "Unbekanntes Land"} (${leg.data.from})`.trim();
      }
    }
    return it.data.group || "Allgemein";
  };
  const groupSortDateOf = (key: string) => {
    if (key.startsWith("acc:")) {
      const acc = unterkuenfte.find((a) => a.id === key.slice(4));
      return acc?.data.von || null;
    }
    if (key.startsWith("route:")) {
      const leg = routeItems.find((r) => r.id === key.slice(6));
      return leg?.data.date || null;
    }
    return null;
  };

  const groupMeta: Record<string, { label: string; sortDate: string | null }> = {};
  items.forEach((it) => {
    const key = groupKeyOf(it);
    if (!groupMeta[key]) groupMeta[key] = { label: groupLabelOf(it), sortDate: groupSortDateOf(key) };
  });
  const groups = Object.keys(groupMeta).sort((a, b) => {
    const ga = groupMeta[a], gb = groupMeta[b];
    if (ga.sortDate && gb.sortDate) return ga.sortDate.localeCompare(gb.sortDate);
    if (ga.sortDate) return -1;
    if (gb.sortDate) return 1;
    return ga.label.localeCompare(gb.label);
  });

  const startEdit = (it: any) => {
    setEditingId(it.id);
    setEditForm({
      name: it.data.name || "", type: it.data.type || "", group: it.data.group || "",
      note: it.data.note || "", context: it.data.context || "", rating: it.data.rating || "",
      unterkunftId: it.data.unterkunftId || "", unterkunftName: it.data.unterkunftName || "",
      routeId: it.data.routeId || "", routeName: it.data.routeName || "", distance: it.data.distance || "",
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
          accommodations={unterkuenfte}
          routeItems={routeItems}
          onCancel={() => setShowForm(false)}
          onSave={async (data) => { await addItem(data); setShowForm(false); }}
        />
      )}

      {groups.length === 0 && !showForm && (
        <p style={{ fontSize: 14, color: "#9A9384", textAlign: "center" }}>Noch keine Einträge – füg den ersten hinzu!</p>
      )}

      {groups.map((groupKey) => {
        const groupItems = items.filter((it) => groupKeyOf(it) === groupKey);
        const groupLabel2 = groupMeta[groupKey].label;
        const isCollapsed = !!collapsed[groupKey];
        return (
          <div key={groupKey}>
            <button
              onClick={() => toggleGroup(groupKey)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", padding: 0, marginBottom: isCollapsed ? 0 : 10, cursor: "pointer" }}
            >
              <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17 }}>{groupLabel2}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#9A9384" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{groupItems.length}</span>
                {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </span>
            </button>
            {!isCollapsed && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {groupItems.map((it) => {
                if (editingId === it.id) {
                  return (
                    <CardForm
                      key={it.id}
                      form={editForm}
                      groupLabel={groupLabel}
                      extraFieldLabel={extraFieldLabel}
                      accommodations={unterkuenfte}
          routeItems={routeItems}
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
                    {(it.data.unterkunftName || it.data.routeName || it.data.distance) && (
                      <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                        {it.data.unterkunftName && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, padding: "4px 9px", borderRadius: 20, background: "#EFEADC", color: "#6B6558", fontWeight: 600 }}>
                            <Home size={11} /> {it.data.unterkunftName}
                          </span>
                        )}
                        {it.data.routeName && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, padding: "4px 9px", borderRadius: 20, background: "#EFEADC", color: "#6B6558", fontWeight: 600 }}>
                            <MapPin size={11} /> {it.data.routeName}
                          </span>
                        )}
                        {it.data.distance && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, padding: "4px 9px", borderRadius: 20, background: "#EFEADC", color: "#6B6558", fontWeight: 600 }}>
                            <Ruler size={11} /> {it.data.distance}
                          </span>
                        )}
                      </div>
                    )}
                    <a
                      href={mapsSearchLink(it.data.name, it.data.context || it.data.group || "")}
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
            )}
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
  accommodations,
  routeItems,
}: {
  form: typeof EMPTY_FORM;
  onChange?: (f: typeof EMPTY_FORM) => void;
  onSave: (data: Record<string, any>) => void;
  onCancel: () => void;
  groupLabel: string;
  extraFieldLabel: string;
  accommodations: any[];
  routeItems: any[];
}) {
  const [local, setLocal] = useState(form);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState("");
  const set = (next: typeof EMPTY_FORM) => {
    setLocal(next);
    onChange?.(next);
  };

  const selectedAccommodation = accommodations.find((a) => a.id === local.unterkunftId);
  const selectedRoute = routeItems.find((r) => r.id === local.routeId);
  const targetLat = selectedAccommodation?.data.lat || selectedRoute?.data.lat;
  const targetLon = selectedAccommodation?.data.lon || selectedRoute?.data.lon;
  const hasLocation = !!(local.unterkunftId || local.routeId);

  const handleCalculateDistance = async () => {
    if (!targetLat || !targetLon) {
      setCalcError("Für diesen Ort liegen noch keine Koordinaten vor (im jeweiligen Tab berechnen lassen).");
      return;
    }
    const query = local.context.trim() || local.name.trim();
    if (!query) { setCalcError("Bitte erst Name oder Ort/Kontext ausfüllen."); return; }
    setCalculating(true);
    setCalcError("");
    const result = await calculateDistanceTo(query, parseFloat(targetLat), parseFloat(targetLon));
    setCalculating(false);
    if (result.error) { setCalcError(result.error); return; }
    set({ ...local, distance: result.km });
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

        {(accommodations.length > 0 || routeItems.length > 0) && (
          <>
            <select
              value={local.unterkunftId ? `acc:${local.unterkunftId}` : local.routeId ? `route:${local.routeId}` : ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val.startsWith("acc:")) {
                  const acc = accommodations.find((a) => a.id === val.slice(4));
                  set({ ...local, unterkunftId: val.slice(4), unterkunftName: acc?.data.station || "", routeId: "", routeName: "", distance: "" });
                } else if (val.startsWith("route:")) {
                  const leg = routeItems.find((r) => r.id === val.slice(6));
                  set({ ...local, routeId: val.slice(6), routeName: leg?.data.from || "", unterkunftId: "", unterkunftName: "", distance: "" });
                } else {
                  set({ ...local, unterkunftId: "", unterkunftName: "", routeId: "", routeName: "", distance: "" });
                }
              }}
              style={inputStyle}
            >
              <option value="">Zugehöriger Ort (optional)</option>
              {accommodations.length > 0 && (
                <optgroup label="Unterkünfte">
                  {accommodations.map((a) => (
                    <option key={a.id} value={`acc:${a.id}`}>{a.data.station}</option>
                  ))}
                </optgroup>
              )}
              {routeItems.length > 0 && (
                <optgroup label="Etappen aus der Route">
                  {routeItems.map((r) => (
                    <option key={r.id} value={`route:${r.id}`}>{r.data.from}{r.data.to ? ` → ${r.data.to}` : ""}</option>
                  ))}
                </optgroup>
              )}
            </select>
            {hasLocation && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={handleCalculateDistance}
                  disabled={calculating}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 8, border: `1px solid ${STYLE.accent4}`, background: "transparent", color: STYLE.accent4, fontSize: 12.5, fontWeight: 600, opacity: calculating ? 0.6 : 1 }}
                >
                  {calculating ? <Loader2 size={13} className="animate-spin" /> : <Ruler size={13} />}
                  {calculating ? "Berechne…" : "Entfernung berechnen"}
                </button>
                {local.distance && <span style={{ fontSize: 12.5, fontWeight: 600, color: STYLE.accent, flexShrink: 0 }}>{local.distance}</span>}
              </div>
            )}
            {calcError && <p style={{ fontSize: 11.5, color: STYLE.danger, margin: 0 }}>{calcError}</p>}
          </>
        )}

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
