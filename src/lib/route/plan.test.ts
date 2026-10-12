import { describe, expect, it } from "vitest";
import {
  bestInsertIndex,
  optimizeOrder,
  planManualRoute,
  planRoute,
  totalWalkMinutes,
} from "./plan";
import type { EventItem, Place, RoutePrefs } from "@/lib/types";

function place(over: Partial<Place> & { slug: string }): Place {
  return {
    id: over.slug,
    name_tr: over.slug,
    name_en: null,
    category: "tarihi",
    lat: 40.183,
    lng: 29.062,
    visit_minutes: 30,
    cost_level: 0,
    open_hour: 8,
    close_hour: 20,
    tags: [],
    description_tr: null,
    description_en: null,
    image_url: null,
    qr_token: over.slug,
    points_reward: 50,
    sort_order: 0,
    ...over,
  };
}

const prefs: RoutePrefs = {
  startHour: 10,
  hours: 4,
  interests: ["tarihi"],
  budget: 1,
  wantsFood: true,
};

describe("planRoute", () => {
  it("bütçe üstü mekanları eler", () => {
    const stops = planRoute({ ...prefs, wantsFood: false }, [
      place({ slug: "ucuz", cost_level: 1 }),
      place({ slug: "pahali", cost_level: 3 }),
    ]);
    expect(stops.map((s) => s.place.slug)).toEqual(["ucuz"]);
  });

  it("gezi saatinde kapalı olan mekanı atlar", () => {
    const stops = planRoute({ ...prefs, wantsFood: false }, [
      place({ slug: "acik" }),
      place({ slug: "aksam-acilir", open_hour: 18, close_hour: 23 }),
    ]);
    expect(stops.map((s) => s.place.slug)).toEqual(["acik"]);
  });

  it("öğle penceresine yemek molası ekler", () => {
    const stops = planRoute(prefs, [
      place({ slug: "gezi-1", visit_minutes: 60 }),
      place({ slug: "gezi-2", visit_minutes: 60 }),
      place({ slug: "gezi-3", visit_minutes: 60 }),
      place({ slug: "lokanta", category: "yemek", visit_minutes: 45, open_hour: 11, close_hour: 23 }),
    ]);
    const meal = stops.find((s) => s.isMeal);
    expect(meal?.place.slug).toBe("lokanta");
    expect(meal!.arrival).toBeGreaterThanOrEqual(12 * 60);
    expect(meal!.arrival).toBeLessThan(14 * 60);
  });

  it("toplam süreyi aşmaz", () => {
    const stops = planRoute(prefs, [
      place({ slug: "a", visit_minutes: 90 }),
      place({ slug: "b", visit_minutes: 90 }),
      place({ slug: "c", visit_minutes: 90 }),
      place({ slug: "d", visit_minutes: 90 }),
    ]);
    const last = stops[stops.length - 1];
    expect(last.departure).toBeLessThanOrEqual(prefs.startHour * 60 + prefs.hours * 60);
  });

  it("yemek istenmezse yemek mekanı rotaya girmez", () => {
    const stops = planRoute({ ...prefs, wantsFood: false }, [
      place({ slug: "gezi", visit_minutes: 60 }),
      place({ slug: "lokanta", category: "yemek", open_hour: 11, close_hour: 23 }),
    ]);
    expect(stops.some((s) => s.place.category === "yemek")).toBe(false);
  });
});

function event(placeId: string): EventItem {
  return {
    id: `ev-${placeId}`,
    place_id: placeId,
    title_tr: "etkinlik",
    title_en: null,
    starts_at: "2026-10-11T10:00:00Z",
    ends_at: "2026-10-11T18:00:00Z",
    source: "belediye",
  };
}

describe("planRoute etkinlikler", () => {
  it("etkinlikli mekanı öne alır", () => {
    const places = [
      place({ slug: "sade", lat: 40.183, lng: 29.062 }),
      place({ slug: "etkinlikli", lat: 40.183, lng: 29.062 }),
    ];
    const stops = planRoute({ ...prefs, wantsFood: false }, places, [event("etkinlikli")]);
    expect(stops[0].place.slug).toBe("etkinlikli");
  });

  it("etkinliği durağa iliştirir, diğer duraklarda bırakmaz", () => {
    const places = [place({ slug: "a" }), place({ slug: "b" })];
    const stops = planRoute({ ...prefs, wantsFood: false }, places, [event("a")]);
    const withEvent = stops.find((s) => s.place.slug === "a");
    const without = stops.find((s) => s.place.slug === "b");
    expect(withEvent?.event?.title_tr).toBe("etkinlik");
    expect(without?.event).toBeUndefined();
  });

  it("etkinlik listesi boşken eskisi gibi çalışır", () => {
    const places = [place({ slug: "a" }), place({ slug: "b" })];
    expect(planRoute({ ...prefs, wantsFood: false }, places)).toHaveLength(2);
  });
});

describe("planManualRoute", () => {
  it("kullanıcının seçtiği sırayı korur, skora göre yeniden sıralamaz", () => {
    const a = place({ slug: "a", name_tr: "A" });
    const b = place({ slug: "b", name_tr: "B" });
    const c = place({ slug: "c", name_tr: "C" });

    const stops = planManualRoute([c, a, b], 10);

    expect(stops.map((s) => s.place.slug)).toEqual(["c", "a", "b"]);
  });

  it("ilk durakta yürüme süresi yok, sonrakilerde varış ziyaretle ilerler", () => {
    const a = place({ slug: "a", visit_minutes: 45 });
    const b = place({ slug: "b", visit_minutes: 30 });

    const [first, second] = planManualRoute([a, b], 10);

    expect(first.travelMinutes).toBe(0);
    expect(first.arrival).toBe(10 * 60);
    expect(first.departure).toBe(10 * 60 + 45);
    // Aynı koordinattalar: yürüme 0, yani ikinci durak birincinin bitişinde başlar.
    expect(second.arrival).toBe(first.departure);
    expect(second.departure).toBe(first.departure + 30);
  });

  it("mekan henüz açılmadıysa varışı açılış saatine çeker", () => {
    const erken = place({ slug: "erken", open_hour: 13 });

    const [stop] = planManualRoute([erken], 9);

    expect(stop.arrival).toBe(13 * 60);
    expect(stop.departure).toBe(13 * 60 + 30);
  });

  it("kapanışı aşan durağı atmaz, uyarı olarak işaretler", () => {
    // 16:00'da başlayıp 90 dk sürer, yani 17:30'da biter; kapanış 17:00.
    // Tam kapanışta biten ziyaret aşım sayılmaz, fit() ile aynı sınır.
    const gec = place({ slug: "gec", close_hour: 17, visit_minutes: 90 });

    const [stop] = planManualRoute([gec], 16, []);

    // Sihirbaz bu durağı elerdi; manuel rotada kullanıcı sırayı kendi seçti.
    expect(stop.outsideHours).toBe(true);
    expect(stop.place.slug).toBe("gec");
  });

  it("saatine sığan durakta uyarı bırakmaz", () => {
    const uygun = place({ slug: "uygun", close_hour: 20, visit_minutes: 30 });

    const [stop] = planManualRoute([uygun], 10);

    expect(stop.outsideHours).toBeUndefined();
  });

  it("yemek kategorisini yemek molası sayar", () => {
    const lokanta = place({ slug: "lokanta", category: "yemek" });

    const [stop] = planManualRoute([lokanta], 12);

    expect(stop.isMeal).toBe(true);
  });

  it("o gün etkinliği olan mekana etkinliği iliştirir", () => {
    const p = place({ slug: "ulu-cami" });
    const event: EventItem = {
      id: "e1",
      place_id: p.id,
      title_tr: "Hat Sergisi",
      title_en: null,
      starts_at: new Date().toISOString(),
      ends_at: new Date().toISOString(),
      source: "belediye",
    };

    const [stop] = planManualRoute([p], 10, [event]);

    expect(stop.event?.title_tr).toBe("Hat Sergisi");
  });

  it("boş seçimde boş rota döner", () => {
    expect(planManualRoute([], 10)).toEqual([]);
  });
});

describe("optimizeOrder", () => {
  // Düz bir hat üzerinde dört nokta: A — B — C — D, batıdan doğuya.
  const A = place({ slug: "a", lng: 29.00 });
  const B = place({ slug: "b", lng: 29.02 });
  const C = place({ slug: "c", lng: 29.04 });
  const D = place({ slug: "d", lng: 29.06 });

  it("yanından geçilip sona atılan durağı yol üstüne alır", () => {
    // Kullanıcı B'yi sona koymuş: A'dan D'ye gidip B'ye geri dönüyor.
    const kotu = [A, C, D, B];
    const iyi = optimizeOrder(kotu);

    expect(iyi.map((p) => p.slug)).toEqual(["a", "b", "c", "d"]);
    expect(totalWalkMinutes(iyi)).toBeLessThan(totalWalkMinutes(kotu));
  });

  it("ilk durağı değiştirmez: başlangıcı kullanıcı seçer", () => {
    const [first] = optimizeOrder([D, A, B, C]);
    expect(first.slug).toBe("d");
  });

  it("zaten en kısa sırayı bozmaz", () => {
    const iyi = [A, B, C, D];
    expect(totalWalkMinutes(optimizeOrder(iyi))).toBeCloseTo(totalWalkMinutes(iyi), 6);
  });

  it("aynı durakları döndürür, hiçbirini düşürmez veya çoğaltmaz", () => {
    const sonuc = optimizeOrder([A, C, D, B]);
    expect([...sonuc.map((p) => p.slug)].sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("iki veya daha az durakta dokunmadan döner", () => {
    expect(optimizeOrder([D, A]).map((p) => p.slug)).toEqual(["d", "a"]);
    expect(optimizeOrder([]).map((p) => p.slug)).toEqual([]);
  });
});

describe("bestInsertIndex", () => {
  const A = place({ slug: "a", lng: 29.00 });
  const B = place({ slug: "b", lng: 29.02 });
  const D = place({ slug: "d", lng: 29.06 });

  it("yol üstündeki mekanı sona değil, geçtiğin yere koyar", () => {
    // A ve D seçili; B tam aralarında. Sona eklemek D'den geri dönmek olurdu.
    expect(bestInsertIndex([A, D], B)).toBe(1);
  });

  it("gerçekten uçta olan mekanı sona ekler", () => {
    expect(bestInsertIndex([A, B], D)).toBe(2);
  });

  it("ilk durağı koruyarak ekler", () => {
    // Boş listeye ilk ekleme 0, sonrakiler asla 0 olmaz.
    expect(bestInsertIndex([], A)).toBe(0);
    expect(bestInsertIndex([D], A)).toBeGreaterThan(0);
  });
});
