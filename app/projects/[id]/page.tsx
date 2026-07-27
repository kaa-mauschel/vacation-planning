"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/lib/useUser";
import { STYLE, FONTS_IMPORT } from "@/lib/style";
import { useHeaderColor } from "@/lib/theme";
import { SECTIONS } from "@/lib/types";
import { useItems } from "@/lib/useItems";
import type { Project } from "@/lib/types";
import Uebersicht from "@/components/Uebersicht";
import GenericChecklist from "@/components/GenericChecklist";
import GenericCardList from "@/components/GenericCardList";
import RouteTab from "@/components/RouteTab";
import Unterkuenfte from "@/components/Unterkuenfte";
import Kosten from "@/components/Kosten";
import Tagesplanung from "@/components/Tagesplanung";
import Tipps from "@/components/Tipps";
import ShareProject from "@/components/ShareProject";
import {
  ArrowLeft, MapPin, Backpack, ClipboardList, Home, Wallet,
  Utensils, Sparkles, Star, CalendarDays, Lightbulb, Share2, Pencil, X, LayoutGrid,
} from "lucide-react";

const TABS = [
  { id: "uebersicht", label: "Übersicht", icon: LayoutGrid },
  { id: "packliste", label: "Packliste", icon: Backpack },
  { id: "vorabreise", label: "Vor der Abreise", icon: ClipboardList },
  { id: "route", label: "Route", icon: MapPin },
  { id: "unterkuenfte", label: "Unterkünfte", icon: Home },
  { id: "kosten", label: "Kosten", icon: Wallet },
  { id: "essen", label: "Essen & Trinken", icon: Utensils },
  { id: "aktivitaeten", label: "Aktivitäten", icon: Sparkles },
  { id: "mustdo", label: "Must-Dos", icon: Star },
  { id: "tagesplan", label: "Tagesplanung", icon: CalendarDays },
  { id: "tipps", label: "Tipps", icon: Lightbulb },
];

const EMOJIS = ["🧳", "🏔️", "🏖️", "🚐", "🌍", "⛺", "🚢", "🎒", "🚗", "✈️"];

export default function ProjectPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const headerColor = useHeaderColor();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("uebersicht");
  const [showShare, setShowShare] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) router.replace("/login");
  }, [userLoading, user, router]);

  const loadProject = async () => {
    const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
    if (error || !data) {
      router.replace("/projects");
      return;
    }
    setProject(data as Project);
    setLoading(false);
  };

  useEffect(() => {
    if (!projectId) return;
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (loading || !project) {
    return <div style={{ minHeight: "100vh", background: STYLE.paperDim }} />;
  }

  return <ProjectPageInner project={project} tab={tab} setTab={setTab} showShare={showShare} setShowShare={setShowShare} showEdit={showEdit} setShowEdit={setShowEdit} headerColor={headerColor} router={router} loadProject={loadProject} />;
}

function ProjectPageInner({ project, tab, setTab, showShare, setShowShare, showEdit, setShowEdit, headerColor, router, loadProject }: any) {
  const { items: routeItems } = useItems(project.id, SECTIONS.ROUTE);
  const routeContext = routeItems
    .slice()
    .sort((a: any, b: any) => (a.data.date || "").localeCompare(b.data.date || ""))
    .map((it: any) => it.data.to)
    .filter(Boolean)
    .join(" -> ") || [routeItems[0]?.data.from].filter(Boolean).join("");

  return (
    <div style={{ minHeight: "100vh", background: STYLE.paperDim, paddingBottom: 40 }}>
      <style>{FONTS_IMPORT}</style>

      <div style={{ background: headerColor, color: STYLE.headerText, padding: "20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => router.push("/projects")} style={{ background: "none", border: "none", color: STYLE.headerText, display: "flex", alignItems: "center", gap: 6, fontSize: 13, opacity: 0.75 }}>
            <ArrowLeft size={16} /> Meine Urlaube
          </button>
          <button onClick={() => setShowShare(true)} style={{ background: "none", border: "none", color: STYLE.headerText, display: "flex", alignItems: "center", gap: 6, fontSize: 13, opacity: 0.85 }}>
            <Share2 size={16} /> Einladen
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
          <span style={{ fontSize: 26 }}>{project.emoji}</span>
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 24, flex: 1 }}>{project.name}</span>
          <button onClick={() => setShowEdit(true)} style={{ background: "rgba(58,53,48,0.08)", border: "none", borderRadius: 8, padding: 7, display: "flex" }}>
            <Pencil size={15} color={STYLE.headerText} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", overflowX: "auto", gap: 6, padding: "14px 16px", background: STYLE.paper, position: "sticky", top: 0, zIndex: 10, borderBottom: `1px solid ${STYLE.paperDim}` }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                padding: "8px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                background: active ? STYLE.ink : STYLE.paperDim,
                color: active ? STYLE.paper : STYLE.ink,
                fontSize: 13, fontWeight: 600,
              }}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "20px 16px", maxWidth: 720, margin: "0 auto" }}>
        {tab === "uebersicht" && <Uebersicht projectId={project.id} startDate={project.start_date} />}
        {tab === "packliste" && <GenericChecklist projectId={project.id} section={SECTIONS.PACKLISTE} />}
        {tab === "vorabreise" && <GenericChecklist projectId={project.id} section={SECTIONS.VORABREISE} />}
        {tab === "route" && <RouteTab projectId={project.id} />}
        {tab === "unterkuenfte" && <Unterkuenfte projectId={project.id} />}
        {tab === "kosten" && <Kosten projectId={project.id} />}
        {tab === "essen" && (
          <GenericCardList projectId={project.id} section={SECTIONS.ESSEN} groupLabel="Ort/Station" extraFieldLabel="Adresse/Kontext für Maps" aiKind="essen" projectName={project.name} routeContext={routeContext} />
        )}
        {tab === "aktivitaeten" && (
          <GenericCardList projectId={project.id} section={SECTIONS.AKTIVITAET} groupLabel="Ort/Kategorie (z. B. Freibäder)" extraFieldLabel="Adresse/Kontext für Maps" aiKind="aktivitaet" projectName={project.name} routeContext={routeContext} />
        )}
        {tab === "mustdo" && (
          <GenericCardList projectId={project.id} section={SECTIONS.MUSTDO} groupLabel="Region" extraFieldLabel="Adresse/Kontext für Maps" aiKind="mustdo" projectName={project.name} routeContext={routeContext} />
        )}
        {tab === "tagesplan" && <Tagesplanung projectId={project.id} />}
        {tab === "tipps" && <Tipps projectId={project.id} />}
      </div>

      {showShare && <ShareProject inviteCode={project.invite_code} onClose={() => setShowShare(false)} />}
      {showEdit && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEdit(false)}
          onSaved={loadProject}
        />
      )}
    </div>
  );
}

function EditProjectModal({ project, onClose, onSaved }: { project: Project; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(project.name);
  const [emoji, setEmoji] = useState(project.emoji);
  const [startDate, setStartDate] = useState(project.start_date || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    const { error } = await supabase
      .from("projects")
      .update({ name: name.trim(), emoji, start_date: startDate || null })
      .eq("id", project.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(58,53,48,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: STYLE.paper, borderRadius: "20px 20px 0 0", padding: 22, width: "100%", maxWidth: 420, boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 18 }}>Urlaub bearbeiten</span>
          <button onClick={onClose} style={{ background: "none", border: "none" }}><X size={20} color="#9A9384" /></button>
        </div>
        <label style={{ fontSize: 13, fontWeight: 600 }}>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #E0D9C6", fontSize: 14, marginTop: 6, marginBottom: 14 }}
        />
        <label style={{ fontSize: 13, fontWeight: 600 }}>Abfahrtsdatum (für den Countdown)</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #E0D9C6", fontSize: 14, marginTop: 6, marginBottom: 14 }}
        />
        <label style={{ fontSize: 13, fontWeight: 600 }}>Symbol</label>
        <div style={{ display: "flex", gap: 8, marginTop: 8, marginBottom: 18, flexWrap: "wrap" }}>
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              style={{ fontSize: 22, width: 42, height: 42, borderRadius: 10, border: emoji === e ? `2px solid ${STYLE.ink}` : "1px solid #E0D9C6", background: STYLE.paper }}
            >
              {e}
            </button>
          ))}
        </div>
        {error && <div style={{ color: STYLE.danger, fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button
          onClick={save}
          disabled={saving || !name.trim()}
          style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: STYLE.ink, color: STYLE.paper, fontSize: 14.5, fontWeight: 600, opacity: saving || !name.trim() ? 0.6 : 1 }}
        >
          {saving ? "Wird gespeichert…" : "Speichern"}
        </button>
      </div>
    </div>
  );
}
