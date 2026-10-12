# KültürRotam

> **ARŞİV — Bu repo Osmangazi Hackathon (Ekim 2026) sürümüdür ve dondurulmuştur.**
> Jüriye sunulan sürüm `v0.1.0` etiketidir; yeni geliştirme özel
> [`kulturrotam-platform`](https://github.com/EmirCobanOfficial/kulturrotam-platform) reposunda sürüyor.
> **`supabase/schema.sql` ve `supabase/seed.sql` tüm veriyi, `supabase/mekanlar.sql` ise kupon ve
> cüzdan kayıtlarını siler. Bunları hiçbir canlı veritabanında çalıştırma.** Bu belgedeki
> "dosyayı güncelle, sonra Supabase'de çalıştır" talimatları artık geçerli değildir.

Bursa / Osmangazi için kişiselleştirilmiş kültür rotası + "gez-kazan" puan, rozet ve indirim sistemi. Osmangazi Hackathon — Takım 13.

## Ne yapar

- **Rota sihirbazı** — süre, başlangıç saati, ilgi alanı ve bütçeyi sorar; açık mekanlardan yürüme mesafesine göre sıralı bir gün planı çıkarır, yemek saatine denk gelince rotaya en yakın lokantayı mola olarak ekler. Harita: Leaflet + OpenStreetMap.
- **QR check-in** — mekandaki QR okutulunca puan ve rozet düşer. Aynı mekandan ikinci puan yoktur.
- **Ödül cüzdanı** — puan, belediye tesisi / yerel esnaf kuponuna dönüşür (biri geri dönüşümlü sürpriz hediye kutusu).

Puan, rozet ve kupon hesapları veritabanındaki `security definer` SQL fonksiyonlarında yapılır; istemci bu değerleri doğrudan yazamaz.

## Kurulum (yaklaşık 10 dk)

1. **Supabase projesi aç** (supabase.com, ücretsiz).
2. SQL Editor'de sırayla çalıştır:
   - `supabase/schema.sql`
   - `supabase/seed.sql`
3. **Anonymous sign-in'i aç**: Authentication → Sign In / Providers → Anonymous sign-ins → Enable.
4. `.env.local.example`'ı `.env.local` olarak kopyala, Project Settings → API'den değerleri doldur:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_DEMO_SKIP_GEOFENCE=true
   ```
5. `npm install && npm run dev` → http://localhost:3000

> `NEXT_PUBLIC_DEMO_SKIP_GEOFENCE=true` iken istemci konumu yine ister, ama izin verilmezse check-in isteğini konumsuz gönderir. Kontrolü gerçekten atlatan tek yer sunucudaki `check_in()` fonksiyonudur (`supabase/geofence.sql` → `v_require_location`). Kontrol atlandığında ekranda "demo modu" etiketi görünür.

## Vercel'e deploy

1. Repoyu GitHub'a push et.
2. vercel.com → New Project → repoyu seç.
3. Environment Variables bölümüne yukarıdaki üç değişkeni ekle.
4. Deploy. (QR'lar deploy edilen domaini kullanır; `/admin/qr` sayfasından yazdır.)

## Geliştirici komutları

```bash
npm run dev      # yerel sunucu
npm run build    # production derleme + tip kontrolü
npm run test     # rota motoru testleri (vitest)
```

## Demo akışı

1. `/sihirbaz` → tercihleri seç → `/rota`'da harita + sıralı duraklar + yemek molası.
2. `/admin/qr` → bir mekanın QR'ını aç → telefonla okut → puan + rozet.
3. Aynı QR'ı tekrar okut → "zaten puan aldın", puan artmaz.
4. `/oduller` → puan yeten kuponu al → kod üretilir, cüzdanda görünür.

## Mimari

```
src/app/            sayfalar (/, /sihirbaz, /rota, /checkin/[token], /profil, /oduller, /admin/qr)
src/components/      SiteHeader, RouteView, RouteMap, CheckInClient
src/lib/route/       plan.ts (rota motoru, saf fonksiyon) + plan.test.ts
src/lib/data.ts      Supabase sorguları ve RPC çağrıları
src/lib/supabase/    anon istemci + anonim oturum
supabase/            schema.sql, seed.sql
```

## Roadmap (sunumda)

Tamamlandı: çoklu dil (TR/EN), topluluk fotoğraf akışı ve oylama, belediye etkinlik takvimi.

Sırada: "yol arkadaşı bul", esnaf self-servis paneli (şimdilik kuponları biz giriyoruz), sosyal etki fonu.
