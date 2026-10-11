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

    nav_signin: "Giriş",
    nav_signout: "Çıkış",
    auth_signup: "Kayıt ol",
    auth_signin: "Giriş yap",
    auth_signup_title: "Hesap oluştur",
    auth_signin_title: "Tekrar hoş geldin",
    auth_email: "E-posta",
    auth_password: "Şifre",
    auth_password_hint: "En az 6 karakter.",
    auth_password_short: "Şifre en az 6 karakter olmalı.",
    auth_keeps_points: "Topladığın puanlar ve rozetler hesabına taşınır.",
    auth_confirm_email: "E-postana doğrulama bağlantısı gönderdik. Onayladıktan sonra giriş yapabilirsin.",
    auth_signed_in_as: "Giriş yapıldı",
    auth_guest: "Misafir olarak geziyorsun.",

    nav_about: "Hakkımızda",
    nav_events: "Etkinlikler",

    home_hero_title_1: "Bursa'yı keşfet.",
    home_hero_title_2: "Kendi rotanı oluştur.",
    home_hero_lead: "Tarih, lezzet ve etkinlikler. Sana uygun bir keşif.",
    home_hero_cta: "Rotanı Oluştur",
    home_hero_secondary: "Bursa'yı Keşfet",
    home_hero_badge: "Keşfet, puan kazan",

    home_quick_what: "Ne keşfetmek istersin?",
    home_quick_time: "Ne kadar zamanın var?",
    home_quick_how: "Nasıl gezmek istersin?",
    home_quick_cta: "Rotamı Bul",
    home_quick_walk: "Yürüyerek",
    home_quick_transit: "Toplu taşıma",

    home_today: "Bursa'da bugün",
    home_card_culture: "Kültür Rotaları",
    home_card_food: "Yerel Lezzetler",
    home_card_events: "Etkinlikler",

    home_events_title: "Etkinlikler ve duyurular",
    home_events_lead: "Belediye takviminden bugüne ait başlıklar. Rota motoru o gün etkinliği olan mekanı öne alır.",
    home_events_empty: "Bugün için kayıtlı etkinlik yok. Rotanı yine de oluşturabilirsin.",
    home_events_all: "Rotanda gör",

    home_partners_title: "İş birlikleri ve sponsorlar",
    home_partners_lead: "Puanı gerçek indirime çeviren ve bağışa dönüştüren kurumlar. Anlaşmalar genişledikçe bu liste büyüyecek.",
    home_partners_cta: "İş birliği için bize ulaş",

    home_solo_title: "Bireysel mi geziyorsun?",
    home_solo_body: "Tek başına gezmek, az gezmek demek değil. Süreni ve ilgi alanını söyle; sihirbaz sana özel, yürüme mesafesinde bir gün planı çıkarsın.",
    home_solo_cta: "Kendi rotanı kur",

    about_eyebrow: "HAKKIMIZDA",
    about_title: "Bursa'dan başlayan bir keşif yolculuğu",
    about_lead: "Kültür Rotam, Bursa'nın tarihî duraklarını, yeme-içme mekânlarını ve etkinliklerini tek bir yerde buluşturur. \u201cBugün ne yapabilirim?\u201d sorusundan yola çıkarak şehri ilgi alanına, zamanına ve gezi tercihlerine göre keşfetmeni kolaylaştırır.",
    about_s1_title: "Bursa'yı hikâyeleriyle tanı",
    about_s1_body: "Hanlardan müzelere, yerel lezzetlerden kültür etkinliklerine uzanan rotalarla kendi planını oluştur. Kısa anlatımlarla ziyaret ettiğin yerlerin hikâyelerini öğren, şehrin henüz tanımadığın köşelerini keşfet.",
    about_s2_title: "Keşfet, katıl, kazan",
    about_s2_body: "Keşif görevleri ve puanlarla gezileri daha eğlenceli hâle getirmeyi; yerel işletmelerle geliştireceğimiz fırsatlarla katılımı desteklemeyi hedefliyoruz.",
    about_s3_title: "Sosyal faydayla büyüyoruz",
    about_s3_body: "Amacımız, daha fazla insanın kültürel yaşama katılmasını kolaylaştırmak. Yerel işletmelerle şeffaf iş birlikleri kurarak bu amacı sürdürebilen bir sosyal girişim geliştiriyoruz.",
    about_closing: "Bursa bizim ilk uygulama bölgemiz. Burada edindiğimiz deneyimi, zamanla Türkiye'nin farklı şehirlerine taşımayı hedefliyoruz.",
    about_first_stop: "İlk durağımız Bursa.",

    home_problem_title: "Neyi çözüyoruz?",
    home_problem_hint: "Nasıl çözdüğümüzü gör",
    home_problem_close: "Kapat",
    prob1_t: "Nereden başlayacağını bilmiyorsun",
    prob1_b: "Şehre ilk kez gelen turist ve öğrenciler, hangi mekanın hangi saatte gezilmesi gerektiğini bilmediği için zamanını kaybediyor.",
    prob1_a: "Sihirbaz süreni, başlangıç saatini ve ilgi alanını sorar; yalnızca o saatte açık olan mekanlardan yürüme mesafesine göre sıralı bir gün planı çıkarır.",
    prob2_t: "Rotalar herkese aynı",
    prob2_b: "Mevcut haritalar tek tip liste veriyor; ilgi alanı, bütçe ve elindeki süre hesaba katılmıyor.",
    prob2_a: "Rota motoru ilgi alanı ve bütçeye göre puanlayıp sıralar. Öğle veya akşam saatine denk gelirse rotaya en yakın yemek molasını kendisi ekler, o gün etkinliği olan mekanı öne alır.",
    prob3_t: "Turist ile esnaf kopuk",
    prob3_b: "Ziyaretçiyi yerel esnafa ve belediye tesislerine yönlendiren bir teşvik yok.",
    prob3_a: "Her durakta QR okutunca puan kazanırsın. Puan, belediye sosyal tesislerinde ve anlaşmalı yerel esnafta geçerli kupona dönüşür; dilersen bağışa çevirirsin.",

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

    nav_signin: "Sign in",
    nav_signout: "Sign out",
    auth_signup: "Sign up",
    auth_signin: "Sign in",
    auth_signup_title: "Create an account",
    auth_signin_title: "Welcome back",
    auth_email: "Email",
    auth_password: "Password",
    auth_password_hint: "At least 6 characters.",
    auth_password_short: "Password must be at least 6 characters.",
    auth_keeps_points: "Your points and badges move to the account.",
    auth_confirm_email: "We sent a confirmation link to your email. Sign in after confirming.",
    auth_signed_in_as: "Signed in",
    auth_guest: "You are browsing as a guest.",

    nav_about: "About",
    nav_events: "Events",

    home_hero_title_1: "Discover Bursa.",
    home_hero_title_2: "Build your own route.",
    home_hero_lead: "History, flavour and events. A trip shaped around you.",
    home_hero_cta: "Build Your Route",
    home_hero_secondary: "Explore Bursa",
    home_hero_badge: "Explore, earn points",

    home_quick_what: "What would you like to see?",
    home_quick_time: "How much time do you have?",
    home_quick_how: "How do you want to travel?",
    home_quick_cta: "Find My Route",
    home_quick_walk: "On foot",
    home_quick_transit: "Public transport",

    home_today: "Today in Bursa",
    home_card_culture: "Culture Routes",
    home_card_food: "Local Flavours",
    home_card_events: "Events",

    home_events_title: "Events and announcements",
    home_events_lead: "Today's entries from the municipal calendar. The route engine moves a place with an event today to the front.",
    home_events_empty: "No events listed for today. You can still build your route.",
    home_events_all: "See it on your route",

    home_partners_title: "Partners and sponsors",
    home_partners_lead: "The organisations that turn points into real discounts and donations. This list grows as partnerships do.",
    home_partners_cta: "Get in touch about a partnership",

    home_solo_title: "Travelling on your own?",
    home_solo_body: "Going alone does not mean seeing less. Tell us your time and interests, and the wizard lays out a walkable day planned around you.",
    home_solo_cta: "Build your own route",

    about_eyebrow: "ABOUT US",
    about_title: "A journey of discovery that starts in Bursa",
    about_lead: "Kultur Rotam brings Bursa's historic stops, places to eat and events together in one place. Starting from the question \u201cwhat can I do today?\u201d, it makes the city easier to explore around your interests, your time and how you like to travel.",
    about_s1_title: "Meet Bursa through its stories",
    about_s1_body: "Build your own plan from routes that run from the old hans to the museums, from local flavours to cultural events. Short readings tell you the story of each place you visit, and show you corners of the city you have not met yet.",
    about_s2_title: "Explore, take part, earn",
    about_s2_body: "We want discovery missions and points to make these trips more fun, and the offers we build with local businesses to keep people taking part.",
    about_s3_title: "We grow through social impact",
    about_s3_body: "Our aim is to make it easier for more people to take part in cultural life. We are building a social enterprise that sustains that aim through transparent partnerships with local businesses.",
    about_closing: "Bursa is our first region. In time we aim to carry what we learn here to other cities in Turkiye.",
    about_first_stop: "Our first stop is Bursa.",

    home_problem_title: "What we solve",
    home_problem_hint: "See how we solve it",
    home_problem_close: "Close",
    prob1_t: "You do not know where to start",
    prob1_b: "Tourists and students arriving for the first time lose time because they cannot tell which place is worth seeing at which hour.",
    prob1_a: "The wizard asks for your time, your starting hour and your interests, then lays out a day in walking order from the places that are actually open at that hour.",
    prob2_t: "Every route is the same",
    prob2_b: "Existing maps hand out one flat list; interests, budget and the time you actually have are not taken into account.",
    prob2_a: "The route engine scores and orders places by interest and budget. If your day runs through lunch or dinner it adds the nearest meal stop itself, and it moves a place with an event that day to the front.",
    prob3_t: "Visitors and local traders are disconnected",
    prob3_b: "Nothing steers a visitor towards local traders and municipal venues.",
    prob3_a: "Scanning the QR at each stop earns you points. Points turn into coupons valid at municipal venues and partner traders — or into a donation, if you would rather give them.",

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
