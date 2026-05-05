create table if not exists public.ajt3_blog_posts (
  slug text primary key,
  title text not null,
  eyebrow text not null default 'Journal',
  excerpt text not null,
  published_at timestamptz not null default now(),
  cover_image_url text,
  cover_image_alt text,
  tags text[] not null default '{}',
  sections jsonb not null default '[]'::jsonb,
  media jsonb not null default '[]'::jsonb,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_blog_posts_updated_at on public.ajt3_blog_posts;

create trigger set_blog_posts_updated_at
before update on public.ajt3_blog_posts
for each row
execute function public.set_updated_at();

alter table public.ajt3_blog_posts enable row level security;

drop policy if exists "Published AJT3 blog posts are readable" on public.ajt3_blog_posts;

create policy "Published AJT3 blog posts are readable"
on public.ajt3_blog_posts
for select
to anon, authenticated
using (is_published = true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-media',
  'blog-media',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public blog media readable" on storage.objects;

create policy "Public blog media readable"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'blog-media');
