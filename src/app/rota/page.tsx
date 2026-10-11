import RouteView from "@/components/RouteView";
import type { RoutePrefs } from "@/lib/types";

export default async function RoutePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const prefs: RoutePrefs = {
    startHour: clamp(Number(sp.start), 8, 18, 10),
    hours: clamp(Number(sp.hours), 2, 10, 4),
    budget: clamp(Number(sp.budget), 0, 3, 2),
    wantsFood: sp.food !== "0",
    interests: (sp.interests ?? "tarihi").split(",").filter(Boolean),
  };
  return <RouteView prefs={prefs} />;
}

function clamp(n: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
