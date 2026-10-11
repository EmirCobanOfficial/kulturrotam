"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorText } from "@/lib/errors";
import { useLang } from "@/lib/i18n";
import { ensureSession, signIn, signUp, supabaseConfigured } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const { t } = useLang();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (password.length < 6) {
      setError(t("auth_password_short"));
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        // Anonim oturumu kalıcıya çevirebilmek için önce oturumun var olması gerekir.
        await ensureSession();
        const { needsConfirmation } = await signUp(email.trim(), password);
        setPassword("");
        if (needsConfirmation) {
          setNotice(t("auth_confirm_email"));
          return;
        }
      } else {
        await signIn(email.trim(), password);
        setPassword("");
      }
      router.push("/profil");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (!supabaseConfigured) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center text-accent">
        Supabase ayarlı değil (.env.local eksik).
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <div className="mb-6 flex rounded-full border border-line bg-surface p-1 text-sm font-semibold">
        <Tab active={mode === "signup"} onClick={() => setMode("signup")}>
          {t("auth_signup")}
        </Tab>
        <Tab active={mode === "signin"} onClick={() => setMode("signin")}>
          {t("auth_signin")}
        </Tab>
      </div>

      <h1 className="text-2xl font-bold">
        {mode === "signup" ? t("auth_signup_title") : t("auth_signin_title")}
      </h1>
      {mode === "signup" && (
        <p className="mt-2 text-sm text-muted">{t("auth_keeps_points")}</p>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold" htmlFor="email">
            {t("auth_email")}
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-line bg-background px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold" htmlFor="password">
            {t("auth_password")}
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-line bg-background px-3 py-2"
          />
          <p className="mt-1 text-xs text-muted">{t("auth_password_hint")}</p>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-brand px-5 py-2.5 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "…" : mode === "signup" ? t("auth_signup") : t("auth_signin")}
        </button>

        {error && <p className="text-sm text-accent">{error}</p>}
        {notice && <p className="text-sm text-muted">{notice}</p>}
      </form>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full px-4 py-2 transition ${
        active ? "bg-brand text-white" : "text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
