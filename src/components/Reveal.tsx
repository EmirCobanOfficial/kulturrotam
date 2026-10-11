"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sayfa aşağı kaydıkça içeriği yavaşça gösterir ("ghost" efekti).
 *
 * Kendi görünürlüğünü IntersectionObserver ile izler; animasyon kütüphanesi
 * eklemiyoruz, derleme boyutu artmasın. Bir kez göründükten sonra izlemeyi
 * bırakır — yukarı kaydırınca tekrar kaybolup belirmesi baş döndürücü oluyor.
 *
 * Hareketi azaltılmış isteyen kullanıcıda (prefers-reduced-motion) animasyon
 * hiç çalışmaz, içerik doğrudan görünür gelir. JavaScript çalışmazsa da içerik
 * görünür kalır: gizleme yalnızca bileşen bağlandıktan sonra uygulanır.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  /** Sıralı kartları birbiri ardına getirmek için milisaniye cinsinden gecikme. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(true);
      return;
    }

    setArmed(true);
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setShown(true);
          observer.disconnect();
        }
      },
      // Biraz görününce başlasın: kullanıcı öğeyi tam görmeden animasyon bitmiş olur.
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const hidden = armed && !shown;

  return (
    <div
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
      className={[
        "transition-all duration-700 ease-out motion-reduce:transition-none",
        hidden ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
