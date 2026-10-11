"use client";

import { useCallback, useEffect, useState } from "react";
import { POINTS_EVENT, fetchProfile } from "@/lib/data";
import {
  accountState,
  ensureSession,
  supabase,
  supabaseConfigured,
} from "@/lib/supabase/client";

export type ProfileState = {
  points: number;
  nickname: string | null;
  signedIn: boolean;
  email: string | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

/** Anonim oturumu kurar ve puanı okur. Supabase ayarlı değilse sessizce boş döner. */
export function useProfile(): ProfileState {
  const [points, setPoints] = useState(0);
  const [nickname, setNickname] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
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
        const [profile, account] = await Promise.all([fetchProfile(), accountState()]);
        if (!alive) return;
        setPoints(profile?.points ?? 0);
        setNickname(profile?.nickname ?? null);
        setSignedIn(account.signedIn);
        setEmail(account.email);
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

  useEffect(() => {
    window.addEventListener(POINTS_EVENT, reload);
    return () => window.removeEventListener(POINTS_EVENT, reload);
  }, [reload]);

  // Giriş/çıkış sonrası puan ve hesap bilgisi kendiliğinden tazelensin.
  useEffect(() => {
    if (!supabaseConfigured) return;
    const { data } = supabase.auth.onAuthStateChange(() => reload());
    return () => data.subscription.unsubscribe();
  }, [reload]);

  return { points, nickname, signedIn, email, loading, error, reload };
}
