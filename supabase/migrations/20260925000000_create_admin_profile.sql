create table public.ajt3_admin_profile (
  id text primary key default 'admin' check (id = 'admin'),
  image_url text not null,
  updated_at timestamptz not null default now()
);

alter table public.ajt3_admin_profile enable row level security;
revoke all on public.ajt3_admin_profile from anon, authenticated;
grant select on public.ajt3_admin_profile to anon, authenticated;
grant all on public.ajt3_admin_profile to service_role;

create policy "Admin profile photo is readable" on public.ajt3_admin_profile
for select to anon, authenticated using (true);
