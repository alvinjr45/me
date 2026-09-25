alter table public.ajt3_guestbook add column is_admin boolean not null default false;
grant select (is_admin) on public.ajt3_guestbook to anon, authenticated;

create or replace view public.ajt3_guestbook_conversation_list with (security_invoker = true) as
select c.id, c.title, c.created_at,
  coalesce(m.created_at, c.created_at) as last_message_at,
  m.message as last_message, m.display_name as last_author,
  m.is_admin as last_author_is_admin
from public.ajt3_guestbook_conversations c
left join lateral (
  select message, display_name, created_at, is_admin from public.ajt3_guestbook
  where conversation_id = c.id and is_hidden = false
  order by created_at desc, id desc limit 1
) m on true
where c.is_hidden = false;

create function public.ajt3_guestbook_submit_v3(
  p_actor text, p_kind text, p_name text default null, p_message text default null,
  p_content text default null, p_conversation uuid default null, p_title text default null,
  p_is_admin boolean default false
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_result jsonb;
  v_row public.ajt3_guestbook;
begin
  v_result := public.ajt3_guestbook_submit_v2(
    p_actor, p_kind, case when p_is_admin then 'AJ' else p_name end,
    p_message, p_content, p_conversation, p_title
  );
  if p_is_admin and v_result->'entry'->>'id' is not null then
    update public.ajt3_guestbook set is_admin = true
      where id = (v_result->'entry'->>'id')::uuid returning * into v_row;
    return jsonb_build_object('entry', to_jsonb(v_row));
  end if;
  return v_result;
end;
$$;
revoke all on function public.ajt3_guestbook_submit_v3(text, text, text, text, text, uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.ajt3_guestbook_submit_v3(text, text, text, text, text, uuid, text, boolean) to service_role;
