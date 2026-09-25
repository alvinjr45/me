import { getSupabaseFunctionHeaders, readResponsePayload } from './adminPostEditor';
import { dateKey } from '../data/calendar';

export async function requestCalendar(secret, payload, { signal } = {}) {
  const baseUrl = process.env.REACT_APP_SUPABASE_URL;
  if (!baseUrl || !secret) throw new Error('Sign in before managing calendar events.');
  const response = await fetch(`${baseUrl}/functions/v1/admin-calendar`, {
    method: 'POST',
    headers: { ...getSupabaseFunctionHeaders({ json: true }), 'x-admin-secret': secret },
    body: JSON.stringify(payload), signal
  });
  const result = await readResponsePayload(response);
  if (!response.ok) throw new Error(result.data?.error || 'Calendar is unavailable. Check that its migration and function are deployed.');
  if (!result.data) throw new Error('Calendar returned an invalid response.');
  return result.data;
}

export function notifyCalendarChanged() {
  window.dispatchEvent(new Event('ajt3-calendar-updated'));
  try { window.localStorage.setItem('ajt3-calendar-updated', String(Date.now())); } catch {
    // Open windows in this tab still receive the update.
  }
}

function localDateTime(value) {
  const date = new Date(value);
  return `${dateKey(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function eventDraft(event) {
  const today = dateKey(new Date());
  return event ? { ...event, starts: event.all_day ? event.start_date : localDateTime(event.start_at), ends: event.all_day ? event.end_date : localDateTime(event.end_at) } : {
    id: '', title: '', calendar: 'personal', location: '', notes: '', all_day: false,
    starts: `${today}T09:00`, ends: `${today}T10:00`, is_published: false
  };
}

export function eventPayload(draft) {
  if (!draft.title.trim()) throw new Error('Enter an event title.');
  if (!draft.starts || !draft.ends) throw new Error('Choose a start and end.');
  if (draft.all_day ? draft.ends < draft.starts : new Date(draft.ends) <= new Date(draft.starts)) {
    throw new Error(draft.all_day ? 'The end date cannot be before the start date.' : 'The event must end after it starts.');
  }
  return {
    action: 'save', id: draft.id, title: draft.title.trim(), calendar: draft.calendar,
    location: draft.location, notes: draft.notes, all_day: draft.all_day, is_published: draft.is_published,
    start_date: draft.all_day ? draft.starts : null, end_date: draft.all_day ? draft.ends : null,
    start_at: draft.all_day ? null : new Date(draft.starts).toISOString(), end_at: draft.all_day ? null : new Date(draft.ends).toISOString()
  };
}
