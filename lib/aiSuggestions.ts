"use client";

import { getStoredApiKey } from "./theme";

export type Suggestion = {
  name: string;
  type: string;
  group: string;
  context: string;
  note: string;
  rating?: string;
};

// Ruft Claude direkt aus dem Browser auf (mit dem eigenen API-Key aus den Einstellungen).
// "bring your own key"-Muster, von Anthropic offiziell unterstützt via CORS-Header.
export async function getAiSuggestions(opts: {
  projectName: string;
  routeContext: string; // z. B. "Berlin -> Bramberg am Wildkogel -> Soragna"
  kind: "essen" | "aktivitaet" | "mustdo";
}): Promise<{ suggestions: Suggestion[]; error?: string }> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    return { suggestions: [], error: "Kein API-Key hinterlegt. Trag ihn in den Einstellungen ein." };
  }

  const kindPrompt: Record<typeof opts.kind, string> = {
    essen: "Restaurants, Cafés, Bäckereien und Eisdielen",
    aktivitaet: "Freizeitaktivitäten (z. B. Freibäder, Kletterparks, Reiten, Wasseraktivitäten)",
    mustdo: "Sehenswürdigkeiten und Programmpunkte (Must-Dos)",
  } as any;

  const prompt = `Für einen Urlaub namens "${opts.projectName}" mit dieser Route: ${opts.routeContext || "(keine Route hinterlegt)"}.
Nenne 6-10 konkrete, realistische Vorschläge für: ${kindPrompt[opts.kind]}.
Antworte NUR mit einem JSON-Array, keine Erklärungen, keine Markdown-Codeblöcke. Jedes Element hat exakt diese Felder:
{"name": "...", "type": "...", "group": "Ort/Region, zu dem der Vorschlag gehört", "context": "Ort, Land (für Kartensuche)", "note": "1-2 Sätze Begründung/Beschreibung"}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { suggestions: [], error: `API-Fehler (${response.status}): ${errText.slice(0, 200)}` };
    }

    const data = await response.json();
    const text = (data.content || []).map((b: any) => b.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (!Array.isArray(parsed)) return { suggestions: [], error: "Unerwartetes Antwortformat." };
    return { suggestions: parsed };
  } catch (e: any) {
    return { suggestions: [], error: `Fehler: ${e.message || e}` };
  }
}
