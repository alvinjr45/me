import { supabase } from './supabaseClient';
import { getConversations, getGuestbook } from './guestbook';

jest.mock('./supabaseClient', () => ({ supabase: { from: jest.fn() } }));
jest.mock('./adminPostEditor', () => ({ getSupabaseFunctionHeaders: jest.fn(), readResponsePayload: jest.fn() }));

const id = '00000000-0000-4000-8000-000000000001';
let messages;
let metadata;
let result;

beforeEach(() => {
  result = { data: [{ id: 'message', conversation_id: id }], error: null };
  messages = {};
  const query = messages;
  for (const method of ['select', 'eq', 'order', 'ilike', 'range', 'or', 'limit']) messages[method] = jest.fn(() => query);
  messages.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  metadata = { select: jest.fn(() => metadata), eq: jest.fn(() => metadata), maybeSingle: jest.fn(async () => ({ data: { id, title: 'The Guestbook' } })) };
  supabase.from.mockImplementation((table) => table === 'ajt3_guestbook_conversations' ? metadata : messages);
});

test('scopes every message read to one visible conversation and returns its title', async () => {
  const data = await getGuestbook(id);
  expect(messages.eq).toHaveBeenCalledWith('conversation_id', id);
  expect(messages.eq).toHaveBeenCalledWith('is_hidden', false);
  expect(messages.limit).toHaveBeenCalledWith(50);
  expect(metadata.eq).toHaveBeenCalledWith('id', id);
  expect(data.conversation.title).toBe('The Guestbook');
  expect(data.entries).toEqual(result.data);
});

test('hidden or removed conversation metadata clears messages even during a read race', async () => {
  metadata.maybeSingle.mockResolvedValue({ data: null });
  expect(await getGuestbook(id)).toEqual({ entries: [], conversation: null });
});

test('older messages use a timestamp and ID cursor without offset pagination', async () => {
  const before = { id, created_at: '2026-09-24T12:00:00+00:00' };
  await getGuestbook(id, before);
  expect(messages.or).toHaveBeenCalledWith(`created_at.lt.${before.created_at},and(created_at.eq.${before.created_at},id.lt.${id})`);
  expect(messages.range).not.toHaveBeenCalled();
  await expect(getGuestbook(id, { ...before, id: 'bad),filter' })).rejects.toThrow('Invalid message cursor');
});

test('conversation search escapes wildcard characters and reads the RLS-respecting preview view', async () => {
  await getConversations(50, '100%_done');
  expect(supabase.from).toHaveBeenCalledWith('ajt3_guestbook_conversation_list');
  expect(messages.ilike).toHaveBeenCalledWith('title', '%100\\%\\_done%');
  expect(messages.range).toHaveBeenCalledWith(50, 99);
});

test('read failures stay errors and cannot masquerade as an empty board', async () => {
  result = { data: null, error: { message: 'Database unavailable' } };
  await expect(getGuestbook(id)).rejects.toThrow('Unable to load');
  await expect(getConversations()).rejects.toThrow('Unable to load');
});
