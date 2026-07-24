"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/lib/useUser";
import { STYLE, FONTS_IMPORT, cardStyle } from "@/lib/style";
import { DEFAULT_PACKLIST, DEFAULT_VORABREISE, DEFAULT_TIPS } from "@/lib/defaultData";
import { SECTIONS } from "@/lib/types";
import type { Project } from "@/lib/types";
import { Plus, LogOut, Users, X, Luggage } from "lucide-react";

const EMOJIS = ["🧳", "🏔️", "🏖️", "🚐", "🌍", "⛺", "🚢", "🎒"];

export default function ProjectsPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const loadProjects = async () => {
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    setProjects((data as Project[]) || []);
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

  return (
    <div style={{ minHeight: "100vh", background: STYLE.paperDim }}>
      <style>{FONTS_IMPORT}</style>

      <div style={{ background: STYLE.ink, color: STYLE.paper, padding: "24px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Luggage size={22} />
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 22 }}>Urlaubsplaner</span>
          </div>
          <button onClick={handleLogout} style={{ background: "none", border: "none", color: STYLE.paper, opacity: 0.75, display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
            <LogOut size={15} /> Abmelden
          </button>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => router.push(`/projects/${p.id}`)}
                style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 14, textAlign: "left", border: "none", width: "100%" }}
              >
                <div style={{ fontSize: 28 }}>{p.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15.5 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#9A9384", marginTop: 2 }}>
                    Angelegt am {new Date(p.created_at).toLocaleDateString("de-DE")}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} onCreated={loadProjects} userId={user.id} />}
      {showJoin && <JoinProjectModal onClose={() => setShowJoin(false)} onJoined={loadProjects} />}
    </div>
  );
}

function NewProjectModal({ onClose, onCreated, userId }: { onClose: () => void; onCreated: () => void; userId: string }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError("");

    // Diagnose: haben wir wirklich eine gültige Sitzung?
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setSaving(false);
      setError("Keine gültige Sitzung gefunden (Session leer). Bitte einmal abmelden und neu anmelden.");
      return;
    }

    // Token-Inhalt zur Diagnose entschlüsseln (nur lesen, keine Prüfung nötig)
    let tokenInfo = "";
    try {
      const token = sessionData.session.access_token;
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      tokenInfo =
        `Token-sub (=auth.uid() sollte sein): ${payload.sub}\n` +
        `Token-role: ${payload.role}\n` +
        `Token läuft ab: ${new Date(payload.exp * 1000).toLocaleString("de-DE")}\n` +
        `Jetzt: ${new Date().toLocaleString("de-DE")}\n`;
    } catch (e) {
      tokenInfo = `Token konnte nicht gelesen werden: ${e}\n`;
    }

    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({ name: name.trim(), emoji, created_by: userId })
      .select()
      .single();

    if (insertError || !project) {
      setSaving(false);
      setError(
        `Fehler beim Speichern:\n` +
        `Code: ${insertError?.code || "-"}\n` +
        `Nachricht: ${insertError?.message || "unbekannt"}\n` +
        (insertError?.details ? `Details: ${insertError.details}\n` : "") +
        (insertError?.hint ? `Hinweis: ${insertError.hint}\n` : "") +
        `\nDeine Nutzer-ID (Client): ${userId}\n` +
        tokenInfo
      );
      return;
    }

    const rows = [
      ...DEFAULT_PACKLIST.map((it, i) => ({ project_id: project.id, section: SECTIONS.PACKLISTE, data: it, position: i })),
      ...DEFAULT_VORABREISE.map((it, i) => ({ project_id: project.id, section: SECTIONS.VORABREISE, data: it, position: i })),
      ...DEFAULT_TIPS.map((it, i) => ({ project_id: project.id, section: SECTIONS.TIPP, data: it, position: i })),
    ];
    if (rows.length) await supabase.from("items").insert(rows);

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
