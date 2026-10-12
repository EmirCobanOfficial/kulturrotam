import type { Lang } from "@/lib/i18n";

/** Bugünden itibaren `count` günlük liste. Saat bileşeni sıfırlanır. */
export function nextDays(count: number): Date[] {
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d;
  });
}

/** "2026-10-15" — sorgu parametresi ve karşılaştırma için. */
export function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** "2026-10-15" metnini yerel güne çevirir; geçersizse bugünü döner. */
export function fromISODate(value: string | null | undefined): Date {
  const today = new Date();
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return today;
  const [y, m, d] = value.split("-").map(Number);
  const parsed = new Date(y, m - 1, d);
  return Number.isNaN(parsed.getTime()) ? today : parsed;
}

export function isSameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b);
}

/** "Çarşamba, 15 Ekim" — bugünse "Bugün". */
export function dayLabel(d: Date, lang: Lang): string {
  if (isSameDay(d, new Date())) return lang === "tr" ? "Bugün" : "Today";
  return d.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
