# Paralel çalışma notu

> **ARŞİV — Bu repo Osmangazi Hackathon (Ekim 2026) sürümüdür ve dondurulmuştur.**
> Jüriye sunulan sürüm `v0.1.0` etiketidir; yeni geliştirme özel
> [`kulturrotam-platform`](https://github.com/EmirCobanOfficial/kulturrotam-platform) reposunda sürüyor.
> **`supabase/schema.sql` ve `supabase/seed.sql` tüm veriyi, `supabase/mekanlar.sql` ise kupon ve
> cüzdan kayıtlarını siler. Bunları hiçbir canlı veritabanında çalıştırma.** Bu belgedeki
> "dosyayı güncelle, sonra Supabase'de çalıştır" talimatları artık geçerli değildir.

> 12 Ekim 2026. Üç kişi aynı anda ilerliyor:
> biri "birlikte gezelim" ve rehberlik sistemini, biri puan sistemini,
> biri de ana sayfa / ödül tarafını yazıyor.
>
> Önce `CLAUDE.md` oku — mimari kuralları ve bilinen tuzaklar orada.
> Bu dosya yalnızca "başkasının işini bozmadan nasıl çalışırım" sorusunu cevaplar.

## Başlarken

```bash
git clone https://github.com/EmirCobanOfficial/kulturrotam.git
cd kulturrotam
npm install
cp .env.local.example .env.local   # Supabase Dashboard → Connect'ten doldur
npm run dev
```

`.env.local` git'te yok, üç `NEXT_PUBLIC_*` değişkeni gerekiyor. Vercel'de zaten girili.

## Kendi dalında çalış

`main`'e doğrudan push etme — şu anda üç kişi aynı dosyalara dokunuyor.

```bash
git checkout -b puan-sistemi      # ya da ne üzerinde çalışıyorsan
# ... değişiklikler ...
npm run build && npm run test     # ikisi de temiz olmalı
git push -u origin puan-sistemi
```

Sonra GitHub'da pull request aç. Entegrasyonu dalı açan değil, `main`'i
toplayan kişi yapar.

**Dalını sık sık güncel tut**, yoksa birleştirme acı olur:

```bash
git fetch origin main && git merge origin/main
```

## Puan sistemi üzerinde çalışacaksan — bunu bozmayın

Bu projede **puan, rozet ve kupon harcama mantığı istemcide değil,
veritabanındaki `security definer` fonksiyonlarında** duruyor:

| Fonksiyon | Ne yapar |
|---|---|
| `check_in(p_token uuid)` | QR okutunca puan + rozet verir, aynı mekandan ikinci puanı engeller |
| `redeem_coupon(p_coupon uuid)` | Puanı düşer, stoğu azaltır, kupon kodu üretir — tek kilitli işlemde |
| `set_nickname(...)` | Profil adı |

Hepsi `supabase/schema.sql` içinde. Yeni puan kuralı yazacaksan **oraya
yeni bir `security definer` fonksiyon ekle**, istemciye taşıma. Sebebi
basit: istemcide hesaplanan puan kurcalanabilir ve jüri önünde yanlış
sayı çıkarsa demo biter.

Tüm tablolarda RLS açık ve istemcinin hiçbir tabloda `insert`/`update`
yetkisi yok. Tek istisna `storage.objects` (fotoğraf yükleme). Yani
"tablodan `update` çekerim" diye başlarsan RLS seni durdurur — bu bir
hata değil, tasarım.

### Puan verisi şu an nerede

- `profiles.points` — tek bakiye, `integer`
- `coupons.kind` — `'reward'` (sarı, puanla alınan ödül) veya `'donation'`
  (yeşil, puanı bağışa çeviren kart)
- `coupons.cost_points`, `coupons.stock`
- `redemptions` — alınan kuponlar ve kodları

İki ayrı bakiye (sarı puan / yeşil iyilik puanı) istenirse `profiles`'a
ikinci bir kolon ve `redeem_coupon`'a hangi bakiyeden düşeceği bilgisi
gerekir. Şu an tek bakiye var, bilerek.

## Şema değişikliği yapacaksan

`supabase/schema.sql` **baştan kurulum** dosyası: başında `drop table`
var, canlı veritabanında çalıştırırsan veriyi silersin. Canlıya değişiklik
götürmenin yolu ayrı bir ek dosya yazmak — `roadmap.sql` ve `rewards.sql`
bunun örneği:

- `if not exists`, `drop policy if exists`, `on conflict` kullan ki
  tekrar çalıştırılabilsin
- `schema.sql` ve `seed.sql`'i de güncelle, sıfırdan kurulum da alsın
- **Dosyayı ASCII yaz.** Türkçe karakterler Supabase SQL editörüne
  panodan yapıştırılınca bozuluyor ("Müzesi" → "M√ºzesi"). Her non-ASCII
  karakteri `' || chr(<kod>) || '` ile değiştir. `rewards.sql` böyle
  yazıldı, örnek alabilirsin.

## Arayüz kuralları

- Metinleri bileşene gömme, `src/lib/i18n.ts` sözlüğüne ekle ve `t("...")`
  ile kullan. Header'da TR/EN anahtarı var; gömülü Türkçe, İngilizce'ye
  geçince olduğu gibi kalır ve demoda göze batar.
- Hata yakalarken `instanceof Error` **kullanma**. Supabase hataları düz
  nesne, o kontrol hiç tutmaz ve gerçek sebep yutulur. `errorText()`
  (`src/lib/errors.ts`) kullan.
- Leaflet SSR'da patlar; harita bileşeni `dynamic(..., { ssr: false })`
  ile yüklenmeli.
- Scroll ile beliren bölümler için `<Reveal>` (`src/components/Reveal.tsx`)
  var, yeni animasyon kütüphanesi ekleme.

## Göndermeden önce

```bash
npm run build   # derleme + tip kontrolü
npm run test    # rota motoru testleri, 8/8 geçmeli
```

İkisi de temiz değilse push etme. `main`'e giden her şey otomatik olarak
production'a deploy oluyor — kırık bir push canlı demoyu etkiler.
