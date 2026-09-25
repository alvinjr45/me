import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Calendar, { timedLayout } from './Calendar';
import { addDays, dateFromKey, dateKey, eventsOnDay, getCalendarEvents, monthDays } from '../data/calendar';

jest.mock('../lib/supabaseClient', () => ({ supabase: null }));
jest.mock('../data/calendar', () => ({ ...jest.requireActual('../data/calendar'), getCalendarEvents: jest.fn() }));

const today = dateKey(new Date());
const event = { id: 'first', title: 'Project launch', calendar: 'work', all_day: true, start_date: today, end_date: today, location: 'Studio', notes: 'Bring ideas.', is_published: true };
function openCalendar() { return render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Calendar /></MemoryRouter>); }
beforeEach(() => { getCalendarEvents.mockReset(); getCalendarEvents.mockResolvedValue([event]); });

test('shows event details, filters calendars and links to event management', async () => {
  openCalendar();
  fireEvent.click((await screen.findAllByRole('button', { name: 'Project launch All day' }))[0]);
  const details = screen.getByRole('region', { name: 'Event details' });
  expect(details).toHaveTextContent('Studio');
  expect(details).toHaveTextContent('Bring ideas.');
  expect(details).toHaveFocus();
  expect(screen.getByRole('link', { name: 'Manage events' })).toHaveAttribute('href', '/admin/calendar');
  fireEvent.click(screen.getByLabelText('Work'));
  expect(screen.queryByRole('region', { name: 'Event details' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Project launch All day' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Work'));
  expect(screen.getAllByRole('button', { name: 'Project launch All day' }).length).toBeGreaterThan(0);
});

test('links web addresses in notes while preserving punctuation and keeping markup as text', async () => {
  getCalendarEvents.mockResolvedValue([{ ...event, notes: 'Join (https://example.com/meet?room=1&guest=2).\nRead https://example.com/wiki/Event_(live), or www.example.com.\nhttp://example.com/info\n<script>alert(1)</script> javascript:alert(1) https://.' }]);
  openCalendar();
  fireEvent.click((await screen.findAllByRole('button', { name: 'Project launch All day' }))[0]);
  const details = screen.getByRole('region', { name: 'Event details' });
  const links = within(details).getAllByRole('link');
  expect(links.map((link) => link.getAttribute('href'))).toEqual([
    'https://example.com/meet?room=1&guest=2', 'https://example.com/wiki/Event_(live)', 'https://www.example.com', 'http://example.com/info'
  ]);
  links.forEach((link) => {
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAccessibleName(/opens in a new tab/);
  });
  expect(within(details).getByText(/Join/).textContent).toContain(').\nRead');
  expect(details).toHaveTextContent('<script>alert(1)</script> javascript:alert(1) https://.');
});

test('supports all four views and navigates safely across month boundaries', async () => {
  openCalendar();
  await screen.findAllByRole('button', { name: 'Project launch All day' });
  fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
  const next = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(next.toLocaleDateString([], { month: 'long', year: 'numeric' }));
  for (const view of ['Day', 'Week', 'Year', 'Month']) {
    fireEvent.click(screen.getByRole('button', { name: view, exact: true }));
    expect(screen.getByRole('button', { name: view, exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
  fireEvent.click(screen.getByRole('button', { name: 'Today', exact: true }));
  expect(screen.getByRole('region', { name: 'Selected day events' })).toHaveTextContent('Project launch');
});

test('refreshes after a save and removes unpublished event details', async () => {
  openCalendar();
  fireEvent.click((await screen.findAllByRole('button', { name: 'Project launch All day' }))[0]);
  getCalendarEvents.mockResolvedValue([]);
  await act(async () => { window.dispatchEvent(new Event('ajt3-calendar-updated')); });
  expect(screen.queryByRole('region', { name: 'Event details' })).not.toBeInTheDocument();
  expect(screen.queryByText('Project launch')).not.toBeInTheDocument();
  expect(screen.getByText('No events. A little room in the day.')).toBeInTheDocument();
});

test('shows a retry on a failed load without inventing events', async () => {
  getCalendarEvents.mockRejectedValueOnce(new Error('Calendar unavailable'));
  openCalendar();
  expect(await screen.findByRole('alert')).toHaveTextContent('Calendar unavailable');
  fireEvent.click(screen.getByRole('button', { name: 'Retry calendar' }));
  expect((await screen.findAllByRole('button', { name: 'Project launch All day' })).length).toBeGreaterThan(0);
});

test('handles leap days, inclusive all-day dates and exclusive midnight endings', () => {
  const leapDay = dateFromKey('2028-02-29');
  expect(dateKey(addDays(leapDay, 1))).toBe('2028-03-01');
  expect(monthDays(leapDay)).toHaveLength(42);
  expect(eventsOnDay([{ ...event, start_date: '2028-02-28', end_date: '2028-02-29' }], leapDay)).toHaveLength(1);
  const timed = { ...event, all_day: false, start_at: new Date(2028, 1, 28, 23).toISOString(), end_at: new Date(2028, 1, 29).toISOString() };
  expect(eventsOnDay([timed], leapDay)).toHaveLength(0);
  expect(eventsOnDay([timed], addDays(leapDay, -1))).toHaveLength(1);
});

test('gives overlapping timed events separate lanes and reuses space later', () => {
  const day = dateFromKey('2028-03-01');
  const timed = (id, start, end) => ({ ...event, id, all_day: false, start_at: new Date(2028, 2, 1, start).toISOString(), end_at: new Date(2028, 2, 1, end).toISOString() });
  const layout = timedLayout([timed('a', 9, 11), timed('b', 10, 12), timed('c', 13, 14)], day);
  expect(layout.map(({ lane, columns }) => [lane, columns])).toEqual([[0, 2], [1, 2], [0, 1]]);
});
