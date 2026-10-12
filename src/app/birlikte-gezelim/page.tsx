"use client";

import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { useLang } from "@/lib/i18n";

/**
 * Birlikte Gezelim.
 *
 * Eşleştirme henüz yazılmadı; sayfa programı anlatıyor ve bunu açıkça
 * söylüyor. Çalışmayan bir "katıl" düğmesi koymaktansa, bugün gerçekten
 * işleyen iki rotaya yönlendiriyoruz.
 */
export default function TogetherPage() {
  const { t } = useLang();

  return (
    <div className="mx-auto max-w-3xl px-4">
      <section className="py-14 sm:py-20">
        <Reveal>
          <p className="text-sm font-bold uppercase tracking-widest text-accent">
            {t("nav_together")}
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
            {t("bg_title")}
          </h1>
          <p className="mt-5 text-xl text-brand">{t("bg_lead")}</p>
          <p className="mt-6 text-muted">{t("bg_p1")}</p>
        </Reveal>

        <Reveal delay={120}>
          <Image
            src="/gorsel/birlikte-1.jpg"
            alt={t("bg_title")}
            width={1600}
            height={1067}
            priority
            className="mt-10 w-full rounded-2xl object-cover"
          />
        </Reveal>
      </section>

      <Reveal>
        <section className="border-t border-line py-10">
          <h2 className="text-2xl font-bold">{t("bg_h1")}</h2>
          <p className="mt-4 leading-relaxed text-muted">{t("bg_b1")}</p>
        </section>
      </Reveal>

      <Reveal delay={80}>
        <Image
          src="/gorsel/birlikte-2.jpg"
          alt={t("bg_h2")}
          width={1600}
          height={1067}
          className="w-full rounded-2xl object-cover"
        />
      </Reveal>

      <Reveal>
        <section className="border-t border-line py-10">
          <h2 className="text-2xl font-bold">{t("bg_h2")}</h2>
          <p className="mt-4 leading-relaxed text-muted">{t("bg_b2")}</p>
        </section>
      </Reveal>

      <Reveal>
        <section className="mb-16 rounded-2xl bg-brand px-6 py-10 text-white sm:px-10">
          <p className="text-lg font-semibold">{t("bg_soon")}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/sihirbaz"
              className="rounded-full bg-white px-6 py-3 font-semibold text-brand hover:opacity-90"
            >
              {t("bg_cta1")} →
            </Link>
            <Link
              href="/kendi-rotam"
              className="rounded-full border border-white/50 px-6 py-3 font-semibold hover:bg-white/10"
            >
              {t("bg_cta2")} →
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
