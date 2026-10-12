"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Reveal from "@/components/Reveal";
import TicketContribution from "@/components/TicketContribution";
import { fetchEventsOn, fetchPlaces } from "@/lib/data";
import { dayLabel, nextDays, toISODate } from "@/lib/dates";
import { eventTitle, placeName, useLang } from "@/lib/i18n";
import type { EventItem, Place } from "@/lib/types";

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function EventsPage() {
  const { lang, t } = useLang();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [dayIndex, setDayIndex] = useState(0);

  const days = useMemo(() => nextDays(14), []);
  const selectedDay = days[dayIndex] ?? days[0];

  useEffect(() => {
    fetchPlaces().then(setPlaces).catch(() => setPlaces([]));
  }, []);

  useEffect(() => {
    fetchEventsOn(selectedDay)
      .then(setEvents)
      .catch(() => setEvents([]));
  }, [selectedDay]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Reveal>
        <h1 className="text-3xl font-bold">{t("ev_title")}</h1>
        <p className="mt-3 max-w-2xl text-muted">{t("ev_lead")}</p>

        <label className="mt-6 block max-w-xs">
          <span className="text-xs font-semibold text-muted">{t("home_quick_date")}</span>
          <select
            value={dayIndex}
            onChange={(e) => setDayIndex(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 font-semibold"
          >
            {days.map((d, i) => (
              <option key={toISODate(d)} value={i}>
                {dayLabel(d, lang)}
              </option>
            ))}
          </select>
        </label>
      </Reveal>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section>
          {events.length === 0 ? (
            <Reveal>
              <p className="text-muted">{t("ev_empty")}</p>
            </Reveal>
          ) : (
            <div className="space-y-4">
              {events.map((e, i) => {
                const place = places.find((p) => p.id === e.place_id);
                return (
                  <Reveal key={e.id} delay={i * 90}>
                    <article className="overflow-hidden rounded-xl border border-line bg-surface">
                      {/* Görsel takımdan gelecek; gelene kadar kart görselsiz çizilir. */}
                      {e.image_url && (
                        <Image
                          src={e.image_url}
                          alt={eventTitle(e, lang)}
                          width={1200}
                          height={675}
                          className="aspect-video w-full object-cover"
                        />
                      )}
                      <div className="p-5">
                        <p className="text-sm font-semibold text-accent">
                          {clock(e.starts_at)} – {clock(e.ends_at)}
                        </p>
                        <h2 className="mt-1 text-lg font-semibold">{eventTitle(e, lang)}</h2>
                        {place && (
                          <p className="mt-1 text-sm text-muted">{placeName(place, lang)}</p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-4">
                          <Link
                            href="/sihirbaz"
                            className="text-sm font-semibold text-brand underline underline-offset-4"
                          >
                            {t("ev_on_route")} →
                          </Link>
                          {/* Gerçek yönlendirme linki gelince buton görünür olur. */}
                          {e.ticket_url && (
                            <a
                              href={e.ticket_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90"
                            >
                              {t("ev_tickets")} →
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          )}
        </section>

        <div className="space-y-4">
          {/* Yönlendirme geliri: arka uç yok, model olduğu gibi anlatılıyor. */}
          <Reveal>
            <aside className="rounded-xl border border-accent/40 bg-accent-soft p-4">
              <p className="font-semibold text-accent">★ {t("af_title")}</p>
              <p className="mt-2 text-sm">{t("af_body")}</p>
              <p className="mt-2 text-sm font-semibold">{t("af_note")}</p>
            </aside>
          </Reveal>
          <Reveal delay={80}>
            <TicketContribution />
          </Reveal>
        </div>
      </div>
    </div>
  );
}
