-- Mekan puanlama ve yorum.
-- schema.sql'e EK olarak calisir; mevcut veriyi silmez, tekrar calistirilabilir.
-- Dosya tamamen ASCII: Supabase SQL editorune panodan yapistirmak guvenli.

create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  place_id   uuid not null references public.places on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now(),
  unique (user_id, place_id)          -- kisi basina mekan basina tek degerlendirme
);

create index if not exists reviews_place_idx on public.reviews (place_id, created_at desc);

alter table public.reviews enable row level security;

-- Yorumlar herkese acik okunur; yazma yine fonksiyondan gecer.
drop policy if exists reviews_read on public.reviews;
create policy reviews_read on public.reviews for select using (true);

-- Degerlendirme ekleme/guncelleme. Istemciye insert/update yetkisi verilmez:
-- puan araligi ve mekan kontrolu sunucuda kalsin.
create or replace function public.add_review(
  p_place   uuid,
  p_rating  integer,
  p_comment text default null
)
returns public.reviews
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_row  public.reviews;
begin
  if v_user is null then raise exception 'oturum yok'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'puan 1 ile 5 arasinda olmali';
  end if;
  if not exists (select 1 from public.places where id = p_place) then
    raise exception 'gecersiz mekan';
  end if;

  -- Ayni mekana ikinci yorum yeni satir acmaz, mevcut degerlendirmeyi gunceller.
  insert into public.reviews (user_id, place_id, rating, comment)
  values (v_user, p_place, p_rating, nullif(trim(p_comment), ''))
  on conflict (user_id, place_id) do update
    set rating     = excluded.rating,
        comment    = excluded.comment,
        created_at = now()
  returning * into v_row;

  return v_row;
end $$;

grant execute on function public.add_review(uuid, integer, text) to anon, authenticated;
