# KültürRotam — proje kuralları ve durum

Osmangazi Hackathon, Takım 13. Bursa/Osmangazi için kişiselleştirilmiş kültür rotası + "gez-kazan" puan/rozet/indirim web uygulaması. Jüri önünde canlı demo hedefleniyor.

## Durum (11 Ekim 2026)

Çalışıyor ve gerçek veritabanına karşı uçtan uca doğrulandı:

- Rota sihirbazı (`/sihirbaz`) → 10 duraklı rota, Leaflet haritası, yürüme süreleri, öğle/akşam penceresine otomatik yemek molası
- QR check-in (`/checkin/[token]`) → puan + rozet; aynı mekandan ikinci puan yok
- Ödül cüzdanı (`/oduller`) → puan düşer, kupon kodu üretilir; puan yetmezse reddedilir
- Profil (`/profil`), QR yazdırma sayfası (`/admin/qr`)
- Kayıt / giriş (`/giris`) → e-posta + şifre. Anonim gezen kullanıcı kayıt olunca **aynı `auth.uid()` ile kalıcıya dönüşür**, puan ve rozetler korunur (`supabase.auth.updateUser`). Header'da Giriş/Çıkış, profilde hesap satırı.
- TR/EN dil anahtarı (header) → mekan adı/açıklaması `name_en`/`description_en` alanlarından gelir
- Topluluk fotoğraf akışı (`/akis`) → Supabase Storage'a yükleme, fotoğraf başına tek oy
- Belediye etkinlik takvimi → `events` tablosu; rota motoru o gün etkinliği olan mekanı öne alır ve durağa rozet iliştirir

Supabase projesi `ooyjctgdfkexjybiqjti` kurulu: şema + seed yüklü, anonymous sign-in açık.

**Canlı: https://kulturrotam.vercel.app** (Vercel projesi `emir-coban-official/kulturrotam`, `main` dalına her push otomatik deploy olur). Üç `NEXT_PUBLIC_*` değişkeni Production ve Preview için girili. Production'da doğrulandı: sihirbaz rota üretiyor, check-in puan veriyor, ikinci tarama puan vermiyor, demo modu etiketi görünüyor.

**`supabase/roadmap.sql` henüz çalıştırılmadı** (hackathon zamanı yetmedi). İçinde `events`, `photos`, `photo_votes` tabloları ve `photos` storage bucket'ı var; schema.sql'e ek olarak çalışır, mevcut veriyi silmez, tekrar çalıştırılabilir.

Çalıştırılana kadar: kod hazır ama veri yok. `/akis` "henüz açık değil" mesajı gösterir ve header'daki Akış linki gizlidir (`SiteHeader.tsx`'te yorum satırı — SQL çalışınca geri ekle). Rotada etkinlik rozeti çıkmaz; rota normal çizilir, demo etkilenmez.

**Kalan iş: QR kodlarını yazdır.** `/admin/qr` sayfasını canlı domainden aç ve yazdır — QR değerleri `window.location.origin` ile üretilir, yerelden yazdırılan kodlar `localhost` gösterir.

## Mimari kuralları

- Next.js App Router + TypeScript + Tailwind. Ayrı API katmanı yok: istemci doğrudan Supabase'e konuşur.
- Puan, rozet ve kupon harcaması **veritabanındaki `security definer` fonksiyonlarında** yapılır (`check_in`, `redeem_coupon`, `set_nickname`). Bu mantığı istemciye taşıma — sahnede yanlış puan çıkmasın.
- Tüm tablolarda RLS açık; istemciye hiçbir tabloda `insert`/`update` yetkisi verilmez. Tek istisna `storage.objects`: fotoğraf yüklemek için gerekli, istemci yalnızca kendi `auth.uid()` klasörüne yazabilir. `photos` satırını yine `add_photo()` oluşturur.
- Anonim oturum temel durumdur: `ensureSession()` her zaman bir oturum açar, kayıt onu yükseltir. Kayıt akışını `signIn`/`signUp` yerine yeni bir kullanıcı yaratacak şekilde değiştirme — puanlar kaybolur.
- Arayüz metinleri `src/lib/i18n.ts` sözlüğünde; bileşene düz Türkçe string gömme, `t("...")` kullan.
- Supabase hataları `Error` değil düz nesnedir; `instanceof Error` yerine `errorText()` (`src/lib/errors.ts`) kullan, yoksa gerçek sebep "bilinmeyen hata"ya dönüşür.
- Rota motoru (`src/lib/route/plan.ts`) saf fonksiyon, Supabase'den bağımsız ve testli. Rota kuralı değiştirirsen `src/lib/route/plan.test.ts`'i güncelle.
- Şema/veri değişikliği `supabase/schema.sql` ve `supabase/seed.sql` üzerinden yapılır; dosyayı güncelle, sonra Supabase'de çalıştır.

## Bilinen tuzaklar

- **Türkçe karakterler Supabase SQL editörüne panodan yapıştırılırsa bozulur** (Chrome→Monaco encoding; "Müzesi" → "M√ºzesi"). Elle yapıştıracaksan önce ASCII'ye çevir: her non-ASCII karakteri `'||chr(<kod>)||'` ile değiştir. `psql` veya Supabase CLI kullanırsan sorun yok.
- `.env.local` git'te yok. Yoksa `cp .env.local.example .env.local` ve Dashboard → Connect'ten doldur.
- **Supabase'de e-posta doğrulaması açıksa** kayıt sonrası oturum gelmez; kullanıcı posta kutusuna erişemediği demoda giriş yapamaz. Dashboard → Authentication → Sign In / Providers → Email → "Confirm email" kapalı olmalı. Kod iki durumu da yönetir: doğrulama gerekiyorsa ekranda bilgilendirme çıkar.
- Leaflet SSR'da patlar; harita bileşeni `dynamic(..., { ssr: false })` ile yüklenmeli.
- `NEXT_PUBLIC_DEMO_SKIP_GEOFENCE=true` iken check-in konum kontrolünü atlar ve ekranda "demo modu" etiketi gösterir. Jüri salonunda mekana 300 m yakın olunamayacağı için demoda açık kalmalı; etiketi gizleme, jüriye açıkça söyle.

## Komutlar

```bash
npm run dev     # yerel sunucu
npm run build   # derleme + tip kontrolü
npm run test    # rota motoru testleri
```

Her değişiklikten sonra `npm run build` ve `npm run test` çalıştır.
