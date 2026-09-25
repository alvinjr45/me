import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { cleanText, scrubProfanity } from './content.ts';

function required(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error('Service configuration missing');
  return value;
}

async function signingKey() {
  const secret = required('GUESTBOOK_HASH_SECRET');
  if (secret.length < 32) throw new Error('Hash secret too short');
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function digest(value: string) {
  const bytes = await crypto.subtle.sign('HMAC', await signingKey(), new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

const sessionLifetime = 60 * 60 * 1000;
const sessionMessage = (expires: number, actor: string, origin: string, terms: string) => JSON.stringify(['guestbook-session-v1', expires, actor, origin, terms]);

async function verifySession(session: unknown, actor: string, origin: string, terms: string) {
  if (typeof session !== 'string' || !/^\d{13}\.[a-f0-9]{64}$/.test(session)) return false;
  const [timestamp, signature] = session.split('.');
  const expires = Number(timestamp);
  if (expires <= Date.now() || expires > Date.now() + sessionLifetime) return false;
  const bytes = Uint8Array.from(signature.match(/../g)!, (byte) => parseInt(byte, 16));
  return crypto.subtle.verify('HMAC', await signingKey(), bytes, new TextEncoder().encode(sessionMessage(expires, actor, origin, terms)));
}

async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Empty request');
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 12000) { await reader.cancel(); throw new Error('Request too large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

// For direct Supabase gateway traffic: use the last proxy-appended address,
// never a client-provided prefix. Verify gateway behavior before enabling writes.
export function clientAddress(request: Request) {
  const raw = request.headers.get('x-forwarded-for')?.split(',').pop()?.trim();
  if (!raw || !/^[0-9a-f:.]+$/i.test(raw)) throw new Error('Client address unavailable');
  const host = raw.includes(':') ? `[${raw}]` : raw;
  return new URL(`http://${host}`).hostname.toLowerCase();
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('origin') || '';
  const allowed = (Deno.env.get('GUESTBOOK_ORIGINS') || '').split(',').map((item) => item.trim()).filter(Boolean);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-admin-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  if (allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (!origin || !allowed.includes(origin)) return respond({ error: 'This site address is not enabled for the guestbook.' }, 403);
  if (request.method === 'OPTIONS') return respond({ ok: true });
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return respond({ error: 'JSON is required.' }, 415);

  try {
    let body;
    try { body = await readBody(request); } catch { return respond({ error: 'Invalid or oversized request.' }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return respond({ error: 'Invalid request.' }, 400);
    const { action } = body;
    if (action !== 'submit' && action !== 'verify') {
      const secret = request.headers.get('x-admin-secret');
      if (!secret || secret !== required('ADMIN_POST_SECRET')) return respond({ error: 'Sign in to manage the guestbook.' }, 401);
    }
    const db = createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'));
    if (action === 'list' || action === 'list_conversations') {
      const offset = Number.isInteger(body.offset) && body.offset >= 0 ? body.offset : 0;
      const [entries, settings] = await Promise.all([
        (action === 'list_conversations'
          ? db.from('ajt3_guestbook_conversations').select('id,title,created_at,is_hidden')
          : db.from('ajt3_guestbook').select('id,display_name,message,created_at,is_hidden,conversation_id,conversation:ajt3_guestbook_conversations(title,is_hidden)'))
          .order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 49),
        db.from('ajt3_guestbook_settings').select('submissions_open').eq('id', true).single()
      ]);
      if (entries.error || settings.error) throw new Error('Database unavailable');
      return respond({ entries: entries.data, submissionsOpen: settings.data.submissions_open });
    }
    if (action === 'pause') {
      if (typeof body.open !== 'boolean') return respond({ error: 'Invalid setting.' }, 400);
      const result = await db.from('ajt3_guestbook_settings').update({ submissions_open: body.open }).eq('id', true).select('submissions_open').single();
      if (result.error) throw new Error('Database unavailable');
      return respond({ submissionsOpen: result.data.submissions_open });
    }
    if (action === 'visibility' || action === 'conversation_visibility' || action === 'delete') {
      if (typeof body.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.id) || (action !== 'delete' && typeof body.hidden !== 'boolean')) return respond({ error: 'Invalid message selection.' }, 400);
      const query = db.from(action === 'conversation_visibility' ? 'ajt3_guestbook_conversations' : 'ajt3_guestbook');
      const result = await (action === 'delete' ? query.delete() : query.update({ is_hidden: body.hidden })).eq('id', body.id).select('id').single();
      if (result.error) throw new Error('Message could not be changed');
      return respond({ ok: true });
    }
    if (action !== 'submit' && action !== 'verify') return respond({ error: 'Unknown action.' }, 400);

    const termsVersion = Deno.env.get('GUESTBOOK_TERMS_VERSION')?.trim();
    if (!termsVersion) return respond({ error: 'Messaging is unavailable until the Terms and Conditions are published.', code: 'terms_unavailable' }, 503);
    if (body.ageConfirmed !== true || body.termsAccepted !== true) {
      return respond({ error: 'Enter your name, confirm that you are at least 18, and accept the Terms and Conditions before posting.', code: 'participation_required' }, 400);
    }
    if (body.termsVersion !== termsVersion) return respond({ error: 'The terms have changed. Reload the site to read and accept the current version before posting.', code: 'terms_changed' }, 409);

    // No bypass: missing protection configuration keeps public writes closed.
    const turnstileSecret = required('TURNSTILE_SECRET_KEY');
    const hostnames = required('GUESTBOOK_HOSTNAMES').split(',').map((item) => item.trim());
    const address = clientAddress(request);
    const actor = await digest(`address:${address}`);
    const limit = await db.rpc('ajt3_guestbook_submit_v2', { p_actor: actor, p_kind: 'attempt' });
    if (limit.error || !limit.data) throw new Error('Rate limiter unavailable');
    if (limit.data.error === 'paused') return respond({ error: 'New messages are paused. Please check back later.' }, 503);
    if (limit.data.error === 'limited') return respond({ error: 'Too many attempts. Please try again later.' }, 429);
    if (!limit.data.ok) throw new Error('Rate limiter unavailable');
    if (body.website) return respond({ error: 'Unable to accept this message.' }, 400);
    const usesSession = action === 'submit' && body.session != null;
    if (usesSession && !await verifySession(body.session, actor, origin, termsVersion)) {
      return respond({ error: 'Your verification expired. Verify again to continue.', code: 'verification_required' }, 401);
    }
    if (!usesSession && (typeof body.token !== 'string' || !body.token || body.token.length > 2048)) return respond({ error: 'Complete the bot check before posting.', code: 'verification_required' }, 400);
    let name;
    let message;
    let title = null;
    let conversationId = null;
    try {
      name = cleanText(body.name, 40, 'Name');
      if (action === 'submit') {
        message = cleanText(body.message, 500, 'Message');
        if (body.conversationId != null) {
          if (typeof body.conversationId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.conversationId) || body.title != null) throw new Error('Choose one conversation to reply to.');
          conversationId = body.conversationId;
        } else {
          title = cleanText(body.title, 80, 'Conversation title');
        }
      }
    } catch (error) { return respond({ error: (error as Error).message }, 400); }
    if (!usesSession) {
      const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: turnstileSecret, response: body.token }),
        signal: AbortSignal.timeout(8000)
      });
      if (!verification.ok) throw new Error('Bot verification unavailable');
      const challenge = await verification.json();
      if (challenge.success !== true || challenge.action !== 'guestbook' || !hostnames.includes(challenge.hostname)) return respond({ error: 'Bot verification expired or failed. Please try again.' }, 400);
    }
    if (action === 'verify') {
      const expiresAt = Date.now() + sessionLifetime;
      const signature = await digest(sessionMessage(expiresAt, actor, origin, termsVersion));
      return respond({ session: `${expiresAt}.${signature}`, expiresAt });
    }
    const extra = Deno.env.get('GUESTBOOK_BLOCKED_WORDS') || '';
    const safeName = scrubProfanity(name, extra);
    const safeMessage = scrubProfanity(message, extra);
    const safeTitle = title === null ? null : scrubProfanity(title, extra);
    const result = await db.rpc('ajt3_guestbook_submit_v2', {
      p_actor: actor, p_kind: 'post', p_name: safeName, p_message: safeMessage,
      p_conversation: conversationId, p_title: safeTitle,
      p_content: await digest(`message:${safeMessage.toLowerCase().replace(/\s+/g, ' ')}`)
    });
    if (result.error || !result.data) throw new Error('Publication unavailable');
    if (result.data.error === 'paused') return respond({ error: 'New messages are paused. Please check back later.' }, 503);
    if (result.data.error === 'duplicate') return respond({ error: 'That message has already been posted recently.' }, 409);
    if (result.data.error === 'conversation_unavailable') return respond({ error: 'This conversation is no longer available.' }, 404);
    if (result.data.error === 'limited') return respond({ error: 'Posting limit reached. Please try again later.' }, 429);
    if (result.data.error) throw new Error('Publication unavailable');
    if (!result.data.entry?.id) throw new Error('Publication unavailable');
    return respond({ entry: result.data.entry, scrubbed: safeName !== name || safeMessage !== message || safeTitle !== title }, 201);
  } catch {
    return respond({ error: 'Guestbook service is unavailable. Please try again later.' }, 503);
  }
});
