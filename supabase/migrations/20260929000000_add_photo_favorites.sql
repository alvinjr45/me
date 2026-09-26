alter table public.ajt3_photos
add column if not exists is_favorite boolean not null default false;

create index if not exists ajt3_photos_favorites_order
on public.ajt3_photos (sort_order, created_at)
where is_favorite = true and is_published = true;
