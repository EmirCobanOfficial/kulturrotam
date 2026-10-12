"use client";

import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { useLang } from "@/lib/i18n";

/** Hakkımızda. Metin i18n sözlüğünde; buraya düz string gömme. */
export default function AboutPage() {
  const { t } = useLang();

  const sections = [
    { title: t("about_s1_title"), body: t("about_s1_body") },
    { title: t("about_s2_title"), body: t("about_s2_body") },
    { title: t("about_s3_title"), body: t("about_s3_body") },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="py-14 sm:py-20">
        <Reveal>
          <p className="text-sm font-bold uppercase tracking-widest text-accent">
            {t("about_eyebrow")}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            {t("about_title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{t("about_lead")}</p>
        </Reveal>

        <Reveal delay={120}>
          <Image
            src="/gorsel/hakkimizda-1.jpg"
            alt={t("about_title")}
            width={1600}
            height={900}
            priority
            className="mt-10 w-full rounded-2xl object-cover"
          />
        </Reveal>
      </section>

      <section className="border-t border-line py-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {sections.map((s, i) => (
            <Reveal key={s.title} delay={i * 110}>
              <div className="h-full rounded-xl border border-line bg-surface p-6">
                <h2 className="text-lg font-semibold">{s.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal>
        <section className="my-6 rounded-2xl bg-brand px-6 py-10 text-white sm:px-10">
          <h2 className="max-w-2xl text-2xl font-bold sm:text-3xl">
            {t("about_s3_title")}
          </h2>
          <p className="mt-4 max-w-2xl text-white/80">{t("about_s3_body")}</p>
        </section>
      </Reveal>

      <Reveal>
        <Image
          src="/gorsel/hakkimizda-2.jpg"
          alt={t("about_first_stop")}
          width={1600}
          height={900}
          className="mt-8 w-full rounded-2xl object-cover"
        />
      </Reveal>

      <section className="border-t border-line py-14">
        <Reveal>
          <h2 className="text-2xl font-bold sm:text-3xl">{t("about_first_stop")}</h2>
          <p className="mt-3 max-w-2xl text-muted">{t("about_closing")}</p>
          <Link
            href="/sihirbaz"
            className="btn rounded-full mt-7 bg-accent text-white hover:opacity-90"
          >
            {t("home_hero_secondary")} →
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
