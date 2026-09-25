create table public.ajt3_calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 160),
  calendar text not null default 'personal' check (calendar in ('personal', 'work', 'events')),
  location text not null default '' check (length(location) <= 500),
  notes text not null default '' check (length(notes) <= 5000),
  all_day boolean not null default false,
  start_at timestamptz,
  end_at timestamptz,
  start_date date,
  end_date date,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_event_range check (
    (all_day and start_date is not null and end_date is not null and end_date >= start_date and start_at is null and end_at is null)
    or (not all_day and start_at is not null and end_at is not null and end_at > start_at and start_date is null and end_date is null)
  )
);

create trigger set_calendar_events_updated_at before update on public.ajt3_calendar_events
for each row execute function public.set_updated_at();

alter table public.ajt3_calendar_events enable row level security;
revoke all on public.ajt3_calendar_events from anon, authenticated;
grant select on public.ajt3_calendar_events to anon, authenticated;
grant all on public.ajt3_calendar_events to service_role;
create policy "Published calendar events are readable" on public.ajt3_calendar_events
for select to anon, authenticated using (is_published = true);
