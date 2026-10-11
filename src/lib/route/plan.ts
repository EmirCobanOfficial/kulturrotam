import type { Place, RoutePrefs, RouteStop } from "@/lib/types";
import { walkMinutes } from "./haversine";

/** Öğle ve akşam yemeği pencereleri, dakika cinsinden. */
const MEAL_WINDOWS: [number, number][] = [
  [12 * 60, 14 * 60],
  [19 * 60, 21 * 60],
];

/** Yakınlığı skora çevirirken 1 puan kaç dakika yürümeye bedel. */
const MINUTES_PER_SCORE_POINT = 8;

export function planRoute(prefs: RoutePrefs, places: Place[]): RouteStop[] {
  const affordable = places.filter((p) => p.cost_level <= prefs.budget);
  const sights = affordable.filter((p) => p.category !== "yemek");
  const foods = affordable.filter((p) => p.category === "yemek");

  const endOfTrip = prefs.startHour * 60 + prefs.hours * 60;
  const stops: RouteStop[] = [];
  const pending = [...sights].sort((a, b) => score(b, prefs) - score(a, prefs));

  let clock = prefs.startHour * 60;
  let current: Place | null = null;
  let mealTaken = false;

  while (pending.length > 0) {
    if (prefs.wantsFood && !mealTaken && inMealWindow(clock)) {
      const meal = pickMeal(foods, current, clock, endOfTrip);
      if (meal) {
        stops.push(meal);
        clock = meal.departure;
        current = meal.place;
        mealTaken = true;
        continue;
      }
      // Uygun yemek yeri yok: bir daha deneme, geziye devam.
      mealTaken = true;
    }

    const index = pickNext(pending, current, prefs);
    const place = pending[index];
    const travelMinutes = current ? walkMinutes(current, place) : 0;
    const stop = fit(place, clock, travelMinutes, endOfTrip, false);

    pending.splice(index, 1);
    if (!stop) continue; // bu mekan sığmadı; diğerlerini dene

    stops.push(stop);
    clock = stop.departure;
    current = place;
  }

  return stops;
}

/** İlgi alanı kesişimi + mekanın kendi puan ödülü. */
function score(place: Place, prefs: RoutePrefs): number {
  const labels = new Set([place.category, ...place.tags]);
  const matches = prefs.interests.filter((i) => labels.has(i)).length;
  return matches * 10 + place.points_reward / 50;
}

/** Skoru yüksek ama yürüme mesafesi kısa olanı seç. */
function pickNext(pending: Place[], current: Place | null, prefs: RoutePrefs): number {
  let best = 0;
  let bestValue = -Infinity;
  pending.forEach((place, i) => {
    const travel = current ? walkMinutes(current, place) : 0;
    const value = score(place, prefs) - travel / MINUTES_PER_SCORE_POINT;
    if (value > bestValue) {
      bestValue = value;
      best = i;
    }
  });
  return best;
}

function pickMeal(
  foods: Place[],
  current: Place | null,
  clock: number,
  endOfTrip: number,
): RouteStop | null {
  const sorted = current
    ? [...foods].sort((a, b) => walkMinutes(current, a) - walkMinutes(current, b))
    : foods;
  for (const food of sorted) {
    const travel = current ? walkMinutes(current, food) : 0;
    const stop = fit(food, clock, travel, endOfTrip, true);
    if (stop) return stop;
  }
  return null;
}

/**
 * Mekanı saate yerleştir. Açılışı beklemek gerekiyorsa bekler;
 * kapanışa veya gezi süresine sığmıyorsa null döner.
 */
function fit(
  place: Place,
  clock: number,
  travelMinutes: number,
  endOfTrip: number,
  isMeal: boolean,
): RouteStop | null {
  const arrival = Math.max(clock + travelMinutes, place.open_hour * 60);
  const departure = arrival + place.visit_minutes;
  if (departure > place.close_hour * 60) return null;
  if (departure > endOfTrip) return null;
  return { place, arrival, departure, travelMinutes, isMeal };
}

function inMealWindow(minutes: number): boolean {
  return MEAL_WINDOWS.some(([from, to]) => minutes >= from && minutes < to);
}

export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
