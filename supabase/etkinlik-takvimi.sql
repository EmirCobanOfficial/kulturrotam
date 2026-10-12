-- Etkinlik takvimi: her gun, her alan icin bir etkinlik.
-- schema.sql + roadmap.sql + etkinlikler.sql'den SONRA calisir.
-- Tekrar calistirilabilir: source = 'kesif' satirlarini silip yeniden uretir.
-- etkinlikler.sql'in tek gunluk 'kesif' etkinliklerinin yerini alir; o dosya
-- yalnizca image_url / ticket_url kolonlari icin hala gerekli.
-- Puan, rozet, mekan ve kullanici verisine dokunmaz.
-- Dosya tamamen ASCII: SQL editorune panodan yapistirmak guvenli.

-- 1) Etkinligin ilgi alani. /etkinlikler sayfasindaki etiket ve suzgec bunu
--    okur; eski 'belediye' satirlarinda bos kalir, kartta etiket cizilmez.
alter table public.events
  add column if not exists area text;

-- 2) Yeni ilgi alanlari mekan etiketlerine de girmek zorunda: rota motoru
--    (src/lib/route/plan.ts score) ilgi anahtarini category + tags icinde
--    ariyor. Etiketlemezsek "Kulturel" ve "Konserler ve sinema" secenekleri
--    hicbir rotayi degistirmez.
update public.places set tags = array_append(tags, 'kulturel')
 where slug in ('panorama-1326', 'ulu-cami', 'koza-han', 'pirinc-han',
                'kent-muzesi', 'irgandi-koprusu', 'muradiye-kulliyesi')
   and not ('kulturel' = any(tags));

update public.places set tags = array_append(tags, 'konser-sinema')
 where slug in ('koza-han', 'tophane-saat-kulesi', 'kent-muzesi', 'irgandi-koprusu')
   and not ('konser-sinema' = any(tags));

-- Kapalicarsi bir carsi ama 'alisveris' etiketi yoktu; Zindan Kapi surlardan
-- sehre bakiyor.
update public.places set tags = array_append(tags, 'alisveris')
 where slug = 'kapali-carsi' and not ('alisveris' = any(tags));

update public.places set tags = array_append(tags, 'manzara')
 where slug = 'zindan-kapi' and not ('manzara' = any(tags));

-- 3) Haftalik program. Her satirin cycle/phase'i haftanin gunune gore secilir:
--    bir alanin phase'leri 0..cycle-1'i kapsadigi icin o alanin her gun bir
--    etkinligi olur, baslik gun gun degisir.
--    Saatler Europe/Istanbul olarak yaziliyor: 'at time zone' olmadan
--    timestamptz sutununa UTC girer ve ekranda 3 saat kayar.
delete from public.events where source = 'kesif';

insert into public.events
  (place_id, title_tr, title_en, starts_at, ends_at, source, area, image_url)
select p.id, c.title_tr, c.title_en,
       ((current_date + d.n) + c.starts) at time zone 'Europe/Istanbul',
       ((current_date + d.n + c.end_day) + c.ends) at time zone 'Europe/Istanbul',
       'kesif', c.area, c.image_url
from generate_series(0, 20) as d(n)
cross join (values
  ('ulu-cami', 'Ulu Cami''de Hat Sanat' || chr(305) || ' Gezisi',
   'Calligraphy Walk at the Grand Mosque',
   time '10:00', time '11:30', 0, 'tarihi', null::text, 3, 0),
  ('osman-orhan-turbeleri', 'Kurulu' || chr(351) || ' Y' || chr(252) || 'r' || chr(252) || 'y' || chr(252) || chr(351) || chr(252) || ': Osman ve Orhan Gazi',
   'Foundation Walk: Osman and Orhan Gazi',
   time '10:00', time '12:00', 0, 'tarihi', null, 3, 1),
  ('muradiye-kulliyesi', 'Muradiye K' || chr(252) || 'lliyesi Rehberli Gezi',
   'Guided Tour of the Muradiye Complex',
   time '10:30', time '12:00', 0, 'tarihi', null, 3, 2),
  ('panorama-1326', 'Rehberli M' || chr(252) || 'ze Turu',
   'Guided Museum Tour',
   time '15:00', time '16:30', 0, 'muze', null, 3, 0),
  ('kent-muzesi', 'Kent M' || chr(252) || 'zesi At' || chr(246) || 'lyesi: ' || chr(199) || 'ocuklarla Bursa',
   'City Museum Workshop: Bursa for Children',
   time '14:00', time '16:00', 0, 'muze', null, 3, 1),
  ('panorama-1326', 'Panorama 1326: Fetih Anlat' || chr(305) || 'm' || chr(305),
   'Panorama 1326: The Story of the Conquest',
   time '11:00', time '12:00', 0, 'muze', null, 3, 2),
  ('muradiye-kulliyesi', 'Hat ve Tezhip Sergisi',
   'Calligraphy and Illumination Exhibition',
   time '10:00', time '18:00', 0, 'kulturel', null, 3, 0),
  ('koza-han', chr(304) || 'pek Dokuma G' || chr(246) || 'sterimi',
   'Silk Weaving Demonstration',
   time '13:00', time '17:00', 0, 'kulturel', null, 3, 1),
  ('pirinc-han', 'Zanaatk' || chr(226) || 'r At' || chr(246) || 'lyeleri G' || chr(252) || 'n' || chr(252),
   'Craft Workshops Day',
   time '11:00', time '17:00', 0, 'kulturel', null, 3, 2),
  ('koza-han', 'Koza Han Canl' || chr(305) || ' M' || chr(252) || 'zik',
   'Koza Han Live Music',
   time '19:00', time '23:00', 0, 'konser-sinema', null, 3, 0),
  ('tophane-saat-kulesi', 'Bu Gece Sinema: A' || chr(231) || chr(305) || 'k Hava G' || chr(246) || 'sterimi',
   'Tonight at the Cinema: Open-Air Screening',
   time '20:00', time '22:30', 0, 'konser-sinema', null, 3, 1),
  ('irgandi-koprusu', 'Irgand' || chr(305) || ' K' || chr(246) || 'pr' || chr(252) || 's' || chr(252) || ' Akustik Ak' || chr(351) || 'am' || chr(305),
   'Acoustic Evening on Irgandi Bridge',
   time '19:30', time '22:00', 0, 'konser-sinema', null, 3, 2),
  ('tophane-saat-kulesi', 'G' || chr(252) || 'n Bat' || chr(305) || 'm' || chr(305) || ' Foto' || chr(287) || 'raf Bulu' || chr(351) || 'mas' || chr(305),
   'Sunset Photography Meetup',
   time '18:00', time '19:30', 0, 'manzara', null, 2, 0),
  ('zindan-kapi', 'Sabah I' || chr(351) || chr(305) || chr(287) || chr(305) || 'nda Surlar Y' || chr(252) || 'r' || chr(252) || 'y' || chr(252) || chr(351) || chr(252),
   'Morning Light Walk Along the Walls',
   time '08:00', time '09:30', 0, 'manzara', null, 2, 1),
  ('kapali-carsi', 'Kapal' || chr(305) || chr(231) || 'ar' || chr(351) || chr(305) || ' Esnaf Turu',
   'Covered Bazaar Artisans Tour',
   time '11:00', time '13:00', 0, 'alisveris', null, 2, 0),
  ('koza-han', 'Koza Han ' || chr(304) || 'pek Pazar' || chr(305),
   'Koza Han Silk Market',
   time '10:00', time '18:00', 0, 'alisveris', null, 2, 1),
  ('kent-muzesi', 'Bursa Mutfa' || chr(287) || chr(305) || ' At' || chr(246) || 'lyesi',
   'Bursa Cuisine Workshop',
   time '14:00', time '16:30', 0, 'yemek', null, 3, 0),
  ('sakarya-caddesi', 'Sakarya Caddesi Lezzet Turu',
   'Sakarya Street Food Tour',
   time '19:00', time '21:30', 0, 'yemek', null, 3, 1),
  ('ulku-pastanesi', 'Tatl' || chr(305) || ' Molas' || chr(305) || ': ' || chr(220) || 'lk' || chr(252) || ' Pastanesi ve Dervi' || chr(351) || 'an Gazoz',
   'Sweet Break: Ulku Patisserie and Dervisan Soda',
   time '16:00', time '17:30', 0, 'yemek', null, 3, 2)
) as c(slug, title_tr, title_en, starts, ends, end_day, area, image_url, cycle, phase)
join public.places p on p.slug = c.slug
where (extract(dow from (current_date + d.n))::int % c.cycle) = c.phase;

-- 4) Bugune ozel: hackathon gecesi. Gorseli takimdan geldi.
insert into public.events
  (place_id, title_tr, title_en, starts_at, ends_at, source, area, image_url)
select p.id,
       'M' || chr(252) || 'zede Bir Gece: Gen' || chr(231) || 'lik, K' || chr(252) || 'lt' || chr(252) || 'r Sanat ve Sosyal Giri' || chr(351) || 'imcilik Hackathonu',
       'A Night at the Museum: Youth, Culture, Arts and Social Entrepreneurship Hackathon',
       (current_date + time '20:00') at time zone 'Europe/Istanbul',
       (current_date + interval '1 day' + time '08:00') at time zone 'Europe/Istanbul',
       'kesif', 'kulturel', '/gorsel/etkinlik-muzede-bir-gece.jpg'
from public.places p where p.slug = 'kent-muzesi';

-- Dogrulama: gun sayisi ve alan sayisi.
select count(*) as etkinlik,
       count(distinct starts_at::date) as gun,
       count(distinct area) as alan
  from public.events where source = 'kesif';
