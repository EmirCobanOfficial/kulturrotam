-- Kesif etkinlikleri: gorsel alani + yeni etkinlikler.
-- schema.sql ve roadmap.sql'e EK olarak calisir; tekrar calistirilabilir.
-- Dosya tamamen ASCII: SQL editorune panodan yapistirmak guvenli.

-- 1) Etkinlige gorsel ve bilet baglantisi alanlari.
--    Ikisi de simdilik bos: gorselleri ve yonlendirme linklerini takim verecek.
--    Gorsel gelince tek update yeter, etkinligi yeniden olusturmaya gerek yok:
--      update public.events set image_url = '/gorsel/<dosya>' where title_tr = '<baslik>';
alter table public.events
  add column if not exists image_url  text,
  add column if not exists ticket_url text;

-- 2) Kesif etkinlikleri. source = 'kesif', boylece roadmap.sql'in
--    'belediye' seed'ini silen satiri bunlara dokunmaz.
delete from public.events where source = 'kesif';

insert into public.events (place_id, title_tr, title_en, starts_at, ends_at, source, image_url)
select p.id, 'M' || chr(252) || 'zede Bir Gece: Gen' || chr(231) || 'lik, K' || chr(252) || 'lt' || chr(252) || 'r Sanat ve Sosyal Giri' || chr(351) || 'imcilik Hackathonu',
       'A Night at the Museum: Youth, Culture, Arts and Social Entrepreneurship Hackathon',
       current_date + time '20:00', current_date + interval '1 day' + time '08:00',
       'kesif', '/gorsel/etkinlik-muzede-bir-gece.jpg'
from public.places p where p.slug = 'kent-muzesi';

insert into public.events (place_id, title_tr, title_en, starts_at, ends_at, source)
select p.id, 'Bu Gece Sinema: A' || chr(231) || chr(305) || 'k Hava G' || chr(246) || 'sterimi', 'Tonight at the Cinema: Open-Air Screening',
       current_date + time '20:00', current_date + time '22:30', 'kesif'
from public.places p where p.slug = 'tophane-saat-kulesi';

insert into public.events (place_id, title_tr, title_en, starts_at, ends_at, source)
select p.id, 'Koza Han Canl' || chr(305) || ' M' || chr(252) || 'zik', 'Koza Han Live Music',
       current_date + time '19:00', current_date + time '23:00', 'kesif'
from public.places p where p.slug = 'koza-han';

insert into public.events (place_id, title_tr, title_en, starts_at, ends_at, source)
select p.id, 'Bursa Mutfa' || chr(287) || chr(305) || ' At' || chr(246) || 'lyesi', 'Bursa Cuisine Workshop',
       current_date + time '14:00', current_date + time '16:30', 'kesif'
from public.places p where p.slug = 'kent-muzesi';

insert into public.events (place_id, title_tr, title_en, starts_at, ends_at, source)
select p.id, 'Hat ve Tezhip Sergisi', 'Calligraphy and Illumination Exhibition',
       current_date + time '10:00', current_date + time '18:00', 'kesif'
from public.places p where p.slug = 'muradiye-kulliyesi';

insert into public.events (place_id, title_tr, title_en, starts_at, ends_at, source)
select p.id, 'Rehberli M' || chr(252) || 'ze Turu', 'Guided Museum Tour',
       current_date + time '15:00', current_date + time '16:30', 'kesif'
from public.places p where p.slug = 'panorama-1326';
