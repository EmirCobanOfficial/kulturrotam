-- Fotograf yuklemeyi kapatir (canli demo, hackathon sonrasi).
-- NEDEN: 'photos' bucket'i herkese acik ve yuklemeler moderasyonsuzdu; hackathon
-- bittikten sonra kotuye kullanima acikti. Mevcut fotograflar gorunmeye,
-- oylama calismaya devam eder.
-- Dosya tamamen ASCII: Supabase SQL editorune panodan yapistirmak guvenli.
-- Tekrar calistirilabilir; veri silmez.

drop policy if exists photos_object_insert on storage.objects;
revoke execute on function public.add_photo(uuid, text, text) from public, anon, authenticated;

-- Kontrol: uc deger de false donmeli.
select
  exists (select 1 from pg_policies
          where schemaname = 'storage' and tablename = 'objects'
            and policyname = 'photos_object_insert')                                  as yukleme_politikasi_var,
  has_function_privilege('anon', 'public.add_photo(uuid, text, text)', 'execute')          as anon_add_photo,
  has_function_privilege('authenticated', 'public.add_photo(uuid, text, text)', 'execute') as auth_add_photo;

-- GERI ALMAK ICIN (yuklemeyi yeniden acmak) asagidaki iki satiri calistir:
-- create policy photos_object_insert on storage.objects
--   for insert to authenticated
--   with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
-- grant execute on function public.add_photo(uuid, text, text) to anon, authenticated;
