create table public.ajt3_photo_albums (
  id text primary key default gen_random_uuid()::text,
  title text not null check (length(trim(title)) between 1 and 120),
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ajt3_photos (
  id text primary key default gen_random_uuid()::text,
  album_id text not null references public.ajt3_photo_albums(id),
  title text not null check (length(trim(title)) between 1 and 160),
  alt_text text not null default '',
  caption text not null default '',
  image_url text not null,
  width integer check (width > 0),
  height integer check (height > 0),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ajt3_photos_library_order on public.ajt3_photos (sort_order, created_at);
create index ajt3_photos_album on public.ajt3_photos (album_id);

create trigger set_photo_albums_updated_at before update on public.ajt3_photo_albums
for each row execute function public.set_updated_at();
create trigger set_photos_updated_at before update on public.ajt3_photos
for each row execute function public.set_updated_at();

alter table public.ajt3_photo_albums enable row level security;
alter table public.ajt3_photos enable row level security;
revoke all on public.ajt3_photo_albums, public.ajt3_photos from anon, authenticated;
grant select on public.ajt3_photo_albums, public.ajt3_photos to anon, authenticated;
grant all on public.ajt3_photo_albums, public.ajt3_photos to service_role;

create policy "Published photos are readable" on public.ajt3_photos
for select to anon, authenticated using (is_published = true);
create policy "Albums with published photos are readable" on public.ajt3_photo_albums
for select to anon, authenticated using (
  exists (select 1 from public.ajt3_photos where album_id = ajt3_photo_albums.id and is_published = true)
);

insert into public.ajt3_photo_albums (id, title, description, sort_order) values
  ('dogs', 'Drake & Josh', 'The usual suspects.', 0),
  ('life', 'Life lately', 'The moments worth keeping.', 1),
  ('tech', 'Out of office', 'Curiosity, out in the world.', 2);

insert into public.ajt3_photos (id, album_id, title, alt_text, image_url, width, height, sort_order) values
  ('drake', 'dogs', 'Drake', 'Portrait of Drake', '/images/dogs/drake.jpg', 3024, 4032, 0),
  ('josh', 'dogs', 'Josh', 'Portrait of Josh', '/images/dogs/josh.jpg', 4284, 5712, 1),
  ('graduation', 'life', 'A chapter complete', 'AJ in graduation attire, sitting outside on campus', '/images/IMG_4870.JPG', 5184, 3456, 2),
  ('tech-week', 'tech', 'IBM Tech 2024', 'Illuminated IBM Tech 2024 sign at an event', '/images/tech-week-24.jpg', 1290, 1233, 3),
  ('drone', 'tech', 'Ready for takeoff', 'A drone hovering above a driveway', '/images/drone.jpeg', 1290, 1665, 4);
