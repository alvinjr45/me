import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminCalendar from './AdminCalendar';
import { eventDraft, eventPayload, notifyCalendarChanged, requestCalendar } from '../lib/adminCalendar';

jest.mock('heic2any', () => jest.fn());
jest.mock('../lib/supabaseClient', () => ({ supabase: null }));
jest.mock('../lib/adminCalendar', () => ({ ...jest.requireActual('../lib/adminCalendar'), requestCalendar: jest.fn(), notifyCalendarChanged: jest.fn() }));

function openEditor() { return render(<MemoryRouter initialEntries={['/admin/calendar?date=2028-02-29']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><AdminCalendar secret="test-secret" onBusy={jest.fn()} /></MemoryRouter>); }
beforeEach(() => { requestCalendar.mockReset(); notifyCalendarChanged.mockClear(); requestCalendar.mockResolvedValue({ events: [] }); });

test('creates and publishes an event through the admin service', async () => {
  openEditor();
  await screen.findByText('Your calendar starts with one event.');
  fireEvent.click(screen.getByRole('button', { name: 'Add event' }));
  expect(screen.getByLabelText('Starts')).toHaveValue('2028-02-29T09:00');
  expect(screen.getByLabelText('Publish in Calendar')).not.toBeChecked();
  fireEvent.change(screen.getByLabelText('Event title'), { target: { value: 'Leap day meetup' } });
  fireEvent.click(screen.getByLabelText('All-day event'));
  fireEvent.click(screen.getByLabelText('Publish in Calendar'));
  requestCalendar.mockImplementationOnce(async (secret, payload) => ({ event: { ...payload, id: 'saved-event' } }));
  fireEvent.click(screen.getByRole('button', { name: 'Save event' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Event saved and published to Calendar.');
  expect(requestCalendar).toHaveBeenLastCalledWith('test-secret', expect.objectContaining({ action: 'save', all_day: true, start_date: '2028-02-29', end_date: '2028-02-29', is_published: true, start_at: null }));
  expect(notifyCalendarChanged).toHaveBeenCalledTimes(1);
});

test('preserves the draft and offers retry after a failed save', async () => {
  openEditor();
  await screen.findByText('Your calendar starts with one event.');
  fireEvent.click(screen.getByRole('button', { name: 'Add event' }));
  fireEvent.change(screen.getByLabelText('Event title'), { target: { value: 'Keep this draft' } });
  requestCalendar.mockRejectedValueOnce(new Error('Save failed'));
  fireEvent.click(screen.getByRole('button', { name: 'Save event' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Save failed');
  expect(screen.getByLabelText('Event title')).toHaveValue('Keep this draft');
  expect(screen.getByRole('button', { name: 'Save event' })).toBeEnabled();
  expect(notifyCalendarChanged).not.toHaveBeenCalled();
});

test('rejects reversed dates and converts timed events to timestamps', () => {
  const draft = { ...eventDraft(), title: 'Timed event', starts: '2028-02-29T09:00', ends: '2028-02-29T10:00' };
  expect(eventPayload(draft).start_at).toBe(new Date(draft.starts).toISOString());
  expect(() => eventPayload({ ...draft, ends: draft.starts })).toThrow('must end after');
  expect(() => eventPayload({ ...draft, all_day: true, starts: '2028-02-29', ends: '2028-02-28' })).toThrow('cannot be before');
});
