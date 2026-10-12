import type { EventItem, Place, RoutePrefs, RouteStop } from "@/lib/types";
import { walkMinutes } from "./haversine";

/** Öğle ve akşam yemeği pencereleri, dakika cinsinden. */
const MEAL_WINDOWS: [number, number][] = [
  [12 * 60, 14 * 60],
  [19 * 60, 21 * 60],
];

/** Yakınlığı skora çevirirken 1 puan kaç dakika yürümeye bedel. */
const MINUTES_PER_SCORE_POINT = 8;

/** Bugün etkinliği olan mekan, bir ilgi alanı eşleşmesi kadar öne çıkar. */
const EVENT_BONUS = 10;

export function planRoute(
  prefs: RoutePrefs,
  places: Place[],
  events: EventItem[] = [],
): RouteStop[] {
  const eventByPlace = new Map(events.map((e) => [e.place_id, e]));
  const affordable = places.filter((p) => p.cost_level <= prefs.budget);
  const sights = affordable.filter((p) => p.category !== "yemek");
  const foods = affordable.filter((p) => p.category === "yemek");

  const endOfTrip = prefs.startHour * 60 + prefs.hours * 60;
  const stops: RouteStop[] = [];
  const pending = [...sights].sort(
    (a, b) => score(b, prefs, eventByPlace) - score(a, prefs, eventByPlace),
  );

  let clock = prefs.startHour * 60;
  let current: Place | null = null;
  let mealTaken = false;

  while (pending.length > 0) {
    if (prefs.wantsFood && !mealTaken && inMealWindow(clock)) {
      const meal = pickMeal(foods, current, clock, endOfTrip, eventByPlace);
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

    const index = pickNext(pending, current, prefs, eventByPlace);
    const place = pending[index];
    const travelMinutes = current ? walkMinutes(current, place) : 0;
    const stop = fit(place, clock, travelMinutes, endOfTrip, false, eventByPlace);

    pending.splice(index, 1);
    if (!stop) continue; // bu mekan sığmadı; diğerlerini dene

    stops.push(stop);
    clock = stop.departure;
    current = place;
  }

  // Açgözlü seçim hangi mekanlara gidileceğini iyi buluyor ama sırayı değil:
  // puan farkı yürüme cezasını yenebildiği için rota kendi üstünden geçiyordu
  // (sabah Tophane'ye çık, şehri dolaş, akşam 24 dk yürüyerek Tophane'ye dön).
  //
  // Seçimi olduğu gibi bırakıp yalnızca sırayı kısaltıyoruz, sonra zamanlamayı
  // baştan kuruyoruz. Yeni sıra bir durağı açılış saatine ya da süre bütçesine
  // kurban ederse kabul etmiyoruz: kısa rota uğruna durak kaybetmek kötü takas.
  const chosen = stops.filter((s) => !s.isMeal).map((s) => s.place);
  if (chosen.length > 2) {
    const candidate = schedule(
      optimizeOrder(chosen),
      foods,
      prefs,
      endOfTrip,
      eventByPlace,
    );
    const keepsEveryStop =
      candidate.filter((s) => !s.isMeal).length === chosen.length;
    if (keepsEveryStop && routeWalkMinutes(candidate) < routeWalkMinutes(stops)) {
      return candidate;
    }
  }

  return stops;
}

/** Rotadaki toplam yürüme, dakika. */
function routeWalkMinutes(stops: RouteStop[]): number {
  return stops.reduce((total, s) => total + s.travelMinutes, 0);
}

/**
 * Durak listesi sabitken zamanlamayı kurar: sıra verilen sıradır, seçim yapmaz.
 * Yemek molası yine ilk uygun yemek penceresinde araya girer.
 */
function schedule(
  ordered: Place[],
  foods: Place[],
  prefs: RoutePrefs,
  endOfTrip: number,
  eventByPlace: Map<string, EventItem>,
): RouteStop[] {
  const stops: RouteStop[] = [];
  let clock = prefs.startHour * 60;
  let current: Place | null = null;
  let mealTaken = false;

  for (const place of ordered) {
    if (prefs.wantsFood && !mealTaken && inMealWindow(clock)) {
      const meal = pickMeal(foods, current, clock, endOfTrip, eventByPlace);
      mealTaken = true;
      if (meal) {
        stops.push(meal);
        clock = meal.departure;
        current = meal.place;
      }
    }

    const travelMinutes = current ? walkMinutes(current, place) : 0;
    const stop = fit(place, clock, travelMinutes, endOfTrip, false, eventByPlace);
    if (!stop) continue;

    stops.push(stop);
    clock = stop.departure;
    current = place;
  }

  return stops;
}

/** İlgi alanı kesişimi + mekanın kendi puan ödülü + bugünkü etkinlik. */
function score(
  place: Place,
  prefs: RoutePrefs,
  eventByPlace: Map<string, EventItem>,
): number {
  const labels = new Set([place.category, ...place.tags]);
  const matches = prefs.interests.filter((i) => labels.has(i)).length;
  const bonus = eventByPlace.has(place.id) ? EVENT_BONUS : 0;
  return matches * 10 + place.points_reward / 50 + bonus;
}

/** Skoru yüksek ama yürüme mesafesi kısa olanı seç. */
function pickNext(
  pending: Place[],
  current: Place | null,
  prefs: RoutePrefs,
  eventByPlace: Map<string, EventItem>,
): number {
  let best = 0;
  let bestValue = -Infinity;
  pending.forEach((place, i) => {
    const travel = current ? walkMinutes(current, place) : 0;
    const value = score(place, prefs, eventByPlace) - travel / MINUTES_PER_SCORE_POINT;
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
  eventByPlace: Map<string, EventItem>,
): RouteStop | null {
  const sorted = current
    ? [...foods].sort((a, b) => walkMinutes(current, a) - walkMinutes(current, b))
    : foods;
  for (const food of sorted) {
    const travel = current ? walkMinutes(current, food) : 0;
    const stop = fit(food, clock, travel, endOfTrip, true, eventByPlace);
    if (stop) return stop;
  }
  return null;
}

/**
 * Mekanı saate yerleştir. Açılışı beklemek gerekiyorsa bekler;
 * kapanışa veya gezi süresine sığmıyorsa null döner.
 */
/** Seçilen sıradaki toplam yürüme süresi, dakika. */
export function totalWalkMinutes(places: Place[]): number {
  let total = 0;
  for (let i = 1; i < places.length; i += 1) {
    total += walkMinutes(places[i - 1], places[i]);
  }
  return total;
}

/**
 * Seçilen durakları en az yürümeyle gezilecek sıraya dizer.
 *
 * **İlk durak sabit kalır:** kullanıcı nereden başlayacağını bilerek seçiyor
 * (otelinin yanı, indiği durak). Gerisini en yakın komşuyla kurar, sonra 2-opt
 * ile kesişen bacakları düzeltir — "yanından geçip sonra geri dönme" durumunu
 * ortadan kaldıran adım bu.
 *
 * Durak sayısı tek haneli olduğu için bu kadarı yeterli; daha iyisi için
 * gereken karmaşıklık burada kendini ödemez.
 */
export function optimizeOrder(places: Place[]): Place[] {
  if (places.length < 3) return [...places];

  const rest = places.slice(1);
  const order: Place[] = [places[0]];

  while (rest.length > 0) {
    const last = order[order.length - 1];
    let best = 0;
    for (let i = 1; i < rest.length; i += 1) {
      if (walkMinutes(last, rest[i]) < walkMinutes(last, rest[best])) best = i;
    }
    order.push(rest.splice(best, 1)[0]);
  }

  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < order.length - 1; i += 1) {
      for (let k = i + 1; k < order.length; k += 1) {
        const candidate = [
          ...order.slice(0, i),
          ...order.slice(i, k + 1).reverse(),
          ...order.slice(k + 1),
        ];
        // Kayan nokta gürültüsünde sonsuz döngüye girmemek için küçük bir eşik.
        if (totalWalkMinutes(candidate) < totalWalkMinutes(order) - 0.001) {
          order.splice(0, order.length, ...candidate);
          improved = true;
        }
      }
    }
  }

  return order;
}

/**
 * Yeni bir mekanı listeye eklerken en az yürüme ekleyen konumu bulur.
 *
 * Sona eklemek, yolun ortasından geçtiğin bir yeri en sona atıyordu; bu
 * fonksiyon onu geçtiğin yere yerleştirir. İlk sırayı yine korur.
 */
export function bestInsertIndex(current: Place[], place: Place): number {
  if (current.length === 0) return 0;

  let bestIndex = current.length;
  let bestCost = Infinity;

  for (let i = 1; i <= current.length; i += 1) {
    const cost = totalWalkMinutes([...current.slice(0, i), place, ...current.slice(i)]);
    if (cost < bestCost) {
      bestCost = cost;
      bestIndex = i;
    }
  }

  return bestIndex;
}

/**
 * Kullanıcının kendi seçtiği sırayla rota kurar.
 *
 * Sihirbazdan farkı: eleme ve puanlama yok. Kullanıcı sırayı bilerek seçti,
 * bu yüzden hiçbir durak sessizce atılmaz — kapanışı aşan ziyaret `outsideHours`
 * ile işaretlenir ve kararı kullanıcıya bırakırız. Mekan henüz açılmadıysa
 * kapıda beklenir, varış saati açılışa çekilir.
 *
 * planRoute gibi saf fonksiyon: Supabase'den bağımsız, testli.
 */
export function planManualRoute(
  chosen: Place[],
  startHour: number,
  events: EventItem[] = [],
): RouteStop[] {
  const eventByPlace = new Map(events.map((e) => [e.place_id, e]));
  const stops: RouteStop[] = [];

  let clock = startHour * 60;
  let current: Place | null = null;

  for (const place of chosen) {
    const travelMinutes = current ? walkMinutes(current, place) : 0;
    const arrival = Math.max(clock + travelMinutes, place.open_hour * 60);
    const departure = arrival + place.visit_minutes;

    const event = eventByPlace.get(place.id);
    stops.push({
      place,
      arrival,
      departure,
      travelMinutes,
      isMeal: place.category === "yemek",
      ...(event ? { event } : {}),
      ...(departure > place.close_hour * 60 ? { outsideHours: true } : {}),
    });

    clock = departure;
    current = place;
  }

  return stops;
}

function fit(
  place: Place,
  clock: number,
  travelMinutes: number,
  endOfTrip: number,
  isMeal: boolean,
  eventByPlace: Map<string, EventItem>,
): RouteStop | null {
  const arrival = Math.max(clock + travelMinutes, place.open_hour * 60);
  const departure = arrival + place.visit_minutes;
  if (departure > place.close_hour * 60) return null;
  if (departure > endOfTrip) return null;
  const event = eventByPlace.get(place.id);
  return event
    ? { place, arrival, departure, travelMinutes, isMeal, event }
    : { place, arrival, departure, travelMinutes, isMeal };
}

function inMealWindow(minutes: number): boolean {
  return MEAL_WINDOWS.some(([from, to]) => minutes >= from && minutes < to);
}

export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
