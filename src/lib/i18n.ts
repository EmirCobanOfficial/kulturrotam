"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { EventItem, Place } from "@/lib/types";

export type Lang = "tr" | "en";

const STORAGE_KEY = "kr:lang";
const LANG_EVENT = "kr:lang-changed";

const DICT = {
  tr: {
    nav_route: "Rota",
    nav_rewards: "Ödüller",
    nav_profile: "Profil",
    nav_feed: "Akış",
    points: "puan",

    wizard_when: "Ne zaman geziyorsun?",
    wizard_start: "Başlangıç saati",
    wizard_hours: "Kaç saat ayırıyorsun",
    wizard_interests: "Neye ilgin var?",
    wizard_budget: "Bütçen?",
    wizard_meal: "Yemek molası?",
    wizard_meal_yes: "Evet, rotaya ekle",
    wizard_meal_no: "Hayır, gerek yok",
    wizard_next: "Devam",
    wizard_back: "Geri",
    wizard_submit: "Rotamı çiz",
    hours_unit: "saat",

    route_ready: "Rotan hazır",
    route_stops: "durak",
    route_points_potential: "puan potansiyeli",
    route_replan: "Yeniden planla",
    route_checkin: "Check-in",
    route_walk: "dk yürüme",
    route_empty: "Bu tercihlerle rota çıkmadı. Süreyi uzat veya bütçeyi yükselt.",
    route_event_today: "Bugün burada",

    feed_title: "Topluluk akışı",
    feed_lead: "Gezdiğin yeri paylaş, beğenilen kareleri gör.",
    feed_place: "Mekan",
    feed_caption: "Açıklama (isteğe bağlı)",
    feed_file: "Fotoğraf",
    feed_upload: "Paylaş",
    feed_uploading: "Yükleniyor…",
    feed_empty: "Henüz fotoğraf yok. İlk paylaşan sen ol.",
    feed_vote: "Beğen",
    feed_voted: "Beğendin",
    feed_need_file: "Önce bir fotoğraf seç.",

  },
  en: {
    nav_route: "Route",
    nav_rewards: "Rewards",
    nav_profile: "Profile",
    nav_feed: "Feed",
    points: "points",

    wizard_when: "When are you exploring?",
    wizard_start: "Start time",
    wizard_hours: "Hours available",
    wizard_interests: "What interests you?",
    wizard_budget: "Your budget?",
    wizard_meal: "Meal break?",
    wizard_meal_yes: "Yes, add one",
    wizard_meal_no: "No, skip it",
    wizard_next: "Next",
    wizard_back: "Back",
    wizard_submit: "Plan my route",
    hours_unit: "hours",

    route_ready: "Your route is ready",
    route_stops: "stops",
    route_points_potential: "points available",
    route_replan: "Plan again",
    route_checkin: "Check in",
    route_walk: "min walk",
    route_empty: "No route fits these choices. Allow more time or raise the budget.",
    route_event_today: "Today here",

    feed_title: "Community feed",
    feed_lead: "Share where you have been, see the best shots.",
    feed_place: "Place",
    feed_caption: "Caption (optional)",
    feed_file: "Photo",
    feed_upload: "Share",
    feed_uploading: "Uploading…",
    feed_empty: "No photos yet. Be the first to share.",
    feed_vote: "Like",
    feed_voted: "Liked",
    feed_need_file: "Pick a photo first.",

  },
} as const;

export type TextKey = keyof (typeof DICT)["tr"];

export function translate(lang: Lang, key: TextKey): string {
  return DICT[lang][key];
}

function readLang(): Lang {
  if (typeof window === "undefined") return "tr";
  try {
    return localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "tr";
  } catch {
    return "tr";
  }
}

export function setLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // depolama kapalıysa dil sadece bu sayfa için değişir
  }
  window.dispatchEvent(new Event(LANG_EVENT));
}

/**
 * Dil, sunucuda her zaman "tr" döner; seçim ilk render'dan sonra uygulanır.
 * Aksi halde sunucu ve istemci HTML'i farklı olur ve React hydration hatası verir.
 */
function subscribe(onChange: () => void) {
  window.addEventListener(LANG_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(LANG_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useLang() {
  const lang = useSyncExternalStore(subscribe, readLang, () => "tr" as Lang);
  const t = useCallback((key: TextKey) => translate(lang, key), [lang]);
  const toggle = useCallback(() => setLang(lang === "tr" ? "en" : "tr"), [lang]);
  return { lang, t, toggle };
}

export function placeName(place: Place, lang: Lang): string {
  return (lang === "en" ? place.name_en : null) ?? place.name_tr;
}

export function placeDescription(place: Place, lang: Lang): string | null {
  return (lang === "en" ? place.description_en : null) ?? place.description_tr;
}

export function eventTitle(event: EventItem, lang: Lang): string {
  return (lang === "en" ? event.title_en : null) ?? event.title_tr;
}

export const CATEGORY_LABEL: Record<Lang, Record<string, string>> = {
  tr: { tarihi: "Tarihi", muze: "Müze", yemek: "Yemek", park: "Park" },
  en: { tarihi: "Historic", muze: "Museum", yemek: "Food", park: "Park" },
};

export const INTEREST_LABEL: Record<Lang, Record<string, string>> = {
  tr: {
    tarihi: "Tarihi mekanlar",
    muze: "Müzeler",
    mimari: "Mimari",
    manzara: "Manzara & fotoğraf",
    alisveris: "Çarşı & alışveriş",
    bahce: "Park & bahçe",
  },
  en: {
    tarihi: "Historic sites",
    muze: "Museums",
    mimari: "Architecture",
    manzara: "Views & photos",
    alisveris: "Bazaar & shopping",
    bahce: "Parks & gardens",
  },
};

export const BUDGET_LABEL: Record<Lang, Record<number, { label: string; sub: string }>> = {
  tr: {
    0: { label: "Ücretsiz", sub: "Sadece bedava mekanlar" },
    1: { label: "Ekonomik", sub: "Küçük girişler" },
    2: { label: "Orta", sub: "Müze + yemek" },
    3: { label: "Rahat", sub: "Fark etmez" },
  },
  en: {
    0: { label: "Free", sub: "Free places only" },
    1: { label: "Budget", sub: "Small entry fees" },
    2: { label: "Medium", sub: "Museum + meal" },
    3: { label: "Relaxed", sub: "No limit" },
  },
};
