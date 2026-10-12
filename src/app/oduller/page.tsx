"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  fetchCoupons,
  fetchMyRedemptions,
  fetchProfile,
  redeemCoupon,
} from "@/lib/data";
import { errorText } from "@/lib/errors";
import { useLang } from "@/lib/i18n";
import { ensureSession, supabaseConfigured } from "@/lib/supabase/client";
import type { Coupon, Redemption } from "@/lib/types";

type Tab = "reward" | "donation";

export default function RewardsPage() {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>("reward");
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
      setError(t("rw_not_configured"));
      setLoading(false);
      return;
    }
    ensureSession()
      .then(load)
      // Supabase hataları düz nesne; errorText() olmadan gerçek sebep kaybolur.
      .catch((e) => setError(errorText(e)))
      .finally(() => setLoading(false));
    // t yalnızca dil değişince değişir; ilk yüklemeyi tekrarlamak istemiyoruz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onRedeem(coupon: Coupon) {
    setBusy(coupon.id);
    setError(null);
    try {
      const r = await redeemCoupon(coupon.id);
      setFlash(`${r.title} ${t("rw_taken")} ${r.code}`);
      await load();
    } catch (e) {
      // Sunucu "puan yetersiz: 2400 gerekli, 60 var" gibi işe yarar bir mesaj döner.
      setError(errorText(e));
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Pad>{t("rw_loading")}</Pad>;

  const shown = coupons.filter((c) => (c.kind ?? "reward") === tab);
  const donating = tab === "donation";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">{t("nav_rewards")}</h1>
        <span className="rounded-full bg-brand px-4 py-1.5 font-semibold text-white">
          {points} {t("points")}
        </span>
      </div>

      {/* Sarı: puanla alınan ödül. Yeşil: puanı bağışa çeviren kart. */}
      <div className="mt-6 inline-flex rounded-full border border-line bg-surface p-1">
        <TabButton active={tab === "reward"} onClick={() => setTab("reward")} tone="amber">
          {t("rw_tab_rewards")}
        </TabButton>
        <TabButton active={tab === "donation"} onClick={() => setTab("donation")} tone="green">
          {t("rw_tab_donations")}
        </TabButton>
      </div>

      <p className="mt-4 max-w-2xl text-muted">
        {donating ? t("rw_donations_lead") : t("rw_rewards_lead")}
      </p>

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

      {shown.length === 0 ? (
        <p className="mt-8 text-muted">{t("rw_empty_list")}</p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => {
            const affordable = points >= c.cost_points && c.stock > 0;
            return (
              <div
                key={c.id}
                className={`overflow-hidden rounded-xl border bg-surface ${
                  donating ? "border-green-600/40" : "border-amber-500/50"
                }`}
              >
                {c.image_url && (
                  <Image
                    src={c.image_url}
                    alt={c.title_tr}
                    width={512}
                    height={512}
                    className="aspect-square w-full object-cover"
                  />
                )}
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {c.partner_name}
                  </p>
                  <h3 className="mt-1 font-semibold">{c.title_tr}</h3>
                  <p className="mt-1 text-sm text-brand">{c.discount_text}</p>
                  {c.is_recyclable_gift && (
                    <p className="mt-1 text-xs text-accent">♻️ {t("rw_recyclable")}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span
                      className={`text-sm font-bold ${
                        donating ? "text-green-700" : "text-amber-700"
                      }`}
                    >
                      {c.cost_points} {t("points")}
                    </span>
                    <button
                      onClick={() => onRedeem(c)}
                      disabled={!affordable || busy === c.id}
                      className={`rounded-full px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40 ${
                        donating ? "bg-green-700" : "bg-brand"
                      }`}
                    >
                      {busy === c.id
                        ? "…"
                        : c.stock <= 0
                          ? t("rw_sold_out")
                          : affordable
                            ? donating
                              ? t("rw_donate")
                              : t("rw_get")
                            : t("rw_not_enough")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section className="mt-12">
        <h2 className="font-semibold">{t("rw_my_coupons")}</h2>
        {wallet.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{t("rw_none_yet")}</p>
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

function TabButton({
  active,
  onClick,
  tone,
  children,
}: {
  active: boolean;
  onClick: () => void;
  tone: "amber" | "green";
  children: React.ReactNode;
}) {
  const on = tone === "amber" ? "bg-amber-400 text-black" : "bg-green-700 text-white";
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
        active ? on : "text-muted hover:bg-brand-soft"
      }`}
    >
      {children}
    </button>
  );
}

function Pad({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted">{children}</div>;
}
