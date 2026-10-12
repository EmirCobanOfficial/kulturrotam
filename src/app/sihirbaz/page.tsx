"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BUDGET_LABEL, INTEREST_LABEL, useLang } from "@/lib/i18n";
import type { RoutePrefs } from "@/lib/types";

const INTERESTS = ["tarihi", "muze", "mimari", "manzara", "alisveris", "bahce"];

const BUDGETS = [0, 1, 2, 3];

export default function WizardPage() {
  const router = useRouter();
  const { lang, t } = useLang();
  const [step, setStep] = useState(0);
  const [startHour, setStartHour] = useState(10);
  const [hours, setHours] = useState(4);
  const [interests, setInterests] = useState<string[]>(["tarihi"]);
  const [budget, setBudget] = useState(2);
  const [wantsFood, setWantsFood] = useState(true);
  /** Ana sayfadan gelen gün; rotadaki etkinlik rozeti bu güne bakar. */
  const [date, setDate] = useState<string | null>(null);

  // Ana sayfadaki hızlı başlangıç çubuğundan gelen seçimleri uygula.
  // useSearchParams yerine mount sonrası okuyoruz: sayfa statik kalır ve
  // sunucu/istemci arasında hydration uyuşmazlığı çıkmaz.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);

    const fromUrl = (q.get("interests") ?? "").split(",").filter(Boolean);
    const known = fromUrl.filter((i) => INTERESTS.includes(i));
    if (known.length > 0) setInterests(known);

    const h = Number(q.get("hours"));
    if (Number.isFinite(h) && h >= 1 && h <= 12) setHours(h);

    const food = q.get("food");
    if (food === "1" || food === "0") setWantsFood(food === "1");

    const d = q.get("date");
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) setDate(d);
  }, []);

  function toggleInterest(id: string) {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }

  function submit() {
    const prefs: RoutePrefs = { startHour, hours, interests, budget, wantsFood };
    const q = new URLSearchParams({
      start: String(startHour),
      hours: String(hours),
      budget: String(budget),
      food: wantsFood ? "1" : "0",
      interests: interests.join(","),
      ...(date ? { date } : {}),
    });
    void prefs;
    router.push(`/rota?${q.toString()}`);
  }

  const steps = [
    {
      title: t("wizard_when"),
      body: (
        <div className="space-y-6">
          <Field label={`${t("wizard_start")}: ${startHour}:00`}>
            <input
              type="range"
              min={8}
              max={18}
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="w-full accent-[var(--brand)]"
            />
          </Field>
          <Field label={`${t("wizard_hours")}: ${hours} ${t("hours_unit")}`}>
            <input
              type="range"
              min={2}
              max={10}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full accent-[var(--brand)]"
            />
          </Field>
        </div>
      ),
    },
    {
      title: t("wizard_interests"),
      body: (
        <div className="grid grid-cols-2 gap-3">
          {INTERESTS.map((id) => {
            const active = interests.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleInterest(id)}
                className={`rounded-xl border p-4 text-left text-sm font-medium transition ${
                  active
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-line bg-surface hover:border-brand"
                }`}
              >
                {INTEREST_LABEL[lang][id]}
              </button>
            );
          })}
        </div>
      ),
    },
    {
      title: t("wizard_budget"),
      body: (
        <div className="grid grid-cols-2 gap-3">
          {BUDGETS.map((value) => {
            const active = budget === value;
            return (
              <button
                key={value}
                onClick={() => setBudget(value)}
                className={`rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-brand bg-brand-soft"
                    : "border-line bg-surface hover:border-brand"
                }`}
              >
                <div className="font-semibold">{BUDGET_LABEL[lang][value].label}</div>
                <div className="text-xs text-muted">{BUDGET_LABEL[lang][value].sub}</div>
              </button>
            );
          })}
        </div>
      ),
    },
    {
      title: t("wizard_meal"),
      body: (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setWantsFood(true)}
            className={`rounded-xl border p-4 font-medium transition ${
              wantsFood ? "border-brand bg-brand-soft" : "border-line bg-surface"
            }`}
          >
            {t("wizard_meal_yes")}
          </button>
          <button
            onClick={() => setWantsFood(false)}
            className={`rounded-xl border p-4 font-medium transition ${
              !wantsFood ? "border-brand bg-brand-soft" : "border-line bg-surface"
            }`}
          >
            {t("wizard_meal_no")}
          </button>
        </div>
      ),
    },
  ];

  const last = step === steps.length - 1;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="mb-6 flex gap-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= step ? "bg-brand" : "bg-line"
            }`}
          />
        ))}
      </div>

      <h1 className="text-2xl font-bold">{steps[step].title}</h1>
      <div className="mt-6">{steps[step].body}</div>

      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="rounded-full border border-line bg-surface px-5 py-2.5 font-medium hover:bg-brand-soft"
          >
            {t("wizard_back")}
          </button>
        )}
        <button
          onClick={() => (last ? submit() : setStep((s) => s + 1))}
          disabled={step === 1 && interests.length === 0}
          className="ml-auto rounded-full bg-brand px-6 py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-40"
        >
          {last ? t("wizard_submit") : t("wizard_next")}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block font-medium">{label}</label>
      {children}
    </div>
  );
}
