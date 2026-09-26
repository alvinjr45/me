import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePhoneBack } from '../components/deviceSettings';
import { addDays, calendarGroups, dateFromKey, dateKey, eventDate, eventRange, eventsOnDay, eventTime, getCalendarEvents, monthDays } from '../data/calendar';
import './Calendar.css';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fullDate = (date) => date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const groupFor = (event) => calendarGroups.find((group) => group.id === event.calendar) || calendarGroups[0];

function MiniMonth({ date, selected, onSelect }) {
  return <div className="calendar-mini">
    <div className="calendar-mini__weekdays">{weekdays.map((day) => <span key={day}>{day[0]}</span>)}</div>
    <div className="calendar-mini__days">{monthDays(date).map((day) => <button key={dateKey(day)} type="button" className={day.getMonth() !== date.getMonth() ? 'is-outside' : ''} aria-label={fullDate(day)} aria-pressed={dateKey(day) === dateKey(selected)} aria-current={dateKey(day) === dateKey(new Date()) ? 'date' : undefined} onClick={() => onSelect(day)}>{day.getDate()}</button>)}</div>
  </div>;
}

function EventButton({ event, onSelect, style, className = '' }) {
  return <button type="button" className={`calendar-event ${className}`} style={{ '--event-color': groupFor(event).color, ...style }} onClick={() => onSelect(event)} title={`${event.title} / ${eventRange(event)}`}><strong>{event.title}</strong><span>{eventTime(event)}</span></button>;
}

function EventNotes({ notes }) {
  const parts = notes.split(/(\b(?:https?:\/\/|www\.)[^\s<>"']+)/gi);
  return <p className="calendar-agenda__notes">{parts.map((part, index) => {
    if (index % 2 === 0) return part;
    let label = part.replace(/[.,!?;:]+$/, '');
    for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}']]) {
      while (label.endsWith(close) && label.split(close).length > label.split(open).length) {
        label = label.slice(0, -1).replace(/[.,!?;:]+$/, '');
      }
    }
    const href = /^www\./i.test(label) ? `https://${label}` : label;
    try {
      const url = new URL(href);
      if (!['http:', 'https:'].includes(url.protocol)) return part;
    } catch { return part; }
    return <React.Fragment key={index}><a href={href} target="_blank" rel="noopener noreferrer">{label}<span className="sr-only"> (opens in a new tab)</span></a>{part.slice(label.length)}</React.Fragment>;
  })}</p>;
}

// Place overlapping events in separate lanes, including their minimum visible height.
export function timedLayout(events, day) {
  const start = dateFromKey(dateKey(day));
  const end = addDays(start, 1);
  const minutes = (date) => date.getHours() * 60 + date.getMinutes();
  const items = events.filter((event) => !event.all_day).map((event) => {
    const from = new Date(event.start_at);
    const to = new Date(event.end_at);
    const top = from < start ? 0 : minutes(from);
    return { event, top, bottom: Math.min(1440, Math.max(top + 30, to >= end ? 1440 : minutes(to))) };
  }).sort((a, b) => a.top - b.top || b.bottom - a.bottom);
  let group = [];
  let groupEnd = 0;
  let lanes = [];
  function finish() { group.forEach((item) => { item.columns = lanes.length; }); }
  items.forEach((item) => {
    if (item.top >= groupEnd) { finish(); group = []; lanes = []; }
    let lane = lanes.findIndex((bottom) => bottom <= item.top);
    if (lane === -1) lane = lanes.length;
    lanes[lane] = item.bottom;
    item.lane = lane;
    group.push(item);
    groupEnd = Math.max(...lanes);
  });
  finish();
  return items;
}

function TimeView({ days, events, onSelect, onDay }) {
  const scroll = useRef(null);
  useEffect(() => { if (scroll.current) scroll.current.scrollTop = 7 * 48; }, [days.length]);
  return <div className="calendar-time-scroll" ref={scroll}>
    <div className={`calendar-time ${days.length === 7 ? 'calendar-time--week' : ''}`} style={{ '--day-count': days.length }}>
      <div className="calendar-time__head"><span>All day</span>{days.map((day) => <div key={dateKey(day)}><button type="button" className="calendar-time__date" aria-current={dateKey(day) === dateKey(new Date()) ? 'date' : undefined} onClick={() => onDay(day)}>{weekdays[day.getDay()]} <strong>{day.getDate()}</strong></button>{eventsOnDay(events, day).filter((event) => event.all_day).map((event) => <EventButton key={event.id} event={event} onSelect={onSelect} />)}</div>)}</div>
      <div className="calendar-time__body"><div className="calendar-time__hours">{Array.from({ length: 24 }, (_, hour) => <span key={hour}>{hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}</span>)}</div>
        {days.map((day) => <div className="calendar-time__column" key={dateKey(day)}>{timedLayout(eventsOnDay(events, day), day).map(({ event, top, bottom, lane, columns }) => <EventButton key={event.id} event={event} onSelect={onSelect} style={{ top: `${top / 1440 * 100}%`, height: `${(bottom - top) / 1440 * 100}%`, left: `calc(${lane / columns * 100}% + 2px)`, width: `calc(${100 / columns}% - 4px)` }} />)}</div>)}
      </div>
    </div>
  </div>;
}

function Calendar() {
  const [selected, setSelected] = useState(() => dateFromKey(dateKey(new Date())));
  const [view, setView] = useState('month');
  const [events, setEvents] = useState([]);
  const [visibleGroups, setVisibleGroups] = useState(calendarGroups.map((group) => group.id));
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const details = useRef(null);
  const todayButton = useRef(null);
  const canvas = useRef(null);

  useLayoutEffect(() => {
    const container = canvas.current;
    if (loading || view !== 'month' || !container) return;
    function alignSelectedWeek() {
      container.style.removeProperty('--calendar-scroll-space');
      const isPhone = Boolean(container.closest('.device-scene--phone'));
      const isLargeViewport = window.matchMedia?.('(min-width: 1025px) and (min-height: 501px)').matches;
      if (!isPhone && !isLargeViewport) return;
      const month = container.querySelector('.calendar-month');
      const cell = month?.querySelector('.is-selected');
      if (!cell) return;
      const cellTop = cell.getBoundingClientRect().top;
      // Leave enough room below the final week to align it at the top too.
      const space = Math.max(0, container.clientHeight - (month.getBoundingClientRect().bottom - cellTop));
      container.style.setProperty('--calendar-scroll-space', `${space}px`);
      container.scrollTop += cellTop - container.getBoundingClientRect().top;
    }
    alignSelectedWeek();
    const observer = window.ResizeObserver ? new ResizeObserver(alignSelectedWeek) : null;
    observer?.observe(container);
    return () => {
      observer?.disconnect();
      container.style.removeProperty('--calendar-scroll-space');
    };
  }, [loading, view, selected]);

  useEffect(() => {
    let current = true;
    let request = 0;
    async function load() {
      const id = ++request;
      try {
        const rows = await getCalendarEvents();
        if (current && id === request) { setEvents(rows); setError(''); }
      } catch (failure) {
        if (current && id === request) { setEvents([]); setError(failure.message); }
      } finally { if (current && id === request) setLoading(false); }
    }
    const storage = (event) => { if (event.key === 'ajt3-calendar-updated' || event.key === null) load(); };
    load();
    window.addEventListener('ajt3-calendar-updated', load);
    window.addEventListener('focus', load);
    window.addEventListener('storage', storage);
    return () => { current = false; window.removeEventListener('ajt3-calendar-updated', load); window.removeEventListener('focus', load); window.removeEventListener('storage', storage); };
  }, [reload]);

  const filtered = events.filter((event) => visibleGroups.includes(event.calendar));
  const active = filtered.find((event) => event.id === activeId);
  useEffect(() => { if (activeId) details.current?.focus(); }, [activeId]);

  function chooseDay(date) { setSelected(date); setActiveId(null); }
  function openDay(date) { chooseDay(date); setView('day'); }
  function selectEvent(event) { setActiveId(event.id); setSelected(dateFromKey(dateKey(eventDate(event)))); }
  function move(direction) {
    setActiveId(null);
    setSelected((date) => view === 'year' ? new Date(date.getFullYear() + direction, date.getMonth(), 1)
      : view === 'month' ? new Date(date.getFullYear(), date.getMonth() + direction, 1)
        : addDays(date, direction * (view === 'week' ? 7 : 1)));
  }

  usePhoneBack(() => {
    if (activeId) setActiveId(null);
    else setView('month');
  }, Boolean(activeId) || view !== 'month', 'Calendar');

  const weekStart = addDays(selected, -selected.getDay());
  const days = view === 'day' ? [selected] : Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const agenda = eventsOnDay(filtered, selected);
  const heading = view === 'year' ? String(selected.getFullYear()) : view === 'day' ? selected.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }) : selected.toLocaleDateString([], { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <main className="calendar-app" aria-busy="true">
        <p className="app-initial-loading" role="status">Loading Calendar...</p>
      </main>
    );
  }

  return (
    <main className="calendar-app">
      <header className="calendar-toolbar">
        <div className="calendar-toolbar__views" role="group" aria-label="Calendar view">{['day', 'week', 'month', 'year'].map((mode) => <button key={mode} type="button" aria-pressed={view === mode} onClick={() => setView(mode)}>{mode[0].toUpperCase() + mode.slice(1)}</button>)}</div>
      </header>
      <div className="calendar-layout">
        <aside className="calendar-sidebar" id="calendar-sidebar">
          <p className="calendar-sidebar__label">MY CALENDARS</p>
          {calendarGroups.map((group) => <label className="calendar-sidebar__group" key={group.id}><input type="checkbox" style={{ accentColor: group.color }} checked={visibleGroups.includes(group.id)} onChange={(event) => setVisibleGroups((current) => event.target.checked ? [...current, group.id] : current.filter((id) => id !== group.id))} />{group.title}</label>)}
          <div className="calendar-sidebar__mini"><strong>{selected.toLocaleDateString([], { month: 'long', year: 'numeric' })}</strong><MiniMonth date={selected} selected={selected} onSelect={chooseDay} /></div>
          <Link className="calendar-sidebar__manage" to="/admin/calendar">Manage events</Link><p className="calendar-sidebar__zone">{Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' ')}</p>
        </aside>
        <div className="calendar-workspace">
          <div className="calendar-heading"><h1>{heading}</h1><div className="calendar-heading__navigation"><button type="button" onClick={() => move(-1)} aria-label={`Previous ${view}`}>&lsaquo;</button><button type="button" ref={todayButton} onClick={() => chooseDay(dateFromKey(dateKey(new Date())))}>Today</button><button type="button" onClick={() => move(1)} aria-label={`Next ${view}`}>&rsaquo;</button></div></div>
          {error && <div className="calendar-notice" role="alert">{error} <button type="button" onClick={() => { setLoading(true); setReload((value) => value + 1); }}>Retry calendar</button></div>}
          <div className="calendar-canvas" ref={canvas}>
            {view === 'month' ? <div className="calendar-month"><div className="calendar-month__weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-month__days">{monthDays(selected).map((day) => {
                const entries = eventsOnDay(filtered, day);
                return <div key={dateKey(day)} className={`calendar-month__cell${day.getMonth() !== selected.getMonth() ? ' is-outside' : ''}${dateKey(day) === dateKey(selected) ? ' is-selected' : ''}`}>
                  <button className="calendar-month__date" type="button" aria-label={fullDate(day)} aria-pressed={dateKey(day) === dateKey(selected)} aria-current={dateKey(day) === dateKey(new Date()) ? 'date' : undefined} onClick={() => chooseDay(day)} onDoubleClick={() => openDay(day)}>{day.getDate()}</button>
                  <div className="calendar-month__events">{entries.slice(0, 2).map((event) => <EventButton key={event.id} event={event} onSelect={selectEvent} />)}{entries.length > 2 && <button className="calendar-month__more" type="button" onClick={() => openDay(day)}>+{entries.length - 2} more</button>}</div>
                  <button className="calendar-month__preview" type="button" aria-label={`${fullDate(day)}: ${entries.length} ${entries.length === 1 ? 'event' : 'events'}${entries.length ? `. ${entries.slice(0, 2).map((event) => `${event.title}, ${eventTime(event)}`).join('; ')}` : ''}. Show day agenda`} aria-pressed={dateKey(day) === dateKey(selected)} aria-current={dateKey(day) === dateKey(new Date()) ? 'date' : undefined} onClick={() => chooseDay(day)}>
                    <span className="calendar-month__preview-date" aria-hidden="true">{day.getDate()}</span>
                    <span className="calendar-month__preview-events" aria-hidden="true">{entries.slice(0, 2).map((event) => <span className="calendar-month__preview-event" key={event.id} style={{ '--event-color': groupFor(event).color }}><span>{event.title}</span></span>)}{entries.length > 2 && <span className="calendar-month__preview-more">+{entries.length - 2} more</span>}</span>
                  </button>
                </div>;
              })}</div></div>
                : view === 'year' ? <div className="calendar-year">{Array.from({ length: 12 }, (_, month) => {
                  const date = new Date(selected.getFullYear(), month, 1);
                  return <section key={month}><button className="calendar-year__month" type="button" onClick={() => { chooseDay(date); setView('month'); }}>{date.toLocaleDateString([], { month: 'long' })}</button><MiniMonth date={date} selected={selected} onSelect={openDay} /></section>;
                })}</div>
                  : <TimeView days={days} events={filtered} onSelect={selectEvent} onDay={openDay} />}
          </div>
          <section className="calendar-agenda" aria-label={active ? 'Event details' : 'Selected day events'} ref={details} tabIndex={-1}>
            {active ? <><header><h2 style={{ color: `var(--calendar-detail-color, ${groupFor(active).color})` }}>{active.title}</h2><button type="button" onClick={() => { setActiveId(null); todayButton.current?.focus(); }} aria-label="Close event details">&times;</button></header><p>{eventRange(active)}</p><p className="calendar-agenda__group">{groupFor(active).title}</p>{active.location && <p><strong>Location:</strong> {active.location}</p>}{active.notes && <EventNotes notes={active.notes} />}</>
              : <><header><h2>{fullDate(selected)}</h2><span>{agenda.length} {agenda.length === 1 ? 'event' : 'events'}</span></header>{!loading && !error && !agenda.length && <p>No events. A little room in the day.</p>}<div className="calendar-agenda__events">{agenda.map((event) => <EventButton key={event.id} event={event} onSelect={selectEvent} />)}</div></>}
          </section>
        </div>
      </div>
    </main>
  );
}

export default Calendar;
