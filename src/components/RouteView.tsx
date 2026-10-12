"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchEventsOn, fetchPlaces } from "@/lib/data";
import { errorText } from "@/lib/errors";
import {
  CATEGORY_LABEL,
  eventTitle,
  placeDescription,
  placeName,
  useLang,
} from "@/lib/i18n";
import { fromISODate } from "@/lib/dates";
import { supabaseConfigured } from "@/lib/supabase/client";
import { planRoute, formatClock } from "@/lib/route/plan";
import type { EventItem, Place, RoutePrefs, RouteStop } from "@/lib/types";

const RouteMap = dynamic(() => import("@/components/RouteMap"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-muted">Harita yükleniyor…</div>,
});

export default function RouteView({
  prefs,
  date,
}: {
  prefs: RoutePrefs;
  /** "2026-10-15"; yoksa bugün. Rozet bu günün etkinliklerine bakar. */
  date?: string | null;
}) {
  const { lang, t } = useLang();
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) {
      setError("Supabase ayarlı değil (.env.local eksik).");
      return;
    }
    fetchPlaces().then(setPlaces).catch((e) => setError(errorText(e)));
    // Etkinlik tablosu yoksa rota yine çizilsin: bu hata rotayı düşürmez.
    fetchEventsOn(fromISODate(date))
      .then(setEvents)
      .catch(() => setEvents([]));
  }, [date]);

  const stops = useMemo<RouteStop[]>(
    () => (places ? planRoute(prefs, places, events) : []),
    [places, events, prefs],
  );

  if (error)
    return (
      <Centered>
        <p className="text-accent">Mekanlar yüklenemedi: {error}</p>
        <p className="mt-2 text-sm text-muted">
          Supabase anahtarlarının <code>.env.local</code>'de olduğundan emin ol.
        </p>
      </Centered>
    );

  if (!places) return <Centered>Rotan hazırlanıyor…</Centered>;

  if (stops.length === 0)
    return (
      <Centered>
        <p>{t("route_empty")}</p>
        <Link href="/sihirbaz" className="mt-3 font-semibold text-brand">
          Tercihleri değiştir
        </Link>
      </Centered>
    );

  const totalPoints = stops.reduce((sum, s) => sum + s.place.points_reward, 0);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{t("route_ready")}</h1>
          <span className="rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand">
            {stops.length} {t("route_stops")}
          </span>
          <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent">
            +{totalPoints} {t("route_points_potential")}
          </span>
          <Link href="/sihirbaz" className="ml-auto text-sm font-semibold text-brand">
            {t("route_replan")}
          </Link>
        </div>

        <ol className="space-y-3">
          {stops.map((s, i) => (
            <li
              key={s.place.id + i}
              className="rounded-xl border border-line bg-surface p-4"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${
                    s.isMeal ? "bg-accent" : "bg-brand"
                  }`}
                >
                  {s.isMeal ? "🍽" : i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{placeName(s.place, lang)}</h3>
                    <span className="shrink-0 text-sm font-medium text-muted">
                      {formatClock(s.arrival)}–{formatClock(s.departure)}
                    </span>
                  </div>
                  {s.event && (
                    <p className="mt-1 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
                      🎪 {t("route_event_today")}: {eventTitle(s.event, lang)}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-muted">{placeDescription(s.place, lang)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-background px-2 py-0.5 text-muted">
                      {CATEGORY_LABEL[lang][s.place.category] ?? s.place.category}
                    </span>
                    {s.travelMinutes > 0 && (
                      <span className="text-muted">
                        🚶 {s.travelMinutes} {t("route_walk")}
                      </span>
                    )}
                    <span className="font-semibold text-brand">
                      +{s.place.points_reward} {t("points")}
                    </span>
                    <Link
                      href={`/checkin/${s.place.qr_token}`}
                      className="ml-auto rounded-full border border-line px-2.5 py-1 font-medium hover:bg-brand-soft"
                    >
                      {t("route_checkin")}
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="h-[60vh] overflow-hidden rounded-xl border border-line lg:sticky lg:top-6 lg:h-[80vh]">
        <RouteMap stops={stops} />
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center text-muted">{children}</div>
  );
}
