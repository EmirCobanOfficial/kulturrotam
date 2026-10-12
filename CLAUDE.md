# KültürRotam — proje kuralları ve durum

Osmangazi Hackathon, Takım 13. Bursa/Osmangazi için kişiselleştirilmiş kültür rotası + "gez-kazan" puan/rozet/indirim web uygulaması. Jüri önünde canlı demo hedefleniyor.

## Durum (11 Ekim 2026)

Çalışıyor ve gerçek veritabanına karşı uçtan uca doğrulandı:

- Rota sihirbazı (`/sihirbaz`) → 10 duraklı rota, Leaflet haritası, yürüme süreleri, öğle/akşam penceresine otomatik yemek molası
- Manuel rota (`/kendi-rotam`) → mekanları kendi sıranla ekle, ↑↓ ile sırala. Eklenen mekan en az yürüten konuma girer; sıra bozulursa "Sıralamayı kısalt" önerisi çıkar (`optimizeOrder`, en yakın komşu + 2-opt, ilk durak sabit)
- Ana sayfa → hero, 3 alanlı hızlı başlangıç (sihirbaza taşınır), bugünün etkinlikleri, problem kartları (soru işareti çözümü açar), sponsorlar; scroll ile beliren `Reveal` animasyonları
- Hakkımızda (`/hakkimizda`)
- Sosyal etki programı (`/bursayla-ilk-bulusma`) → "Bursa'yla İlk Buluşma": ana sayfada özet bölüm, ayrıntı sayfası, bilet katkı kutusu (`TicketContribution`). Tutar henüz belirlenmedi, ekranda yer tutucu görünür — rakamı takım verecek.
- Etkinlikler (`/etkinlikler`) → gün seçimi (önümüzdeki iki hafta) + alan süzgeci; her gün yedi alanın (tarihi, müze, kültürel, konser & sinema, manzara, çarşı, yemek) her birinde bir etkinlik var. Yönlendirme geliri ve bilet katkısı açıklamaları duruyor; **arka uç yok**, gerçek affiliate linki yok; metinler modeli anlatıyor, gelecek zamanda yazıldı.
- Mekanlar, puanlama ve yorum (`/mekanlar`) → 1-5 yıldız + kısa yorum, mekan başına ortalama. Yazma `add_review()` security definer fonksiyonundan geçer; kişi başına mekan başına tek değerlendirme, tekrar gönderim öncekini günceller.
- QR check-in (`/checkin/[token]`) → puan + rozet; aynı mekandan ikinci puan yok
- Ödül cüzdanı (`/oduller`) → puan düşer, kupon kodu üretilir; puan yetmezse reddedilir
- Profil (`/profil`), QR yazdırma sayfası (`/admin/qr`)
- Kayıt / giriş (`/giris`) → e-posta + şifre. Anonim gezen kullanıcı kayıt olunca **aynı `auth.uid()` ile kalıcıya dönüşür**, puan ve rozetler korunur (`supabase.auth.updateUser`). Header'da Giriş/Çıkış, profilde hesap satırı.
- TR/EN dil anahtarı (header) → mekan adı/açıklaması `name_en`/`description_en` alanlarından gelir
- Topluluk fotoğraf akışı (`/akis`) → Supabase Storage'a yükleme, fotoğraf başına tek oy
- Belediye etkinlik takvimi → `events` tablosu; rota motoru o gün etkinliği olan mekanı öne alır ve durağa rozet iliştirir

Supabase projesi `ooyjctgdfkexjybiqjti` kurulu: şema + seed yüklü, anonymous sign-in açık.

**Canlı: https://kulturrotam.vercel.app** (Vercel projesi `emir-coban-official/kulturrotam`, `main` dalına her push otomatik deploy olur). Üç `NEXT_PUBLIC_*` değişkeni Production ve Preview için girili. Production'da doğrulandı: sihirbaz rota üretiyor, check-in puan veriyor, ikinci tarama puan vermiyor, demo modu etiketi görünüyor.

**`supabase/roadmap.sql` çalıştırıldı** (11 Ekim, Dashboard → SQL Editor). `events`, `photos`, `photo_votes` tabloları, `photos` storage bucket'ı, RLS politikaları ve `add_photo()` / `vote_photo()` fonksiyonları artık veritabanında. Doğrulandı: üç tablo mevcut, bucket 1, fonksiyon 2, etkinlik 3. Header'daki Akış linki geri eklendi (`d1035bf`).

Dosya idempotent, tekrar çalıştırılabilir. Tek uyarı: 125. satır `delete from public.events where source = 'belediye'` yapar — kendi seed'ini silip yeniden ekler. Puan, rozet, mekan ve kullanıcı verisine dokunmaz. Etkinlik tarihleri `current_date` üzerinden üretildiği için demo hangi gün olursa olsun o güne düşer; tekrar çalıştırmaya gerek yok.

**`supabase/rewards.sql` çalıştırıldı** (12 Ekim). `coupons` tablosuna `kind` (`reward` = sarı, puanla alınan ödül / `donation` = yeşil, puanı bağışa çeviren kart) ve `image_url` kolonları eklendi; dokuz kart yüklendi. Kart görselleri `public/oduller/` altında. **Tek puan bakiyesi var** (`profiles.points`); iki kategori aynı bakiyeden harcar, `redeem_coupon` değişmedi.

**11 Ekim'de canlıda doğrulandı:** `/akis` fotoğraf yükleme ve oylama (tek oy kuralı dahil), QR check-in'in ikinci taramada puan vermemesi, kayıt → e-posta doğrulama → giriş akışı.

**12 Ekim'de canlıda doğrulandı:** `/oduller` kupon alma (sarı ve yeşil sekme).

**`supabase/reviews.sql` çalıştırıldı** (12 Ekim). `reviews` tablosu ve `add_review()` fonksiyonu veritabanında. Kişi başına mekan başına tek değerlendirme; tekrar gönderim yeni satır açmaz, mevcut satırı günceller.

**Canlıda hâlâ denenmedi:** rotadaki etkinlik rozeti, `/mekanlar` puanlama ve yorum arayüzü. `/mekanlar` "henüz açık değil" diyorsa göç uygulanmamış demektir.

**Sahiplik (12 Ekim, üç kişi paralel çalışıyor):** puan ve ödül tarafı ekipten bir arkadaşa devredildi — `profiles.points`, `coupons`, `redeem_coupon` ve `/oduller` ona ait. O alana dokunmadan önce onunla konuş, yoksa aynı anda iki kişi aynı mantığı yazar.

**`supabase/etkinlik-takvimi.sql` HENÜZ ÇALIŞTIRILMADI (12 Ekim).** Etkinlik
takvimini üç haftaya ve yedi alana yayıyor: `events.area` kolonunu ekler, yeni
ilgi alanlarının mekan etiketlerini (`kulturel`, `konser-sinema`) yazar ve
`source = 'kesif'` etkinliklerini yeniden üretir. `etkinlikler.sql`'in tek
günlük etkinliklerinin yerini alır — o dosya yalnızca `image_url` /
`ticket_url` kolonları için hâlâ gerekli. İdempotent; puan, rozet ve kullanıcı
verisine dokunmaz. Çalıştırmadan önce `/etkinlikler` yalnızca bugünü gösterir
ve sihirbazdaki **Kültürel** / **Konserler ve sinema** seçenekleri rotayı
değiştirmez (mekanlarda etiketleri yok).

**İlgi alanları değişti (12 Ekim):** sihirbaz ve ana sayfadaki hızlı başlangıç
artık `tarihi, muze, kulturel, konser-sinema, manzara, alisveris` soruyor —
Mimari ve Park & bahçe kaldırıldı. İki liste **birebir aynı kalmalı**, seçim
ana sayfadan sihirbaza sorgu parametresiyle taşınıyor. Yeni bir ilgi alanı
eklerken mekanlara da etiketini ekle: rota motoru anahtarı `category` + `tags`
içinde arar, etiketsiz seçenek hiçbir rotayı etkilemez.

**Düğme ölçüsü tek yerden:** `globals.css` içindeki `.btn` (pill düğmeler) ve
`.choice` (sihirbaz seçenek kartları) sınıfları yüksekliği ve dolguyu tutar;
renk sınıfları Tailwind'den gelir. Yeni düğmeye `px-6 py-3` yazmak yerine
`.btn` ver, yoksa sayfada boy farkı çıkar.

**Kalan iş (hepsi operasyon, kod değil — ayrıntısı `HANDOFF.md`'de):**

1. **`supabase/etkinlik-takvimi.sql`'i çalıştır** (Dashboard → SQL Editor).
   Sonunda doğrulama sorgusu var: 21 gün, 7 alan beklenir.
2. **QR kodlarını yazdır.** `/admin/qr` sayfasını **canlı domainden** aç ve yazdır — QR değerleri `window.location.origin` ile üretilir; yerelden yazdırılan kodlar `localhost`, Vercel preview dalından yazdırılanlar ise dal silinince ölen bir adres gösterir.
3. **Canlıda bir kez dene:** rotada etkinlik rozeti (`/sihirbaz` → rota; Ulu Cami, Koza Han ve Kent Müzesi duraklarında bugüne ait rozet çıkmalı). Hiç test edilmedi.

Birden fazla kişi aynı anda çalışıyorsa `KATKI.md`'yi oku: dal açma, şema değişikliği ve puan mantığına dokunma kuralları orada.

## Mimari kuralları

- Next.js App Router + TypeScript + Tailwind. Ayrı API katmanı yok: istemci doğrudan Supabase'e konuşur.
- Puan, rozet, kupon harcaması ve değerlendirme **veritabanındaki `security definer` fonksiyonlarında** yapılır (`check_in`, `redeem_coupon`, `set_nickname`, `add_review`). Bu mantığı istemciye taşıma — sahnede yanlış puan çıkmasın.
- Tüm tablolarda RLS açık; istemciye hiçbir tabloda `insert`/`update` yetkisi verilmez. Tek istisna `storage.objects`: fotoğraf yüklemek için gerekli, istemci yalnızca kendi `auth.uid()` klasörüne yazabilir. `photos` satırını yine `add_photo()` oluşturur.
- Anonim oturum temel durumdur: `ensureSession()` her zaman bir oturum açar, kayıt onu yükseltir. Kayıt akışını `signIn`/`signUp` yerine yeni bir kullanıcı yaratacak şekilde değiştirme — puanlar kaybolur.
- Arayüz metinleri `src/lib/i18n.ts` sözlüğünde; bileşene düz Türkçe string gömme, `t("...")` kullan.
- Supabase hataları `Error` değil düz nesnedir; `instanceof Error` yerine `errorText()` (`src/lib/errors.ts`) kullan, yoksa gerçek sebep "bilinmeyen hata"ya dönüşür.
- Rota motoru (`src/lib/route/plan.ts`) saf fonksiyon, Supabase'den bağımsız ve testli. Rota kuralı değiştirirsen `src/lib/route/plan.test.ts`'i güncelle.
- Şema/veri değişikliği `supabase/schema.sql` ve `supabase/seed.sql` üzerinden yapılır; dosyayı güncelle, sonra Supabase'de çalıştır.

## Bilinen tuzaklar

- **Türkçe karakterler Supabase SQL editörüne panodan yapıştırılırsa bozulur** (Chrome→Monaco encoding; "Müzesi" → "M√ºzesi"). Elle yapıştıracaksan önce ASCII'ye çevir: her non-ASCII karakteri `'||chr(<kod>)||'` ile değiştir. `psql` veya Supabase CLI kullanırsan sorun yok.
- `.env.local` git'te yok. Yoksa `cp .env.local.example .env.local` ve Dashboard → Connect'ten doldur.
- **Email provider sayfasında iki ayrı anahtar var, karıştırma.** Dashboard → Authentication → Sign In / Providers → Email:
  - **"Enable Email provider" AÇIK kalmalı.** Kapatılırsa `signInWithPassword` 422 ile `"Email logins are disabled"` döner. Sinsi tarafı: **kayıt yine çalışıyor gibi görünür**, çünkü anonim kullanıcıyı kalıcıya çeviren yol `updateUser()` kullanır ve bu anahtara bakmaz. Yani "kayıt oluyorum ama giriş yapamıyorum" tablosunu görürsen sebep budur. 11 Ekim'de bir kez bu şekilde kapatıldı ve giriş kırıldı.
  - **"Confirm email"** doğrulama mailini yönetir. Şu an **açık** ve çalışıyor; akış canlıda test edildi.
- **Anonim kullanıcıyı kalıcıya çevirmek Supabase için bir "e-posta değişikliği"dir**, kayıt değil. Gelen mailin tipi `type=email_change` olur ve bu **"Confirm email" anahtarından etkilenmez**. Doğrulama mailini tamamen kaldırmaya çalışıyorsan yanlış anahtarla uğraşma.
- **Doğrulama mailindeki link Site URL'e gider.** `emailRedirectTo` verilmezse Supabase projenin Site URL'ini kullanır; varsayılan `localhost:3000` olduğu için canlıda kaydolan kullanıcı tıklayınca `ERR_CONNECTION_REFUSED` alır. Kod artık her iki kayıt yolunda da `window.location.origin + "/profil"` gönderiyor (`src/lib/supabase/client.ts`), **ama Supabase yalnızca Authentication → URL Configuration → Redirect URLs listesindeki adresleri kabul eder.** Yeni bir domain eklersen oraya da ekle.
- Leaflet SSR'da patlar; harita bileşeni `dynamic(..., { ssr: false })` ile yüklenmeli.
- **Konum kontrolü iki yerde kapatılır, ikisini birlikte düşün.** `NEXT_PUBLIC_DEMO_SKIP_GEOFENCE=true` yalnızca **istemciyi** susturur ve "demo modu" etiketi gösterir; sunucuyu etkilemez. Asıl kural `check_in()` içindeki `v_require_location` sabitidir (`supabase/geofence.sql`). Sahnede mekana 300 m yaklaşılamayacaksa **ikisini birlikte** kapat, yoksa check-in "konum gerekli" diye reddeder.
- **Eski bir açık kapatıldı (12 Ekim):** `check_in()` mesafeyi yalnızca koordinat geldiyse kontrol ediyordu; tarayıcıda konum iznini reddeden kullanıcı `null` gönderip kontrolü tamamen atlıyor ve puanı yine alıyordu. İstemci hatayı yutuyordu (`getCoords().catch(() => undefined)`). Artık sunucu koordinatsız check-in'i reddediyor ve istemci kullanıcıya izin vermesi gerektiğini söylüyor. **İstemci her zaman `null` gönderebilir; tek gerçek güvence sunucudadır** — bu kontrolü istemciye taşıma.

## Komutlar

```bash
npm run dev     # yerel sunucu
npm run build   # derleme + tip kontrolü
npm run test    # rota motoru testleri
```

Her değişiklikten sonra `npm run build` ve `npm run test` çalıştır.
