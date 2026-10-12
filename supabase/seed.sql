-- UYARI (ARSIV): Bu dosya tum mekan, kupon, ziyaret ve rozet verisini DELETE ile siler. Hicbir canli veritabaninda CALISTIRMA.
-- KültürRotam — demo verisi. schema.sql'den sonra çalıştırılır.
-- Koordinatlar OpenStreetMap/Nominatim'den alındı; Tophane ve Kapalıçarşı
-- OSM'de nokta olarak kayıtlı olmadığı için yakın (±150 m) elle girildi.

delete from public.redemptions;
delete from public.user_badges;
delete from public.visits;
delete from public.coupons;
delete from public.badges;
delete from public.places;

insert into public.places
  (slug, name_tr, name_en, category, lat, lng, visit_minutes, cost_level,
   open_hour, close_hour, tags, description_tr, points_reward, sort_order)
values
  ('panorama-1326', 'Panorama 1326 Bursa Fetih Müzesi', 'Panorama 1326 Conquest Museum',
   'muze', 40.1864178, 29.0751579, 60, 2, 9, 18, '{tarih,muze,aile,kulturel}',
   'Bursa''nın fethini 360 derece panoramik tabloyla anlatan müze. Şehrin hikâyesine buradan başlamak en kolayı.', 60, 1),

  ('ulu-cami', 'Ulu Cami', 'Grand Mosque',
   'tarihi', 40.1834633, 29.0617892, 30, 0, 8, 20, '{tarih,mimari,kulturel,ucretsiz}',
   '1399 tarihli, 20 kubbeli ulu cami. İçindeki şadırvan ve hat levhaları mutlaka görülmeli.', 50, 2),

  ('kapali-carsi', 'Kapalıçarşı ve Kestane Şekeri Durağı', 'Covered Bazaar',
   'yemek', 40.1842000, 29.0622000, 25, 1, 9, 19, '{tatli,hediyelik,alisveris,yerel-esnaf}',
   'Kestane şekeri, lokum ve hediyelik için kısa mola. Yerel esnafın yoğun olduğu hat.', 40, 3),

  ('koza-han', 'Koza Han', 'Silk Cocoon Caravanserai',
   'tarihi', 40.1844464, 29.0632519, 40, 1, 9, 20, '{tarih,ipek,cay,alisveris,kulturel,konser-sinema}',
   'İpek ticaretinin kalbi. Avlusundaki çay bahçesinde oturup ipek dükkanlarını gezin.', 50, 4),

  ('pirinc-han', 'Pirinç Han', 'Rice Caravanserai',
   'tarihi', 40.1857239, 29.0602794, 25, 1, 9, 19, '{tarih,zanaat,kahve,kulturel}',
   'II. Bayezid dönemi hanı; bugün zanaatkâr atölyeleri ve kahvecilerle dolu.', 40, 5),

  ('kent-muzesi', 'Bursa Kent Müzesi', 'Bursa City Museum',
   'muze', 40.1823869, 29.0664373, 50, 1, 9, 17, '{muze,tarih,aile,kulturel,konser-sinema}',
   'Eski adliye binasında şehrin 8 bin yılı: canlandırmalar, el sanatları ve Bursa mutfağı bölümü.', 50, 6),

  ('tophane-saat-kulesi', 'Tophane Parkı ve Saat Kulesi', 'Tophane Park and Clock Tower',
   'park', 40.1863000, 29.0568000, 30, 0, 7, 23, '{manzara,ucretsiz,fotograf,konser-sinema}',
   'Şehre tepeden bakan sur parkı. Gün batımında Bursa ovasının en iyi göründüğü yer.', 50, 7),

  ('osman-orhan-turbeleri', 'Osman ve Orhan Gazi Türbeleri', 'Tombs of Osman and Orhan Gazi',
   'tarihi', 40.1867754, 29.0573226, 25, 0, 8, 19, '{tarih,ucretsiz}',
   'Osmanlı''nın kurucu iki padişahının türbesi, Tophane Parkı''nın hemen içinde.', 50, 8),

  ('irgandi-koprusu', 'Irgandı Köprüsü', 'Irgandi Bridge',
   'tarihi', 40.1819246, 29.0708487, 30, 1, 9, 20, '{tarih,zanaat,alisveris,kulturel,konser-sinema}',
   'Üzerinde dükkanlar bulunan dünyadaki sayılı çarşı köprülerinden biri.', 50, 9),

  ('sakarya-caddesi', 'Sakarya Caddesi Yemek Hattı', 'Sakarya Street Food Row',
   'yemek', 40.1893849, 29.0531680, 60, 2, 11, 23, '{yemek,aksam,yerel-esnaf}',
   'İskender''den balık-ekmeğe uzanan esnaf lokantaları hattı. Akşam yemeği için en canlı sokak.', 40, 10),

  ('muradiye-kulliyesi', 'Muradiye Külliyesi', 'Muradiye Complex',
   'tarihi', 40.1910633, 29.0465006, 45, 0, 8, 19, '{tarih,mimari,bahce,kulturel,ucretsiz}',
   'Cami, medrese ve 12 şehzade türbesinden oluşan sakin külliye; bahçesi dinlenmek için ideal.', 60, 11);

insert into public.badges (slug, name_tr, icon, rule) values
  ('tarih-avcisi', 'Tarih Avcısı', '🏛️', '{"type":"category_count","category":"tarihi","n":3}'),
  ('muze-dostu',   'Müze Dostu',   '🖼️', '{"type":"category_count","category":"muze","n":2}'),
  ('lezzet-pesinde','Lezzet Peşinde','🍽️', '{"type":"category_count","category":"yemek","n":2}');

insert into public.coupons
  (partner_name, title_tr, discount_text, cost_points, stock, is_recyclable_gift, sort_order)
values
  ('Osmangazi Belediyesi Sosyal Tesisleri', 'Sosyal tesiste çay + tatlı', '%25 indirim', 100, 50, false, 1),
  ('Anlaşmalı Yerel Esnaf', 'Kestane şekeri 250 g', '%20 indirim', 150, 40, false, 2),
  ('Bursa Kent Müzesi', 'Müze giriş', 'Tek kişi ücretsiz', 200, 25, false, 3),
  ('KültürRotam', 'Geri dönüşümlü sürpriz hediye kutusu', 'Kutu içinden rastgele yerel ürün', 300, 15, true, 4);

-- Sarı kartlar: puanla alınan ödüller.
insert into public.coupons
  (partner_name, title_tr, discount_text, cost_points, stock, kind, image_url, sort_order)
values
  ('BursaKart', 'BursaKart 50 TL yükleme kodu', '50 TL yükleme', 2400, 50, 'reward', '/oduller/bursakart-50.jpeg', 10),
  ('BursaKart', 'BursaKart 100 TL yükleme kodu', '100 TL yükleme', 4000, 50, 'reward', '/oduller/bursakart-100.jpeg', 11),
  ('BursaKart', 'BursaKart 200 TL yükleme kodu', '200 TL yükleme', 6000, 50, 'reward', '/oduller/bursakart-200.jpeg', 12),
  ('Sinema', 'Sinema bileti hediyesi', '1 bilet', 2000, 50, 'reward', '/oduller/sinema.jpeg', 13),
  ('Konser', 'Konser bileti hediyesi', '1 bilet', 5000, 50, 'reward', '/oduller/konser.jpeg', 14);

-- Yeşil kartlar: puanı bağışa çevirenler.
insert into public.coupons
  (partner_name, title_tr, discount_text, cost_points, stock, kind, image_url, sort_order)
values
  ('KültürRotam', 'İyiliğe dönüştür', 'Puanını bağışa çevir', 100, 50, 'donation', '/oduller/iyilige-donustur.jpeg', 20),
  ('TEMA Vakfı', 'Umut Ormanı Projesi', 'Bir fidan bağışı', 500, 50, 'donation', '/oduller/tema.jpeg', 21),
  ('HAYTAP', 'Sahipsiz canlara yaşam desteği', 'Mama ve bakım bağışı', 1000, 50, 'donation', '/oduller/haytap.jpeg', 22),
  ('Türk Eğitim Vakfı', 'Öğrenci bursu desteği', 'Burs bağışı', 2000, 50, 'donation', '/oduller/tev.jpeg', 23);
