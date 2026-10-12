export type PlaceCategory = "tarihi" | "muze" | "yemek" | "park";

export type Place = {
  id: string;
  slug: string;
  name_tr: string;
  name_en: string | null;
  category: PlaceCategory;
  lat: number;
  lng: number;
  visit_minutes: number;
  cost_level: number;
  open_hour: number;
  close_hour: number;
  tags: string[];
  description_tr: string | null;
  description_en: string | null;
  image_url: string | null;
  qr_token: string;
  points_reward: number;
  sort_order: number;
};

export type Badge = {
  id: string;
  slug: string;
  name_tr: string;
  icon: string;
  rule: { type: string; category?: string; n?: number };
};

export type Coupon = {
  id: string;
  partner_name: string;
  title_tr: string;
  discount_text: string;
  cost_points: number;
  stock: number;
  is_recyclable_gift: boolean;
  sort_order: number;
  /** 'reward' puanla alınan ödül, 'donation' puanı bağışa çeviren kart. */
  kind: "reward" | "donation";
  image_url: string | null;
};

export type Redemption = {
  id: string;
  coupon_id: string;
  code: string;
  created_at: string;
  used_at: string | null;
};

/** Sihirbaz cevapları. Rota motorunun tek girdisi. */
export type RoutePrefs = {
  /** Gezi başlangıç saati, 0-23. */
  startHour: number;
  /** Geziye ayrılan süre, saat. */
  hours: number;
  /** Kategori ve etiket adları: "tarihi", "muze", "manzara", "alisveris" ... */
  interests: string[];
  /** 0 ücretsiz .. 3 pahalı. Bu seviyenin üstündeki mekanlar elenir. */
  budget: number;
  /** Rotaya yemek molası eklensin mi. */
  wantsFood: boolean;
};

export type RouteStop = {
  place: Place;
  /** Gün başından itibaren dakika. */
  arrival: number;
  departure: number;
  /** Önceki duraktan yürüme süresi, dakika. */
  travelMinutes: number;
  isMeal: boolean;
  /** O gün bu mekanda etkinlik varsa. Rota motoru etkinlikli mekanı öne alır. */
  event?: EventItem;
  /**
   * Yalnızca manuel rotada: ziyaret mekanın kapanışını aşıyor. Sihirbaz böyle
   * bir durağı zaten elerdi; manuel rotada sırayı kullanıcı seçtiği için durak
   * atılmaz, uyarı olarak işaretlenir.
   */
  outsideHours?: boolean;
};

export type EventItem = {
  id: string;
  place_id: string;
  title_tr: string;
  title_en: string | null;
  starts_at: string;
  ends_at: string;
  source: string;
};

export type Photo = {
  id: string;
  place_id: string;
  storage_path: string;
  caption: string | null;
  votes: number;
  created_at: string;
};

export type Review = {
  id: string;
  user_id: string;
  place_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};
