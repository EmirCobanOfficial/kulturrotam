-- KültürRotam — şema. Supabase SQL editöründe baştan sona çalıştırılır.
-- Tekrar çalıştırılabilir olsun diye her şey drop ile başlar (hackathon; veri değerli değil).

drop function if exists public.check_in(uuid, double precision, double precision);
drop function if exists public.redeem_coupon(uuid);
drop function if exists public.set_nickname(text);
drop table if exists public.redemptions;
drop table if exists public.user_badges;
drop table if exists public.visits;
drop table if exists public.coupons;
drop table if exists public.badges;
drop table if exists public.places;
drop table if exists public.profiles;

create table public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  nickname   text,
  points     integer not null default 0,        -- sari, yildizli puan
  green_points integer not null default 0,      -- yesil, kalpli iyilik puani
  created_at timestamptz not null default now()
);

create table public.places (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  name_tr        text not null,
  name_en        text,
  category       text not null,              -- tarihi | muze | yemek | park
  lat            double precision not null,
  lng            double precision not null,
  visit_minutes  integer not null default 30,
  cost_level     integer not null default 0, -- 0 ücretsiz .. 3 pahalı
  open_hour      integer not null default 9,
  close_hour     integer not null default 19,
  tags           text[] not null default '{}',
  description_tr text,
  description_en text,
  image_url      text,
  qr_token       uuid not null unique default gen_random_uuid(),
  points_reward  integer not null default 50,
  sort_order     integer not null default 0
);

create table public.visits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  place_id   uuid not null references public.places on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, place_id)              -- aynı mekandan ikinci puan yok
);

create table public.badges (
  id      uuid primary key default gen_random_uuid(),
  slug    text unique not null,
  name_tr text not null,
  icon    text not null default '🏅',
  -- tek kural tipi: {"type":"category_count","category":"tarihi","n":3}
  rule    jsonb not null
);

create table public.user_badges (
  user_id   uuid not null references auth.users on delete cascade,
  badge_id  uuid not null references public.badges on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create table public.coupons (
  id                 uuid primary key default gen_random_uuid(),
  partner_name       text not null,
  title_tr           text not null,
  discount_text      text not null,
  cost_points        integer not null,
  stock              integer not null default 50,
  is_recyclable_gift boolean not null default false,
  sort_order         integer not null default 0,
  -- 'reward'   sari kart: sari puanla alinir, kupon kodu uretir.
  -- 'convert'  Iyilige donustur: sari puani ayni miktar yesil puana cevirir.
  -- 'donation' yesil kart: yesil puanla alinir, tesekkur mesaji gosterir.
  kind               text not null default 'reward' check (kind in ('reward', 'convert', 'donation')),
  image_url          text,
  -- arayuzun karta ozel tesekkur metnini secmesi icin (src/lib/i18n.ts)
  slug               text unique
);

create table public.redemptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  coupon_id  uuid not null references public.coupons on delete cascade,
  code       text not null unique,
  created_at timestamptz not null default now(),
  used_at    timestamptz
);

-- ---------------------------------------------------------------- RLS
-- Katalog herkese açık okunur; kişisel satırlar sadece sahibine.
-- Hiçbir tabloya istemci yazamaz: tüm yazma işleri aşağıdaki
-- security definer fonksiyonlarından geçer.
alter table public.profiles    enable row level security;
alter table public.places      enable row level security;
alter table public.visits      enable row level security;
alter table public.badges      enable row level security;
alter table public.user_badges enable row level security;
alter table public.coupons     enable row level security;
alter table public.redemptions enable row level security;

create policy places_read  on public.places      for select using (true);
create policy badges_read  on public.badges      for select using (true);
create policy coupons_read on public.coupons     for select using (true);
create policy profile_read on public.profiles    for select using (id = auth.uid());
create policy visits_read  on public.visits      for select using (user_id = auth.uid());
create policy ubadge_read  on public.user_badges for select using (user_id = auth.uid());
create policy redeem_read  on public.redemptions for select using (user_id = auth.uid());

-- ---------------------------------------------------------- fonksiyonlar

create or replace function public.set_nickname(p_nick text)
returns public.profiles
language plpgsql security definer set search_path = public as $$
declare v_row public.profiles;
begin
  if auth.uid() is null then raise exception 'oturum yok'; end if;
  insert into public.profiles (id, nickname) values (auth.uid(), nullif(trim(p_nick), ''))
  on conflict (id) do update set nickname = coalesce(nullif(trim(p_nick), ''), public.profiles.nickname)
  returning * into v_row;
  return v_row;
end $$;

-- Metre cinsinden haversine.
create or replace function public.meters_between(lat1 double precision, lng1 double precision,
                                      lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- QR check-in: puanı, ziyareti ve rozetleri tek işlemde yazar.
-- p_lat/p_lng verilmezse mesafe kontrolü atlanır (demo modu).
create or replace function public.check_in(p_token uuid,
                               p_lat double precision default null,
                               p_lng double precision default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user     uuid := auth.uid();
  v_place    public.places;
  v_distance double precision;
  v_new      boolean := false;
  v_badges   jsonb := '[]'::jsonb;
  v_badge    record;
  v_count    integer;
  v_points   integer;
  v_green    integer;
begin
  if v_user is null then raise exception 'oturum yok'; end if;

  select * into v_place from public.places where qr_token = p_token;
  if v_place.id is null then raise exception 'gecersiz QR'; end if;

  if p_lat is not null and p_lng is not null then
    v_distance := public.meters_between(p_lat, p_lng, v_place.lat, v_place.lng);
    if v_distance > 300 then
      raise exception 'mekana uzaksin: % metre', round(v_distance);
    end if;
  end if;

  insert into public.profiles (id) values (v_user) on conflict (id) do nothing;

  insert into public.visits (user_id, place_id) values (v_user, v_place.id)
  on conflict (user_id, place_id) do nothing;
  v_new := found;

  if v_new then
    -- Kazanilan puan sari ve yesil bakiyeye ayni miktarda yazilir.
    update public.profiles
       set points       = points       + v_place.points_reward,
           green_points = green_points + v_place.points_reward
     where id = v_user
    returning points, green_points into v_points, v_green;

    -- rozet değerlendirme: kategori sayacı
    for v_badge in
      select b.* from public.badges b
      where b.rule->>'type' = 'category_count'
        and not exists (select 1 from public.user_badges ub
                        where ub.user_id = v_user and ub.badge_id = b.id)
    loop
      select count(*) into v_count
      from public.visits v join public.places p on p.id = v.place_id
      where v.user_id = v_user and p.category = v_badge.rule->>'category';

      if v_count >= (v_badge.rule->>'n')::int then
        insert into public.user_badges (user_id, badge_id) values (v_user, v_badge.id)
        on conflict do nothing;
        v_badges := v_badges || jsonb_build_object('slug', v_badge.slug,
                                                   'name', v_badge.name_tr,
                                                   'icon', v_badge.icon);
      end if;
    end loop;
  else
    select points, green_points into v_points, v_green
    from public.profiles where id = v_user;
  end if;

  return jsonb_build_object(
    'place',        jsonb_build_object('slug', v_place.slug, 'name', v_place.name_tr),
    'already',      not v_new,
    'earned',       case when v_new then v_place.points_reward else 0 end,
    'total_points', coalesce(v_points, 0),
    'total_green',  coalesce(v_green, 0),
    'new_badges',   v_badges,
    'geofence_checked', p_lat is not null and p_lng is not null
  );
end $$;

-- Kart harcama: hangi bakiyeden düşeceği kart türüne göre seçilir.
-- Bakiye ve kart satırı kilitlenir, bütün yazma tek işlemde olur.
--   reward   → sarı düşer, stok azalır, kupon kodu üretilir
--   convert  → sarı düşer, aynı miktar yeşile eklenir (stok yok)
--   donation → yeşil düşer, kod gösterilmez (arayüz teşekkür mesajı çıkarır)
create or replace function public.redeem_coupon(p_coupon uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user    uuid := auth.uid();
  v_profile public.profiles;
  v_coupon  public.coupons;
  v_code    text := null;
begin
  if v_user is null then raise exception 'oturum yok'; end if;

  select * into v_profile from public.profiles where id = v_user for update;
  if v_profile.id is null then raise exception 'once check-in yap'; end if;

  select * into v_coupon from public.coupons where id = p_coupon for update;
  if v_coupon.id is null then raise exception 'kupon yok'; end if;

  if v_coupon.kind = 'donation' then
    if v_profile.green_points < v_coupon.cost_points then
      raise exception 'iyilik puani yetersiz: % gerekli, % var',
        v_coupon.cost_points, v_profile.green_points;
    end if;
    update public.profiles set green_points = green_points - v_coupon.cost_points
     where id = v_user returning * into v_profile;
    -- Satır yalnızca "yaptığım iyilikler" listesi için; code kolonu zorunlu ve tekil.
    insert into public.redemptions (user_id, coupon_id, code)
    values (v_user, v_coupon.id,
            'IY-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)));

  elsif v_coupon.kind = 'convert' then
    if v_profile.points < v_coupon.cost_points then
      raise exception 'puan yetersiz: % gerekli, % var', v_coupon.cost_points, v_profile.points;
    end if;
    update public.profiles
       set points       = points       - v_coupon.cost_points,
           green_points = green_points + v_coupon.cost_points
     where id = v_user returning * into v_profile;

  else
    if v_coupon.stock <= 0 then raise exception 'kupon tukendi'; end if;
    if v_profile.points < v_coupon.cost_points then
      raise exception 'puan yetersiz: % gerekli, % var', v_coupon.cost_points, v_profile.points;
    end if;
    v_code := 'KR-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    update public.profiles set points = points - v_coupon.cost_points
     where id = v_user returning * into v_profile;
    update public.coupons set stock = stock - 1 where id = v_coupon.id;
    insert into public.redemptions (user_id, coupon_id, code) values (v_user, v_coupon.id, v_code);
  end if;

  return jsonb_build_object('kind',             v_coupon.kind,
                            'slug',             v_coupon.slug,
                            'code',             v_code,
                            'title',            v_coupon.title_tr,
                            'partner',          v_coupon.partner_name,
                            'cost',             v_coupon.cost_points,
                            'remaining_points', v_profile.points,
                            'remaining_green',  v_profile.green_points);
end $$;

grant execute on function public.set_nickname(text)  to anon, authenticated;
grant execute on function public.check_in(uuid, double precision, double precision) to anon, authenticated;
grant execute on function public.redeem_coupon(uuid) to anon, authenticated;
