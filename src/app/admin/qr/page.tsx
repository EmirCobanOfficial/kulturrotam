"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { fetchPlaces } from "@/lib/data";
import { supabaseConfigured } from "@/lib/supabase/client";
import type { Place } from "@/lib/types";

export default function AdminQrPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    if (!supabaseConfigured) {
      setError("Supabase ayarlı değil (.env.local eksik).");
      return;
    }
    fetchPlaces()
      .then(setPlaces)
      .catch((e) => setError(e instanceof Error ? e.message : "hata"));
  }, []);

  if (error)
    return <p className="mx-auto max-w-xl px-4 py-20 text-center text-accent">{error}</p>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Mekan QR kodları</h1>
          <p className="text-sm text-muted">
            Demo için yazdırılabilir. Her QR ilgili mekanın check-in sayfasını açar.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="rounded-full bg-brand px-5 py-2 font-semibold text-white"
        >
          Yazdır
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        {places.map((p) => (
          <div
            key={p.id}
            className="flex flex-col items-center rounded-xl border border-line bg-white p-4 text-center"
          >
            <QRCodeSVG value={`${origin}/checkin/${p.qr_token}`} size={150} />
            <p className="mt-3 text-sm font-semibold">{p.name_tr}</p>
            <p className="text-xs text-muted">+{p.points_reward} puan</p>
          </div>
        ))}
      </div>
    </div>
  );
}
