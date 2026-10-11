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

## Şu Anki Durum

**Canlıda çalışan ve production'da elle doğrulanan:**
- https://kulturrotam.vercel.app — Vercel projesi `emir-coban-official/kulturrotam`
- `main` dalına her push otomatik deploy olur, ayrı deploy adımı yok
- Rota sihirbazı → 6 duraklı rota, Leaflet haritası, 12:30'a otomatik yemek molası
- QR check-in → Ulu Cami'de +50 puan verdi, header puanı güncelledi
- Aynı QR ikinci kez okutulunca puan vermedi ("Bu mekandan puanını daha önce aldın")
- `NEXT_PUBLIC_DEMO_SKIP_GEOFENCE=true` etkin, "Demo modu" etiketi görünüyor
- TR/EN dil anahtarı (header) — veritabanı değişikliği gerektirmez, hemen çalışır

**Kodu yazıldı ama canlıda HİÇ test edilmedi:**
- Kayıt / giriş (`/giris`). Test edilemedi çünkü Supabase'de "Confirm email" ayarının
  kapatılması gerekiyor (aşağıda 2. adım).

**Kodu yazıldı ama veritabanı göçü çalıştırılmadı, bu yüzden kapalı:**
- Topluluk fotoğraf akışı (`/akis`) ve belediye etkinlik takvimi.
  `supabase/roadmap.sql` çalıştırılmadı (hackathonda zaman yetmedi, bilinçli karar).
  Bu yüzden: header'daki "Akış" linki `SiteHeader.tsx` içinde yorum satırına alındı,
  `/akis` adresine elle girilirse ham Postgres hatası yerine "henüz açık değil" mesajı
  çıkar, rotada etkinlik rozeti görünmez. **Demo bundan etkilenmez, rota normal çizilir.**

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
| `supabase/roadmap.sql` | Çalıştırılmayı bekleyen göç: `events`, `photos`, `photo_votes` tabloları + `photos` storage bucket'ı. Ek olarak çalışır, veri silmez, tekrar çalıştırılabilir. |
| `supabase/schema.sql` | Ana şema + `security definer` fonksiyonları (`check_in`, `redeem_coupon`, `set_nickname`). |
| `src/lib/supabase/client.ts` | Oturum yönetimi: `ensureSession`, `signUp`, `signIn`, `signOut`, `accountState`. |
| `src/app/giris/page.tsx` | Kayıt/giriş formu, iki sekmeli. |
| `src/lib/i18n.ts` | Tüm arayüz metinleri. Bileşene düz string gömme, buraya ekle. |
| `src/lib/errors.ts` | `errorText()` — Supabase hatalarını okunur mesaja çevirir. |
| `src/lib/route/plan.ts` | Rota motoru, saf fonksiyon. Değiştirirsen `plan.test.ts`'i güncelle. |
| `src/components/SiteHeader.tsx` | Akış linki burada yorum satırında; göç çalışınca geri ekle. |
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

2. **Supabase'de e-posta doğrulamasını kapat.** Dashboard → Authentication → Sign In / Providers → Email → "Confirm email" kapalı olmalı. Açıkken kayıt sonrası oturum açılmaz ve jüri önünde e-posta kutusu açman gerekir. Kapattıktan sonra `/giris` sayfasında kayıt → `/profil`'e yönlenme → çıkış → tekrar giriş akışını canlıda dene. **Bu akış hiç test edilmedi.**

3. **Zaman kalırsa `supabase/roadmap.sql`'i çalıştır.** Supabase Dashboard → SQL Editor → dosyayı yapıştır → Run. Türkçe karakterler `chr()` ile yazıldığı için panodan yapıştırmak güvenli. Sonra `src/components/SiteHeader.tsx` içindeki yorum satırının yerine Akış linkini geri ekle:
   ```tsx
   <Link className="rounded-full px-3 py-1.5 hover:bg-brand-soft" href="/akis">
     {t("nav_feed")}
   </Link>
   ```
   Ardından `/akis`'te fotoğraf yükleme ve oylamayı, rotada etkinlik rozetini dene. Hiçbiri canlıda test edilmedi.

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
