-- etkinlik-takvimi.sql dogrulamasi. Hicbir sey degistirmez, yalnizca okur.
-- Dosya tamamen ASCII: SQL editorune panodan yapistirmak guvenli.
--
-- TEK sorgu: Supabase SQL editoru yan yana yapistirilan sorgulardan yalnizca
-- sonuncusunun sonucunu gosterdigi icin butun kontroller tek tabloda donuyor.
-- Hepsinin durum sutunu OK olmali.

with kesif as (
  select *, (starts_at at time zone 'Europe/Istanbul') as yerel
    from public.events where source = 'kesif'
),
gun as (select generate_series(0, 20) as n),
alan as (select unnest(array['tarihi', 'muze', 'kulturel', 'konser-sinema',
                             'manzara', 'alisveris', 'yemek']) as a),
eksik as (
  select count(*) as c
    from gun cross join alan
   where not exists (select 1 from kesif k
                      where k.area = alan.a and k.yerel::date = current_date + gun.n)
),
etiket as (
  select t.e as etiket, count(p.id) as n
    from (values ('kulturel'), ('konser-sinema'), ('alisveris'), ('manzara')) as t(e)
    left join public.places p on t.e = any(p.tags)
   group by t.e
)
select kontrol, sonuc, beklenen,
       case when sonuc = beklenen then 'OK' else '>>> BAK' end as durum
  from (
    select 1 as sira, 'etkinlik sayisi' as kontrol,
           (select count(*)::text from kesif) as sonuc, '148' as beklenen
    union all select 2, 'gun sayisi',
           (select count(distinct yerel::date)::text from kesif), '21'
    union all select 3, 'alan sayisi',
           (select count(distinct area)::text from kesif), '7'
    union all select 4, 'etkinliksiz gun-alan',
           (select c::text from eksik), '0'
    union all select 5, 'etiket: kulturel',
           (select n::text from etiket where etiket = 'kulturel'), '7'
    union all select 6, 'etiket: konser-sinema',
           (select n::text from etiket where etiket = 'konser-sinema'), '4'
    union all select 7, 'etiket: alisveris',
           (select n::text from etiket where etiket = 'alisveris'), '3'
    union all select 8, 'etiket: manzara',
           (select n::text from etiket where etiket = 'manzara'), '2'
    union all select 9, 'bugun en erken saat',
           (select min(yerel::time)::text from kesif where yerel::date = current_date), '08:00:00'
  ) x
 order by sira;
