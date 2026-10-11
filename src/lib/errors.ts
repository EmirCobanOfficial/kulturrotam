/**
 * Supabase hataları Error değil, düz nesne döner (PostgrestError, StorageError).
 * instanceof kontrolü onları "bilinmeyen hata"ya çevirip gerçek sebebi gizler.
 */
export function errorText(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null && "message" in e) {
    return String((e as { message: unknown }).message);
  }
  return "bilinmeyen hata";
}
