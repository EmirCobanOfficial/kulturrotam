-- Odul kartlari: sari (puanla alinan odul) ve yesil (puani bagisa ceviren) ayrimi.
-- schema.sql'e EK olarak calisir; mevcut veriyi silmez, tekrar calistirilabilir.
-- Turkce karakterler chr() ile yazildi: SQL editorune panodan yapistirmak guvenli.

-- 1) Kupon tablosuna tur ve gorsel alanlari. Varsayilan 'reward', yani
--    mevcut kuponlarin davranisi degismez.
alter table public.coupons
  add column if not exists kind text not null default 'reward',
  add column if not exists image_url text;

-- 'convert' wallet.sql ile geldi; burada da kabul edilmeli ki bu dosya
-- wallet.sql'den sonra tekrar calistirilinca kisit kirilmasin.
alter table public.coupons drop constraint if exists coupons_kind_check;
alter table public.coupons
  add constraint coupons_kind_check check (kind in ('reward', 'convert', 'donation'));

-- 2) Kartlar. partner + baslik cifti benzersiz kabul edilir; tekrar
--    calistirildiginda yenisi eklenmez, mevcut satir guncellenir.
create unique index if not exists coupons_partner_title_idx
  on public.coupons (partner_name, title_tr);

insert into public.coupons
  (partner_name, title_tr, discount_text, cost_points, stock, kind, image_url, sort_order)
values
  ('BursaKart', 'BursaKart 50 TL y' || chr(252) || 'kleme kodu', '50 TL y' || chr(252) || 'kleme', 2400, 50, 'reward', '/oduller/bursakart-50.jpeg', 10),
  ('BursaKart', 'BursaKart 100 TL y' || chr(252) || 'kleme kodu', '100 TL y' || chr(252) || 'kleme', 4000, 50, 'reward', '/oduller/bursakart-100.jpeg', 11),
  ('BursaKart', 'BursaKart 200 TL y' || chr(252) || 'kleme kodu', '200 TL y' || chr(252) || 'kleme', 6000, 50, 'reward', '/oduller/bursakart-200.jpeg', 12),
  ('Sinema', 'Sinema bileti hediyesi', '1 bilet', 2000, 50, 'reward', '/oduller/sinema.jpeg', 13),
  ('Konser', 'Konser bileti hediyesi', '1 bilet', 5000, 50, 'reward', '/oduller/konser.jpeg', 14),
  ('K' || chr(252) || 'lt' || chr(252) || 'rRotam', chr(304) || 'yili' || chr(287) || 'e d' || chr(246) || 'n' || chr(252) || chr(351) || 't' || chr(252) || 'r', 'Puan' || chr(305) || 'n' || chr(305) || ' ba' || chr(287) || chr(305) || chr(351) || 'a ' || chr(231) || 'evir', 100, 50, 'convert', '/oduller/iyilige-donustur.jpeg', 20),
  ('TEMA Vakf' || chr(305), 'Umut Orman' || chr(305) || ' Projesi', 'Bir fidan ba' || chr(287) || chr(305) || chr(351) || chr(305), 500, 50, 'donation', '/oduller/tema.jpeg', 21),
  ('HAYTAP', 'Sahipsiz canlara ya' || chr(351) || 'am deste' || chr(287) || 'i', 'Mama ve bak' || chr(305) || 'm ba' || chr(287) || chr(305) || chr(351) || chr(305), 1000, 50, 'donation', '/oduller/haytap.jpeg', 22),
  ('T' || chr(252) || 'rk E' || chr(287) || 'itim Vakf' || chr(305), chr(214) || chr(287) || 'renci bursu deste' || chr(287) || 'i', 'Burs ba' || chr(287) || chr(305) || chr(351) || chr(305), 2000, 50, 'donation', '/oduller/tev.jpeg', 23)
on conflict (partner_name, title_tr) do update set
  discount_text = excluded.discount_text,
  cost_points   = excluded.cost_points,
  kind          = excluded.kind,
  image_url     = excluded.image_url,
  sort_order    = excluded.sort_order;
