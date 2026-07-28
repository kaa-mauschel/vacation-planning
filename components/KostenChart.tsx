"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { STYLE } from "@/lib/style";

const COLORS = [STYLE.accent, STYLE.accent2, STYLE.accent3, STYLE.accent4, "#C98A3E", "#D97878", "#9584B8"];

export default function KostenChart({ items, orte, kategorien }: { items: any[]; orte: string[]; kategorien: string[] }) {
  // Baut je Ort eine Zeile mit einer Spalte pro Kostenart auf: { ort: "Bramberg", Unterkunft: 500, Essen: 80, ... }
  const data = orte.map((ort) => {
    const row: Record<string, any> = { ort };
    kategorien.forEach((kat) => {
      row[kat] = items
        .filter((it) => it.data.ort === ort && it.data.kategorie === kat)
        .reduce((sum, it) => sum + (Number(it.data.betrag) || 0), 0);
    });
    return row;
  }).filter((row) => kategorien.some((kat) => row[kat] > 0));

  const usedKategorien = kategorien.filter((kat) => data.some((row) => row[kat] > 0));

  if (data.length === 0) {
    return <p style={{ fontSize: 13, color: "#9A9384" }}>Trag bei ein paar Ausgaben einen Ort ein, um hier ein Diagramm zu sehen.</p>;
  }

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0D9C6" />
          <XAxis dataKey="ort" tick={{ fontSize: 11, fill: STYLE.ink }} />
          <YAxis tick={{ fontSize: 11, fill: STYLE.ink }} unit=" €" />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: `1px solid #E0D9C6`, fontSize: 12.5 }}
            formatter={(value: number) => `${value.toLocaleString("de-DE")} €`}
          />
          <Legend wrapperStyle={{ fontSize: 11.5 }} />
          {usedKategorien.map((kat, i) => (
            <Bar key={kat} dataKey={kat} stackId={undefined} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
