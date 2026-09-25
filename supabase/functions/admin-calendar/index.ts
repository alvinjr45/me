import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function headers(request: Request) {
  const origins = (Deno.env.get('ADMIN_CORS_ORIGINS') || Deno.env.get('ADMIN_CORS_ORIGIN') || '*').split(',').map((item) => item.trim());
  const origin = request.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': origins.includes('*') ? '*' : origins.includes(origin) ? origin : origins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin'
  };
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function text(value: unknown, max: number, required = false) {
  if (value != null && typeof value !== 'string') throw new Error('Text fields must contain text.');
  const result = String(value || '').trim();
  if ((required && !result) || result.length > max) throw new Error(`Text fields must contain ${required ? '1' : '0'} to ${max} characters.`);
  return result;
}

function date(value: unknown, allDay: boolean) {
  if (typeof value !== 'string' || !(allDay ? /^\d{4}-\d{2}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/).test(value)) throw new Error('Choose valid event dates.');
  const parsed = new Date(allDay ? `${value}T00:00:00Z` : value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value.slice(0, 10)) throw new Error('Choose valid event dates.');
  return allDay ? value : parsed.toISOString();
}

Deno.serve(async (request) => {
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: headers(request) });
  if (request.method === 'OPTIONS') return respond({});
  if (request.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
  try {
    const secret = request.headers.get('x-admin-secret');
    if (!secret || secret !== requiredEnv('ADMIN_POST_SECRET')) return respond({ error: 'Unauthorized' }, 401);
    let body;
    try { body = await request.json(); } catch { return respond({ error: 'Send valid event JSON.' }, 400); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return respond({ error: 'Send an event object.' }, 400);
    const client = createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'));
    if (body.action === 'list') {
      const { data, error } = await client.from('ajt3_calendar_events').select('*').order('created_at').order('id');
      if (error) return respond({ error: 'Calendar is unavailable. Apply the calendar migration and retry.' }, 503);
      return respond({ events: data });
    }
    if (body.action !== 'save') return respond({ error: 'Unknown action' }, 400);
    let record;
    try {
      if (typeof body.all_day !== 'boolean' || typeof body.is_published !== 'boolean') throw new Error('Choose all-day and publishing settings.');
      if (!['personal', 'work', 'events'].includes(body.calendar)) throw new Error('Choose an existing calendar.');
      const id = text(body.id, 36) || crypto.randomUUID();
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error('Invalid event ID.');
      const start = date(body.all_day ? body.start_date : body.start_at, body.all_day);
      const end = date(body.all_day ? body.end_date : body.end_at, body.all_day);
      if (body.all_day ? end < start : end <= start) throw new Error('The event must end after it starts. All-day events may end on the same date.');
      record = {
        id, title: text(body.title, 160, true), calendar: body.calendar,
        location: text(body.location, 500), notes: text(body.notes, 5000),
        all_day: body.all_day, is_published: body.is_published,
        start_date: body.all_day ? start : null, end_date: body.all_day ? end : null,
        start_at: body.all_day ? null : start, end_at: body.all_day ? null : end
      };
    } catch (error) { return respond({ error: error instanceof Error ? error.message : 'Invalid event' }, 400); }
    const { data, error } = await client.from('ajt3_calendar_events').upsert(record).select('*').single();
    if (error) return respond({ error: 'Unable to save this event. Please retry.' }, 500);
    return respond({ event: data });
  } catch { return respond({ error: 'Calendar service is unavailable. Check its configuration and retry.' }, 500); }
});
