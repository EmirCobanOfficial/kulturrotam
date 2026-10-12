"use client";

import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import TicketContribution from "@/components/TicketContribution";
import { useLang } from "@/lib/i18n";

/** Sosyal etki programının ayrıntı sayfası. Metinler i18n sözlüğünde. */
export default function FirstMeetingPage() {
  const { t } = useLang();

  const sections = [
    { h: t("bib_h1"), body: [t("bib_b1a"), t("bib_b1b")] },
    { h: t("bib_h2"), body: [t("bib_b2a"), t("bib_b2b")] },
    { h: t("bib_h3"), body: [t("bib_b3a")] },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4">
      <section className="py-14 sm:py-20">
        <Reveal>
          <p className="text-sm font-bold uppercase tracking-widest text-accent">
            {t("nav_social")}
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
            {t("bib_title")}
          </h1>
          <p className="mt-5 text-xl text-brand">{t("bib_lead")}</p>
          <p className="mt-6 text-muted">{t("bib_intro1")}</p>
          <p className="mt-4 text-muted">{t("bib_intro2")}</p>
        </Reveal>

        <Reveal delay={120}>
          <Image
            src="/gorsel/sosyal-1.jpg"
            alt={t("bib_title")}
            width={1600}
            height={1067}
            priority
            className="mt-10 w-full rounded-2xl object-cover"
          />
        </Reveal>
      </section>

      {sections.map((s, i) => (
        <Reveal key={s.h} delay={i * 80}>
          <section className="border-t border-line py-10">
            <h2 className="text-2xl font-bold">{s.h}</h2>
            {s.body.map((paragraph) => (
              <p key={paragraph} className="mt-4 leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
          </section>
        </Reveal>
      ))}

      <Reveal>
        <Image
          src="/gorsel/sosyal-2.jpg"
          alt={t("bib_h1")}
          width={1600}
          height={1067}
          className="mb-8 w-full rounded-2xl object-cover"
        />
      </Reveal>

      <Reveal>
        <section className="my-6 rounded-2xl bg-brand px-6 py-10 text-white sm:px-10">
          <p className="text-xl font-semibold">{t("bib_closing")}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/etkinlikler"
              className="rounded-full bg-white px-6 py-3 font-semibold text-brand hover:opacity-90"
            >
              {t("bib_cta1")} →
            </Link>
            <a
              href="mailto:emircobanoffical@gmail.com?subject=Bursa%27yla%20%C4%B0lk%20Bulu%C5%9Fma%20-%20i%C5%9F%20birli%C4%9Fi"
              className="rounded-full border border-white/50 px-6 py-3 font-semibold hover:bg-white/10"
            >
              {t("bib_cta2")}
            </a>
          </div>
        </section>
      </Reveal>

      <section className="pb-16">
        <Reveal>
          <TicketContribution />
        </Reveal>
      </section>
    </div>
  );
}
