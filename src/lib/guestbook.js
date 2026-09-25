import { supabase } from './supabaseClient';
import { getSupabaseFunctionHeaders, readResponsePayload } from './adminPostEditor';

export async function getGuestbook(offset = 0) {
  if (!supabase) throw new Error('The guestbook is not connected yet.');
  const { data, error } = await supabase.from('ajt3_guestbook')
    .select('id,display_name,message,created_at').eq('is_hidden', false)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 49);
  if (error || !Array.isArray(data)) throw new Error('Unable to load the guestbook. Please try again.');
  return data;
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
  if (!response.ok) throw new Error(data?.error || 'The guestbook service is unavailable.');
  if (!data) throw new Error('The guestbook returned an invalid response.');
  return data;
}

export function notifyGuestbookChanged() {
  window.dispatchEvent(new Event('ajt3-guestbook-updated'));
}
