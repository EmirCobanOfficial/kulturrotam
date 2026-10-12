-- etkinlik-takvimi.sql dogrulamasi. Hicbir sey degistirmez, yalnizca okur.
-- Dosya tamamen ASCII: SQL editorune panodan yapistirmak guvenli.
-- Dordunu birlikte yapistirip Run'a bas; SQL editoru her sorgunun sonucunu
-- ayri sekmede gosterir.

-- 1) Toplam. Beklenen: gun = 21, alan = 7, etkinlik = 148
--    (gunde 7 etkinlik x 21 gun = 147, + bugune ozel hackathon gecesi).
select count(*)                                                      as etkinlik,
       count(distinct (starts_at at time zone 'Europe/Istanbul')::date) as gun,
       count(distinct area)                                          as alan
  from public.events
 where source = 'kesif';

-- 2) Eksik var mi? Beklenen: HIC SATIR DONMEMESI.
--    Donen her satir, o gun o alanda etkinlik olmadigini soyler.
with gun as (select generate_series(0, 20) as n),
     alan as (select unnest(array['tarihi', 'muze', 'kulturel', 'konser-sinema',
                                  'manzara', 'alisveris', 'yemek']) as a)
select (current_date + gun.n) as eksik_gun, alan.a as eksik_alan
  from gun cross join alan
 where not exists (
         select 1 from public.events e
          where e.source = 'kesif'
            and e.area = alan.a
            and (e.starts_at at time zone 'Europe/Istanbul')::date = current_date + gun.n)
 order by 1, 2;

-- 3) Yeni ilgi etiketleri mekanlara yazildi mi?
--    Beklenen: kulturel 7, konser-sinema 4, alisveris 3, manzara 2.
--    Sifir gorursen sihirbazdaki o secenek rotayi degistirmiyor demektir.
select t.etiket, count(p.id) as mekan
  from (values ('kulturel'), ('konser-sinema'), ('manzara'), ('alisveris')) as t(etiket)
  left join public.places p on t.etiket = any(p.tags)
 group by t.etiket
 order by 1;

-- 4) Saatler kaymis mi? Bugunun programi, Istanbul saatiyle.
--    Beklenen: 08:00-20:00 arasi makul saatler (ornegin 10:00, 11:00, 19:00).
--    Hepsi 3 saat ileri gorunuyorsa 'at time zone' satirlari calismamis.
select (starts_at at time zone 'Europe/Istanbul')::time as baslangic,
       area, title_tr
  from public.events
 where source = 'kesif'
   and (starts_at at time zone 'Europe/Istanbul')::date = current_date
 order by 1;
