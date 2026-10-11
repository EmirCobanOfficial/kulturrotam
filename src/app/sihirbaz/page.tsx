"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RoutePrefs } from "@/lib/types";

const INTERESTS = [
  { id: "tarihi", label: "Tarihi mekanlar" },
  { id: "muze", label: "Müzeler" },
  { id: "mimari", label: "Mimari" },
  { id: "manzara", label: "Manzara & fotoğraf" },
  { id: "alisveris", label: "Çarşı & alışveriş" },
  { id: "bahce", label: "Park & bahçe" },
];

const BUDGETS = [
  { value: 0, label: "Ücretsiz", sub: "Sadece bedava mekanlar" },
  { value: 1, label: "Ekonomik", sub: "Küçük girişler" },
  { value: 2, label: "Orta", sub: "Müze + yemek" },
  { value: 3, label: "Rahat", sub: "Fark etmez" },
];

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [startHour, setStartHour] = useState(10);
  const [hours, setHours] = useState(4);
  const [interests, setInterests] = useState<string[]>(["tarihi"]);
  const [budget, setBudget] = useState(2);
  const [wantsFood, setWantsFood] = useState(true);

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
    });
    void prefs;
    router.push(`/rota?${q.toString()}`);
  }

  const steps = [
    {
      title: "Ne zaman geziyorsun?",
      body: (
        <div className="space-y-6">
          <Field label={`Başlangıç saati: ${startHour}:00`}>
            <input
              type="range"
              min={8}
              max={18}
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="w-full accent-[var(--brand)]"
            />
          </Field>
          <Field label={`Kaç saat ayırıyorsun: ${hours} saat`}>
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
      title: "Neye ilgin var?",
      body: (
        <div className="grid grid-cols-2 gap-3">
          {INTERESTS.map((item) => {
            const active = interests.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleInterest(item.id)}
                className={`rounded-xl border p-4 text-left text-sm font-medium transition ${
                  active
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-line bg-surface hover:border-brand"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ),
    },
    {
      title: "Bütçen?",
      body: (
        <div className="grid grid-cols-2 gap-3">
          {BUDGETS.map((b) => {
            const active = budget === b.value;
            return (
              <button
                key={b.value}
                onClick={() => setBudget(b.value)}
                className={`rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-brand bg-brand-soft"
                    : "border-line bg-surface hover:border-brand"
                }`}
              >
                <div className="font-semibold">{b.label}</div>
                <div className="text-xs text-muted">{b.sub}</div>
              </button>
            );
          })}
        </div>
      ),
    },
    {
      title: "Yemek molası?",
      body: (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setWantsFood(true)}
            className={`rounded-xl border p-4 font-medium transition ${
              wantsFood ? "border-brand bg-brand-soft" : "border-line bg-surface"
            }`}
          >
            Evet, rotaya ekle
          </button>
          <button
            onClick={() => setWantsFood(false)}
            className={`rounded-xl border p-4 font-medium transition ${
              !wantsFood ? "border-brand bg-brand-soft" : "border-line bg-surface"
            }`}
          >
            Hayır, gerek yok
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
            Geri
          </button>
        )}
        <button
          onClick={() => (last ? submit() : setStep((s) => s + 1))}
          disabled={step === 1 && interests.length === 0}
          className="ml-auto rounded-full bg-brand px-6 py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-40"
        >
          {last ? "Rotamı çiz" : "Devam"}
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
