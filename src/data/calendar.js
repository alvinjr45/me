import { supabase } from '../lib/supabaseClient';

export const calendarGroups = [
  { id: 'personal', title: 'Personal', color: '#ff9d54' },
  { id: 'work', title: 'Work', color: '#66baff' },
  { id: 'events', title: 'Events', color: '#bd9aff' }
];

export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function dateFromKey(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date, count) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + count);
}

export function monthDays(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function eventsOnDay(events, date) {
  const key = dateKey(date);
  const start = dateFromKey(key);
  const end = addDays(start, 1);
  return events.filter((event) => event.all_day
    ? event.start_date <= key && event.end_date >= key
    : new Date(event.start_at) < end && new Date(event.end_at) > start
  ).sort((a, b) => Number(b.all_day) - Number(a.all_day) || (a.start_at || a.start_date).localeCompare(b.start_at || b.start_date) || a.title.localeCompare(b.title));
}

export function eventDate(event) {
  return event.all_day ? dateFromKey(event.start_date) : new Date(event.start_at);
}

export function eventTime(event) {
  return event.all_day ? 'All day' : new Date(event.start_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function eventRange(event) {
  if (event.all_day) {
    const start = dateFromKey(event.start_date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
    return `${start}${event.end_date !== event.start_date ? ` - ${dateFromKey(event.end_date).toLocaleDateString()}` : ''} / All day`;
  }
  const options = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' };
  return `${new Date(event.start_at).toLocaleString([], options)} - ${new Date(event.end_at).toLocaleString([], options)}`;
}

export async function getCalendarEvents() {
  if (!supabase) throw new Error('Calendar is not connected yet. Configure the site connection to load events.');
  const { data, error } = await supabase.from('ajt3_calendar_events').select('*').eq('is_published', true).order('created_at').order('id');
  if (error) throw new Error('Calendar is unavailable. Please try again.');
  return data || [];
}
