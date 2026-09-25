create table public.ajt3_guestbook_conversations (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 80),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.ajt3_guestbook_conversations enable row level security;
revoke all on public.ajt3_guestbook_conversations from public, anon, authenticated;
grant select on public.ajt3_guestbook_conversations to anon, authenticated;
grant all on public.ajt3_guestbook_conversations to service_role;
create policy "Visible conversations are readable" on public.ajt3_guestbook_conversations
for select to anon, authenticated using (is_hidden = false);

insert into public.ajt3_guestbook_conversations (id, title)
values ('00000000-0000-4000-8000-000000000001', 'The Guestbook');
alter table public.ajt3_guestbook add column conversation_id uuid references public.ajt3_guestbook_conversations(id);
update public.ajt3_guestbook set conversation_id = '00000000-0000-4000-8000-000000000001' where conversation_id is null;
alter table public.ajt3_guestbook alter column conversation_id set not null;
grant select (conversation_id) on public.ajt3_guestbook to anon, authenticated;
create index ajt3_guestbook_conversation_messages on public.ajt3_guestbook (conversation_id, created_at desc, id desc);
alter policy "Visible guestbook messages are readable" on public.ajt3_guestbook
using (is_hidden = false and exists (
  select 1 from public.ajt3_guestbook_conversations c where c.id = conversation_id and c.is_hidden = false
));

-- Preview text must obey the same RLS as the actual conversation and messages.
create view public.ajt3_guestbook_conversation_list with (security_invoker = true) as
select c.id, c.title, c.created_at,
  coalesce(m.created_at, c.created_at) as last_message_at,
  m.message as last_message, m.display_name as last_author
from public.ajt3_guestbook_conversations c
left join lateral (
  select message, display_name, created_at from public.ajt3_guestbook
  where conversation_id = c.id and is_hidden = false
  order by created_at desc, id desc limit 1
) m on true
where c.is_hidden = false;
revoke all on public.ajt3_guestbook_conversation_list from public, anon, authenticated;
grant select on public.ajt3_guestbook_conversation_list to anon, authenticated, service_role;

create function public.ajt3_guestbook_submit_v2(
  p_actor text, p_kind text, p_name text default null, p_message text default null,
  p_content text default null, p_conversation uuid default null, p_title text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_now timestamptz;
  v_row public.ajt3_guestbook;
  v_conversation uuid := p_conversation;
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
  if p_content is null or p_content !~ '^[a-f0-9]{64}$'
    or (p_conversation is null and (p_title is null or char_length(trim(p_title)) not between 1 and 80))
    or (p_conversation is not null and p_title is not null) then
    return jsonb_build_object('error', 'invalid');
  end if;
  if p_conversation is not null then
    perform 1 from public.ajt3_guestbook_conversations where id = p_conversation and is_hidden = false for share;
    if not found then return jsonb_build_object('error', 'conversation_unavailable'); end if;
  end if;
  if (select count(*) from public.ajt3_guestbook_limits where kind = 'post') >= 100
    or (select count(*) from public.ajt3_guestbook_limits where kind = 'post' and actor_hash = p_actor) >= 5
    or exists(select 1 from public.ajt3_guestbook_limits where kind = 'post' and actor_hash = p_actor and created_at > v_now - interval '1 minute') then
    return jsonb_build_object('error', 'limited');
  end if;
  if exists(select 1 from public.ajt3_guestbook_limits where kind = 'post' and content_hash = p_content) then
    return jsonb_build_object('error', 'duplicate');
  end if;
  if v_conversation is null then
    insert into public.ajt3_guestbook_conversations (title, created_at) values (p_title, v_now) returning id into v_conversation;
  end if;
  insert into public.ajt3_guestbook (conversation_id, display_name, message, created_at)
    values (v_conversation, p_name, p_message, v_now) returning * into v_row;
  insert into public.ajt3_guestbook_limits (actor_hash, kind, content_hash, created_at)
    values (p_actor, 'post', p_content, v_now);
  return jsonb_build_object('entry', to_jsonb(v_row));
end;
$$;
revoke all on function public.ajt3_guestbook_submit_v2(text, text, text, text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.ajt3_guestbook_submit_v2(text, text, text, text, text, uuid, text) to service_role;

-- Older deployments must not publish messages without a conversation.
create or replace function public.ajt3_guestbook_submit(
  p_actor text, p_kind text, p_name text default null, p_message text default null, p_content text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if p_kind = 'attempt' then
    return public.ajt3_guestbook_submit_v2(p_actor, 'attempt');
  end if;
  return jsonb_build_object('error', 'upgrade_required');
end;
$$;
