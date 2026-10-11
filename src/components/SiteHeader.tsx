"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { useProfile } from "@/lib/useProfile";

export default function SiteHeader() {
  const { points, loading } = useProfile();
  const { lang, t, toggle } = useLang();

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link href="/" className="font-bold text-brand text-lg">
          Kültür<span className="text-accent">Rotam</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link className="rounded-full px-3 py-1.5 hover:bg-brand-soft" href="/sihirbaz">
            {t("nav_route")}
          </Link>
          <Link className="rounded-full px-3 py-1.5 hover:bg-brand-soft" href="/akis">
            {t("nav_feed")}
          </Link>
          <Link className="rounded-full px-3 py-1.5 hover:bg-brand-soft" href="/oduller">
            {t("nav_rewards")}
          </Link>
          <Link className="rounded-full px-3 py-1.5 hover:bg-brand-soft" href="/profil">
            {t("nav_profile")}
          </Link>
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
