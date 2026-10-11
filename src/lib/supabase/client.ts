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

export type AccountState = {
  signedIn: boolean;
  anonymous: boolean;
  email: string | null;
};

/** Anonim oturum da bir oturumdur; "giriş yapmış" sayılması için e-postası olmalı. */
export async function accountState(): Promise<AccountState> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  return {
    signedIn: Boolean(user?.email),
    anonymous: Boolean(user) && !user?.email,
    email: user?.email ?? null,
  };
}

/**
 * Doğrulama maili tıklandığında kullanıcının döneceği adres. Sabit yazmak yerine
 * açık olan sayfanın kökünü kullanırız: production, Vercel preview ve yerelde
 * aynı kod doğru adrese döner. Supabase bu adresi yalnızca Authentication →
 * URL Configuration → Redirect URLs listesinde varsa kabul eder.
 */
function emailRedirectTo() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/profil`;
}

/**
 * Kayıt. Zaten anonim oturum varsa onu kalıcıya çevirir: kullanıcı kimliği
 * (ve dolayısıyla toplanan puan, rozet, ziyaretler) aynı kalır.
 */
export async function signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;

  if (user && !user.email) {
    const { error } = await supabase.auth.updateUser(
      { email, password },
      { emailRedirectTo: emailRedirectTo() },
    );
    if (error) throw error;
    // Doğrulama açıksa e-posta onaylanana kadar hesap anonim kalır.
    const after = await supabase.auth.getSession();
    return { needsConfirmation: !after.data.session?.user.email };
  }

  const { data: created, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: emailRedirectTo() },
  });
  if (error) throw error;
  return { needsConfirmation: !created.session };
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/** Çıkıştan sonra ensureSession() yeni bir anonim oturum açar; site gezilebilir kalır. */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
