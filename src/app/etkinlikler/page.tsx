"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import TicketContribution from "@/components/TicketContribution";
import { fetchPlaces, fetchTodayEvents } from "@/lib/data";
import { eventTitle, placeName, useLang } from "@/lib/i18n";
import type { EventItem, Place } from "@/lib/types";

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function EventsPage() {
  const { lang, t } = useLang();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);

  useEffect(() => {
    Promise.all([fetchTodayEvents(), fetchPlaces()])
      .then(([e, p]) => {
        setEvents(e);
        setPlaces(p);
      })
      .catch(() => setEvents([]));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Reveal>
        <h1 className="text-3xl font-bold">{t("ev_title")}</h1>
        <p className="mt-3 max-w-2xl text-muted">{t("ev_lead")}</p>
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
                    <article className="rounded-xl border border-line bg-surface p-5">
                      <p className="text-sm font-semibold text-accent">
                        {clock(e.starts_at)} – {clock(e.ends_at)}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold">{eventTitle(e, lang)}</h2>
                      {place && (
                        <p className="mt-1 text-sm text-muted">{placeName(place, lang)}</p>
                      )}
                      <Link
                        href="/sihirbaz"
                        className="mt-3 inline-block text-sm font-semibold text-brand underline underline-offset-4"
                      >
                        {t("ev_on_route")} →
                      </Link>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          )}
        </section>

        <Reveal>
          <TicketContribution />
        </Reveal>
      </div>
    </div>
  );
}
