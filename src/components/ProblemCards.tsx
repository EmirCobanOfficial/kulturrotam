"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import { useLang } from "@/lib/i18n";
import type { TextKey } from "@/lib/i18n";

/**
 * Problem kartları. Her kartın soru işareti düğmesi, o problemi nasıl
 * çözdüğümüzü açar — jüri "peki siz ne yapıyorsunuz?" diye sormadan
 * cevabı kartın içinde bulur.
 */
const ITEMS: { t: TextKey; b: TextKey; a: TextKey }[] = [
  { t: "prob1_t", b: "prob1_b", a: "prob1_a" },
  { t: "prob2_t", b: "prob2_b", a: "prob2_a" },
  { t: "prob3_t", b: "prob3_b", a: "prob3_a" },
];

export default function ProblemCards() {
  const { t } = useLang();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="border-t border-line py-14">
      <Reveal>
        <h2 className="text-2xl font-bold sm:text-3xl">{t("home_problem_title")}</h2>
      </Reveal>

      <div className="mt-6 grid items-start gap-4 sm:grid-cols-3">
        {ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={item.t} delay={i * 110}>
              <div className="h-full rounded-xl border border-line bg-surface p-5">
                <div className="flex items-start gap-3">
                  <h3 className="font-semibold">{t(item.t)}</h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-label={isOpen ? t("home_problem_close") : t("home_problem_hint")}
                    title={isOpen ? t("home_problem_close") : t("home_problem_hint")}
                    className={`ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-bold transition-colors ${
                      isOpen
                        ? "border-accent bg-accent text-white"
                        : "border-line text-accent hover:bg-accent-soft"
                    }`}
                  >
                    {isOpen ? "×" : "?"}
                  </button>
                </div>

                <p className="mt-2 text-sm text-muted">{t(item.b)}</p>

                {isOpen && (
                  <div className="mt-4 rounded-lg bg-brand-soft p-4">
                    <p className="text-sm font-semibold text-brand">
                      {t("home_problem_hint")}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">{t(item.a)}</p>
                  </div>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
