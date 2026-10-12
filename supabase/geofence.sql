-- Konum kontrolunu zorunlu hale getirir.
-- schema.sql'e EK olarak calisir; fonksiyonu yerinde degistirir, veri silmez.
-- Dosya tamamen ASCII: SQL editorune panodan yapistirmak guvenli.
--
-- NEDEN: eski surum mesafeyi yalnizca koordinat GELDIYSE kontrol ediyordu.
-- Tarayicida konum iznini reddeden kullanici null gonderiyor ve kontrol hic
-- calismiyordu, yani puani yine aliyordu. Istemci tarafi her zaman null
-- gonderebilecegi icin tek gercek guvence sunucuda.
--
-- DEMO MODU: sahnede mekana 300 m yaklasilamayan bir sunum olursa asagidaki
-- v_require_location degerini false yapip bu dosyayi tekrar calistirin.
-- NEXT_PUBLIC_DEMO_SKIP_GEOFENCE istemci tarafini susturur ama sunucuyu
-- etkilemez; ikisini birlikte kapatmak gerekir.

create or replace function public.check_in(p_token uuid,
                               p_lat double precision default null,
                               p_lng double precision default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_require_location constant boolean := true;   -- demo icin false yapin
  v_max_meters       constant integer := 300;

  v_user     uuid := auth.uid();
  v_place    public.places;
  v_distance double precision;
  v_new      boolean := false;
  v_badges   jsonb := '[]'::jsonb;
  v_badge    record;
  v_count    integer;
  v_points   integer;
begin
  if v_user is null then raise exception 'oturum yok'; end if;

  select * into v_place from public.places where qr_token = p_token;
  if v_place.id is null then raise exception 'gecersiz QR'; end if;

  if v_require_location and (p_lat is null or p_lng is null) then
    raise exception 'konum gerekli: tarayicida konum iznini ver ve tekrar dene';
  end if;

  if p_lat is not null and p_lng is not null then
    v_distance := public.meters_between(p_lat, p_lng, v_place.lat, v_place.lng);
    if v_distance > v_max_meters then
      raise exception 'mekana uzaksin: % metre', round(v_distance);
    end if;
  end if;

  insert into public.profiles (id) values (v_user) on conflict (id) do nothing;

  insert into public.visits (user_id, place_id) values (v_user, v_place.id)
  on conflict (user_id, place_id) do nothing;
  v_new := found;

  if v_new then
    update public.profiles set points = points + v_place.points_reward
    where id = v_user returning points into v_points;

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
    select points into v_points from public.profiles where id = v_user;
  end if;

  return jsonb_build_object(
    'place',        jsonb_build_object('slug', v_place.slug, 'name', v_place.name_tr),
    'already',      not v_new,
    'earned',       case when v_new then v_place.points_reward else 0 end,
    'total_points', coalesce(v_points, 0),
    'new_badges',   v_badges,
    'geofence_checked', p_lat is not null and p_lng is not null
  );
end $$;

grant execute on function public.check_in(uuid, double precision, double precision) to anon, authenticated;
