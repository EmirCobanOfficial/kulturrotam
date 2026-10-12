"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { errorText } from "@/lib/errors";
import { signOut } from "@/lib/supabase/client";
import { useProfile } from "@/lib/useProfile";

export default function SiteHeader() {
  const { points, loading, signedIn, reload } = useProfile();
  const { lang, t, toggle } = useLang();

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link href="/" className="font-bold text-brand text-lg">
          Kültür<span className="text-accent">Rotam</span>
        </Link>
        <nav className="ml-auto flex flex-wrap items-center gap-1 text-sm">
          <Link className="rounded-full px-3 py-1.5 hover:bg-brand-soft" href="/hakkimizda">
            {t("nav_about")}
          </Link>
          <Link className="rounded-full px-3 py-1.5 hover:bg-brand-soft" href="/bursayla-ilk-bulusma">
            {t("nav_social")}
          </Link>
          <Link className="rounded-full px-3 py-1.5 hover:bg-brand-soft" href="/sihirbaz">
            {t("nav_route_build")}
          </Link>
          <Link className="rounded-full px-3 py-1.5 hover:bg-brand-soft" href="/birlikte-gezelim">
            {t("nav_together")}
          </Link>
          <Link className="rounded-full px-3 py-1.5 hover:bg-brand-soft" href="/kendi-rotam">
            {t("nav_custom")}
          </Link>
          <Link className="rounded-full px-3 py-1.5 hover:bg-brand-soft" href="/oduller">
            {t("nav_rewards")}
          </Link>
          <Link className="rounded-full px-3 py-1.5 hover:bg-brand-soft" href="/mekanlar">
            {t("nav_places")}
          </Link>
          <Link className="rounded-full px-3 py-1.5 hover:bg-brand-soft" href="/etkinlikler">
            {t("nav_events")}
          </Link>
          <Link className="rounded-full px-3 py-1.5 hover:bg-brand-soft" href="/akis">
            {t("nav_feed")}
          </Link>
          <Link className="rounded-full px-3 py-1.5 hover:bg-brand-soft" href="/profil">
            {t("nav_profile")}
          </Link>
          {signedIn ? (
            <button
              onClick={async () => {
                try {
                  await signOut();
                } catch (e) {
                  console.error(errorText(e));
                }
                reload();
              }}
              className="rounded-full px-3 py-1.5 hover:bg-brand-soft"
            >
              {t("nav_signout")}
            </button>
          ) : (
            <Link className="rounded-full px-3 py-1.5 hover:bg-brand-soft" href="/giris">
              {t("nav_signin")}
            </Link>
          )}
          <button
            onClick={toggle}
            aria-label={lang === "tr" ? "Switch to English" : "Türkçeye geç"}
            className="rounded-full border border-line px-2.5 py-1.5 font-semibold uppercase hover:bg-brand-soft"
          >
            {lang === "tr" ? "EN" : "TR"}
          </button>
          <span className="ml-1 rounded-full bg-brand px-3 py-1.5 font-semibold text-white">
            {loading ? "…" : `${points} ${t("points")}`}
          </span>
        </nav>
      </div>
    </header>
  );
}
