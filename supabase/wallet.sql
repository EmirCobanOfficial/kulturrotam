-- Iki bakiye: sari yildizli puan (profiles.points) ve yesil kalpli iyilik
-- puani (profiles.green_points).
--
-- Kurallar:
--   * QR check-in ikisini birden ayni miktarda artirir (+50 sari, +50 yesil).
--   * 'reward'   (sari kart)  sari bakiyeden duser, stok azalir, kupon kodu uretir.
--   * 'convert'  (Iyilige donustur) sari bakiyeden duser, ayni miktar yesile eklenir.
--   * 'donation' (yesil kart: TEMA, HAYTAP, TEV) yesil bakiyeden duser,
--     karsiliginda kod degil tesekkur mesaji gosterilir.
--
-- schema.sql'e EK olarak calisir; rewards.sql'den SONRA calistir.
-- Mevcut veriyi silmez, tekrar calistirilabilir.
-- Dosya bilerek ASCII: SQL editorune panodan yapistirmak guvenli.

-- 1) Yesil bakiye. Kolon ILK KEZ eklenirken mevcut kullanicilara gecmis
--    check-in'leri kadar yesil puan yazilir, cunku artik her check-in ikisini
--    birden veriyor. Tekrar calistirilinca bu blok hicbir sey yapmaz.
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public'
                   and table_name   = 'profiles'
                   and column_name  = 'green_points') then
    alter table public.profiles add column green_points integer not null default 0;

    update public.profiles p set green_points = coalesce((
      select sum(pl.points_reward)
      from public.visits v join public.places pl on pl.id = v.place_id
      where v.user_id = p.id), 0);
  end if;
end $$;

-- 2) Kart turu ve kart kimligi. slug, arayuzun karta ozel tesekkur mesajini
--    secmesi icin (metinler src/lib/i18n.ts icinde).
alter table public.coupons add column if not exists slug text;
create unique index if not exists coupons_slug_idx on public.coupons (slug);

alter table public.coupons drop constraint if exists coupons_kind_check;
alter table public.coupons
  add constraint coupons_kind_check check (kind in ('reward', 'convert', 'donation'));

update public.coupons set slug = 'bursakart-50'     where image_url = '/oduller/bursakart-50.jpeg';
update public.coupons set slug = 'bursakart-100'    where image_url = '/oduller/bursakart-100.jpeg';
update public.coupons set slug = 'bursakart-200'    where image_url = '/oduller/bursakart-200.jpeg';
update public.coupons set slug = 'sinema'           where image_url = '/oduller/sinema.jpeg';
update public.coupons set slug = 'konser'           where image_url = '/oduller/konser.jpeg';
update public.coupons set slug = 'tema'             where image_url = '/oduller/tema.jpeg';
update public.coupons set slug = 'haytap'           where image_url = '/oduller/haytap.jpeg';
update public.coupons set slug = 'tev'              where image_url = '/oduller/tev.jpeg';
update public.coupons set slug = 'iyilige-donustur', kind = 'convert'
  where image_url = '/oduller/iyilige-donustur.jpeg';

-- 3) QR check-in: sari ve yesil bakiye ayni miktarda artar.
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
    update public.profiles
       set points       = points       + v_place.points_reward,
           green_points = green_points + v_place.points_reward
     where id = v_user
    returning points, green_points into v_points, v_green;

    -- rozet degerlendirme: kategori sayaci
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

-- 4) Kart harcama: hangi bakiyeden dusecegi kart turune gore secilir.
--    Bakiye ve kart satiri kilitlenir, butun yazma tek islemde olur.
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
    -- Yesil kart: yesil bakiyeden duser. Kod gosterilmez; satir yalnizca
    -- "yaptigim iyilikler" listesi icin yazilir (code kolonu zorunlu ve tekil).
    if v_profile.green_points < v_coupon.cost_points then
      raise exception 'iyilik puani yetersiz: % gerekli, % var',
        v_coupon.cost_points, v_profile.green_points;
    end if;
    update public.profiles set green_points = green_points - v_coupon.cost_points
     where id = v_user returning * into v_profile;
    insert into public.redemptions (user_id, coupon_id, code)
    values (v_user, v_coupon.id,
            'IY-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)));

  elsif v_coupon.kind = 'convert' then
    -- Iyilige donustur: sari duser, ayni miktar yesile eklenir. Stok yok.
    if v_profile.points < v_coupon.cost_points then
      raise exception 'puan yetersiz: % gerekli, % var', v_coupon.cost_points, v_profile.points;
    end if;
    update public.profiles
       set points       = points       - v_coupon.cost_points,
           green_points = green_points + v_coupon.cost_points
     where id = v_user returning * into v_profile;

  else
    -- Sari kart: sari bakiyeden duser, stok azalir, kupon kodu uretilir.
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

grant execute on function public.check_in(uuid, double precision, double precision) to anon, authenticated;
grant execute on function public.redeem_coupon(uuid) to anon, authenticated;
