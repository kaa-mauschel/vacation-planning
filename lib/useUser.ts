"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import type { User } from "@supabase/supabase-js";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // getSession() liest die gespeicherte Sitzung lokal (kein Netzwerk nötig) –
    // dadurch bleibst du auch bei schlechter Verbindung eingeloggt, statt bei
    // jedem App-Start neu einloggen zu müssen.
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return { user, loading };
}
