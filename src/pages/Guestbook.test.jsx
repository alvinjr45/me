import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Guestbook from './Guestbook';
import AdminGuestbook from './AdminGuestbook';
import { getConversations, getGuestbook, guestbookRequest, verifyGuestbook } from '../lib/guestbook';
import { guestbookTerms } from '../data/guestbookTerms';

jest.mock('../data/guestbookTerms', () => ({ guestbookTerms: { version: 'test-v1', content: 'Test-only terms fixture.' } }));

jest.mock('../lib/guestbook', () => ({
  getConversations: jest.fn(), getGuestbook: jest.fn(), guestbookRequest: jest.fn(), verifyGuestbook: jest.fn(),
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
const conversation = { id: '00000000-0000-4000-8000-000000000001', title: 'The Guestbook', created_at: '2026-09-24T12:00:00Z', last_message_at: '2026-09-24T12:00:00Z', last_message: 'Hello!', last_author: 'Visitor' };
const secondConversation = { ...conversation, id: '00000000-0000-4000-8000-000000000002', title: 'Weekend plans' };
const entry = { id: 'one', conversation_id: conversation.id, display_name: 'Visitor', message: 'Hello!', created_at: '2026-09-24T12:00:00Z', is_hidden: false };

beforeEach(() => {
  jest.clearAllMocks();
  guestbookTerms.version = 'test-v1';
  guestbookTerms.content = 'Test-only terms fixture.';
  process.env.REACT_APP_TURNSTILE_SITE_KEY = 'test-sitekey';
  process.env.REACT_APP_SUPABASE_URL = 'https://example.test';
  process.env.REACT_APP_SUPABASE_ANON_KEY = 'test-public-key';
  getConversations.mockResolvedValue([conversation]);
  getGuestbook.mockResolvedValue({ entries: [entry], conversation });
  guestbookRequest.mockResolvedValue({ entry, scrubbed: false });
  verifyGuestbook.mockImplementation(async () => ({ session: 'verified-session', expiresAt: Date.now() + 3600000 }));
  window.confirm = jest.fn(() => true);
});
afterEach(() => {
  for (const [key, value] of Object.entries({ REACT_APP_TURNSTILE_SITE_KEY: savedKey, REACT_APP_SUPABASE_URL: savedUrl, REACT_APP_SUPABASE_ANON_KEY: savedAnonKey })) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  window.confirm = savedConfirm;
});

function renderGuestbook(join = true) {
  const view = render(<Guestbook />);
  if (join) joinGuestbook();
  return view;
}

function joinGuestbook() {
  const join = screen.queryByRole('button', { name: 'Join conversation' });
  if (join) fireEvent.click(join);
  if (!screen.queryByRole('button', { name: 'Continue to messages' })) return;
  fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'A guest' } });
  for (const checkbox of screen.getAllByRole('checkbox')) if (!checkbox.checked) fireEvent.click(checkbox);
  const challenge = screen.queryByRole('button', { name: 'Complete bot check' });
  if (challenge) fireEvent.click(challenge);
  fireEvent.click(screen.getByRole('button', { name: 'Continue to messages' }));
}

function fillMessage() {
  joinGuestbook();
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Hello there!' } });
  const challenge = screen.queryByRole('button', { name: 'Complete bot check' });
  if (challenge) fireEvent.click(challenge);
}

test('published policies unlock participation and remain accessible before joining', async () => {
  Object.assign(guestbookTerms, jest.requireActual('../data/guestbookTerms').guestbookTerms);
  renderGuestbook(false);
  expect(screen.queryByRole('navigation', { name: 'Conversations' })).not.toBeInTheDocument();
  expect(getConversations).not.toHaveBeenCalled();
  expect(screen.getByText('Read the Privacy Policy')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continue to messages' })).toBeDisabled();
  expect(screen.getByText('Read the Terms and Conditions')).toBeInTheDocument();
  joinGuestbook();
  await screen.findByText('Hello!');
  fillMessage();
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  await waitFor(() => expect(guestbookRequest).toHaveBeenCalledWith(expect.objectContaining({
    termsVersion: '2026-09-25', termsAccepted: true, ageConfirmed: true
  }), null, expect.any(AbortSignal)));
});

test('verifies once on entry and reuses the session across messages', async () => {
  guestbookRequest.mockResolvedValue({ entry, scrubbed: true });
  renderGuestbook();
  await screen.findByText('Hello!');
  joinGuestbook();
  expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled();
  expect(screen.queryByRole('button', { name: 'Complete bot check' })).not.toBeInTheDocument();
  fillMessage();
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  expect(await screen.findByText('Sent. Filtered words were replaced with ***.')).toBeInTheDocument();
  expect(guestbookRequest).toHaveBeenCalledWith(expect.objectContaining({ action: 'submit', conversationId: conversation.id, name: 'A guest', ageConfirmed: true, termsAccepted: true, termsVersion: 'test-v1', message: 'Hello there!', session: 'verified-session' }), null, expect.any(AbortSignal));
  expect(screen.getByText('A guest')).toBeInTheDocument();
  expect(screen.getByLabelText('Message')).toHaveValue('');
  fillMessage();
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  await waitFor(() => expect(guestbookRequest).toHaveBeenCalledTimes(2));
  expect(verifyGuestbook).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('button', { name: 'Complete bot check' })).not.toBeInTheDocument();
});

test('keeps text and verification on posting failure and never claims publication', async () => {
  guestbookRequest.mockRejectedValue(new Error('Posting limit reached.'));
  renderGuestbook();
  await screen.findByText('Hello!');
  fillMessage();
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Posting limit reached.');
  expect(screen.getByText('A guest')).toBeInTheDocument();
  expect(screen.getByLabelText('Message')).toHaveValue('Hello there!');
  expect(screen.queryByText(/Sent to the conversation/)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled();
  expect(screen.queryByRole('button', { name: 'Complete bot check' })).not.toBeInTheDocument();
});

test('missing configuration prevents joining', () => {
  delete process.env.REACT_APP_TURNSTILE_SITE_KEY;
  guestbookRequest.mockClear();
  renderGuestbook(false);
  expect(screen.getByText('Joining is unavailable until spam protection is configured.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continue to messages' })).toBeDisabled();
  expect(screen.queryByLabelText('Message')).not.toBeInTheDocument();
  expect(guestbookRequest).not.toHaveBeenCalled();
});

test('failed server verification keeps entry closed and requires a fresh bot token', async () => {
  verifyGuestbook.mockRejectedValueOnce(new Error('Bot verification expired or failed. Please try again.'));
  renderGuestbook();
  expect(await screen.findByRole('alert')).toHaveTextContent('Bot verification expired');
  expect(getConversations).not.toHaveBeenCalled();
  expect(screen.queryByLabelText('Message')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continue to messages' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Complete bot check' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue to messages' }));
  await screen.findByText('Hello!');
  expect(verifyGuestbook).toHaveBeenCalledTimes(2);
});

test('a server-rejected session offers entry verification without losing the message', async () => {
  guestbookRequest.mockRejectedValueOnce(Object.assign(new Error('Your verification expired.'), { code: 'verification_required' }));
  renderGuestbook();
  await screen.findByText('Hello!');
  fillMessage();
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Verify to continue' }));
  joinGuestbook();
  expect(await screen.findByLabelText('Message')).toHaveValue('Hello there!');
  expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled();
});

test('renders visitor content as text, not markup or links, and refresh removes hidden posts', async () => {
  getGuestbook.mockResolvedValueOnce({ conversation, entries: [{ ...entry, display_name: '<b>Admin</b>', message: '<img src=x onerror=alert(1)>' }] });
  renderGuestbook();
  await screen.findByText('<img src=x onerror=alert(1)>');
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getByText('<b>Admin</b>')).toContainHTML('&lt;b&gt;Admin&lt;/b&gt;');
  getGuestbook.mockResolvedValue({ conversation, entries: [] });
  fireEvent(window, new Event('ajt3-guestbook-updated'));
  await screen.findByText('Be the first to join the conversation.');
  expect(screen.queryByText('<img src=x onerror=alert(1)>')).not.toBeInTheDocument();
});

test('load failures offer retry and do not look like an empty board', async () => {
  getGuestbook.mockRejectedValueOnce(new Error('Unable to load.'));
  renderGuestbook();
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load.');
  expect(screen.queryByText('Be the first to join the conversation.')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry messages' }));
  await screen.findByText('Hello!');
});

test('switches boards without mixing replies and retains a separate draft per conversation', async () => {
  getConversations.mockResolvedValue([conversation, secondConversation]);
  getGuestbook.mockImplementation(async (id) => id === conversation.id ? { conversation, entries: [entry] } : { conversation: secondConversation, entries: [{ ...entry, id: 'two', conversation_id: id, message: 'Going hiking' }] });
  renderGuestbook();
  await screen.findByText('Hello!');
  joinGuestbook();
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'First draft' } });
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Conversations' })).getByRole('button', { name: /Weekend plans/ }));
  await screen.findByText('Going hiking');
  expect(screen.queryByText('Hello!')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Message')).toHaveValue('');
  fillMessage();
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  await screen.findByText('Sent to the conversation.');
  expect(guestbookRequest).toHaveBeenCalledWith(expect.objectContaining({ conversationId: secondConversation.id }), null, expect.any(AbortSignal));
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Conversations' })).getByRole('button', { name: /The Guestbook/ }));
  await screen.findByText('Hello!');
  expect(screen.getByLabelText('Message')).toHaveValue('First draft');
});

test('creates a named conversation and opens its first message', async () => {
  const created = { ...entry, id: 'created-message', conversation_id: secondConversation.id, message: 'Hello there!' };
  guestbookRequest.mockResolvedValue({ entry: created, scrubbed: false });
  renderGuestbook();
  await screen.findByText('Hello!');
  fireEvent.click(screen.getByRole('button', { name: 'New conversation' }));
  joinGuestbook();
  fireEvent.change(screen.getByLabelText('Conversation title'), { target: { value: 'Weekend plans' } });
  fillMessage();
  getGuestbook.mockResolvedValue({ conversation: secondConversation, entries: [created] });
  fireEvent.click(screen.getByRole('button', { name: 'Create conversation' }));
  expect(await screen.findByRole('heading', { name: 'Weekend plans' })).toBeInTheDocument();
  expect(screen.getByRole('article', { name: 'You: Hello there!' })).toHaveClass('guestbook-messages__message--own');
  const payload = guestbookRequest.mock.calls[0][0];
  expect(payload.title).toBe('Weekend plans');
  expect(payload.conversationId).toBeUndefined();
});

test('an unavailable conversation clears its feed and disables replies', async () => {
  renderGuestbook();
  await screen.findByText('Hello!');
  joinGuestbook();
  getGuestbook.mockResolvedValue({ entries: [], conversation: null });
  fireEvent(window, new Event('ajt3-guestbook-updated'));
  await screen.findByText('This conversation is no longer available.');
  expect(screen.queryByText('Hello!')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
});

test('requires a nonblank name and both unchecked confirmations before showing a composer', async () => {
  renderGuestbook(false);
  expect(within(screen.getByRole('group', { name: 'Requirements to join' })).getAllByRole('checkbox')).toHaveLength(2);
  expect(screen.queryByRole('button', { name: /without joining/ })).not.toBeInTheDocument();
  expect(getConversations).not.toHaveBeenCalled();
  expect(screen.queryByLabelText('Message')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Complete bot check' })).toBeInTheDocument();
  const age = screen.getByRole('checkbox', { name: /at least 18/ });
  const terms = screen.getByRole('checkbox', { name: /have read and agree/ });
  expect(age).not.toBeChecked(); expect(terms).not.toBeChecked();
  fireEvent.change(screen.getByLabelText('Display name'), { target: { value: '   ' } });
  fireEvent.click(age); fireEvent.click(terms);
  expect(screen.getByRole('button', { name: 'Continue to messages' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'Visitor' } });
  fireEvent.click(terms);
  expect(screen.getByRole('button', { name: 'Continue to messages' })).toBeDisabled();
  fireEvent.click(terms);
  fireEvent.click(age);
  expect(screen.getByRole('button', { name: 'Continue to messages' })).toBeDisabled();
  fireEvent.click(age);
  fireEvent.click(screen.getByText('Read the Terms and Conditions'));
  expect(screen.getByText('Test-only terms fixture.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Continue to messages' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Complete bot check' }));
  expect(screen.getByRole('button', { name: 'Continue to messages' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Expire bot check' }));
  expect(screen.getByRole('button', { name: 'Continue to messages' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Complete bot check' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue to messages' }));
  expect(await screen.findByLabelText('Message')).toBeInTheDocument();
  expect(guestbookRequest).not.toHaveBeenCalled();
});

test('unpublished terms prevent entering conversations', () => {
  guestbookTerms.version = null; guestbookTerms.content = '';
  renderGuestbook(false);
  expect(screen.getByText(/Terms and Conditions are being prepared/)).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: /have read and agree/ })).toBeDisabled();
  expect(screen.queryByLabelText('Message')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /without joining/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Conversations' })).not.toBeInTheDocument();
  expect(getConversations).not.toHaveBeenCalled();
  expect(screen.queryByLabelText('Conversation title')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Message')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continue to messages' })).toBeDisabled();
});

test('changing participation details relocks the composer and preserves the unsent draft', async () => {
  renderGuestbook();
  await screen.findByText('Hello!');
  fillMessage();
  fireEvent.click(screen.getByRole('button', { name: 'Change details' }));
  expect(screen.getByLabelText('Display name')).toHaveValue('A guest');
  expect(screen.getByRole('checkbox', { name: /at least 18/ })).not.toBeChecked();
  expect(screen.getByRole('checkbox', { name: /have read and agree/ })).not.toBeChecked();
  expect(screen.queryByLabelText('Message')).not.toBeInTheDocument();
  joinGuestbook();
  expect(await screen.findByLabelText('Message')).toHaveValue('Hello there!');
  expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled();
});

test('session expiry returns verification to the entry screen and preserves the draft', async () => {
  jest.useFakeTimers();
  let view;
  try {
    view = renderGuestbook();
    await act(async () => { jest.advanceTimersByTime(0); });
    await act(async () => { jest.advanceTimersByTime(1); });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Still writing' } });
    expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled();
    await act(async () => { jest.advanceTimersByTime(3600000); });
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
    expect(screen.getByLabelText('Message')).toHaveValue('Still writing');
    expect(screen.queryByRole('button', { name: 'Complete bot check' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Verify to continue' }));
    joinGuestbook();
    await act(async () => { jest.advanceTimersByTime(0); });
    expect(screen.getByLabelText('Message')).toHaveValue('Still writing');
    expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled();
    expect(guestbookRequest).not.toHaveBeenCalled();
  } finally { view?.unmount(); jest.useRealTimers(); }
});

test('server-side terms changes relock composition and require a reload', async () => {
  guestbookRequest.mockRejectedValue(Object.assign(new Error('Reload the site to read the current terms.'), { code: 'terms_changed' }));
  renderGuestbook();
  await screen.findByText('Hello!');
  fillMessage();
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Reload the site');
  expect(screen.queryByLabelText('Message')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continue to messages' })).toBeDisabled();
});

test('ignores late responses from a previously selected board', async () => {
  let resolveFirst;
  getConversations.mockResolvedValue([conversation, secondConversation]);
  getGuestbook.mockImplementation((id) => id === conversation.id ? new Promise((resolve) => { resolveFirst = resolve; }) : Promise.resolve({ conversation: secondConversation, entries: [{ ...entry, id: 'two', message: 'Second board' }] }));
  renderGuestbook();
  await screen.findByRole('heading', { name: 'The Guestbook' });
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Conversations' })).getByRole('button', { name: /Weekend plans/ }));
  await screen.findByText('Second board');
  await act(async () => resolveFirst({ conversation, entries: [entry] }));
  expect(screen.getByText('Second board')).toBeInTheDocument();
  expect(screen.queryByText('Hello!')).not.toBeInTheDocument();
});

test('admin can hide an entire conversation', async () => {
  guestbookRequest.mockImplementation(async (body) => body.action === 'list_conversations' ? { entries: [{ ...conversation, is_hidden: false }], submissionsOpen: true } : body.action === 'list' ? { entries: [], submissionsOpen: true } : { ok: true });
  render(<AdminGuestbook secret="test-admin" onBusy={() => {}} />);
  await screen.findByText('No messages on this page.');
  fireEvent.click(screen.getByRole('button', { name: 'Conversations' }));
  await screen.findByText('The Guestbook');
  fireEvent.click(screen.getByRole('button', { name: 'Hide conversation' }));
  await screen.findByRole('button', { name: 'Show conversation' });
  expect(guestbookRequest).toHaveBeenCalledWith({ action: 'conversation_visibility', id: conversation.id, hidden: true }, 'test-admin', expect.any(AbortSignal));
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
