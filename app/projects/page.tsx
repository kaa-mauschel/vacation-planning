"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/lib/useUser";
import { STYLE, FONTS_IMPORT, cardStyle } from "@/lib/style";
import { useHeaderColor } from "@/lib/theme";
import type { Project } from "@/lib/types";
import { Plus, LogOut, Users, X, Luggage, Settings, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";

const EMOJIS = ["🧳", "🏔️", "🏖️", "🚐", "🌍", "⛺", "🚢", "🎒", "🚗", "✈️"];

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24));
}

function getStatus(start: string | null, end: string | null): { label: string; bg: string; color: string } {
  const today = new Date().toISOString().slice(0, 10);
  if (!start && !end) return { label: "Kein Termin", bg: "#EFEADC", color: "#9A9384" };
  if (start && today < start) return { label: "Bevorstehend", bg: "#E4EFE7", color: STYLE.accent };
  if (end && today > end) return { label: "Vorbei", bg: "#EFEADC", color: "#9A9384" };
  if (start && (!end || today <= end)) return { label: "Läuft gerade", bg: "#F7E7CE", color: "#8A5A1E" };
  return { label: "Kein Termin", bg: "#EFEADC", color: "#9A9384" };
}

export default function ProjectsPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const headerColor = useHeaderColor();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const loadProjects = async () => {
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    const list = (data as Project[]) || [];
    list.sort((a, b) => {
      if (a.start_date && b.start_date) return a.start_date.localeCompare(b.start_date);
      if (a.start_date) return -1;
      if (b.start_date) return 1;
      return b.created_at.localeCompare(a.created_at);
    });
    setProjects(list);
    setLoadingProjects(false);
  };

  useEffect(() => {
    if (user) loadProjects();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading || !user) {
    return <div style={{ minHeight: "100vh", background: STYLE.paperDim }} />;
  }

  const isPast = (p: Project) => getStatus(p.start_date, p.end_date).label === "Vorbei";
  const upcoming = projects.filter((p) => !isPast(p));
  const past = projects.filter(isPast);
  const nextTrip = upcoming.find((p) => p.start_date && getStatus(p.start_date, p.end_date).label !== "Läuft gerade");

  return (
    <div style={{ minHeight: "100vh", background: STYLE.paperDim }}>
      <style>{FONTS_IMPORT}</style>

      <div style={{ background: headerColor, color: STYLE.headerText, padding: "24px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Luggage size={22} />
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 22 }}>Urlaubsplaner</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => router.push("/settings")} style={{ background: "none", border: "none", color: STYLE.headerText, opacity: 0.75, display: "flex", alignItems: "center" }}>
              <Settings size={17} />
            </button>
            <button onClick={handleLogout} style={{ background: "none", border: "none", color: STYLE.headerText, opacity: 0.7, display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
              <LogOut size={15} /> Abmelden
            </button>
          </div>
        </div>
        <p style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>{user.email}</p>
      </div>

      <div style={{ padding: "20px 16px", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => setShowNew(true)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 0", borderRadius: 12, border: "none", background: STYLE.ink, color: STYLE.paper, fontSize: 14, fontWeight: 600 }}
          >
            <Plus size={16} /> Neuer Urlaub
          </button>
          <button
            onClick={() => setShowJoin(true)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 0", borderRadius: 12, border: `1px solid ${STYLE.ink}`, background: "transparent", color: STYLE.ink, fontSize: 14, fontWeight: 600 }}
          >
            <Users size={16} /> Beitreten
          </button>
        </div>

        {loadingProjects ? (
          <p style={{ color: "#9A9384", fontSize: 14 }}>Lädt…</p>
        ) : projects.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: 30 }}>
            <p style={{ fontSize: 14, color: "#6B6558" }}>Noch keine Urlaube angelegt. Leg deinen ersten mit "Neuer Urlaub" an!</p>
          </div>
        ) : (
          <>
            {upcoming.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: "center", padding: 24 }}>
                <p style={{ fontSize: 14, color: "#6B6558" }}>Keine bevorstehenden Urlaube.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {upcoming.map((p) => (
                  <ProjectCard key={p.id} project={p} highlighted={p.id === nextTrip?.id} onClick={() => router.push(`/projects/${p.id}`)} />
                ))}
              </div>
            )}

            {past.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <button
                  onClick={() => setShowPast(!showPast)}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#9A9384", fontSize: 13, fontWeight: 600, padding: "6px 0" }}
                >
                  {showPast ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  Vergangene Urlaube ({past.length})
                </button>
                {showPast && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                    {past.map((p) => (
                      <ProjectCard key={p.id} project={p} onClick={() => router.push(`/projects/${p.id}`)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} onCreated={loadProjects} userId={user.id} />}
      {showJoin && <JoinProjectModal onClose={() => setShowJoin(false)} onJoined={loadProjects} />}
    </div>
  );
}

function daysUntilLabel(start: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(start + "T00:00:00");
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Heute!";
  if (diffDays === 1) return "Morgen!";
  if (diffDays > 1) return `in ${diffDays} Tagen`;
  return "";
}

function ProjectCard({ project: p, onClick, highlighted }: { project: Project; onClick: () => void; highlighted?: boolean }) {
  const status = getStatus(p.start_date, p.end_date);
  const dur = p.start_date && p.end_date ? daysBetween(p.start_date, p.end_date) : null;
  const countdown = status.label === "Bevorstehend" && p.start_date ? daysUntilLabel(p.start_date) : null;
  return (
    <button
      onClick={onClick}
      style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 14, textAlign: "left", border: highlighted ? `1.5px solid ${STYLE.accent}` : "none", width: "100%", opacity: status.label === "Vorbei" ? 0.75 : 1 }}
    >
      <div style={{ fontSize: 28, flexShrink: 0 }}>{p.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 700, fontSize: 15.5 }}>{p.name}</div>
          <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: status.bg, color: status.color, flexShrink: 0 }}>
            {status.label}
          </span>
          {countdown && (
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: STYLE.headerBg, color: STYLE.headerText, flexShrink: 0 }}>
              {countdown}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: "#9A9384", marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
          <CalendarDays size={12} />
          {p.start_date && p.end_date ? (
            <span>{fmtDate(p.start_date)} – {fmtDate(p.end_date)} · {dur} {dur === 1 ? "Tag" : "Tage"}</span>
          ) : p.start_date ? (
            <span>ab {fmtDate(p.start_date)}</span>
          ) : (
            <span>Angelegt am {new Date(p.created_at).toLocaleDateString("de-DE")}</span>
          )}
        </div>
      </div>
    </button>
  );
}

function NewProjectModal({ onClose, onCreated, userId }: { onClose: () => void; onCreated: () => void; userId: string }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError("");

    const { error: insertError } = await supabase
      .from("projects")
      .insert({ name: name.trim(), emoji, created_by: userId, start_date: startDate || null, end_date: endDate || null });

    if (insertError) {
      setSaving(false);
      setError(`Fehler beim Speichern: ${insertError.message}`);
      return;
    }

    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <ModalShell onClose={onClose} title="Neuer Urlaub">
      <label style={{ fontSize: 13, fontWeight: 600 }}>Name</label>
      <input
        autoFocus
        type="text"
        placeholder="z. B. Sommerurlaub 2027"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #E0D9C6", fontSize: 14, marginTop: 6, marginBottom: 14 }}
      />
      <label style={{ fontSize: 13, fontWeight: 600 }}>Zeitraum (optional, für Countdown & Übersicht)</label>
      <div style={{ display: "flex", gap: 8, marginTop: 6, marginBottom: 14 }}>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #E0D9C6", fontSize: 14, minWidth: 0 }}
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #E0D9C6", fontSize: 14, minWidth: 0 }}
        />
      </div>
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
      {error && <div style={{ color: STYLE.danger, fontSize: 12.5, marginBottom: 12, whiteSpace: "pre-line", background: "#FBEAEA", borderRadius: 8, padding: "8px 10px" }}>{error}</div>}
      <button
        onClick={handleCreate}
        disabled={saving || !name.trim()}
        style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: STYLE.ink, color: STYLE.paper, fontSize: 14.5, fontWeight: 600, opacity: saving || !name.trim() ? 0.6 : 1 }}
      >
        {saving ? "Wird angelegt…" : "Urlaub anlegen"}
      </button>
    </ModalShell>
  );
}

function JoinProjectModal({ onClose, onJoined }: { onClose: () => void; onJoined: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) return;
    setSaving(true);
    setError("");
    const { error } = await supabase.rpc("join_project_by_code", { code: code.trim() });
    setSaving(false);
    if (error) {
      setError("Code nicht gefunden. Bitte nochmal prüfen.");
      return;
    }
    onJoined();
    onClose();
  };

  return (
    <ModalShell onClose={onClose} title="Einem Urlaub beitreten">
      <p style={{ fontSize: 13.5, color: "#6B6558", marginBottom: 14 }}>
        Gib den Einladungscode ein, den dir jemand aus dem Urlaubsprojekt geschickt hat.
      </p>
      <input
        autoFocus
        type="text"
        placeholder="z. B. a1b2c3d4"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #E0D9C6", fontSize: 14, marginBottom: 10 }}
      />
      {error && <div style={{ color: STYLE.danger, fontSize: 13, marginBottom: 10 }}>{error}</div>}
      <button
        onClick={handleJoin}
        disabled={saving || !code.trim()}
        style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: STYLE.ink, color: STYLE.paper, fontSize: 14.5, fontWeight: 600, opacity: saving || !code.trim() ? 0.6 : 1 }}
      >
        {saving ? "Trete bei…" : "Beitreten"}
      </button>
    </ModalShell>
  );
}

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(32,48,43,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: STYLE.paper, borderRadius: "20px 20px 0 0", padding: 22, width: "100%", maxWidth: 420, boxSizing: "border-box" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 18 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none" }}><X size={20} color="#9A9384" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
