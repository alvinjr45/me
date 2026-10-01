alter table public.ajt3_guestbook
  drop constraint if exists ajt3_guestbook_conversation_id_fkey;

alter table public.ajt3_guestbook
  add constraint ajt3_guestbook_conversation_id_fkey
  foreign key (conversation_id)
  references public.ajt3_guestbook_conversations(id)
  on delete cascade;
