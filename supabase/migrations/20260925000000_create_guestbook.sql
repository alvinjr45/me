create table public.ajt3_guestbook (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 40),
  message text not null check (char_length(message) between 1 and 500),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index ajt3_guestbook_recent on public.ajt3_guestbook (created_at desc, id desc);

create table public.ajt3_guestbook_settings (
  id boolean primary key default true check (id),
  submissions_open boolean not null default false
);
insert into public.ajt3_guestbook_settings (id) values (true);

create table public.ajt3_guestbook_limits (
  id bigint generated always as identity primary key,
  actor_hash text not null,
  kind text not null check (kind in ('attempt', 'post')),
  content_hash text,
  created_at timestamptz not null default now()
);
create index ajt3_guestbook_limits_time on public.ajt3_guestbook_limits (created_at);
create index ajt3_guestbook_limits_actor on public.ajt3_guestbook_limits (actor_hash, kind, created_at);

alter table public.ajt3_guestbook enable row level security;
alter table public.ajt3_guestbook_settings enable row level security;
alter table public.ajt3_guestbook_limits enable row level security;
revoke all on public.ajt3_guestbook, public.ajt3_guestbook_settings, public.ajt3_guestbook_limits from public, anon, authenticated;
grant select (id, display_name, message, created_at, is_hidden) on public.ajt3_guestbook to anon, authenticated;
grant all on public.ajt3_guestbook, public.ajt3_guestbook_settings, public.ajt3_guestbook_limits to service_role;
revoke all on sequence public.ajt3_guestbook_limits_id_seq from public, anon, authenticated;
grant usage, select on sequence public.ajt3_guestbook_limits_id_seq to service_role;
create policy "Visible guestbook messages are readable" on public.ajt3_guestbook
for select to anon, authenticated using (is_hidden = false);

-- Both attempt accounting and publication are serialized across function instances.
-- Returns errors instead of raising so denied requests do not roll back cleanup.
create function public.ajt3_guestbook_submit(
  p_actor text, p_kind text, p_name text default null, p_message text default null, p_content text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_now timestamptz := clock_timestamp();
  v_row public.ajt3_guestbook;
begin
  perform pg_advisory_xact_lock(734821901);
  v_now := clock_timestamp();
  delete from public.ajt3_guestbook_limits where created_at < v_now - interval '24 hours';
  if p_actor is null or p_actor !~ '^[a-f0-9]{64}$' or p_kind not in ('attempt', 'post') or p_kind is null then
    return jsonb_build_object('error', 'invalid');
  end if;
  if not coalesce((select submissions_open from public.ajt3_guestbook_settings where id = true for share), false) then
    return jsonb_build_object('error', 'paused');
  end if;
  if p_kind = 'attempt' then
    if (select count(*) from public.ajt3_guestbook_limits where kind = 'attempt' and created_at > v_now - interval '1 minute') >= 60
      or (select count(*) from public.ajt3_guestbook_limits where kind = 'attempt') >= 1000
      or (select count(*) from public.ajt3_guestbook_limits where kind = 'attempt' and actor_hash = p_actor and created_at > v_now - interval '10 minutes') >= 5
      or (select count(*) from public.ajt3_guestbook_limits where kind = 'attempt' and actor_hash = p_actor) >= 20 then
      return jsonb_build_object('error', 'limited');
    end if;
    insert into public.ajt3_guestbook_limits (actor_hash, kind, created_at) values (p_actor, 'attempt', v_now);
    return jsonb_build_object('ok', true);
  end if;
  if p_content is null or p_content !~ '^[a-f0-9]{64}$' then return jsonb_build_object('error', 'invalid'); end if;
  if (select count(*) from public.ajt3_guestbook_limits where kind = 'post') >= 100
    or (select count(*) from public.ajt3_guestbook_limits where kind = 'post' and actor_hash = p_actor) >= 5
    or exists(select 1 from public.ajt3_guestbook_limits where kind = 'post' and actor_hash = p_actor and created_at > v_now - interval '1 minute') then
    return jsonb_build_object('error', 'limited');
  end if;
  if exists(select 1 from public.ajt3_guestbook_limits where kind = 'post' and content_hash = p_content) then
    return jsonb_build_object('error', 'duplicate');
  end if;
  insert into public.ajt3_guestbook (display_name, message, created_at)
    values (p_name, p_message, v_now) returning * into v_row;
  insert into public.ajt3_guestbook_limits (actor_hash, kind, content_hash, created_at)
    values (p_actor, 'post', p_content, v_now);
  return jsonb_build_object('entry', to_jsonb(v_row));
end;
$$;
revoke all on function public.ajt3_guestbook_submit(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.ajt3_guestbook_submit(text, text, text, text, text) to service_role;
