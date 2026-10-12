"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import Reveal from "@/components/Reveal";
import { fetchPlaces, fetchTodayEvents } from "@/lib/data";
import { errorText } from "@/lib/errors";
import { CATEGORY_LABEL, eventTitle, placeName, useLang } from "@/lib/i18n";
import { formatClock, planManualRoute } from "@/lib/route/plan";
import { supabaseConfigured } from "@/lib/supabase/client";
import type { EventItem, Place } from "@/lib/types";

// Leaflet SSR'da patlar.
const RouteMap = dynamic(() => import("@/components/RouteMap"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-muted">…</div>,
});

const START_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

export default function CustomRoutePage() {
  const { lang, t } = useLang();
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  /** Seçilen mekan id'leri — sıra kullanıcının sırası, rota bundan kurulur. */
  const [chosen, setChosen] = useState<string[]>([]);
  const [startHour, setStartHour] = useState(10);

  useEffect(() => {
    if (!supabaseConfigured) {
      setError(t("rw_not_configured"));
      return;
    }
    fetchPlaces()
      .then(setPlaces)
      .catch((e) => setError(errorText(e)));
    // Etkinlik tablosu olmasa da rota kurulabilmeli.
    fetchTodayEvents()
      .then(setEvents)
      .catch(() => setEvents([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byId = useMemo(
    () => new Map((places ?? []).map((p) => [p.id, p])),
    [places],
  );

  const chosenPlaces = useMemo(
    () => chosen.map((id) => byId.get(id)).filter((p): p is Place => Boolean(p)),
    [chosen, byId],
  );

  const stops = useMemo(
    () => planManualRoute(chosenPlaces, startHour, events),
    [chosenPlaces, startHour, events],
  );

  const available = (places ?? []).filter((p) => !chosen.includes(p.id));

  function move(index: number, delta: number) {
    setChosen((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  if (error) return <Pad>{error}</Pad>;
  if (!places) return <Pad>{t("km_loading")}</Pad>;

  const last = stops[stops.length - 1];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Reveal>
        <h1 className="text-3xl font-bold">{t("km_title")}</h1>
        <p className="mt-3 max-w-2xl text-muted">{t("km_lead")}</p>
      </Reveal>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="text-xs font-semibold text-muted">{t("km_start")}</span>
          <select
            value={startHour}
            onChange={(e) => setStartHour(Number(e.target.value))}
            className="mt-1 rounded-lg border border-line bg-surface px-3 py-2 font-semibold"
          >
            {START_HOURS.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </label>

        {stops.length > 0 && (
          <>
            <p className="text-sm font-semibold">
              {stops.length} {t("km_summary_stops")}
              {last && ` · ${t("km_summary_ends")} ${formatClock(last.departure)}`}
            </p>
            <button
              onClick={() => setChosen([])}
              className="rounded-full border border-line px-4 py-1.5 text-sm font-semibold hover:bg-brand-soft"
            >
              {t("km_clear")}
            </button>
          </>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* ------------------------------------------------- eklenebilecekler */}
        <section>
          <h2 className="font-semibold">{t("km_pick")}</h2>
          {available.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{t("km_all_added")}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {available.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{placeName(p, lang)}</p>
                    <p className="text-xs text-muted">
                      {CATEGORY_LABEL[lang][p.category] ?? p.category} · {p.visit_minutes}{" "}
                      {lang === "tr" ? "dk" : "min"}
                    </p>
                  </div>
                  <button
                    onClick={() => setChosen((c) => [...c, p.id])}
                    className="ml-auto shrink-0 rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    {t("km_add")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* -------------------------------------------------------- senin rotan */}
        <section>
          <h2 className="font-semibold">{t("km_chosen")}</h2>
          {stops.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{t("km_empty")}</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {stops.map((s, i) => (
                <li
                  key={s.place.id}
                  className={`rounded-xl border bg-surface p-3 ${
                    s.outsideHours ? "border-accent" : "border-line"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{placeName(s.place, lang)}</p>
                      <p className="text-xs text-muted">
                        {formatClock(s.arrival)} – {formatClock(s.departure)}
                        {s.travelMinutes > 0 && ` · ${s.travelMinutes} ${t("km_walk")}`}
                      </p>
                      {s.event && (
                        <p className="mt-1 text-xs font-semibold text-brand">
                          ★ {eventTitle(s.event, lang)}
                        </p>
                      )}
                      {s.outsideHours && (
                        <p className="mt-1 text-xs font-semibold text-accent">
                          ⚠ {t("km_outside")}
                        </p>
                      )}
                    </div>

                    <div className="ml-auto flex shrink-0 gap-1">
                      <IconButton label={t("km_up")} onClick={() => move(i, -1)} disabled={i === 0}>
                        ↑
                      </IconButton>
                      <IconButton
                        label={t("km_down")}
                        onClick={() => move(i, 1)}
                        disabled={i === stops.length - 1}
                      >
                        ↓
                      </IconButton>
                      <IconButton
                        label={t("km_remove")}
                        onClick={() => setChosen((c) => c.filter((id) => id !== s.place.id))}
                      >
                        ×
                      </IconButton>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {stops.length > 0 && (
        <div className="mt-8 h-80 overflow-hidden rounded-xl border border-line">
          <RouteMap stops={stops} />
        </div>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-7 w-7 items-center justify-center rounded-full border border-line font-bold hover:bg-brand-soft disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function Pad({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted">{children}</div>;
}
