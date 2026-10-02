-- Every photo belongs to exactly one album. Legacy unassigned rows are removed
-- because deleting a photo from its album now deletes it from the library.
delete from public.ajt3_photos where album_id is null;

alter table public.ajt3_photos alter column album_id set not null;
