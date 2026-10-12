# Devir Notu (Handoff)

> Oluşturuldu: 11 Ekim 2026
> Proje: KültürRotam — Osmangazi Hackathon, Takım 13
> Bu oturum: Vercel'e deploy edildi ve canlıda doğrulandı; ardından TR/EN dil desteği, topluluk fotoğraf akışı, belediye etkinlik takvimi ve e-posta ile kayıt/giriş yazıldı.

Bu dosya, işi devralan geliştirici ve onun yapay zekâ aracı (Gemini CLI, Cursor, vb.) içindir.
Önce `CLAUDE.md` dosyasını oku — mimari kuralları, komutlar ve bilinen tuzaklar orada.
Bu not yalnızca "şu an nerede kaldık" sorusunu cevaplar.

## Hedef

Jüri önünde canlı demo: ziyaretçi rota sihirbazını doldurur, harita üstünde duraklı bir
Bursa/Osmangazi rotası alır, mekandaki QR'ı okutup puan ve rozet kazanır, puanla kupon
alır. Uygulama canlıda çalışıyor; kalan iş demoyu sahneye hazırlamak ve son yazılan
özellikleri açmak.

## Nerede Kaldık (özet)

| Aşama | Durum |
|------|-------|
| Çekirdek demo akışı (sihirbaz → rota → QR → puan → kupon) | ✅ yazıldı, canlıda doğrulandı (kupon alma hariç) |
| Vercel deploy + `main`'e push ile otomatik yayın | ✅ çalışıyor |
| TR/EN dil anahtarı | ✅ canlıda çalışıyor, veritabanı gerektirmiyor |
| Kayıt / giriş (`/giris`) | ✅ canlıda doğrulandı: kayıt, e-posta doğrulama, çıkış, tekrar giriş |
| Fotoğraf akışı + etkinlik takvimi | ✅ canlıda doğrulandı |
| Ödüller: sarı (puanla al) / yeşil (bağışa çevir) | ✅ `rewards.sql` çalıştırıldı, canlıda doğrulandı |
| Ana sayfa, Hakkımızda, scroll animasyonları | ✅ canlıda |
| Manuel rota (`/kendi-rotam`) + sıralama optimizasyonu | ✅ canlıda; sihirbaz rotası da artık kendi üstünden geçmiyor |
| Sosyal etki programı (`/bursayla-ilk-bulusma`) | ✅ canlıda; katkı tutarı rakamı bekliyor |
| Mekan puanlama ve yorum (`/mekanlar`) | ✅ `reviews.sql` çalıştırıldı — **canlı test bekliyor** |
| QR kodlarının basılı hali | ⛔ canlı domainden yazdırılmadı |
| Bağımlılık açığı (Dependabot) | ✅ incelendi, demoyu etkilemiyor, bilinçli bırakıldı |

Kısaca: **demonun kendisi ayakta ve canlıda doğrulanmış durumda.** Kalan işler
kod yazmak değil, operasyon: bir SQL dosyasını çalıştırmak, QR'ları basmak ve iki
akışı (kayıt, kupon) canlıda bir kez denemek.

## Şu Anki Durum

**Canlıda çalışan ve production'da elle doğrulanan:**
- https://kulturrotam.vercel.app — Vercel projesi `emir-coban-official/kulturrotam`
- `main` dalına her push otomatik deploy olur, ayrı deploy adımı yok
- Rota sihirbazı → 6 duraklı rota, Leaflet haritası, 12:30'a otomatik yemek molası
- QR check-in → Ulu Cami'de +50 puan verdi, header puanı güncelledi
- Aynı QR ikinci kez okutulunca puan vermedi ("Bu mekandan puanını daha önce aldın")
- `NEXT_PUBLIC_DEMO_SKIP_GEOFENCE=true` etkin, "Demo modu" etiketi görünüyor
- TR/EN dil anahtarı (header) — veritabanı değişikliği gerektirmez, hemen çalışır

**Canlıda doğrulandı (11 Ekim):**
- Kayıt / giriş (`/giris`). Doğrulama maili **açık** ve çalışıyor. İki düzeltme gerekti:
  Site URL / Redirect URLs canlı domaine çekildi ve kod artık `emailRedirectTo` olarak
  sayfanın kendi origin'ini gönderiyor (`280b4da`) — öncesinde mail linki
  `localhost:3000`'e gidip `ERR_CONNECTION_REFUSED` veriyordu. Ayrıca Email provider'ın
  ana anahtarı bir ara kapandığı için giriş `"Email logins are disabled"` (422) döndü;
  açılınca düzeldi. Eski not: Supabase'de **"Confirm email" kapatıldı** (11 Ekim, takım
  bildirdi), yani kayıt sonrası oturum artık doğrudan açılmalı — jüri önünde posta
  kutusu açma derdi kalktı. Akışın kendisi (kayıt → `/profil` yönlendirmesi → çıkış →
  tekrar giriş) canlıda hiç denenmedi. Demo provasına bunu da ekle.

**Göçü çalıştırıldı, açıldı, ama canlıda hiç denenmedi:**
- Topluluk fotoğraf akışı (`/akis`) ve belediye etkinlik takvimi.
  `supabase/roadmap.sql` 11 Ekim'de Dashboard → SQL Editor üzerinden çalıştırıldı ve
  doğrulandı: `events` / `photos` / `photo_votes` tabloları mevcut, `photos` bucket'ı 1,
  `add_photo` + `vote_photo` fonksiyonları 2, seed etkinlik 3. Header'daki "Akış" linki
  geri eklendi (`d1035bf`). **Henüz denenmeyen:** fotoğraf yükleme, oylama, rotadaki
  etkinlik rozeti. Bunlar bozuksa demo yolu etkilenmez — sihirbaz, rota, QR ve kupon
  ayrı akışlar.

**Bilinen açık sorunlar:**
- GitHub Dependabot yüksek seviye bağımlılık açığı bildiriyor:
  https://github.com/EmirCobanOfficial/kulturrotam/security/dependabot/1
  **İncelendi, bilinçli olarak bırakıldı.** `npm audit` 5 high gösteriyor; hepsi tek bir
  zincir: `braces` → `micromatch` → `fast-glob` → `@next/eslint-plugin-next` →
  `eslint-config-next`. Bu paket `devDependencies` altında, yani yalnızca `npm run lint`
  çalışırken yüklenir — tarayıcıya giden pakete ve Vercel runtime'ına girmez, demoyu
  etkilemez. Açık da zaten "deeply nested glob pattern ile DoS", yani lint'e kasten kötü
  desen verebilen birini gerektirir. `npm audit fix --force` tek çözüm olarak
  `eslint-config-next`'i 16.4.0'dan 14.2.35'e düşürüyor; Next 16.4.0 ile sürüm uyumsuzluğu
  çıkarıp lint yapılandırmasını bozma riski, kazanımdan büyük. Demodan sonra
  `eslint-config-next` yukarı sürüme alınarak kapatılmalı.
- Şifre sıfırlama akışı yok. Şifresini unutan kullanıcı hesabına erişemez.
- `/akis` fotoğrafları herkese açık bucket'ta, moderasyon yok.
- `npm run lint` birkaç `setState in effect` hatası veriyor. Bunlar projede baştan beri
  var (`oduller`, `profil`, `admin/qr`, `RouteView`, `useProfile`) ve build'i engellemiyor.
  Yeni kod da aynı kalıbı izliyor; tutarlılık için düzeltilmedi.

## Dosyalar

| Dosya | Neden önemli |
|------|---------------|
| `CLAUDE.md` | Projenin tek doğruluk kaynağı: durum, mimari kuralları, tuzaklar. `GEMINI.md` buna symlink. |
| `supabase/reviews.sql` | **Çalıştırıldı (12 Ekim).** `reviews` tablosu + `add_review()`. Idempotent, ASCII. |
| `supabase/rewards.sql` | **Çalıştırıldı (12 Ekim).** Kuponlara `kind` + `image_url`, dokuz ödül/bağış kartı. |
| `supabase/roadmap.sql` | **Çalıştırıldı (11 Ekim).** `events`, `photos`, `photo_votes` tabloları + `photos` bucket'ı. Idempotent; tekrar çalıştırılabilir, ama 125. satır kendi seed etkinliklerini silip yeniden ekler. |
| `supabase/schema.sql` | Ana şema + `security definer` fonksiyonları (`check_in`, `redeem_coupon`, `set_nickname`). |
| `src/lib/supabase/client.ts` | Oturum yönetimi: `ensureSession`, `signUp`, `signIn`, `signOut`, `accountState`. |
| `src/app/giris/page.tsx` | Kayıt/giriş formu, iki sekmeli. |
| `src/lib/i18n.ts` | Tüm arayüz metinleri. Bileşene düz string gömme, buraya ekle. |
| `src/lib/errors.ts` | `errorText()` — Supabase hatalarını okunur mesaja çevirir. |
| `src/lib/route/plan.ts` | Rota motoru, saf fonksiyon. Değiştirirsen `plan.test.ts`'i güncelle. |
| `src/components/SiteHeader.tsx` | Akış linki `d1035bf` ile geri eklendi. |
| `src/app/admin/qr/page.tsx` | QR yazdırma. QR değerleri `window.location.origin` kullanır. |

## Denenip Yanlış Çıkan Şeyler

### 1. "Production'da check-in bozuk" — yanlış alarm
- **Ne yapıldı:** `/checkin/ulu-cami` adresi denendi, ekranda "Check-in başarısız / bilinmeyen hata" çıktı, HTTP 400 alındı.
- **Gerçek sebep:** `check_in(p_token uuid)` fonksiyonu **uuid** bekliyor, `ulu-cami` ise bir *slug*. Test URL'i hatalıydı, uygulama değil. Gerçek `qr_token` (örn. `5c8ebf0d-748a-4535-b2eb-0a943cb3d807`) ile denenince +50 puan verdi.
- **Ders:** QR tokenleri `places.qr_token` kolonundaki uuid'lerdir, slug değil.

### 2. Hatanın "bilinmeyen hata" diye görünmesi — gerçek bir kusurdu, düzeltildi
- **Sebep:** Supabase hataları `Error` örneği değil, düz nesnedir (`PostgrestError`). Kod `e instanceof Error ? e.message : "bilinmeyen hata"` yazdığı için gerçek sebep yutuluyordu.
- **Çözüm:** `src/lib/errors.ts` içindeki `errorText()`. Yeni kodda `instanceof Error` kullanma.

### 3. Anonim kullanıcının puanını koruma
- **Denenmedi ama bilinçli olarak reddedildi:** kayıt olurken `signUp` ile yeni kullanıcı yaratmak. Bu, `auth.uid()`'yi değiştirip toplanan tüm puan/rozet/ziyareti koparır.
- **Uygulanan:** anonim oturum varsa `supabase.auth.updateUser({email, password})` ile aynı kimlik kalıcıya çevrilir. `src/lib/supabase/client.ts` içindeki `signUp()` bunu yapar. **Bu akışı bozma.**

## Sıradaki Adımlar

1. **QR kodlarını yazdır.** Tarayıcıda https://kulturrotam.vercel.app/admin/qr aç, sağ üstteki "Yazdır"a bas. QR'lar sayfanın açıldığı adresi gömer; yerelden (`localhost:3000`) yazdırılan kodlar demoda çalışmaz.

2. ~~**Kayıt / giriş akışını canlıda dene.**~~ ✅ **Yapıldı** (11 Ekim). Kayıt, e-posta doğrulama, çıkış ve tekrar giriş canlıda çalışıyor. Email provider'ın ana anahtarı AÇIK kalmalı — kapalıyken kayıt çalışır ama giriş 422 `"Email logins are disabled"` döner (ayrıntı `CLAUDE.md` → Bilinen tuzaklar). **Tek doğrulanmayan:** giriş sonrası puanların korunduğu gözle teyit edilmedi; provada header'daki puan rozetine bak.

3. ~~**`supabase/roadmap.sql`'i çalıştır.**~~ ✅ **Yapıldı** (11 Ekim). Dashboard → SQL Editor'den çalıştırıldı, "Success. No rows returned" döndü ve doğrulandı (3 tablo / 1 bucket / 2 fonksiyon / 3 etkinlik). Akış linki `SiteHeader.tsx`'e geri eklendi (`d1035bf`). **Kalan iş:** `/akis`'te fotoğraf yükleme ve oylamayı, rotada etkinlik rozetini canlıda dene. Hiçbiri test edilmedi.

4. **Demo provası yap:** sihirbaz → rota → QR okut → puan → aynı QR tekrar → puan vermiyor → `/oduller`'de kupon al. Kupon alma akışı production'da test edilmedi (puan harcadığı için denenmedi).

## Önemli Kısıtlar

- **Her değişiklikten sonra `npm run build` ve `npm run test` çalıştır.** Şu an ikisi de temiz (test 8/8).
- Puan, rozet ve kupon mantığı veritabanındaki `security definer` fonksiyonlarında kalmalı. İstemciye taşıma — sahnede yanlış puan çıkar.
- Tüm tablolarda RLS açık, istemciye `insert`/`update` yetkisi yok. Tek istisna `storage.objects` (fotoğraf yükleme), kullanıcı yalnızca kendi `auth.uid()` klasörüne yazabilir.
- Türkçe karakterler Supabase SQL editörüne panodan yapıştırılırsa bozulur. `psql` veya Supabase CLI kullan, ya da `chr()` ile ASCII'ye çevir.
- Leaflet SSR'da patlar; harita `dynamic(..., { ssr: false })` ile yüklenmeli.
- `.env.local` git'te yok. Üç `NEXT_PUBLIC_*` değişkenini Supabase Dashboard → Project Settings → API'den doldur. Vercel'de zaten girili.
- **Kapsam dışı bırakılanlar:** esnaf self-servis paneli (kuponları takım elle girecek), "yol arkadaşı bul", sosyal etki fonu.
- Takım kararı: doğrudan `main`'e push, sorun çıkarsa sonradan düzeltilir. İki kişi aynı anda çalışacaksa ayrı dal açın, yoksa çakışma çıkar.

## Geçmişe Bakmak İçin

`git log --oneline` son altı commit'te bu oturumun tamamını anlatır; en yenisi `31486be`.
Özellik commit'leri: `1a1515e` (kayıt/giriş), `ff6284e` (TR/EN + akış + etkinlik),
`79295fd` (akışı demo yolundan çıkarma), `6139beb` (deploy kaydı).
