"use client";

import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import TicketContribution from "@/components/TicketContribution";
import { useLang } from "@/lib/i18n";

/**
 * Birlikte Gezelim. Metinler takımın yazdığı gibi, i18n sözlüğünde.
 *
 * Geziler henüz planlanıyor; bilet satışı yok. "Planlanan Gezileri İncele"
 * etkinlikler sayfasına gidiyor — çalışmayan bir satın alma düğmesi koymuyoruz.
 */
export default function TogetherPage() {
  const { t } = useLang();

  return (
    <div className="mx-auto max-w-3xl px-4">
      <section className="py-12 sm:py-16">
        <Reveal>
          <p className="text-sm font-bold uppercase tracking-widest text-accent">
            {t("nav_together")}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
            {t("bg_title")}
          </h1>
          <p className="mt-4 text-lg text-brand">{t("bg_lead")}</p>
        </Reveal>

        <Reveal delay={120}>
          <Image
            src="/gorsel/birlikte-hero.jpg"
            alt={t("bg_title")}
            width={1600}
            height={900}
            priority
            className="mt-8 w-full rounded-2xl object-cover"
          />
        </Reveal>

        <Reveal delay={60}>
          <p className="mt-8 leading-relaxed text-muted">{t("bg_p1")}</p>
        </Reveal>
      </section>

      <Reveal>
        <Image
          src="/gorsel/birlikte-rehber.jpg"
          alt={t("bg_p1")}
          width={1600}
          height={1067}
          className="w-full rounded-2xl object-cover"
        />
      </Reveal>

      <Reveal>
        <section className="border-t border-line py-10">
          <h2 className="text-2xl font-bold">{t("bg_h1")}</h2>
          <p className="mt-4 leading-relaxed text-muted">{t("bg_b1")}</p>
        </section>
      </Reveal>

      <Reveal delay={60}>
        <section className="border-t border-line py-10">
          <h2 className="text-2xl font-bold">{t("bg_h2")}</h2>
          <p className="mt-4 leading-relaxed text-muted">{t("bg_b2")}</p>
        </section>
      </Reveal>

      <Reveal>
        <section className="rounded-2xl bg-brand px-6 py-10 text-white sm:px-10">
          <p className="text-xl font-semibold">{t("bg_lead")}</p>
          <Link
            href="/etkinlikler"
            className="btn rounded-full mt-7 bg-white text-brand hover:opacity-90"
          >
            {t("bg_cta1")} →
          </Link>
        </section>
      </Reveal>

      <section className="py-10">
        <Reveal>
          <TicketContribution />
        </Reveal>
      </section>
    </div>
  );
}
