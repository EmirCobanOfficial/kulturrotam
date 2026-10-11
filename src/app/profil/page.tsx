"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchMyBadges,
  fetchMyVisits,
  fetchProfile,
  setNickname as saveNickname,
} from "@/lib/data";
import { ensureSession, supabaseConfigured } from "@/lib/supabase/client";
import type { Badge, Place } from "@/lib/types";

export default function ProfilePage() {
  const [points, setPoints] = useState(0);
  const [nickname, setNick] = useState("");
  const [badges, setBadges] = useState<Badge[]>([]);
  const [visits, setVisits] = useState<{ created_at: string; place: Place }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      await ensureSession();
      const [profile, b, v] = await Promise.all([
        fetchProfile(),
        fetchMyBadges(),
        fetchMyVisits(),
      ]);
      setPoints(profile?.points ?? 0);
      setNick(profile?.nickname ?? "");
      setBadges(b);
      setVisits(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : "hata");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!supabaseConfigured) {
      setError("Supabase ayarlı değil (.env.local eksik).");
      setLoading(false);
      return;
    }
    load();
  }, []);

  async function onSave() {
    await saveNickname(nickname);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  if (loading) return <Pad>Yükleniyor…</Pad>;
  if (error) return <Pad><span className="text-accent">{error}</span></Pad>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-xl border border-line bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Toplam puan</p>
            <p className="text-4xl font-bold text-brand">{points}</p>
          </div>
          <div className="text-right">
            <div className="flex gap-2">
              <input
                value={nickname}
                onChange={(e) => setNick(e.target.value)}
                placeholder="Takma adın"
                className="rounded-lg border border-line px-3 py-2 text-sm"
              />
              <button
                onClick={onSave}
                className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white"
              >
                Kaydet
              </button>
            </div>
            {saved && <p className="mt-1 text-xs text-brand">Kaydedildi ✓</p>}
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="font-semibold">Rozetlerin</h2>
        {badges.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Henüz rozet yok. Aynı kategoriden birkaç mekana check-in yap.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-3">
            {badges.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-line bg-surface px-4 py-3 text-center"
              >
                <div className="text-3xl">{b.icon}</div>
                <div className="mt-1 text-sm font-medium">{b.name_tr}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-semibold">Ziyaret geçmişin</h2>
        {visits.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Henüz check-in yok.{" "}
            <Link href="/sihirbaz" className="font-semibold text-brand">
              Rota oluştur
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {visits.map((v, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-2 text-sm"
              >
                <span>{v.place.name_tr}</span>
                <span className="text-muted">
                  {new Date(v.created_at).toLocaleString("tr-TR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Pad({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted">{children}</div>;
}
