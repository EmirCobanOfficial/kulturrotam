-- Roadmap tablolari: belediye etkinlik takvimi + topluluk fotograf akisi.
-- schema.sql'e EK olarak calisir; mevcut veriyi silmez, tekrar tekrar calistirilabilir.
-- Turkce karakterler chr() ile yazildi: Supabase SQL editorune panodan yapistirmak guvenli.

-- ------------------------------------------------- belediye etkinlik takvimi

create table if not exists public.events (
  id        uuid primary key default gen_random_uuid(),
  place_id  uuid not null references public.places on delete cascade,
  title_tr  text not null,
  title_en  text,
  starts_at timestamptz not null,
  ends_at   timestamptz not null,
  source    text not null default 'belediye'
);

create index if not exists events_starts_at_idx on public.events (starts_at);

alter table public.events enable row level security;
drop policy if exists events_read on public.events;
create policy events_read on public.events for select using (true);

-- --------------------------------------------- topluluk fotograf akisi

create table if not exists public.photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  place_id     uuid not null references public.places on delete cascade,
  storage_path text not null,
  caption      text,
  votes        integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists photos_votes_idx on public.photos (votes desc, created_at desc);

create table if not exists public.photo_votes (
  user_id  uuid not null references auth.users on delete cascade,
  photo_id uuid not null references public.photos on delete cascade,
  primary key (user_id, photo_id)      -- ayni fotografa ikinci oy yok
);

alter table public.photos      enable row level security;
alter table public.photo_votes enable row level security;

drop policy if exists photos_read on public.photos;
create policy photos_read on public.photos for select using (true);

drop policy if exists photo_votes_read on public.photo_votes;
create policy photo_votes_read on public.photo_votes for select using (user_id = auth.uid());

-- Yazma islemleri yine security definer fonksiyonlarindan gecer.

create or replace function public.add_photo(p_place uuid, p_path text, p_caption text default null)
returns public.photos
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_row  public.photos;
begin
  if v_user is null then raise exception 'oturum yok'; end if;
  if p_path is null or trim(p_path) = '' then raise exception 'dosya yolu yok'; end if;
  if not exists (select 1 from public.places where id = p_place) then
    raise exception 'gecersiz mekan';
  end if;

  -- Dosya yolu kullanicinin kendi klasorunde olmali: storage policy'siyle ayni kural.
  if split_part(p_path, '/', 1) <> v_user::text then
    raise exception 'baska kullanicinin klasorune yazilamaz';
  end if;

  insert into public.photos (user_id, place_id, storage_path, caption)
  values (v_user, p_place, trim(p_path), nullif(trim(p_caption), ''))
  returning * into v_row;
  return v_row;
end $$;

create or replace function public.vote_photo(p_photo uuid)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_user  uuid := auth.uid();
  v_votes integer;
begin
  if v_user is null then raise exception 'oturum yok'; end if;

  insert into public.photo_votes (user_id, photo_id) values (v_user, p_photo)
  on conflict do nothing;

  if not found then
    select votes into v_votes from public.photos where id = p_photo;
    if v_votes is null then raise exception 'fotograf yok'; end if;
    return v_votes;                     -- zaten oy vermis: sayac degismez
  end if;

  update public.photos set votes = votes + 1 where id = p_photo returning votes into v_votes;
  if v_votes is null then raise exception 'fotograf yok'; end if;
  return v_votes;
end $$;

grant execute on function public.add_photo(uuid, text, text) to anon, authenticated;
grant execute on function public.vote_photo(uuid)            to anon, authenticated;

-- ------------------------------------------------------- fotograf depolama
-- Tek istisna: fotograf yuklemek icin istemcinin storage.objects'e insert yetkisi
-- var. Kendi klasorunun (auth.uid()) disina yazamaz; photos tablosuna yine
-- yazamaz, satiri add_photo() olusturur.

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists photos_object_read on storage.objects;
create policy photos_object_read on storage.objects
  for select using (bucket_id = 'photos');

drop policy if exists photos_object_insert on storage.objects;
create policy photos_object_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- -------------------------------------------------------------- seed: etkinlik
-- Demo her gun calissin diye tarihler current_date uzerinden uretilir.

delete from public.events where source = 'belediye';

insert into public.events (place_id, title_tr, title_en, starts_at, ends_at)
select p.id,
       'Hat Sanat' || chr(305) || ' Sergisi',
       'Calligraphy Exhibition',
       current_date + time '10:00',
       current_date + time '18:00'
from public.places p where p.slug = 'ulu-cami';

insert into public.events (place_id, title_tr, title_en, starts_at, ends_at)
select p.id,
       'Koza Han Canl' || chr(305) || ' M' || chr(252) || 'zik',
       'Koza Han Live Music',
       current_date + time '15:00',
       current_date + time '20:00'
from public.places p where p.slug = 'koza-han';

insert into public.events (place_id, title_tr, title_en, starts_at, ends_at)
select p.id,
       'M' || chr(252) || 'ze Gecesi Turu',
       'Museum Night Tour',
       current_date + time '18:00',
       current_date + time '22:00'
from public.places p where p.slug = 'kent-muzesi';
