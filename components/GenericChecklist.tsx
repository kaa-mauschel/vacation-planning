"use client";

import { useState } from "react";
import { useItems } from "@/lib/useItems";
import { STYLE, cardStyle } from "@/lib/style";
import { SECTIONS, PERSON_COLORS, PERSON_EMOJIS } from "@/lib/types";
import { personStyle as fallbackStyle } from "@/lib/personStyle";
import { Check, Plus, Pencil, X, ChevronDown, ChevronUp, Palette } from "lucide-react";

const ALLGEMEIN = "Allgemein";

export default function GenericChecklist({ projectId, section }: { projectId: string; section: string }) {
  const { items, loading, addItem, updateItem, deleteItem } = useItems(projectId, section);
  const { items: personPrefs, addItem: addPersonPref, updateItem: updatePersonPref } = useItems(projectId, SECTIONS.PERSON);
  const [newCategory, setNewCategory] = useState("");
  const [newOwner, setNewOwner] = useState(ALLGEMEIN);
  const [customOwner, setCustomOwner] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingCatText, setEditingCatText] = useState("");
  const [collapsedOwners, setCollapsedOwners] = useState<Record<string, boolean>>({});
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  if (loading) return <p style={{ color: "#9A9384", fontSize: 14 }}>Lädt…</p>;

  const owners = Array.from(new Set(items.map((it) => it.data.owner || ALLGEMEIN)));
  if (!owners.includes(ALLGEMEIN)) owners.unshift(ALLGEMEIN);
  owners.sort((a, b) => (a === ALLGEMEIN ? -1 : b === ALLGEMEIN ? 1 : a.localeCompare(b)));
  const existingOwners = Array.from(new Set(items.map((it) => it.data.owner || ALLGEMEIN))).filter((o) => o !== ALLGEMEIN);

  // Frei wählbare Farbe/Emoji je Person, in der Datenbank gespeichert (für alle Mitreisenden
  // gleich sichtbar). Falls noch nichts gewählt wurde: automatische Rückfalloption.
  const personStyle = (name: string) => {
    const pref = personPrefs.find((p) => p.data.name === name);
    if (pref) return { color: pref.data.color, emoji: pref.data.emoji };
    return fallbackStyle(name);
  };
  const savePersonStyle = (name: string, color: string, emoji: string) => {
    const existing = personPrefs.find((p) => p.data.name === name);
    if (existing) updatePersonPref(existing.id, { name, color, emoji });
    else addPersonPref({ name, color, emoji });
  };

  const total = items.length;
  const done = items.filter((it) => it.data.checked).length;

  const submitDraft = (owner: string, cat: string) => {
    const key = `${owner}|${cat}`;
    const text = (drafts[key] || "").trim();
    if (!text) return;
    addItem({ category: cat, text, checked: false, owner });
    setDrafts({ ...drafts, [key]: "" });
  };

  const addCategory = () => {
    const cat = newCategory.trim();
    if (!cat) return;
    const owner = newOwner === "__custom__" ? customOwner.trim() : newOwner;
    if (!owner) return;
    addItem({ category: cat, text: "Erster Punkt…", checked: false, owner });
    setNewCategory("");
    setCustomOwner("");
  };

  const renameCategory = async (owner: string, oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) { setEditingCat(null); return; }
    const catItems = items.filter((it) => (it.data.category || "Sonstiges") === oldName && (it.data.owner || ALLGEMEIN) === owner);
    await Promise.all(catItems.map((it) => updateItem(it.id, { ...it.data, category: trimmed })));
    setEditingCat(null);
  };

  const deleteCategory = async (owner: string, cat: string) => {
    const catItems = items.filter((it) => (it.data.category || "Sonstiges") === cat && (it.data.owner || ALLGEMEIN) === owner);
    await Promise.all(catItems.map((it) => deleteItem(it.id)));
  };

  const PersonPicker = ({ name }: { name: string }) => {
    const current = personStyle(name);
    return (
      <div style={{ background: STYLE.paper, borderRadius: 10, padding: 12, marginTop: 10, border: "1px solid #E0D9C6" }}>
        <div style={{ fontSize: 11.5, color: "#9A9384", marginBottom: 6 }}>Farbe</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {PERSON_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => savePersonStyle(name, c, current.emoji)}
              style={{ width: 30, height: 30, borderRadius: "50%", background: c, border: current.color === c ? "3px solid #3A3530" : "1px solid rgba(0,0,0,0.1)" }}
            />
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: "#9A9384", marginBottom: 6 }}>Emoji</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {PERSON_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => savePersonStyle(name, current.color, e)}
              style={{ width: 32, height: 32, borderRadius: 8, fontSize: 16, background: current.emoji === e ? "#E4EFE7" : "#fff", border: current.emoji === e ? `2px solid ${STYLE.accent}` : "1px solid #E0D9C6" }}
            >
              {e}
            </button>
          ))}
        </div>
        <button onClick={() => setPickerFor(null)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #E0D9C6", background: "transparent", fontSize: 12.5 }}>Fertig</button>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 17 }}>Fortschritt</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: STYLE.accent }}>{done}/{total}</span>
        </div>
        <div style={{ height: 6, background: STYLE.paperDim, borderRadius: 4, marginTop: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${total ? (done / total) * 100 : 0}%`, background: STYLE.accent, transition: "width 0.3s" }} />
        </div>
      </div>

      {owners.map((owner) => {
        const ownerItems = items.filter((it) => (it.data.owner || ALLGEMEIN) === owner);
        if (owner !== ALLGEMEIN && ownerItems.length === 0) return null;
        const categories = Array.from(new Set(ownerItems.map((it) => it.data.category || "Sonstiges")));
        const ownerCollapsed = !!collapsedOwners[owner];
        const ownerDone = ownerItems.filter((it) => it.data.checked).length;
        const style = personStyle(owner);

        return (
          <div key={owner} style={{ ...cardStyle, background: owner === ALLGEMEIN ? STYLE.paper : "#F3F0E5", borderLeft: owner !== ALLGEMEIN ? `4px solid ${style.color}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button
                onClick={() => setCollapsedOwners({ ...collapsedOwners, [owner]: !ownerCollapsed })}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1, background: "none", border: "none", padding: 0, cursor: "pointer" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 16.5, color: owner !== ALLGEMEIN ? style.color : STYLE.ink }}>
                  <span>{style.emoji}</span> {owner}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#9A9384", marginLeft: 10 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{ownerDone}/{ownerItems.length}</span>
                  {ownerCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                </span>
              </button>
              {owner !== ALLGEMEIN && (
                <button onClick={() => setPickerFor(pickerFor === owner ? null : owner)} style={{ background: "none", border: "none", color: "#9A9384", marginLeft: 8 }}>
                  <Palette size={15} />
                </button>
              )}
            </div>

            {pickerFor === owner && <PersonPicker name={owner} />}

            {!ownerCollapsed && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                {categories.map((cat) => {
                  const catItems = ownerItems.filter((it) => (it.data.category || "Sonstiges") === cat);
                  const isEditingCat = editingCat === `${owner}|${cat}`;
                  const draftKey = `${owner}|${cat}`;
                  return (
                    <div key={cat} style={{ background: STYLE.paperDim, borderRadius: 12, padding: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        {isEditingCat ? (
                          <input
                            autoFocus
                            value={editingCatText}
                            onChange={(e) => setEditingCatText(e.target.value)}
                            onBlur={() => renameCategory(owner, cat, editingCatText)}
                            onKeyDown={(e) => { if (e.key === "Enter") renameCategory(owner, cat, editingCatText); if (e.key === "Escape") setEditingCat(null); }}
                            style={{ flex: 1, minWidth: 0, padding: "5px 8px", borderRadius: 7, border: `1px solid ${STYLE.accent}`, fontSize: 14, fontWeight: 700 }}
                          />
                        ) : (
                          <div style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{cat}</div>
                        )}
                        <button onClick={() => { setEditingCat(`${owner}|${cat}`); setEditingCatText(cat); }} style={{ background: "none", border: "none", color: "#9A9384" }}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => deleteCategory(owner, cat)} style={{ background: "none", border: "none", color: "#B8AF9C" }}>
                          <X size={15} />
                        </button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {catItems.map((it) => {
                          const checked = !!it.data.checked;
                          const isEditing = editingId === it.id;
                          return (
                            <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 4px" }}>
                              <div
                                onClick={() => updateItem(it.id, { ...it.data, checked: !checked })}
                                style={{
                                  width: 20, height: 20, borderRadius: 6, flexShrink: 0, cursor: "pointer",
                                  border: `2px solid ${checked ? STYLE.accent : "#C9C2B0"}`,
                                  background: checked ? STYLE.accent : "transparent",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                              >
                                {checked && <Check size={13} color="#fff" strokeWidth={3} />}
                              </div>
                              {isEditing ? (
                                <input
                                  autoFocus
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  onBlur={() => { updateItem(it.id, { ...it.data, text: editingText }); setEditingId(null); }}
                                  onKeyDown={(e) => { if (e.key === "Enter") { updateItem(it.id, { ...it.data, text: editingText }); setEditingId(null); } }}
                                  style={{ flex: 1, minWidth: 0, padding: "5px 8px", borderRadius: 7, border: `1px solid ${STYLE.accent}`, fontSize: 14 }}
                                />
                              ) : (
                                <span
                                  onClick={() => { setEditingId(it.id); setEditingText(it.data.text); }}
                                  style={{ flex: 1, minWidth: 0, fontSize: 14, cursor: "text", color: checked ? "#9A9384" : STYLE.ink, textDecoration: checked ? "line-through" : "none" }}
                                >
                                  {it.data.text}
                                </span>
                              )}
                              <button onClick={() => deleteItem(it.id)} style={{ width: 22, height: 22, borderRadius: "50%", border: "none", background: "transparent", color: "#B8AF9C", fontSize: 15, fontWeight: 700 }}>×</button>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <input
                          type="text"
                          placeholder="Punkt hinzufügen…"
                          value={drafts[draftKey] || ""}
                          onChange={(e) => setDrafts({ ...drafts, [draftKey]: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") submitDraft(owner, cat); }}
                          style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: "1px solid #E0D9C6", fontSize: 13, minWidth: 0, background: "#fff" }}
                        />
                        <button onClick={() => submitDraft(owner, cat)} style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: STYLE.accent, color: "#fff", fontSize: 13, fontWeight: 600 }}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div style={cardStyle}>
        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 10 }}>Neue Kategorie</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <div style={{ fontSize: 11.5, color: "#9A9384", marginBottom: 5 }}>Für wen?</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setNewOwner(ALLGEMEIN)}
                style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12.5, fontWeight: 600, border: newOwner === ALLGEMEIN ? `1.5px solid ${STYLE.accent}` : "1px solid #E0D9C6", background: newOwner === ALLGEMEIN ? "#E4EFE7" : "#fff" }}
              >
                Allgemein
              </button>
              {existingOwners.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setNewOwner(o)}
                  style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12.5, fontWeight: 600, border: newOwner === o ? `1.5px solid ${personStyle(o).color}` : "1px solid #E0D9C6", background: newOwner === o ? "#E4EFE7" : "#fff" }}
                >
                  {personStyle(o).emoji} {o}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setNewOwner("__custom__")}
                style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12.5, fontWeight: 600, border: newOwner === "__custom__" ? `1.5px solid ${STYLE.accent}` : "1px solid #E0D9C6", background: newOwner === "__custom__" ? "#E4EFE7" : "#fff" }}
              >
                + Neue Person
              </button>
            </div>
            {newOwner === "__custom__" && (
              <input
                placeholder="Name eingeben"
                value={customOwner}
                onChange={(e) => setCustomOwner(e.target.value)}
                style={{ marginTop: 8, padding: "8px 11px", borderRadius: 9, border: "1px solid #E0D9C6", fontSize: 13.5, width: "100%" }}
              />
            )}
          </div>
          <input
            type="text"
            placeholder="Name der Kategorie, z. B. Elektronik…"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }}
            style={{ padding: "8px 11px", borderRadius: 9, border: "1px solid #E0D9C6", fontSize: 13.5 }}
          />
          <button onClick={addCategory} style={{ padding: "10px 0", borderRadius: 9, border: "none", background: STYLE.ink, color: "#fff", fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Plus size={14} /> Kategorie anlegen
          </button>
        </div>
      </div>
    </div>
  );
}
