"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { checkIn, type CheckInResult } from "@/lib/data";
import { errorText } from "@/lib/errors";
import { ensureSession, supabaseConfigured } from "@/lib/supabase/client";

/**
 * Demo modu. Artık "konumu hiç sorma" demek DEĞİL: konum her zaman istenir,
 * bu bayrak yalnızca izin verilmezse check-in'i yine denemeye yarar.
 *
 * Eskiden bayrak açıkken istemci konumu hiç sormuyor ve koordinatsız istek
 * atıyordu; sunucudaki v_require_location = true kuralı da bunu reddediyordu.
 * Yani iki anahtar ters durduğunda check-in hiç çalışmıyordu — üstelik bunu
 * ancak QR'ı okutunca görüyordun. Artık ters duruş check-in'i kırmıyor:
 * konum alınırsa sunucu mesafeyi kontrol eder, alınamazsa karar sunucunun
 * (bkz. supabase/geofence.sql v_require_location).
 */
const DEMO_LOCATION_OPTIONAL =
  process.env.NEXT_PUBLIC_DEMO_SKIP_GEOFENCE === "true";

type Phase = "idle" | "ready" | "locating" | "sending" | "done" | "error";

export default function CheckInClient({ token }: { token: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  // StrictMode effect'i iki kez çağırır; ikinci çağrı "zaten aldın" dönüp ilk sonucu ezer.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!supabaseConfigured) {
      setPhase("error");
      setMessage("Supabase ayarlı değil (.env.local eksik).");
      return;
    }
    // Konum iznini sayfa açılır açılmaz istemiyoruz. iOS Safari, kullanıcı
    // dokunmadan yapılan getCurrentPosition çağrılarında izin kutusunu
    // güvenilir biçimde göstermiyor; telefonda QR okutan kişi de ne olduğunu
    // anlamadan izin kutusuyla karşılaşmasın. Tek dokunuşla başlatıyoruz.
    setPhase("ready");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run() {
    try {
      setMessage(null);
      await ensureSession();
      let coords: { lat: number; lng: number } | undefined;

      // Konumu her durumda istiyoruz. Hatayı yutmuyoruz: konum reddedilince
      // eskiden null gidiyordu ve sunucu mesafeyi hiç kontrol etmiyordu, yani
      // izni reddetmek geofence'i atlamanın yolu oluyordu. Artık sunucu da
      // reddediyor; burada da kullanıcıya ne yapması gerektiğini söylüyoruz.
      // Demo modunda konumsuz denemeye devam ediyoruz — kararı sunucu verir.
      if (!("geolocation" in navigator)) {
        if (!DEMO_LOCATION_OPTIONAL) {
          throw new Error(
            "Bu tarayıcı konum paylaşmıyor. Check-in için konum gerekli.",
          );
        }
      } else {
        setPhase("locating");
        try {
          coords = await getCoords();
        } catch (err) {
          if (!DEMO_LOCATION_OPTIONAL) throw new Error(geoMessage(err));
        }
      }

      setPhase("sending");
      const data = await checkIn(token, coords);
      setResult(data);
      setPhase("done");
    } catch (e) {
      setMessage(errorText(e));
      setPhase("error");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      {phase === "locating" && <Info>Konumun alınıyor…</Info>}
      {phase === "sending" && <Info>Check-in yapılıyor…</Info>}
      {phase === "idle" && <Info>Başlatılıyor…</Info>}

      {phase === "ready" && (
        <div className="rounded-xl border border-line bg-surface p-6">
          <p className="text-4xl">📍</p>
          <h1 className="mt-3 text-xl font-bold">Buradasın!</h1>
          <p className="mt-2 text-sm text-muted">
            Puanı alabilmek için konumunu doğrulamamız gerekiyor. Butona basınca
            telefonun konum izni soracak.
          </p>
          <button
            onClick={run}
            className="mt-5 w-full rounded-full bg-brand px-6 py-3 text-lg font-semibold text-white"
          >
            Check-in yap
          </button>
        </div>
      )}

      {phase === "error" && (
        <div className="rounded-xl border border-accent/40 bg-accent-soft p-6">
          <p className="text-2xl">⚠️</p>
          <p className="mt-2 font-semibold text-accent">Check-in başarısız</p>
          <p className="mt-1 text-sm text-muted">{message}</p>
          <button
            onClick={run}
            className="mt-4 rounded-full bg-brand px-5 py-2 font-semibold text-white"
          >
            Tekrar dene
          </button>
        </div>
      )}

      {phase === "done" && result && (
        <div className="rounded-xl border border-line bg-surface p-6">
          {result.already ? (
            <>
              <p className="text-4xl">✅</p>
              <h1 className="mt-3 text-xl font-bold">{result.place.name}</h1>
              <p className="mt-1 text-muted">
                Bu mekandan puanını daha önce aldın. Tekrar puan verilmez.
              </p>
            </>
          ) : (
            <>
              <p className="text-4xl">🎉</p>
              <h1 className="mt-3 text-xl font-bold">{result.place.name}</h1>
              <p className="mt-2 text-lg font-semibold text-brand">
                +{result.earned} puan
              </p>
              {result.new_badges.length > 0 && (
                <div className="mt-4 rounded-lg bg-accent-soft p-3">
                  <p className="text-sm font-semibold text-accent">Yeni rozet!</p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {result.new_badges.map((b) => (
                      <span key={b.slug} className="rounded-full bg-surface px-3 py-1 text-sm">
                        {b.icon} {b.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <p className="mt-4 text-sm text-muted">
            Toplam puanın: <strong className="text-foreground">{result.total_points}</strong>
          </p>
          {!result.geofence_checked && (
            <p className="mt-2 rounded bg-background px-2 py-1 text-xs text-muted">
              Demo modu: konum doğrulaması atlandı.
            </p>
          )}

          <div className="mt-6 flex justify-center gap-3">
            <Link href="/profil" className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-brand-soft">
              Profilim
            </Link>
            <Link href="/oduller" className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
              Ödülleri gör
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ children }: { children: React.ReactNode }) {
  return <p className="animate-pulse text-muted">{children}</p>;
}

/** Tarayıcının konum hatasını kullanıcının yapabileceği bir şeye çevirir. */
function geoMessage(err: unknown): string {
  const code = (err as GeolocationPositionError | undefined)?.code;
  if (code === 1) {
    return "Konum izni verilmedi. Tarayıcı ayarlarından bu siteye konum izni ver ve tekrar dene.";
  }
  if (code === 3) {
    return "Konum zamanında alınamadı. Açık alana çık, konum servisini aç ve tekrar dene.";
  }
  return "Konum alınamadı. Telefonun konum servisi kapalı olabilir.";
}

function getCoords(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      // Telefonda GPS soğuk başlangıcı 8 sn'yi rahat aşıyor; son bir dakikalık
      // konum da bu iş için yeterince taze.
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 },
    );
  });
}
