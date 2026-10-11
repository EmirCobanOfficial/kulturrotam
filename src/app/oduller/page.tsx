"use client";

import { useEffect, useState } from "react";
import {
  fetchCoupons,
  fetchMyRedemptions,
  fetchProfile,
  redeemCoupon,
} from "@/lib/data";
import { ensureSession, supabaseConfigured } from "@/lib/supabase/client";
import type { Coupon, Redemption } from "@/lib/types";

export default function RewardsPage() {
  const [points, setPoints] = useState(0);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [wallet, setWallet] = useState<(Redemption & { coupon: Coupon })[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  async function load() {
    const [profile, c, w] = await Promise.all([
      fetchProfile(),
      fetchCoupons(),
      fetchMyRedemptions(),
    ]);
    setPoints(profile?.points ?? 0);
    setCoupons(c);
    setWallet(w);
  }

  useEffect(() => {
    if (!supabaseConfigured) {
      setError("Supabase ayarlı değil (.env.local eksik).");
      setLoading(false);
      return;
    }
    ensureSession()
      .then(load)
      .catch((e) => setError(e instanceof Error ? e.message : "hata"))
      .finally(() => setLoading(false));
  }, []);

  async function onRedeem(coupon: Coupon) {
    setBusy(coupon.id);
    setError(null);
    try {
      const r = await redeemCoupon(coupon.id);
      setFlash(`${r.title} alındı! Kod: ${r.code}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "kupon alınamadı");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Pad>Yükleniyor…</Pad>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Ödüller</h1>
        <span className="rounded-full bg-brand px-4 py-1.5 font-semibold text-white">
          {points} puan
        </span>
      </div>

      {flash && (
        <p className="mt-4 rounded-lg bg-brand-soft px-4 py-3 text-sm font-medium text-brand">
          {flash}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-lg bg-accent-soft px-4 py-3 text-sm font-medium text-accent">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {coupons.map((c) => {
          const affordable = points >= c.cost_points && c.stock > 0;
          return (
            <div
              key={c.id}
              className={`rounded-xl border p-5 ${
                c.is_recyclable_gift ? "border-accent bg-accent-soft" : "border-line bg-surface"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {c.partner_name}
              </p>
              <h3 className="mt-1 font-semibold">{c.title_tr}</h3>
              <p className="mt-1 text-sm text-brand">{c.discount_text}</p>
              {c.is_recyclable_gift && (
                <p className="mt-1 text-xs text-accent">♻️ Geri dönüşümlü hediye kutusu</p>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold">{c.cost_points} puan</span>
                <button
                  onClick={() => onRedeem(c)}
                  disabled={!affordable || busy === c.id}
                  className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {busy === c.id
                    ? "…"
                    : c.stock <= 0
                      ? "Tükendi"
                      : affordable
                        ? "Al"
                        : "Puan yetmiyor"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <section className="mt-10">
        <h2 className="font-semibold">Kuponlarım</h2>
        {wallet.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Henüz kupon almadın.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {wallet.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-dashed border-brand bg-surface px-4 py-3"
              >
                <div>
                  <p className="font-medium">{r.coupon.title_tr}</p>
                  <p className="text-xs text-muted">{r.coupon.partner_name}</p>
                </div>
                <code className="rounded-lg bg-brand-soft px-3 py-1.5 font-mono font-bold text-brand">
                  {r.code}
                </code>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Pad({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted">{children}</div>;
}
