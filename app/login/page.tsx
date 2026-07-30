"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/lib/useUser";
import { STYLE, FONTS_IMPORT } from "@/lib/style";
import { Luggage, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/projects");
  }, [loading, user, router]);

  useEffect(() => {
    const saved = window.localStorage.getItem("urlaubsplaner-last-email");
    if (saved) setEmail(saved);
  }, []);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setSending(true);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo("Link zum Passwort-Setzen wurde an deine E-Mail geschickt. Öffne die Mail und klick auf den Link – du kannst dort ein neues Passwort festlegen.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (mode === "forgot") return handleForgot(e);
    e.preventDefault();
    setError("");
    setInfo("");
    setSending(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setSending(false);
      if (error) {
        setError(error.message === "Invalid login credentials"
          ? "E-Mail oder Passwort falsch. Falls du dich schon per Magic-Link angemeldet hattest, aber noch nie ein Passwort gesetzt hast, nutze unten \"Passwort vergessen\"."
          : error.message);
        return;
      }
      window.localStorage.setItem("urlaubsplaner-last-email", email);
      router.replace("/projects");
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setSending(false);
      if (error) {
        if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
          setError("Diese E-Mail ist schon registriert. Nutze \"Anmelden\" – oder falls du noch kein Passwort dafür hast, \"Passwort vergessen\".");
        } else {
          setError(error.message);
        }
        return;
      }
      if (data.session) {
        router.replace("/projects");
      } else {
        setInfo("Konto erstellt! Falls du eine Bestätigungs-Mail bekommst, klick den Link darin. Danach kannst du dich hier normal anmelden.");
        setMode("signin");
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: STYLE.paperDim }}>
      <style>{FONTS_IMPORT}</style>
      <div style={{ width: "100%", maxWidth: 380, background: STYLE.paper, borderRadius: 20, padding: 28, boxShadow: "0 4px 20px rgba(32,48,43,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: STYLE.headerBg2, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Luggage size={20} color={STYLE.ink} />
          </div>
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 22 }}>Urlaubsplaner</span>
        </div>
        <p style={{ fontSize: 14, color: "#6B6558", margin: "10px 0 20px" }}>
          Gemeinsam Urlaube planen – mit allen, die mitkommen.
        </p>

        <div style={{ display: "flex", gap: 6, marginBottom: 18, background: STYLE.paperDim, borderRadius: 10, padding: 4 }}>
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(""); setInfo(""); }}
            style={{ flex: 1, padding: "8px 0", borderRadius: 7, border: "none", fontSize: 13.5, fontWeight: 600, background: mode === "signin" ? STYLE.paper : "transparent", color: STYLE.ink }}
          >
            Anmelden
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); setInfo(""); }}
            style={{ flex: 1, padding: "8px 0", borderRadius: 7, border: "none", fontSize: 13.5, fontWeight: 600, background: mode === "signup" ? STYLE.paper : "transparent", color: STYLE.ink }}
          >
            Registrieren
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: 13, fontWeight: 600, color: STYLE.ink }}>E-Mail-Adresse</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, marginBottom: 12, border: "1px solid #E0D9C6", borderRadius: 10, padding: "10px 12px" }}>
            <Mail size={16} color="#9A9384" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="du@beispiel.de"
              style={{ border: "none", outline: "none", flex: 1, fontSize: 14, background: "transparent" }}
            />
          </div>

          {mode !== "forgot" && (
            <>
              <label style={{ fontSize: 13, fontWeight: 600, color: STYLE.ink }}>Passwort</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, marginBottom: 8, border: "1px solid #E0D9C6", borderRadius: 10, padding: "10px 12px" }}>
                <Lock size={16} color="#9A9384" />
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="mindestens 6 Zeichen"
                  style={{ border: "none", outline: "none", flex: 1, fontSize: 14, background: "transparent" }}
                />
              </div>
            </>
          )}

          {mode === "signin" && (
            <button
              type="button"
              onClick={() => { setMode("forgot"); setError(""); setInfo(""); }}
              style={{ background: "none", border: "none", color: STYLE.accent4, fontSize: 12.5, padding: 0, marginBottom: 14, display: "block" }}
            >
              Passwort vergessen?
            </button>
          )}
          {mode === "forgot" && (
            <p style={{ fontSize: 12.5, color: "#6B6558", margin: "0 0 14px" }}>
              Wir schicken dir einen Link, mit dem du ein (neues) Passwort für diese E-Mail-Adresse festlegen kannst.
            </p>
          )}

          {error && <div style={{ color: STYLE.danger, fontSize: 13, marginBottom: 10 }}>{error}</div>}
          {info && <div style={{ color: STYLE.accent, fontSize: 13, marginBottom: 10 }}>{info}</div>}

          <button
            type="submit"
            disabled={sending}
            style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: STYLE.ink, color: STYLE.paper, fontSize: 14.5, fontWeight: 600, opacity: sending ? 0.7 : 1 }}
          >
            {sending ? "Einen Moment…" : mode === "signin" ? "Anmelden" : mode === "signup" ? "Konto erstellen" : "Link schicken"}
          </button>

          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(""); setInfo(""); }}
              style={{ background: "none", border: "none", color: STYLE.accent4, fontSize: 12.5, padding: 0, marginTop: 12, display: "block", width: "100%", textAlign: "center" }}
            >
              Zurück zum Anmelden
            </button>
          )}
        </form>

      </div>
    </div>
  );
}
