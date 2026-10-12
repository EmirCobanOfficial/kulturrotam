"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProblemCards from "@/components/ProblemCards";
import Reveal from "@/components/Reveal";
import { fetchEventsOn, fetchPlaces } from "@/lib/data";
import { dayLabel, isSameDay, nextDays, toISODate } from "@/lib/dates";
import { INTEREST_LABEL, eventTitle, placeName, useLang } from "@/lib/i18n";
import type { EventItem, Place } from "@/lib/types";

// Sihirbazdaki listeyle birebir aynı olmalı: seçim oraya parametre olarak taşınıyor.
const INTERESTS = [
  "tarihi",
  "muze",
  "kulturel",
  "konser-sinema",
  "manzara",
  "alisveris",
] as const;
/** Önümüzdeki iki hafta: "haftaya çarşamba oradayım" sorusu bu aralığa düşer. */
const DAYS = 14;

/** "15:00" — saat dilimi sürprizi olmasın diye yerel saate çeviriyoruz. */
function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home() {
  const { t, lang } = useLang();

  // Hızlı başlangıç çubuğu: seçimler sihirbaza sorgu parametresi olarak taşınır.
  const [interest, setInterest] = useState<string>(INTERESTS[0]);
  const [wantsFood, setWantsFood] = useState(true);
  const [dayIndex, setDayIndex] = useState(0);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);

  const days = useMemo(() => nextDays(DAYS), []);
  const selectedDay = days[dayIndex] ?? days[0];

  useEffect(() => {
    fetchPlaces()
      .then(setPlaces)
      .catch(() => setPlaces([]));
  }, []);

  useEffect(() => {
    // Etkinlik tabloları yoksa ana sayfa yine açılmalı: hata yutulur, bölüm boş görünür.
    fetchEventsOn(selectedDay)
      .then(setEvents)
      .catch(() => setEvents([]));
  }, [selectedDay]);

  /**
   * Çubuk tarihi, ilgi alanını ve yemek molasını alır; saati ve bütçeyi
   * sihirbaz sorar. Burada sorulanlar sihirbazda hazır gelir, kullanıcı
   * aynı soruyu iki kez cevaplamaz.
   */
  const wizardHref =
    `/sihirbaz?interests=${interest}&food=${wantsFood ? 1 : 0}` +
    `&date=${toISODate(selectedDay)}`;

  // image verilen kart fotoğrafla, verilmeyen renk geçişiyle çizilir;
  // diğer iki fotoğraf gelince aynı alana düşer.
  const cards = [
    {
      label: t("home_card_culture"),
      href: "/sihirbaz",
      from: "from-brand",
      image: "/gorsel/kart-kultur.jpg",
    },
    {
      label: t("home_card_food"),
      href: "/sihirbaz",
      from: "from-accent",
      image: "/gorsel/kart-lezzet.webp",
    },
    {
      label: t("home_card_events"),
      href: "/etkinlikler",
      from: "from-brand",
      image: "/gorsel/etkinlik-muzede-bir-gece.jpg",
    },
  ];

  const partners = [
    "Bursa Kart",
    "TEMA Vakfı",
    "Osmangazi Belediyesi",
    "Yerel esnaf",
  ];

  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative mt-6 overflow-hidden rounded-3xl">
        <Image
          src="/gorsel/hero.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover"
        />
        {/*
          Metin fotoğrafın üstünde duruyor; perde olmadan okunmuyor.
          Telefonda yazı tüm genişliği kapladığı için düz bir perde,
          geniş ekranda soldan sağa açılan bir geçiş: yazı kremin üstünde
          kalırken fotoğraf sağda görünür.
        */}
        <div className="absolute inset-0 bg-background/55 sm:bg-gradient-to-r sm:from-background sm:from-0% sm:via-background/68 sm:via-30% sm:to-transparent sm:to-62%" />
        <div className="relative px-6 py-14 sm:px-10 sm:py-28">
          <Reveal>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white">
              <span aria-hidden>●</span>
              {t("home_hero_badge")}
            </span>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight [text-shadow:0_1px_10px_rgba(251,247,241,0.95)] sm:text-6xl">
              {t("home_hero_title_1")}
              <br />
              <span className="text-brand">{t("home_hero_title_2")}</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-medium text-muted [text-shadow:0_1px_8px_rgba(251,247,241,0.95)]">
              {t("home_hero_lead")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/sihirbaz"
                className="btn rounded-full bg-accent text-white hover:opacity-90"
              >
                {t("home_hero_cta")} →
              </Link>
              <Link
                href="/akis"
                className="font-semibold underline underline-offset-4"
              >
                {t("home_hero_secondary")} →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------- hızlı başlangıç çubuğu */}
      <Reveal>
        <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="block">
            <span className="text-xs font-semibold text-muted">
              {t("home_quick_date")}
            </span>
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

          <label className="block">
            <span className="text-xs font-semibold text-muted">
              {t("home_quick_what")}
            </span>
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
            <span className="text-xs font-semibold text-muted">
              {t("wizard_meal")}
            </span>
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
            className="btn rounded-lg bg-accent text-white hover:opacity-90 sm:mt-5"
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
                className={`relative flex h-44 items-end overflow-hidden rounded-xl p-5 transition-transform hover:-translate-y-1 ${
                  c.image ? "bg-foreground" : `bg-gradient-to-br ${c.from} to-brand-soft`
                }`}
              >
                {c.image && (
                  <>
                    <Image
                      src={c.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 320px"
                      className="object-cover"
                    />
                    {/* Yazı fotoğrafın üstünde; alttan koyuya giden perde onu taşır. */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                  </>
                )}
                <span className="relative text-lg font-bold text-white drop-shadow">
                  {c.label} →
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------ etkinlikler ve duyurular */}
      <section className="border-t border-line py-14">
        <Reveal>
          <h2 className="text-2xl font-bold sm:text-3xl">
            {isSameDay(selectedDay, new Date())
              ? t("home_events_title")
              : `${dayLabel(selectedDay, lang)} ${t("home_events_on")}`}
          </h2>
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
                    <h3 className="mt-2 font-semibold">
                      {eventTitle(e, lang)}
                    </h3>
                    {place && (
                      <p className="mt-1 text-sm text-muted">
                        {placeName(place, lang)}
                      </p>
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
          <h2 className="max-w-2xl text-2xl font-bold sm:text-3xl">
            {t("home_solo_title")}
          </h2>
          <p className="mt-4 max-w-2xl text-white/80">{t("home_solo_body")}</p>
          <Link
            href="/kendi-rotam"
            className="btn rounded-full mt-7 bg-white text-brand hover:opacity-90"
          >
            {t("home_solo_cta")} →
          </Link>
        </section>
      </Reveal>

      {/* ------------------------------------------------------- sosyal etkimiz */}
      <Reveal>
        <section className="my-4 rounded-2xl border border-green-600/40 bg-green-50 px-6 py-10 sm:px-10">
          <h2 className="max-w-2xl text-2xl font-bold text-green-900 sm:text-3xl">
            {t("si_title")}
          </h2>
          <p className="mt-4 max-w-2xl text-green-900/80">{t("si_p1")}</p>
          <p className="mt-3 max-w-2xl text-green-900/80">{t("si_p2")}</p>
          <p className="mt-3 max-w-2xl text-green-900/80">{t("si_p3")}</p>
          <Link
            href="/bursayla-ilk-bulusma"
            className="btn rounded-full mt-7 bg-green-700 text-white hover:opacity-90"
          >
            {t("si_cta")} →
          </Link>
        </section>
      </Reveal>

      {/* ------------------------------------------------ iş birlikleri, sponsorlar */}
      <section className="border-t border-line py-14">
        <Reveal>
          <h2 className="text-2xl font-bold sm:text-3xl">
            {t("home_partners_title")}
          </h2>
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
