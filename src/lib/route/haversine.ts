type Point = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: Point, b: Point): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Yürüme 5 km/sa, şehir içi dolambaç için 1.3 katsayı. */
export function walkMinutes(a: Point, b: Point): number {
  return Math.round((haversineKm(a, b) * 1.3 * 60) / 5);
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
