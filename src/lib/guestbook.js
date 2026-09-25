import { supabase } from './supabaseClient';
import { getSupabaseFunctionHeaders, readResponsePayload } from './adminPostEditor';

export async function getConversations(offset = 0, search = '') {
  if (!supabase) throw new Error('The guestbook is not connected yet.');
  let query = supabase.from('ajt3_guestbook_conversation_list')
    .select('id,title,created_at,last_message_at,last_message,last_author')
    .order('last_message_at', { ascending: false }).order('id', { ascending: false });
  if (search.trim()) query = query.ilike('title', `%${search.trim().replace(/[\\%_]/g, '\\$&')}%`);
  const { data, error } = await query.range(offset, offset + 49);
  if (error || !Array.isArray(data)) throw new Error('Unable to load conversations. Please try again.');
  return data;
}

export async function getGuestbook(conversationId, before = null) {
  if (!supabase) throw new Error('The guestbook is not connected yet.');
  if (!conversationId) throw new Error('Choose a conversation first.');
  let query = supabase.from('ajt3_guestbook')
    .select('id,conversation_id,display_name,message,created_at').eq('is_hidden', false).eq('conversation_id', conversationId)
    .order('created_at', { ascending: false }).order('id', { ascending: false });
  if (before) {
    if (!/^[0-9a-f-]{36}$/i.test(before.id) || !/^[0-9T:.+Z-]+$/.test(before.created_at)) throw new Error('Invalid message cursor.');
    query = query.or(`created_at.lt.${before.created_at},and(created_at.eq.${before.created_at},id.lt.${before.id})`);
  }
  const [{ data, error }, conversation] = await Promise.all([
    query.limit(50),
    supabase.from('ajt3_guestbook_conversations').select('id,title').eq('id', conversationId).eq('is_hidden', false).maybeSingle()
  ]);
  if (error || !Array.isArray(data)) throw new Error('Unable to load the guestbook. Please try again.');
  if (conversation.error) throw new Error('Unable to load this conversation. Please try again.');
  return { entries: conversation.data ? data : [], conversation: conversation.data };
}

export async function guestbookRequest(payload, secret, signal) {
  const url = process.env.REACT_APP_SUPABASE_URL?.trim().replace(/\/+$/, '');
  if (!url) throw new Error('The guestbook is not connected yet.');
  let response;
  try {
    response = await fetch(`${url}/functions/v1/guestbook`, {
      method: 'POST', signal,
      headers: { ...getSupabaseFunctionHeaders({ json: true }), ...(secret ? { 'x-admin-secret': secret } : {}) },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Cannot reach the guestbook. Check your connection and try again.');
  }
  const { data } = await readResponsePayload(response);
  if (!response.ok) {
    const failure = new Error(data?.error || 'The guestbook service is unavailable.');
    failure.code = data?.code;
    throw failure;
  }
  if (!data) throw new Error('The guestbook returned an invalid response.');
  return data;
}

export function notifyGuestbookChanged() {
  window.dispatchEvent(new Event('ajt3-guestbook-updated'));
}
