"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchProfile } from "@/lib/data";
import { ensureSession, supabaseConfigured } from "@/lib/supabase/client";

export type ProfileState = {
  points: number;
  nickname: string | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

/** Anonim oturumu kurar ve puanı okur. Supabase ayarlı değilse sessizce boş döner. */
export function useProfile(): ProfileState {
  const [points, setPoints] = useState(0);
  const [nickname, setNickname] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      setError("Supabase ayarlı değil (.env.local eksik)");
      return;
    }
    let alive = true;
    (async () => {
      try {
        await ensureSession();
        const profile = await fetchProfile();
        if (!alive) return;
        setPoints(profile?.points ?? 0);
        setNickname(profile?.nickname ?? null);
        setError(null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "bilinmeyen hata");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { points, nickname, loading, error, reload };
}
