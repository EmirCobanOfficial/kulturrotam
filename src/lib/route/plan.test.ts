import { describe, expect, it } from "vitest";
import { planRoute } from "./plan";
import type { Place, RoutePrefs } from "@/lib/types";

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
