"use client";

import Link from "next/link";
import { useProfile } from "@/lib/useProfile";

export default function SiteHeader() {
  const { points, loading } = useProfile();

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link href="/" className="font-bold text-brand text-lg">
          Kültür<span className="text-accent">Rotam</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link className="rounded-full px-3 py-1.5 hover:bg-brand-soft" href="/sihirbaz">
            Rota
          </Link>
          <Link className="rounded-full px-3 py-1.5 hover:bg-brand-soft" href="/oduller">
            Ödüller
          </Link>
          <Link className="rounded-full px-3 py-1.5 hover:bg-brand-soft" href="/profil">
            Profil
          </Link>
          <span className="ml-1 rounded-full bg-brand px-3 py-1.5 font-semibold text-white">
            {loading ? "…" : `${points} puan`}
          </span>
        </nav>
      </div>
    </header>
  );
}
