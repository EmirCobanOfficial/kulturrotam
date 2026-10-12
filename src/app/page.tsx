"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProblemCards from "@/components/ProblemCards";
import Reveal from "@/components/Reveal";
import { fetchPlaces, fetchTodayEvents } from "@/lib/data";
import { INTEREST_LABEL, eventTitle, placeName, useLang } from "@/lib/i18n";
import type { EventItem, Place } from "@/lib/types";

// Sihirbazdaki listeyle birebir aynı olmalı: seçim oraya parametre olarak taşınıyor.
const INTERESTS = ["tarihi", "muze", "mimari", "manzara", "alisveris", "bahce"] as const;
const HOURS = [2, 3, 4, 6] as const;

/** "15:00" — saat dilimi sürprizi olmasın diye yerel saate çeviriyoruz. */
function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Home() {
  const { t, lang } = useLang();

  // Hızlı başlangıç çubuğu: seçimler sihirbaza sorgu parametresi olarak taşınır.
  const [interest, setInterest] = useState<string>(INTERESTS[0]);
  const [hours, setHours] = useState<number>(3);
  const [wantsFood, setWantsFood] = useState(true);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);

  useEffect(() => {
    // Etkinlik tabloları yoksa ana sayfa yine açılmalı: hata yutulur, bölüm boş görünür.
    Promise.all([fetchTodayEvents(), fetchPlaces()])
      .then(([e, p]) => {
        setEvents(e);
        setPlaces(p);
      })
      .catch(() => {
        setEvents([]);
      });
  }, []);

  const wizardHref =
    `/sihirbaz?interests=${interest}&hours=${hours}&food=${wantsFood ? 1 : 0}`;

  const cards = [
    { label: t("home_card_culture"), href: "/sihirbaz", from: "from-brand" },
    { label: t("home_card_food"), href: "/sihirbaz", from: "from-accent" },
    { label: t("home_card_events"), href: "/akis", from: "from-brand" },
  ];

  const partners = ["Bursa Kart", "TEMA Vakfı", "Osmangazi Belediyesi", "Yerel esnaf"];

  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative py-14 sm:py-20">
        <Reveal>
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white">
            <span aria-hidden>●</span>
            {t("home_hero_badge")}
          </span>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">
            {t("home_hero_title_1")}
            <br />
            <span className="text-brand">{t("home_hero_title_2")}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{t("home_hero_lead")}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/sihirbaz"
              className="rounded-full bg-accent px-7 py-3 font-semibold text-white hover:opacity-90"
            >
              {t("home_hero_cta")} →
            </Link>
            <Link href="/akis" className="font-semibold underline underline-offset-4">
              {t("home_hero_secondary")} →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------- hızlı başlangıç çubuğu */}
      <Reveal>
        <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="block">
            <span className="text-xs font-semibold text-muted">{t("home_quick_what")}</span>
            <select
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 font-semibold"
            >
              {INTERESTS.map((i) => (
                <option key={i} value={i}>
                  {INTEREST_LABEL[lang][i]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-muted">{t("home_quick_time")}</span>
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 font-semibold"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h} {lang === "tr" ? "saat" : "hours"}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-muted">{t("wizard_meal")}</span>
            <select
              value={wantsFood ? "1" : "0"}
              onChange={(e) => setWantsFood(e.target.value === "1")}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 font-semibold"
            >
              <option value="1">{t("wizard_meal_yes")}</option>
              <option value="0">{t("wizard_meal_no")}</option>
            </select>
          </label>

          <Link
            href={wizardHref}
            className="flex items-center justify-center rounded-lg bg-accent px-6 py-2 font-semibold text-white hover:opacity-90 sm:mt-5"
          >
            {t("home_quick_cta")} →
          </Link>
        </div>
      </Reveal>

      {/* ------------------------------------------------------- Bursa'da bugün */}
      <section className="py-14">
        <Reveal>
          <h2 className="text-2xl font-bold sm:text-3xl">{t("home_today")}</h2>
        </Reveal>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.label} delay={i * 110}>
              <Link
                href={c.href}
                className={`flex h-44 items-end rounded-xl bg-gradient-to-br ${c.from} to-brand-soft p-5 transition-transform hover:-translate-y-1`}
              >
                <span className="text-lg font-bold text-white drop-shadow">{c.label} →</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------ etkinlikler ve duyurular */}
      <section className="border-t border-line py-14">
        <Reveal>
          <h2 className="text-2xl font-bold sm:text-3xl">{t("home_events_title")}</h2>
          <p className="mt-3 max-w-2xl text-muted">{t("home_events_lead")}</p>
        </Reveal>

        {events.length === 0 ? (
          <Reveal>
            <p className="mt-6 text-muted">{t("home_events_empty")}</p>
          </Reveal>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {events.map((e, i) => {
              const place = places.find((p) => p.id === e.place_id);
              return (
                <Reveal key={e.id} delay={i * 110}>
                  <div className="h-full rounded-xl border border-line bg-surface p-5">
                    <p className="text-sm font-semibold text-accent">
                      {clock(e.starts_at)} – {clock(e.ends_at)}
                    </p>
                    <h3 className="mt-2 font-semibold">{eventTitle(e, lang)}</h3>
                    {place && (
                      <p className="mt-1 text-sm text-muted">{placeName(place, lang)}</p>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>

      <ProblemCards />

      {/* ------------------------------------------------- bireysel mi geziyorsun */}
      <Reveal>
        <section className="my-4 rounded-2xl bg-brand px-6 py-10 text-white sm:px-10">
          <h2 className="max-w-2xl text-2xl font-bold sm:text-3xl">{t("home_solo_title")}</h2>
          <p className="mt-4 max-w-2xl text-white/80">{t("home_solo_body")}</p>
          <Link
            href="/kendi-rotam"
            className="mt-7 inline-block rounded-full bg-white px-6 py-3 font-semibold text-brand hover:opacity-90"
          >
            {t("home_solo_cta")} →
          </Link>
        </section>
      </Reveal>

      {/* ------------------------------------------------ iş birlikleri, sponsorlar */}
      <section className="border-t border-line py-14">
        <Reveal>
          <h2 className="text-2xl font-bold sm:text-3xl">{t("home_partners_title")}</h2>
          <p className="mt-3 max-w-2xl text-muted">{t("home_partners_lead")}</p>
        </Reveal>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {partners.map((p, i) => (
            <Reveal key={p} delay={i * 90}>
              <div className="flex h-24 items-center justify-center rounded-xl border border-line bg-surface p-4 text-center font-semibold text-muted">
                {p}
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
