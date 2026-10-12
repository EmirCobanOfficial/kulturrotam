# KültürRotam — yapay zekâ aracı için giriş noktası

> **ARŞİV — Bu repo Osmangazi Hackathon (Ekim 2026) sürümüdür ve dondurulmuştur.**
> Jüriye sunulan sürüm `v0.1.0` etiketidir; yeni geliştirme özel
> [`kulturrotam-platform`](https://github.com/EmirCobanOfficial/kulturrotam-platform) reposunda sürüyor.
> **`supabase/schema.sql` ve `supabase/seed.sql` tüm veriyi, `supabase/mekanlar.sql` ise kupon ve
> cüzdan kayıtlarını siler. Bunları hiçbir canlı veritabanında çalıştırma.** Bu belgedeki
> "dosyayı güncelle, sonra Supabase'de çalıştır" talimatları artık geçerli değildir.

Bu dosya kasıtlı olarak kısadır. Projenin kuralları, durumu ve bilinen tuzakları
tek bir yerde tutulur:

1. **`CLAUDE.md`** — mimari kuralları, komutlar, bilinen tuzaklar, güncel durum.
2. **`HANDOFF.md`** — en son nerede kalındı, neyin test edilmediği, sıradaki adımlar.

Çalışmaya başlamadan önce ikisini de oku.

## Hızlı kurallar

- Her değişiklikten sonra `npm run build` ve `npm run test` çalıştır.
- Puan, rozet ve kupon mantığı veritabanındaki `security definer` fonksiyonlarında
  kalır; istemciye taşıma.
- Arayüz metinleri `src/lib/i18n.ts` sözlüğünde; bileşene düz string gömme.
- Supabase hataları `Error` örneği değildir; `src/lib/errors.ts` içindeki
  `errorText()` kullan.
- `.env.local` git'te yoktur. Dosya olmadan da `npm run build` ve `npm run test`
  çalışır; yalnızca `npm run dev` ile açılan sayfalar "Supabase ayarlı değil" der.
