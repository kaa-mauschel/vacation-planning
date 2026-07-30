"use client";

import { useState } from "react";
import { getStoredName, setStoredName, useDisplayName } from "@/lib/profileName";
import { STYLE } from "@/lib/style";
import { User } from "lucide-react";

// Erscheint einmalig, solange auf diesem Gerät noch kein Name hinterlegt ist – danach
// begrüßt dich die App persönlich (z. B. in der "Heute"-Karte).
export default function NamePrompt() {
  const name = useDisplayName();
  const [value, setValue] = useState("");

  if (name || getStoredName()) return null;

  const save = () => {
    if (!value.trim()) return;
    setStoredName(value.trim());
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(58,53,48,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div style={{ background: STYLE.paper, borderRadius: 20, padding: 26, width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: STYLE.paperDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <User size={22} color={STYLE.accent} />
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 19 }}>Wie sollen wir dich nennen?</div>
        <p style={{ fontSize: 13, color: "#6B6558", marginTop: 6, marginBottom: 16 }}>
          Damit dich die App persönlich begrüßen kann und deine Einträge in Packliste & Co. richtig zugeordnet werden.
        </p>
        <input
          autoFocus
          type="text"
          placeholder="Dein Name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); }}
          style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #E0D9C6", fontSize: 15, textAlign: "center", boxSizing: "border-box" }}
        />
        <button
          onClick={save}
          disabled={!value.trim()}
          style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: STYLE.ink, color: "#fff", fontSize: 14.5, fontWeight: 600, marginTop: 14, opacity: value.trim() ? 1 : 0.5 }}
        >
          Los geht's
        </button>
      </div>
    </div>
  );
}
