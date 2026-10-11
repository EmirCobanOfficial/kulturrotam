import { supabase } from "@/lib/supabase/client";
import type { Badge, Coupon, Place, Redemption } from "@/lib/types";

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
  return data as CheckInResult;
}

export async function redeemCoupon(couponId: string) {
  const { data, error } = await supabase.rpc("redeem_coupon", { p_coupon: couponId });
  if (error) throw error;
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
