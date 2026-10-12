import { ensureSession, supabase } from "@/lib/supabase/client";
import type {
  Badge,
  Coupon,
  EventItem,
  Photo,
  Place,
  Redemption,
  Review,
} from "@/lib/types";

export async function fetchPlaces(): Promise<Place[]> {
  const { data, error } = await supabase.from("places").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []) as Place[];
}

export async function fetchCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase.from("coupons").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []) as Coupon[];
}

export async function fetchProfile() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nickname, points")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchMyBadges(): Promise<Badge[]> {
  const { data, error } = await supabase
    .from("user_badges")
    .select("badge:badges(*)")
    .order("earned_at");
  if (error) throw error;
  return ((data ?? []) as unknown as { badge: Badge }[]).map((row) => row.badge);
}

export async function fetchMyVisits(): Promise<{ created_at: string; place: Place }[]> {
  const { data, error } = await supabase
    .from("visits")
    .select("created_at, place:places(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as { created_at: string; place: Place }[];
}

export async function fetchMyRedemptions(): Promise<(Redemption & { coupon: Coupon })[]> {
  const { data, error } = await supabase
    .from("redemptions")
    .select("*, coupon:coupons(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as (Redemption & { coupon: Coupon })[];
}

export type CheckInResult = {
  place: { slug: string; name: string };
  already: boolean;
  earned: number;
  total_points: number;
  new_badges: { slug: string; name: string; icon: string }[];
  geofence_checked: boolean;
};

export async function checkIn(
  token: string,
  coords?: { lat: number; lng: number },
): Promise<CheckInResult> {
  const { data, error } = await supabase.rpc("check_in", {
    p_token: token,
    p_lat: coords?.lat ?? null,
    p_lng: coords?.lng ?? null,
  });
  if (error) throw error;
  pointsChanged();
  return data as CheckInResult;
}

export async function redeemCoupon(couponId: string) {
  const { data, error } = await supabase.rpc("redeem_coupon", { p_coupon: couponId });
  if (error) throw error;
  pointsChanged();
  return data as {
    code: string;
    title: string;
    partner: string;
    remaining_points: number;
  };
}

export async function setNickname(nickname: string) {
  const { error } = await supabase.rpc("set_nickname", { p_nick: nickname });
  if (error) throw error;
}

/** Bugün başlayan veya bugüne sarkan belediye etkinlikleri. */
/** Bugünün etkinlikleri. Tarih seçimi olan yerlerde fetchEventsOn kullan. */
export async function fetchTodayEvents(): Promise<EventItem[]> {
  return fetchEventsOn(new Date());
}

/** Verilen günün etkinlikleri. Gün sınırları kullanıcının yerel saatine göre. */
export async function fetchEventsOn(day: Date): Promise<EventItem[]> {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .lt("starts_at", dayEnd.toISOString())
    .gte("ends_at", dayStart.toISOString())
    .order("starts_at");
  if (error) throw error;
  return (data ?? []) as EventItem[];
}

export async function fetchPhotos(): Promise<Photo[]> {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .order("votes", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return (data ?? []) as Photo[];
}

export async function fetchMyPhotoVotes(): Promise<string[]> {
  const { data, error } = await supabase.from("photo_votes").select("photo_id");
  if (error) throw error;
  return ((data ?? []) as { photo_id: string }[]).map((row) => row.photo_id);
}

export function photoUrl(storagePath: string): string {
  return supabase.storage.from("photos").getPublicUrl(storagePath).data.publicUrl;
}

/** Dosyayı kullanıcının kendi klasörüne yükler, sonra satırı fonksiyon yazar. */
export async function uploadPhoto(placeId: string, file: File, caption: string) {
  const session = await ensureSession();
  const userId = session?.user.id;
  if (!userId) throw new Error("oturum yok");

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;

  const upload = await supabase.storage.from("photos").upload(path, file, {
    contentType: file.type || "image/jpeg",
  });
  if (upload.error) throw upload.error;

  const { data, error } = await supabase.rpc("add_photo", {
    p_place: placeId,
    p_path: path,
    p_caption: caption,
  });
  if (error) throw error;
  return data as Photo;
}

/** Oy sayısını döner. Aynı kullanıcı ikinci kez oy veremez. */
export async function votePhoto(photoId: string): Promise<number> {
  const { data, error } = await supabase.rpc("vote_photo", { p_photo: photoId });
  if (error) throw error;
  return data as number;
}

/** Header'daki puan rozetinin kendini tazelemesi için. */
export const POINTS_EVENT = "kr:points";

function pointsChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(POINTS_EVENT));
}

/** Tüm değerlendirmeler. Veri küçük, ortalamayı istemcide hesaplıyoruz. */
export async function fetchReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Puan ve yorum. Doğrulama sunucudaki add_review() içinde. */
export async function addReview(
  placeId: string,
  rating: number,
  comment: string,
): Promise<Review> {
  const { data, error } = await supabase.rpc("add_review", {
    p_place: placeId,
    p_rating: rating,
    p_comment: comment,
  });
  if (error) throw error;
  return data as Review;
}
