"use client";

import Link from "next/link";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import type { TextKey } from "@/lib/i18n";
import { errorText } from "@/lib/errors";
import { signOut } from "@/lib/supabase/client";
import { useProfile } from "@/lib/useProfile";

/** Menü on maddeye çıktı; telefonda açılır menüye, geniş ekranda şerite sığar. */
const LINKS: { href: string; key: TextKey }[] = [
  { href: "/hakkimizda", key: "nav_about" },
  { href: "/bursayla-ilk-bulusma", key: "nav_social" },
  { href: "/sihirbaz", key: "nav_route_build" },
  { href: "/birlikte-gezelim", key: "nav_together" },
  { href: "/kendi-rotam", key: "nav_custom" },
  { href: "/oduller", key: "nav_rewards" },
  { href: "/mekanlar", key: "nav_places" },
  { href: "/etkinlikler", key: "nav_events" },
  { href: "/profil", key: "nav_profile" },
];

export default function SiteHeader() {
  const { points, loading, signedIn, reload } = useProfile();
  const { lang, t, toggle } = useLang();
  const [open, setOpen] = useState(false);

  async function onSignOut() {
    try {
      await signOut();
    } catch (e) {
      console.error(errorText(e));
    }
    reload();
    setOpen(false);
  }

  const linkClass = "rounded-full px-3 py-1.5 hover:bg-brand-soft";

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-brand" onClick={() => setOpen(false)}>
          Kültür<span className="text-accent">Rotam</span>
        </Link>

        {/* Geniş ekran: tüm menü tek şeritte. */}
        <nav className="ml-auto hidden items-center gap-1 text-sm lg:flex">
          {LINKS.map((l) => (
            <Link key={l.href} className={linkClass} href={l.href}>
              {t(l.key)}
            </Link>
          ))}
          {signedIn ? (
            <button onClick={onSignOut} className={linkClass}>
              {t("nav_signout")}
            </button>
          ) : (
            <Link className={linkClass} href="/giris">
              {t("nav_signin")}
            </Link>
          )}
        </nav>

        {/* Puan ve dil her boyutta görünür; telefonda menü düğmesinin yanında. */}
        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <button
            onClick={toggle}
            aria-label={lang === "tr" ? "Switch to English" : "Türkçeye geç"}
            className="rounded-full border border-line px-2.5 py-1.5 text-sm font-semibold uppercase hover:bg-brand-soft"
          >
            {lang === "tr" ? "EN" : "TR"}
          </button>
          <span className="rounded-full bg-brand px-3 py-1.5 text-sm font-semibold text-white">
            {loading ? "…" : `${points} ${t("points")}`}
          </span>
          <button
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Menü"
            className="rounded-full border border-line px-3 py-1.5 text-lg leading-none lg:hidden"
          >
            {open ? "×" : "☰"}
          </button>
        </div>
      </div>

      {/* Telefon: açılır menü. Bağlantıya dokununca kapanır. */}
      {open && (
        <nav className="border-t border-line px-4 pb-4 pt-2 text-sm lg:hidden">
          <div className="grid grid-cols-2 gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 font-medium hover:bg-brand-soft"
              >
                {t(l.key)}
              </Link>
            ))}
            {signedIn ? (
              <button
                onClick={onSignOut}
                className="rounded-lg px-3 py-2 text-left font-medium hover:bg-brand-soft"
              >
                {t("nav_signout")}
              </button>
            ) : (
              <Link
                href="/giris"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 font-medium hover:bg-brand-soft"
              >
                {t("nav_signin")}
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
