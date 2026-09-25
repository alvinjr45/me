-- Photos removed from albums remain in the main library.
alter table public.ajt3_photos alter column album_id drop not null;
