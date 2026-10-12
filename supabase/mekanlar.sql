-- Rotaya yeni duraklar ve odul kartlarinin sadelestirilmesi.
-- schema.sql'e EK olarak calisir; tekrar calistirilabilir.
-- Dosya tamamen ASCII: SQL editorune panodan yapistirmak guvenli.

-- 1) Eski seed kupon kartlarini kaldir (odul sayfasindaki ilk dort kart).
--    DIKKAT: redemptions tablosu coupons'a cascade bagli; bu kartlardan
--    alinmis bir kupon varsa cuzdandan da silinir.
delete from public.coupons where partner_name || '|' || title_tr in (
  'Osmangazi Belediyesi Sosyal Tesisleri' || '|' || 'Sosyal tesiste ' || chr(231) || 'ay + tatl' || chr(305),
  'Anla' || chr(351) || 'mal' || chr(305) || ' Yerel Esnaf' || '|' || 'Kestane ' || chr(351) || 'ekeri 250 g',
  'Bursa Kent M' || chr(252) || 'zesi' || '|' || 'M' || chr(252) || 'ze giri' || chr(351),
  'K' || chr(252) || 'lt' || chr(252) || 'rRotam' || '|' || 'Geri d' || chr(246) || 'n' || chr(252) || chr(351) || chr(252) || 'ml' || chr(252) || ' s' || chr(252) || 'rpriz hediye kutusu'
);

-- 2) Yeni duraklar. slug benzersiz; tekrar calistirmak yenisini eklemez.
insert into public.places
  (slug, name_tr, name_en, category, lat, lng, visit_minutes, cost_level,
   open_hour, close_hour, tags, description_tr, points_reward, sort_order)
values
  ('zindan-kapi', 'Zindan Kap' || chr(305), 'Zindan Gate', 'tarihi', 40.1829, 29.0598, 20, 0, 0, 24, '{tarihi,mimari,manzara}', 'Bursa Hisar surlar' || chr(305) || 'n' || chr(305) || 'n ayakta kalan kap' || chr(305) || 'lar' || chr(305) || 'ndan biri; Tophane''ye ' || chr(231) || chr(305) || 'kan tarihi yol burada ba' || chr(351) || 'lar.', 40, 15),
  ('ulku-pastanesi', chr(220) || 'lk' || chr(252) || ' Pastanesi', 'Ulku Patisserie', 'yemek', 40.1872, 29.0556, 25, 1, 8, 22, '{yemek}', 'Bursa''n' || chr(305) || 'n k' || chr(246) || 'kl' || chr(252) || ' pastanelerinden; ' || chr(351) || 'ehrin klasik tatl' || chr(305) || ' molas' || chr(305) || '.', 40, 16),
  ('dervisan-gazoz', 'Dervi' || chr(351) || 'an Gazoz', 'Dervisan Soda', 'yemek', 40.1841, 29.0612, 20, 1, 10, 22, '{yemek}', 'Yerel gazozuyla bilinen, ' || chr(351) || 'ehrin kendi lezzetini tadabilece' || chr(287) || 'in k' || chr(252) || chr(231) || chr(252) || 'k durak.', 40, 17)
on conflict (slug) do update set
  name_tr        = excluded.name_tr,
  name_en        = excluded.name_en,
  category       = excluded.category,
  lat            = excluded.lat,
  lng            = excluded.lng,
  description_tr = excluded.description_tr,
  sort_order     = excluded.sort_order;
