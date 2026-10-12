"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import PhotoFeed from "@/components/PhotoFeed";
import Reveal from "@/components/Reveal";
import { addReview, fetchPlaces, fetchReviews } from "@/lib/data";
import { errorText } from "@/lib/errors";
import { CATEGORY_LABEL, placeDescription, placeName, useLang } from "@/lib/i18n";
import { ensureSession, supabaseConfigured } from "@/lib/supabase/client";
import type { Place, Review } from "@/lib/types";

/** Tablo yoksa Postgres 42P01 döner; ham hata yerine kurulum mesajı göster. */
function missingTables(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const code = (e as { code?: unknown }).code;
  return code === "42P01" || code === "PGRST205" || code === "PGRST202";
}

export default function PlacesPage() {
  const { lang, t } = useLang();
  const [places, setPlaces] = useState<Place[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  /** Akış ayrı bir sayfaydı; /akis buraya yönlendiriyor, sekme oradan açılır. */
  const [tab, setTab] = useState<"mekanlar" | "akis">("mekanlar");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("sekme") === "akis") setTab("akis");
  }, []);

  async function load() {
    const [p, r] = await Promise.all([fetchPlaces(), fetchReviews()]);
    setPlaces(p);
    setReviews(r);
  }

  useEffect(() => {
    if (!supabaseConfigured) {
      setError(t("rw_not_configured"));
      setLoading(false);
      return;
    }
    ensureSession()
      .then((session) => {
        setUserId(session?.user.id ?? null);
        return load();
      })
      .catch((e) => setError(missingTables(e) ? t("rv_not_ready") : errorText(e)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Mekan başına ortalama ve sayı; veri küçük, istemcide hesaplamak yeterli. */
  const summary = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const r of reviews) {
      const cur = map.get(r.place_id) ?? { total: 0, count: 0 };
      map.set(r.place_id, { total: cur.total + r.rating, count: cur.count + 1 });
    }
    return map;
  }, [reviews]);

  if (loading) return <Pad>{t("rv_loading")}</Pad>;
  if (error) return <Pad>{error}</Pad>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Reveal>
        <h1 className="text-3xl font-bold">{t("rv_title")}</h1>

        <div className="mt-5 inline-flex rounded-full border border-line bg-surface p-1">
          <button
            onClick={() => setTab("mekanlar")}
            className={`rounded-full px-5 py-2 text-sm font-semibold ${
              tab === "mekanlar" ? "bg-brand text-white" : "text-muted hover:bg-brand-soft"
            }`}
          >
            {t("rv_tab_places")}
          </button>
          <button
            onClick={() => setTab("akis")}
            className={`rounded-full px-5 py-2 text-sm font-semibold ${
              tab === "akis" ? "bg-brand text-white" : "text-muted hover:bg-brand-soft"
            }`}
          >
            {t("rv_tab_feed")}
          </button>
        </div>

        {tab === "mekanlar" && (
          <>
            <p className="mt-4 text-muted">{t("rv_lead")}</p>
            <p className="mt-1 text-sm text-muted">{t("rv_one_each")}</p>
          </>
        )}
      </Reveal>

      {tab === "akis" && (
        <div className="mt-8">
          <PhotoFeed />
        </div>
      )}

      {flash && (
        <p className="mt-4 rounded-lg bg-brand-soft px-4 py-3 text-sm font-medium text-brand">
          {flash}
        </p>
      )}

      {tab === "mekanlar" && (
      <div className="mt-8 space-y-5">
        {places.map((place, i) => (
          <Reveal key={place.id} delay={Math.min(i, 4) * 70}>
            <PlaceCard
              place={place}
              stats={summary.get(place.id)}
              reviews={reviews.filter((r) => r.place_id === place.id)}
              mine={reviews.find((r) => r.place_id === place.id && r.user_id === userId)}
              onSaved={async (message) => {
                setFlash(message);
                await load();
              }}
              onError={setError}
            />
          </Reveal>
        ))}
      </div>
      )}
    </div>
  );
}

function PlaceCard({
  place,
  stats,
  reviews,
  mine,
  onSaved,
  onError,
}: {
  place: Place;
  stats?: { total: number; count: number };
  reviews: Review[];
  mine?: Review;
  onSaved: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const { lang, t } = useLang();
  const [rating, setRating] = useState(mine?.rating ?? 0);
  const [comment, setComment] = useState(mine?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const average = stats ? stats.total / stats.count : null;

  async function submit() {
    if (rating < 1) {
      onError(t("rv_pick_rating"));
      return;
    }
    setBusy(true);
    try {
      await addReview(place.id, rating, comment);
      await onSaved(t("rv_saved"));
    } catch (e) {
      onError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-surface">
      {/* Mekan görseli veritabanındaki image_url'den; yoksa kart görselsiz çizilir. */}
      {place.image_url && (
        <Image
          src={place.image_url}
          alt={placeName(place, lang)}
          width={1200}
          height={675}
          className="aspect-video w-full object-cover"
        />
      )}
      <div className="p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-lg font-semibold">{placeName(place, lang)}</h2>
        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">
          {CATEGORY_LABEL[lang][place.category] ?? place.category}
        </span>
        <span className="ml-auto text-sm font-semibold">
          {average === null ? (
            <span className="text-muted">{t("rv_no_rating")}</span>
          ) : (
            <>
              <span className="text-amber-600">{"★".repeat(Math.round(average))}</span>{" "}
              {average.toFixed(1)}{" "}
              <span className="font-normal text-muted">
                ({stats?.count} {t(stats?.count === 1 ? "rv_rating_one" : "rv_rating_many")})
              </span>
            </>
          )}
        </span>
      </div>

      {placeDescription(place, lang) && (
        <p className="mt-2 text-sm text-muted">{placeDescription(place, lang)}</p>
      )}

      <div className="mt-4 rounded-lg bg-brand-soft/40 p-3">
        <p className="text-xs font-semibold text-muted">{t("rv_your_rating")}</p>
        <div className="mt-1 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              aria-label={`${n}`}
              className={`text-2xl leading-none transition-transform hover:scale-110 ${
                n <= rating ? "text-amber-500" : "text-line"
              }`}
            >
              ★
            </button>
          ))}
        </div>

        <label className="mt-3 block">
          <span className="text-xs font-semibold text-muted">{t("rv_comment")}</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
          />
        </label>

        <button
          onClick={submit}
          disabled={busy}
          className="mt-3 rounded-full bg-brand px-5 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? t("rv_saving") : mine ? t("rv_update") : t("rv_submit")}
        </button>
      </div>

      <button
        onClick={() => setOpen(!open)}
        className="mt-3 text-sm font-semibold text-brand underline underline-offset-4"
      >
        {t("rv_comments")} ({reviews.filter((r) => r.comment).length})
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {reviews.filter((r) => r.comment).length === 0 ? (
            <p className="text-sm text-muted">{t("rv_no_comments")}</p>
          ) : (
            reviews
              .filter((r) => r.comment)
              .map((r) => (
                <div key={r.id} className="rounded-lg border border-line p-3">
                  <p className="text-sm text-amber-600">{"★".repeat(r.rating)}</p>
                  <p className="mt-1 text-sm">{r.comment}</p>
                </div>
              ))
          )}
        </div>
      )}
      </div>
    </article>
  );
}

function Pad({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted">{children}</div>;
}
