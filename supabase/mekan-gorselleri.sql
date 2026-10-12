-- Mekan gorselleri. schema.sql'e EK olarak calisir, tekrar calistirilabilir.
-- Dosya tamamen ASCII: SQL editorune panodan yapistirmak guvenli.

update public.places set image_url = '/gorsel/muradiye-muze.jpg'
where slug = 'muradiye-kulliyesi';
