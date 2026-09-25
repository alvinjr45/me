import { act, renderHook, waitFor } from '@testing-library/react';
import useAdminProfile from './useAdminProfile';
import { supabase } from './supabaseClient';

jest.mock('./supabaseClient', () => ({ supabase: { from: jest.fn() } }));

function profileResponse(response) {
  const query = { select: jest.fn(() => query), eq: jest.fn(() => query), maybeSingle: jest.fn(() => response) };
  supabase.from.mockReturnValue(query);
  return query;
}

test('loads the saved profile on a fresh session', async () => {
  const query = profileResponse(Promise.resolve({ data: { image_url: 'https://example.test/profile.jpg' } }));
  const { result } = renderHook(() => useAdminProfile());
  await waitFor(() => expect(result.current.imageUrl).toBe('https://example.test/profile.jpg'));
  expect(supabase.from).toHaveBeenCalledWith('ajt3_admin_profile');
  expect(query.eq).toHaveBeenCalledWith('id', 'admin');
});

test('a delayed load cannot overwrite a newly saved photo', async () => {
  let finish;
  profileResponse(new Promise((resolve) => { finish = resolve; }));
  const { result } = renderHook(() => useAdminProfile());
  act(() => result.current.updateImage('https://example.test/new.jpg'));
  await act(async () => finish({ data: { image_url: 'https://example.test/old.jpg' } }));
  expect(result.current.imageUrl).toBe('https://example.test/new.jpg');
});

test('keeps initials available when the profile cannot be loaded', async () => {
  let finish;
  profileResponse(new Promise((resolve) => { finish = resolve; }));
  const { result } = renderHook(() => useAdminProfile());
  await act(async () => finish({ error: { message: 'Unavailable' } }));
  expect(result.current.imageUrl).toBe('');
});
