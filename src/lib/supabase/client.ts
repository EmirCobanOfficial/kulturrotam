import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(url || "http://localhost", anonKey || "anon", {
  auth: { persistSession: true, autoRefreshToken: true },
});

/** Anonim oturum: ilk girişte kullanıcı yaratır, sonrakilerde mevcut oturumu döner. */
export async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;
  const { data: created, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return created.session;
}
