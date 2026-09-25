import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Guestbook from './Guestbook';
import AdminGuestbook from './AdminGuestbook';
import { getGuestbook, guestbookRequest } from '../lib/guestbook';

jest.mock('../lib/guestbook', () => ({
  getGuestbook: jest.fn(), guestbookRequest: jest.fn(),
  notifyGuestbookChanged: () => global.window.dispatchEvent(new Event('ajt3-guestbook-updated'))
}));
jest.mock('../components/GuestbookChallenge', () => function Challenge({ onToken, resetKey }) {
  const { useEffect } = require('react');
  useEffect(() => { onToken(''); }, [onToken, resetKey]);
  return <><button type="button" onClick={() => onToken('verified-token')}>Complete bot check</button><button type="button" onClick={() => onToken('')}>Expire bot check</button></>;
});

const savedKey = process.env.REACT_APP_TURNSTILE_SITE_KEY;
const savedUrl = process.env.REACT_APP_SUPABASE_URL;
const savedAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const savedConfirm = window.confirm;
const entry = { id: 'one', display_name: 'Visitor', message: 'Hello!', created_at: '2026-09-24T12:00:00Z', is_hidden: false };

beforeEach(() => {
  jest.clearAllMocks();
  process.env.REACT_APP_TURNSTILE_SITE_KEY = 'test-sitekey';
  process.env.REACT_APP_SUPABASE_URL = 'https://example.test';
  process.env.REACT_APP_SUPABASE_ANON_KEY = 'test-public-key';
  getGuestbook.mockResolvedValue([entry]);
  guestbookRequest.mockResolvedValue({ entry, scrubbed: false });
  window.confirm = jest.fn(() => true);
});
afterEach(() => {
  for (const [key, value] of Object.entries({ REACT_APP_TURNSTILE_SITE_KEY: savedKey, REACT_APP_SUPABASE_URL: savedUrl, REACT_APP_SUPABASE_ANON_KEY: savedAnonKey })) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  window.confirm = savedConfirm;
});

function fillMessage() {
  fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'A guest' } });
  fireEvent.change(screen.getByLabelText(/Message \d/), { target: { value: 'Hello there!' } });
  fireEvent.click(screen.getByRole('button', { name: 'Complete bot check' }));
}

test('requires a bot token, publishes without approval, and resets the token after submission', async () => {
  guestbookRequest.mockResolvedValue({ entry, scrubbed: true });
  render(<Guestbook />);
  await screen.findByText('Hello!');
  expect(screen.getByRole('button', { name: 'Post message' })).toBeDisabled();
  fillMessage();
  fireEvent.click(screen.getByRole('button', { name: 'Post message' }));
  expect(await screen.findByText('Posted! Filtered words were replaced with ***.')).toBeInTheDocument();
  expect(guestbookRequest).toHaveBeenCalledWith(expect.objectContaining({ action: 'submit', name: 'A guest', message: 'Hello there!', token: 'verified-token' }), null, expect.any(AbortSignal));
  expect(screen.getByLabelText('Display name')).toHaveValue('');
  expect(screen.getByRole('button', { name: 'Post message' })).toBeDisabled();
});

test('keeps text on failure, requests a fresh challenge, and never claims publication', async () => {
  guestbookRequest.mockRejectedValue(new Error('Posting limit reached.'));
  render(<Guestbook />);
  await screen.findByText('Hello!');
  fillMessage();
  fireEvent.click(screen.getByRole('button', { name: 'Post message' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Posting limit reached.');
  expect(screen.getByLabelText('Display name')).toHaveValue('A guest');
  expect(screen.getByLabelText(/Message \d/)).toHaveValue('Hello there!');
  expect(screen.queryByText(/Posted!/)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Post message' })).toBeDisabled();
});

test('expired challenges and missing configuration cannot submit', async () => {
  const { unmount } = render(<Guestbook />);
  await screen.findByText('Hello!');
  fillMessage();
  fireEvent.click(screen.getByRole('button', { name: 'Expire bot check' }));
  expect(screen.getByRole('button', { name: 'Post message' })).toBeDisabled();
  unmount();
  delete process.env.REACT_APP_TURNSTILE_SITE_KEY;
  render(<Guestbook />);
  await screen.findByText('Hello!');
  expect(screen.getByText('Posting is not available until spam protection is configured.')).toBeInTheDocument();
  expect(screen.getByLabelText('Display name')).toBeDisabled();
  expect(guestbookRequest).not.toHaveBeenCalled();
});

test('renders visitor content as text, not markup or links, and refresh removes hidden posts', async () => {
  getGuestbook.mockResolvedValueOnce([{ ...entry, display_name: '<b>Admin</b>', message: '<img src=x onerror=alert(1)>' }]);
  render(<Guestbook />);
  await screen.findByText('<img src=x onerror=alert(1)>');
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getByText('<b>Admin</b>')).toContainHTML('&lt;b&gt;Admin&lt;/b&gt;');
  getGuestbook.mockResolvedValue([]);
  fireEvent(window, new Event('ajt3-guestbook-updated'));
  await screen.findByText('No notes yet. Be the first to say hello.');
  expect(screen.queryByText('<img src=x onerror=alert(1)>')).not.toBeInTheDocument();
});

test('load failures offer retry and do not look like an empty board', async () => {
  getGuestbook.mockRejectedValueOnce(new Error('Unable to load.'));
  render(<Guestbook />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load.');
  expect(screen.queryByText(/No notes yet/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry messages' }));
  await screen.findByText('Hello!');
});

test('admin can hide, restore, pause, and delete without an approval queue', async () => {
  guestbookRequest.mockImplementation(async (body) => {
    if (body.action === 'list') return { entries: [entry], submissionsOpen: true };
    if (body.action === 'pause') return { submissionsOpen: body.open };
    return { ok: true };
  });
  const onBusy = jest.fn();
  render(<AdminGuestbook secret="test-admin" onBusy={onBusy} />);
  await screen.findByText('Hello!');
  fireEvent.click(screen.getByRole('button', { name: 'Hide message' }));
  await screen.findByRole('button', { name: 'Show message' });
  expect(guestbookRequest).toHaveBeenCalledWith({ action: 'visibility', id: 'one', hidden: true }, 'test-admin', expect.any(AbortSignal));
  fireEvent.click(screen.getByRole('button', { name: 'Show message' }));
  await screen.findByRole('button', { name: 'Hide message' });
  fireEvent.click(screen.getByRole('button', { name: 'Pause submissions' }));
  await screen.findByRole('button', { name: 'Resume submissions' });
  fireEvent.click(screen.getByRole('button', { name: 'Delete message' }));
  await waitFor(() => expect(screen.queryByText('Hello!')).not.toBeInTheDocument());
  expect(window.confirm).toHaveBeenCalled();
  expect(onBusy).toHaveBeenLastCalledWith(false);
});

test('admin failed writes preserve messages and canceled deletion makes no request', async () => {
  guestbookRequest.mockResolvedValueOnce({ entries: [entry], submissionsOpen: true }).mockRejectedValue(new Error('Save failed.'));
  render(<AdminGuestbook secret="test-admin" onBusy={() => {}} />);
  await screen.findByText('Hello!');
  window.confirm.mockReturnValue(false);
  fireEvent.click(screen.getByRole('button', { name: 'Delete message' }));
  expect(guestbookRequest).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Hide message' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Save failed.');
  expect(screen.getByRole('button', { name: 'Hide message' })).toBeEnabled();
  expect(screen.getByText('Hello!')).toBeInTheDocument();
});
