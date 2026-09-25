import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import MissionControl from './MissionControl';
import { DeviceSettingsContext } from '../components/deviceSettings';
import AdminLogin from '../components/AdminLogin';
import useAdminAccess from '../lib/useAdminAccess';

jest.mock('heic2any', () => jest.fn());

const savedFetch = global.fetch;
const savedUrl = process.env.REACT_APP_SUPABASE_URL;
const savedCreateObjectURL = URL.createObjectURL;
const savedRevokeObjectURL = URL.revokeObjectURL;
const post = { slug: 'first-post', title: 'First post', is_published: true, sections: [], media: [] };
const photo = { id: 'drake', title: 'Drake', image_url: '/images/dogs/drake.jpg', album_id: 'dogs', alt_text: 'Portrait of Drake', caption: '', sort_order: 0, width: 3024, height: 4032, is_published: true };
const album = { id: 'dogs', title: 'Drake & Josh', description: '', sort_order: 0 };
const response = (status, data) => ({ status, ok: status >= 200 && status < 300, text: async () => JSON.stringify(data) });

function TestDesktop() {
  const navigate = useNavigate();
  const access = useAdminAccess();
  return <DeviceSettingsContext.Provider value={{ adminAccess: access }}><button onClick={() => navigate('/music')}>Switch to Music</button><button onClick={() => navigate('/admin/new?slug=first-post')}>Return to editor</button><button onClick={access.logout}>Log out of desktop</button>{access.session ? <MissionControl /> : <AdminLogin access={access} />}</DeviceSettingsContext.Provider>;
}

function openApp(route = '/admin') {
  return render(<MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><TestDesktop /></MemoryRouter>);
}

async function signIn(password = 'test-password') {
  fireEvent.change(screen.getByLabelText('Admin password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
}

beforeEach(() => {
  window.sessionStorage.clear();
  process.env.REACT_APP_SUPABASE_URL = 'https://example.test';
  URL.createObjectURL = jest.fn(() => 'blob:test-photo');
  URL.revokeObjectURL = jest.fn();
  let photoRows = [{ ...photo }];
  let albumRows = [{ ...album }];
  global.fetch = jest.fn(async (url, options) => {
    if (url.endsWith('admin-dog-incident')) return response(200, { incident: null });
    if (url.endsWith('admin-photo-library')) {
      const body = options.body instanceof FormData ? Object.fromEntries(options.body.entries()) : JSON.parse(options.body);
      if (body.action === 'remove_from_album') {
        const saved = { ...photoRows.find((item) => item.id === body.id), album_id: null };
        photoRows = photoRows.map((item) => item.id === saved.id ? saved : item);
        return response(200, { photo: saved });
      }
      if (body.action === 'save_photo') {
        const saved = { ...body, id: body.id || 'new-photo', is_published: body.is_published === 'true', sort_order: Number(body.sort_order), image_url: body.file ? 'https://example.test/upload.jpg' : body.image_url };
        photoRows = [...photoRows.filter((item) => item.id !== saved.id), saved];
        return response(200, { photo: saved });
      }
      if (body.action === 'save_album') {
        const saved = { ...body, id: body.id || 'new-album', sort_order: Number(body.sort_order) };
        albumRows = [...albumRows.filter((item) => item.id !== saved.id), saved];
        return response(200, { album: saved });
      }
      return response(200, { photos: photoRows, albums: albumRows });
    }
    const body = JSON.parse(options.body);
    return body.adminSecret === 'test-password'
      ? response(200, { posts: [post] })
      : response(401, { error: 'Unauthorized' });
  });
});

afterEach(() => {
  global.fetch = savedFetch;
  URL.createObjectURL = savedCreateObjectURL;
  URL.revokeObjectURL = savedRevokeObjectURL;
  if (savedUrl === undefined) delete process.env.REACT_APP_SUPABASE_URL;
  else process.env.REACT_APP_SUPABASE_URL = savedUrl;
  window.sessionStorage.clear();
});

test('keeps the dashboard locked until the server accepts the password, and signs out', async () => {
  openApp();
  expect(global.fetch).not.toHaveBeenCalled();
  expect(screen.queryByRole('heading', { name: 'Posts' })).not.toBeInTheDocument();
  await signIn('wrong-password');
  expect(await screen.findByRole('alert')).toHaveTextContent('That password was not accepted');
  expect(screen.queryByRole('heading', { name: 'Posts' })).not.toBeInTheDocument();
  expect(window.sessionStorage.getItem('ajt3_admin_secret')).toBeNull();
  expect(global.fetch).toHaveBeenCalledTimes(1);

  await signIn();
  await screen.findByRole('heading', { name: 'Recent posts' });
  fireEvent.click(screen.getByRole('button', { name: '02 Blog posts' }));
  expect(await screen.findByRole('heading', { name: 'Posts' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'First post Published' })).toBeInTheDocument();
  expect(window.sessionStorage.getItem('ajt3_admin_secret')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Log out of desktop' }));
  expect(screen.getByLabelText('Admin password')).toHaveValue('');
  expect(screen.queryByRole('heading', { name: 'Posts' })).not.toBeInTheDocument();
  expect(window.sessionStorage.getItem('ajt3_admin_secret')).toBeNull();
});

test('rejects an invalid stored password on a direct editor link', async () => {
  window.sessionStorage.setItem('ajt3_admin_secret', 'unverified-value');
  openApp('/admin/new');
  expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
  await signIn('unverified-value');
  expect(await screen.findByRole('alert')).toHaveTextContent('That password was not accepted');
  expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  expect(window.sessionStorage.getItem('ajt3_admin_secret')).toBeNull();
});

test('verifies a direct new-post login even without an existing post slug', async () => {
  openApp('/admin/new');
  await signIn('wrong-password');
  await screen.findByRole('alert');
  expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  await signIn();
  expect(await screen.findByLabelText('Title')).toHaveValue('');
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));
});

test('preserves the verified editor session and a draft while switching apps', async () => {
  openApp('/admin/new?slug=first-post');
  await signIn();
  const title = await screen.findByLabelText('Title');
  await waitFor(() => expect(title).toHaveValue('First post'));
  fireEvent.change(title, { target: { value: 'Unsaved changes' } });
  fireEvent.click(screen.getByRole('button', { name: 'Switch to Music' }));
  expect(screen.getByLabelText('Title')).toHaveValue('Unsaved changes');
  fireEvent.click(screen.getByRole('button', { name: 'Return to editor' }));
  expect(screen.getByLabelText('Title')).toHaveValue('Unsaved changes');
  expect(global.fetch).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole('button', { name: 'Back to dashboard' }));
  expect(await screen.findByRole('heading', { name: 'Posts' })).toBeInTheDocument();
});

test('keeps access locked on network errors and malformed successful responses', async () => {
  global.fetch.mockRejectedValueOnce(new Error('Connection failed'));
  openApp();
  await signIn();
  expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the sign-in service');
  global.fetch.mockResolvedValueOnce(response(200, { unexpected: true }));
  await signIn();
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to verify your login');
  expect(screen.queryByRole('heading', { name: 'Posts' })).not.toBeInTheDocument();
});

test('does not send requests when the backend is not configured', () => {
  delete process.env.REACT_APP_SUPABASE_URL;
  openApp();
  expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
  expect(screen.getByRole('status')).toHaveTextContent('Sign-in is unavailable');
  expect(global.fetch).not.toHaveBeenCalled();
});

test.each([
  [404, 'The sign-in service was not found'],
  [503, 'The sign-in service is unavailable']
])('explains backend status %s without unlocking access', async (status, message) => {
  global.fetch.mockResolvedValueOnce(response(status, { error: 'Unavailable' }));
  openApp();
  await signIn();
  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(screen.queryByRole('heading', { name: 'Recent posts' })).not.toBeInTheDocument();
});

test('aborts an unfinished sign-in when its window is closed', async () => {
  global.fetch.mockImplementationOnce(() => new Promise(() => {}));
  const { unmount } = openApp();
  await signIn();
  const signal = global.fetch.mock.calls[0][1].signal;
  unmount();
  expect(signal.aborted).toBe(true);
  expect(window.sessionStorage.getItem('ajt3_admin_secret')).toBeNull();
});

test('edits photo metadata and hides a photo without deleting it', async () => {
  openApp('/admin/photos');
  await signIn();
  fireEvent.click(await screen.findByRole('button', { name: 'Drake Published / Drake & Josh' }));
  fireEvent.change(screen.getByLabelText('Photo title'), { target: { value: 'Drake at home' } });
  fireEvent.change(screen.getByLabelText('Caption'), { target: { value: 'On patrol.' } });
  fireEvent.click(screen.getByLabelText('Publish in Photos'));
  fireEvent.click(screen.getByRole('button', { name: 'Save photo' }));
  await screen.findByText('Photo saved. It is hidden from the camera roll.');
  expect(screen.getByRole('button', { name: 'Drake at home Hidden / Drake & Josh' })).toBeInTheDocument();
  const [, request] = global.fetch.mock.calls.find(([, options]) => options.body instanceof FormData);
  expect(request.headers['x-admin-secret']).toBe('test-password');
  expect(request.body.get('id')).toBe('drake');
  expect(request.body.get('caption')).toBe('On patrol.');
  expect(request.body.get('is_published')).toBe('false');
});

test('creates an album and makes it available in the photo editor without another login', async () => {
  openApp('/admin/photos');
  await signIn();
  fireEvent.click(await screen.findByRole('button', { name: 'New album' }));
  fireEvent.change(screen.getByLabelText('Album title'), { target: { value: 'Weekends' } });
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Days outside.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save album' }));
  await screen.findByText('Album saved. Albums appear publicly when they contain published photos.');
  fireEvent.click(screen.getByRole('button', { name: 'Add photo' }));
  expect(screen.getByRole('option', { name: 'Weekends' })).toBeInTheDocument();
  expect(global.fetch.mock.calls.filter(([url]) => url.endsWith('admin-blog-post'))).toHaveLength(1);
});

test('removes album membership immediately while preserving library photos and unsaved drafts', async () => {
  openApp('/admin/photos');
  await signIn();
  fireEvent.click(await screen.findByRole('button', { name: 'Drake Published / Drake & Josh' }));
  fireEvent.change(screen.getByLabelText('Photo title'), { target: { value: 'Unsaved photo title' } });
  fireEvent.click(screen.getByRole('button', { name: 'Albums (1)' }));
  fireEvent.click(screen.getByRole('button', { name: 'Drake & Josh 1 photos' }));
  fireEvent.change(screen.getByLabelText('Album title'), { target: { value: 'Unsaved album title' } });
  fireEvent.click(screen.getByRole('button', { name: 'Remove Drake from album' }));
  await screen.findByText('Photo removed from this album. It is still in your photo library.');
  expect(screen.getByText('No photos in this album.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Drake & Josh 0 photos' })).toBeInTheDocument();
  expect(screen.getByLabelText('Album title')).toHaveValue('Unsaved album title');
  fireEvent.click(screen.getByRole('button', { name: 'Photos (1)' }));
  expect(screen.getByRole('button', { name: 'Drake Published / No album' })).toBeInTheDocument();
  expect(screen.getByLabelText('Photo title')).toHaveValue('Unsaved photo title');
  expect(screen.getByLabelText('Album')).toHaveValue('');
  fireEvent.click(screen.getByRole('button', { name: 'Save photo' }));
  await screen.findByText('Photo saved and published to your camera roll.');
  const [, request] = global.fetch.mock.calls.find(([, options]) => options.body instanceof FormData);
  expect(request.body.get('album_id')).toBe('');
});

test('retains photos in the album after a failed removal and allows retry', async () => {
  openApp('/admin/photos');
  await signIn();
  fireEvent.click(await screen.findByRole('button', { name: 'Albums (1)' }));
  fireEvent.click(screen.getByRole('button', { name: 'Drake & Josh 1 photos' }));
  global.fetch.mockResolvedValueOnce(response(500, { error: 'Unable to remove the photo.' }));
  fireEvent.click(screen.getByRole('button', { name: 'Remove Drake from album' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to remove the photo.');
  expect(screen.getByRole('button', { name: 'Drake & Josh 1 photos' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Remove Drake from album' }));
  await screen.findByText('No photos in this album.');
});

test('uploads a new image through the authenticated photo endpoint', async () => {
  openApp('/admin/photos');
  await signIn();
  fireEvent.click(await screen.findByRole('button', { name: 'Add photo' }));
  const file = new File(['image-bytes'], 'new-image.jpg', { type: 'image/jpeg' });
  fireEvent.change(screen.getByLabelText('Upload image'), { target: { files: [file] } });
  await screen.findByText('Image ready. Save the photo to upload it.');
  fireEvent.change(screen.getByLabelText('Photo title'), { target: { value: 'New memory' } });
  expect(screen.queryByLabelText(/Alt text/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Save photo' }));
  await screen.findByText('Photo saved and published to your camera roll.');
  const [, request] = global.fetch.mock.calls.find(([, options]) => options.body instanceof FormData);
  expect(request.body.get('file').name).toBe('new-image.jpg');
  expect(request.body.has('alt_text')).toBe(false);
  expect(request.headers['Content-Type']).toBeUndefined();
  expect(screen.getByRole('button', { name: 'New memory Published / Drake & Josh' })).toBeInTheDocument();
});

test('retains unsaved photo details after a failed save', async () => {
  openApp('/admin/photos');
  await signIn();
  fireEvent.click(await screen.findByRole('button', { name: 'Drake Published / Drake & Josh' }));
  fireEvent.change(screen.getByLabelText('Caption'), { target: { value: 'Keep this draft' } });
  global.fetch.mockResolvedValueOnce(response(500, { error: 'Save unavailable' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save photo' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Save unavailable');
  expect(screen.getByLabelText('Caption')).toHaveValue('Keep this draft');
  expect(screen.getByRole('button', { name: 'Drake Published / Drake & Josh' })).toBeInTheDocument();
});

test('uploads multiple photos and preserves an open photo draft', async () => {
  const originalCrypto = global.crypto;
  let sequence = 0;
  global.crypto = { randomUUID: () => `batch-photo-${++sequence}` };
  try {
    openApp('/admin/photos');
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: 'Drake Published / Drake & Josh' }));
    fireEvent.change(screen.getByLabelText('Caption'), { target: { value: 'Keep this draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Upload photos' }));
    const files = ['first.jpg', 'second.jpg'].map((name) => new File(['photo'], name, { type: 'image/jpeg' }));
    fireEvent.change(screen.getByLabelText('Choose photos'), { target: { files } });
    fireEvent.click(screen.getByRole('button', { name: 'Upload 2 photos' }));
    expect(screen.getByRole('button', { name: '02 Blog posts' })).toBeDisabled();
    await screen.findByText('2 photos uploaded. All selected photos are saved.');
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByRole('button', { name: 'first Published / Drake & Josh' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'second Published / Drake & Josh' })).toBeInTheDocument();
    expect(screen.getByLabelText('Caption')).toHaveValue('Keep this draft');
    expect(screen.getByRole('button', { name: '02 Blog posts' })).toBeEnabled();
    const uploads = global.fetch.mock.calls.filter(([, options]) => options.body instanceof FormData);
    expect(uploads).toHaveLength(2);
    for (const [, request] of uploads) expect(request.headers['x-admin-secret']).toBe('test-password');
  } finally {
    global.crypto = originalCrypto;
  }
});

test('keeps blog management usable when photo setup is unavailable', async () => {
  const implementation = global.fetch.getMockImplementation();
  global.fetch.mockImplementation((url, options) => url.endsWith('admin-photo-library') ? Promise.resolve(response(503, { error: 'Apply the photo-library migration.' })) : implementation(url, options));
  openApp('/admin/photos');
  await signIn();
  expect(await screen.findByRole('alert')).toHaveTextContent('Apply the photo-library migration.');
  fireEvent.click(screen.getByRole('button', { name: '02 Blog posts' }));
  expect(screen.getByRole('button', { name: 'First post Published' })).toBeInTheDocument();
});

test('creates calendar events and keeps unsaved details when switching sections', async () => {
  const implementation = global.fetch.getMockImplementation();
  global.fetch.mockImplementation((url, options) => {
    if (!url.endsWith('admin-calendar')) return implementation(url, options);
    const body = JSON.parse(options.body);
    return Promise.resolve(body.action === 'list' ? response(200, { events: [] }) : response(200, { event: { ...body, id: 'saved-calendar-event' } }));
  });
  openApp('/admin/calendar');
  expect(screen.queryByRole('heading', { name: 'Calendar events' })).not.toBeInTheDocument();
  await signIn();
  await screen.findByText('Your calendar starts with one event.');
  fireEvent.click(screen.getByRole('button', { name: 'Add event' }));
  fireEvent.change(screen.getByLabelText('Event title'), { target: { value: 'Studio session' } });
  fireEvent.click(screen.getByRole('button', { name: '02 Blog posts' }));
  fireEvent.click(screen.getByRole('button', { name: '06 Calendar' }));
  expect(screen.getByLabelText('Event title')).toHaveValue('Studio session');
  fireEvent.click(screen.getByLabelText('Publish in Calendar'));
  fireEvent.click(screen.getByRole('button', { name: 'Save event' }));
  await screen.findByText('Event saved and published to Calendar.');
  const [, request] = global.fetch.mock.calls.find(([url, options]) => url.endsWith('admin-calendar') && JSON.parse(options.body).action === 'save');
  expect(request.headers['x-admin-secret']).toBe('test-password');
  expect(JSON.parse(request.body)).toMatchObject({ title: 'Studio session', is_published: true });
  fireEvent.click(screen.getByRole('button', { name: 'Log out of desktop' }));
  expect(screen.queryByRole('heading', { name: 'Calendar events' })).not.toBeInTheDocument();
});
