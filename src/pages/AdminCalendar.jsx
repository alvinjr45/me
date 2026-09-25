import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { calendarGroups, eventDate, eventRange } from '../data/calendar';
import { eventDraft, eventPayload, notifyCalendarChanged, requestCalendar } from '../lib/adminCalendar';
import './AdminCalendar.css';

function AdminCalendar({ secret, onBusy }) {
  const { search } = useLocation();
  const [events, setEvents] = useState([]);
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    requestCalendar(secret, { action: 'list' }, { signal: controller.signal }).then((result) => {
      if (controller.signal.aborted) return;
      if (!Array.isArray(result.events)) throw new Error('Calendar returned an invalid event list.');
      setEvents(result.events);
    }).catch((failure) => { if (!controller.signal.aborted) setLoadError(failure.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [secret, reload]);

  function selectEvent(event) {
    if (dirty && !window.confirm('Discard your unsaved event changes?')) return;
    const next = eventDraft(event);
    const selectedDate = new URLSearchParams(search).get('date');
    if (!event && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate || '')) {
      next.starts = `${selectedDate}T09:00`;
      next.ends = `${selectedDate}T10:00`;
    }
    setDraft(next); setDirty(false); setMessage(''); setError('');
  }

  function update(name, value) {
    setDraft((current) => ({ ...current, [name]: value }));
    setDirty(true);
  }

  function toggleAllDay(checked) {
    setDraft((current) => ({ ...current, all_day: checked,
      starts: checked ? current.starts.slice(0, 10) : `${current.starts}T09:00`,
      ends: checked ? current.ends.slice(0, 10) : `${current.ends}T10:00`
    }));
    setDirty(true);
  }

  async function save(event) {
    event.preventDefault();
    setError(''); setMessage(''); setSaving(true); onBusy(true);
    try {
      const result = await requestCalendar(secret, eventPayload(draft));
      if (!result.event?.id) throw new Error('Calendar did not confirm the save. Refresh before retrying.');
      setEvents((current) => [...current.filter((item) => item.id !== result.event.id), result.event]);
      setDraft(eventDraft(result.event)); setDirty(false);
      setMessage(result.event.is_published ? 'Event saved and published to Calendar.' : 'Event saved as a draft. Only admins can see it.');
      notifyCalendarChanged();
    } catch (failure) { setError(failure.message); }
    finally { setSaving(false); onBusy(false); }
  }

  const matching = events.filter((item) => `${item.title} ${item.location}`.toLowerCase().includes(query.toLowerCase()) &&
    (filter === 'all' || (filter === 'published' ? item.is_published : !item.is_published)))
    .sort((a, b) => eventDate(a) - eventDate(b) || a.title.localeCompare(b.title));

  return (
    <main className="admin-page admin-page--mission-control admin-calendar">
      <header className="admin-calendar__toolbar"><div><h1>Calendar events</h1><p>Give the next good thing a place on the calendar.</p></div><button className="admin-page__primary" type="button" disabled={loading || Boolean(loadError) || saving} onClick={() => selectEvent(null)}>Add event</button></header>
      {loading && <p role="status">Loading your events...</p>}
      {loadError && <div role="alert"><p>{loadError}</p><button type="button" onClick={() => setReload((value) => value + 1)}>Retry calendar</button></div>}
      {error && <p role="alert" className="admin-page__message admin-page__message--error">{error}</p>}
      {message && <p role="status" className="admin-page__message">{message} <Link to="/calendar">Open Calendar</Link></p>}
      {!loading && !loadError && <div className="admin-calendar__layout">
        <section aria-label="Manage events" className="admin-calendar__collection">
          <label>Search events<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <label>Event visibility<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All events</option><option value="published">Published</option><option value="draft">Drafts</option></select></label>
          <div className="admin-calendar__items">{matching.map((item) => <button key={item.id} type="button" disabled={saving} aria-pressed={draft?.id === item.id} onClick={() => selectEvent(item)}><strong>{item.title}</strong><small>{eventRange(item)}</small><small>{item.is_published ? 'Published' : 'Draft'} / {calendarGroups.find((group) => group.id === item.calendar)?.title}</small></button>)}</div>
          {!matching.length && <p className="admin-page__hint">{events.length ? 'No matching events.' : 'Your calendar starts with one event.'}</p>}
        </section>
        {draft ? <form className="admin-calendar__editor" onSubmit={save}>
          <fieldset disabled={saving}><legend>{draft.id ? 'Edit event' : 'New event'}</legend>
            <label>Event title<input required maxLength={160} value={draft.title} onChange={(event) => update('title', event.target.value)} /></label>
            <label>Calendar<select value={draft.calendar} onChange={(event) => update('calendar', event.target.value)}>{calendarGroups.map((group) => <option key={group.id} value={group.id}>{group.title}</option>)}</select></label>
            <label className="admin-page__toggle"><input type="checkbox" checked={draft.all_day} onChange={(event) => toggleAllDay(event.target.checked)} />All-day event</label>
            <label>Starts<input type={draft.all_day ? 'date' : 'datetime-local'} required value={draft.starts} onChange={(event) => update('starts', event.target.value)} /></label>
            <label>Ends<input type={draft.all_day ? 'date' : 'datetime-local'} required min={draft.starts} value={draft.ends} onChange={(event) => update('ends', event.target.value)} /></label>
            <p className="admin-page__hint">{draft.all_day ? 'The end date is included.' : `Times use your local time zone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}.`}</p>
            <label>Location<input maxLength={500} value={draft.location} onChange={(event) => update('location', event.target.value)} /></label>
            <label>Notes<textarea rows={4} maxLength={5000} aria-describedby="calendar-notes-hint" value={draft.notes} onChange={(event) => update('notes', event.target.value)} /></label>
            <p className="admin-page__hint" id="calendar-notes-hint">Links starting with https://, http://, or www. are clickable in event details.</p>
            <label className="admin-page__toggle"><input type="checkbox" checked={draft.is_published} onChange={(event) => update('is_published', event.target.checked)} />Publish in Calendar</label>
            <p className="admin-page__hint">Published events, including their location and notes, are visible to everyone. Uncheck to hide an event.</p>
            <button type="submit">{saving ? 'Saving event...' : 'Save event'}</button>
          </fieldset>
        </form> : <div className="admin-calendar__placeholder"><h2>Something to look forward to.</h2><p>Add an event or select one to edit its details.</p></div>}
      </div>}
    </main>
  );
}

export default AdminCalendar;
