"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";
import type { Item } from "./types";

// Lädt alle Items einer Section eines Projekts und hält sie live synchron:
// Wenn ein Mitreisender etwas ändert, aktualisiert sich die Liste bei dir automatisch.
// Neue Einträge landen ganz oben (neueste zuerst).
export function useItems(projectId: string, section: string) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  // Eindeutige ID pro Hook-Nutzung, damit zwei Komponenten, die gleichzeitig dieselbe
  // project/section abfragen (z. B. Übersicht + Route-Tab), keine Kanalnamen-Kollision
  // bei Supabase Realtime auslösen.
  const instanceId = useRef(Math.random().toString(36).slice(2));

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("project_id", projectId)
      .eq("section", section)
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });
    if (!error && data) setItems(data as Item[]);
    setLoading(false);
  }, [projectId, section]);

  useEffect(() => {
    reload();

    const channel = supabase
      .channel(`items-${projectId}-${section}-${instanceId.current}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: `project_id=eq.${projectId}` },
        (payload) => {
          const row = (payload.new || payload.old) as Item;
          if (row?.section !== section) return;
          reload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, section]);

  const addItem = async (data: Record<string, any>, position = 0) => {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("items").insert({
      project_id: projectId,
      section,
      data,
      position,
      created_by: userData?.user?.id ?? null,
    });
    await reload(); // sofort aktualisieren, nicht nur auf Realtime warten
  };

  const updateItem = async (id: string, data: Record<string, any>) => {
    await supabase.from("items").update({ data }).eq("id", id);
    await reload();
  };

  const deleteItem = async (id: string) => {
    await supabase.from("items").delete().eq("id", id);
    await reload();
  };

  return { items, loading, addItem, updateItem, deleteItem, reload };
}
