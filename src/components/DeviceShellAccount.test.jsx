import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DeviceShell, { desktopApps } from './DeviceShell';
import Home from '../pages/Home';
import MissionControl from '../pages/MissionControl';
import Settings from '../pages/Settings';
import { supabase } from '../lib/supabaseClient';

jest.mock('heic2any', () => jest.fn());
jest.mock('../lib/supabaseClient', () => ({ supabase: { from: jest.fn() } }));
jest.mock('./SceneBackground', () => ({ __esModule: true, default: () => null, SceneWindow: () => null }));
jest.mock('../pages/Tech', () => () => null);
jest.mock('../pages/Music', () => () => null);
jest.mock('../pages/Dogs', () => () => null);
jest.mock('../pages/Blog', () => () => null);
jest.mock('../pages/Photos', () => () => null);
jest.mock('../pages/Terminal', () => () => null);

const savedFetch = global.fetch;
const savedUrl = process.env.REACT_APP_SUPABASE_URL;
const savedMatchMedia = window.matchMedia;
const savedShowModal = HTMLDialogElement.prototype.showModal;
const savedClose = HTMLDialogElement.prototype.close;
const response = (status, data) => ({ status, ok: status === 200, text: async () => JSON.stringify(data) });

function openDesktop(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <DeviceShell home={<p>Guest desktop</p>}>
        <Routes>
          <Route path="/" element={<p>Home screen</p>} />
          <Route path="/admin/*" element={<MissionControl />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </DeviceShell>
    </MemoryRouter>
  );
}

function openMissionControl() {
  fireEvent.click(within(screen.getByRole('navigation', { name: 'App dock' })).getByRole('link', { name: 'Open Mission Control' }));
}

function enterAdminPassword(password) {
  fireEvent.click(screen.getByRole('radio', { name: 'AJ Thompson Administrator' }));
  fireEvent.change(screen.getByLabelText('Admin password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Log in as AJ Thompson' }));
}

beforeEach(() => {
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: null }) };
  supabase.from.mockReturnValue(query);
  window.localStorage.clear();
  window.sessionStorage.clear();
  process.env.REACT_APP_SUPABASE_URL = 'https://example.test';
  window.matchMedia = jest.fn(() => ({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  global.fetch = jest.fn(async (url, options) => {
    if (url.endsWith('admin-photo-library')) return response(200, { photos: [], albums: [] });
    return JSON.parse(options.body).adminSecret === 'test-password'
      ? response(200, { posts: [] })
      : response(401, { error: 'Unauthorized' });
  });
});

afterEach(() => {
  global.fetch = savedFetch;
  window.matchMedia = savedMatchMedia;
  if (savedUrl === undefined) delete process.env.REACT_APP_SUPABASE_URL;
  else process.env.REACT_APP_SUPABASE_URL = savedUrl;
  HTMLDialogElement.prototype.showModal = savedShowModal;
  HTMLDialogElement.prototype.close = savedClose;
  window.localStorage.clear();
  window.sessionStorage.clear();
});

test('starts as Guest even with an old admin password, and blocks Mission Control', () => {
  window.sessionStorage.setItem('ajt3_admin_secret', 'test-password');
  openDesktop();
  expect(screen.getByText('Guest')).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
  openMissionControl();
  expect(screen.getByRole('alertdialog')).toHaveTextContent('you must log out and log in as AJ Thompson');
  expect(screen.queryByRole('heading', { name: 'Welcome back.' })).not.toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  openMissionControl();
  fireEvent(screen.getByRole('alertdialog'), new Event('cancel', { bubbles: true, cancelable: true }));
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
});

test.each([false, true])('blocks a direct admin editor link on phone=%s', (phone) => {
  window.matchMedia.mockImplementation((query) => ({ matches: phone && query.includes('max-width'), addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  openDesktop('/admin/new?slug=private-draft');
  if (phone) fireEvent.click(screen.getByRole('button', { name: 'Unlock as Guest' }));
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});

test('phone keeps four dock shortcuts and paginates every app to fit the available space', () => {
  window.matchMedia.mockImplementation((query) => ({ matches: query.includes('max-width'), addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  let availableHeight = 224;
  const height = jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => availableHeight);
  const width = jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(280);
  try {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DeviceShell><Home /></DeviceShell>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Unlock as Guest' }));
    const dock = screen.getByRole('navigation', { name: 'App dock' });
    expect(within(dock).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['https://ajt3.website', '/music', '/dogs', '/blog']);
    const apps = screen.getByRole('navigation', { name: 'Open a site app' });
    expect(within(apps).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(desktopApps.map((app) => app.path));
    expect(within(apps).getAllByRole('group')).toHaveLength(Math.ceil(desktopApps.length / 8));
    expect(within(within(apps).getAllByRole('group')[0]).getAllByRole('link')).toHaveLength(8);

    apps.scrollTo = jest.fn();
    fireEvent.click(screen.getByRole('button', { name: 'Show app page 2' }));
    expect(apps.scrollTo).toHaveBeenLastCalledWith({ left: 280 });
    fireEvent.scroll(apps, { target: { scrollLeft: 280 } });
    expect(screen.getByRole('button', { name: 'Show app page 2' })).toHaveAttribute('aria-current', 'page');
    fireEvent.keyDown(apps, { key: 'ArrowLeft' });
    expect(apps.scrollTo).toHaveBeenLastCalledWith({ left: 0 });
    expect(within(apps).getAllByRole('link')[0]).toHaveFocus();

    availableHeight = 600;
    fireEvent(window, new Event('resize'));
    expect(within(apps).getAllByRole('group')).toHaveLength(1);
    expect(screen.queryByRole('navigation', { name: 'Home screen pages' })).not.toBeInTheDocument();
    expect(apps.scrollLeft).toBe(0);
  } finally {
    height.mockRestore();
    width.mockRestore();
  }
});

test('phone starts locked and only an upward swipe unlocks as Guest', () => {
  window.matchMedia.mockImplementation((query) => ({ matches: query.includes('max-width'), addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  window.sessionStorage.setItem('ajt3_admin_secret', 'test-password');
  openDesktop();
  const lock = screen.getByRole('region', { name: 'Phone locked' });
  lock.setPointerCapture = jest.fn();
  const pointer = (type, x, y) => fireEvent(lock, Object.assign(new Event(type, { bubbles: true }), {
    pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: y
  }));
  expect(screen.queryByRole('navigation', { name: 'App dock' })).not.toBeInTheDocument();
  expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  for (const [x, y] of [[100, 280], [100, 400], [250, 220]]) {
    pointer('pointerdown', 100, 300);
    pointer('pointermove', x, y);
    pointer('pointerup', x, y);
    expect(lock).toBeInTheDocument();
  }
  for (const type of ['pointercancel', 'lostpointercapture']) {
    pointer('pointerdown', 100, 300);
    pointer('pointermove', 100, 180);
    pointer(type, 100, 180);
    pointer('pointerup', 100, 180);
    expect(lock).toBeInTheDocument();
  }
  pointer('pointerdown', 100, 300);
  pointer('pointermove', 105, 200);
  pointer('pointerup', 105, 200);
  expect(screen.queryByRole('region', { name: 'Phone locked' })).not.toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'App dock' })).toBeInTheDocument();
  expect(screen.getByText('Guest')).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});

test('touch swipe survives capture transferring from the unlock button to the lock screen', () => {
  window.matchMedia.mockImplementation((query) => ({ matches: query.includes('max-width'), addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  openDesktop();
  const lock = screen.getByRole('region', { name: 'Phone locked' });
  const unlock = screen.getByRole('button', { name: 'Unlock as Guest' });
  lock.setPointerCapture = jest.fn();
  const pointer = (target, type, y) => fireEvent(target, Object.assign(new Event(type, { bubbles: true }), {
    pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0, clientX: 100, clientY: y
  }));
  pointer(unlock, 'pointerdown', 400);
  pointer(unlock, 'pointermove', 380);
  pointer(unlock, 'lostpointercapture', 380);
  pointer(lock, 'pointermove', 200);
  pointer(lock, 'pointerup', 200);
  expect(screen.queryByRole('region', { name: 'Phone locked' })).not.toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'App dock' })).toBeInTheDocument();
});

test('phone keeps administrator sign-in available through Switch user', async () => {
  window.matchMedia.mockImplementation((query) => ({ matches: query.includes('max-width'), addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  openDesktop();
  fireEvent.click(screen.getByRole('button', { name: 'Switch user' }));
  enterAdminPassword('test-password');
  await screen.findByRole('navigation', { name: 'App dock' });
  expect(screen.getByText('AJ Thompson')).toBeInTheDocument();
});

test.each(['on', 'off', 'reduced'])('phone finishes a swipe with motion %s', (motion) => {
  window.matchMedia.mockImplementation((query) => ({
    matches: query.includes('max-width') || (motion === 'reduced' && query === '(prefers-reduced-motion: reduce)'),
    addEventListener: jest.fn(), removeEventListener: jest.fn()
  }));
  window.localStorage.setItem('ajt3-motion', String(motion !== 'off'));
  openDesktop();
  const lock = screen.getByRole('region', { name: 'Phone locked' });
  // Animation layers have no accessible role; inspect them to verify the visual handoff.
  /* eslint-disable testing-library/no-node-access */
  const sheet = lock.querySelector('.device-system-screen__lock-sheet');
  const preview = lock.parentElement.querySelector('.device-screen__session');
  /* eslint-enable testing-library/no-node-access */
  const animation = { cancel: jest.fn(), onfinish: null };
  const previewAnimation = { cancel: jest.fn() };
  sheet.animate = jest.fn(() => animation);
  preview.animate = jest.fn(() => previewAnimation);
  lock.setPointerCapture = jest.fn();
  const pointer = (type, y) => fireEvent(lock, Object.assign(new Event(type, { bubbles: true }), {
    pointerId: 1, isPrimary: true, button: 0, clientX: 100, clientY: y
  }));
  pointer('pointerdown', 400);
  pointer('pointermove', 100);
  pointer('pointerup', 100);
  pointer('lostpointercapture', 100);

  const animated = motion === 'on';
  expect(lock.isConnected).toBe(animated);
  expect(lock.style.getPropertyValue('--unlock-offset')).toBe('300px');
  expect(sheet.animate).toHaveBeenCalledTimes(animated ? 1 : 0);
  expect(preview.animate).toHaveBeenCalledTimes(animated ? 1 : 0);
  expect(screen.queryByRole('navigation', { name: 'App dock' }) !== null).toBe(!animated);
  if (animated) act(() => animation.onfinish());
  expect(animation.cancel).toHaveBeenCalledTimes(animated ? 1 : 0);
  expect(previewAnimation.cancel).toHaveBeenCalledTimes(animated ? 1 : 0);
  expect(screen.queryByRole('region', { name: 'Phone locked' })).not.toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'App dock' })).toBeInTheDocument();
});

test('phone reveals home during a held swipe and reverses without unlocking', () => {
  jest.useFakeTimers();
  try {
    window.matchMedia.mockImplementation((query) => ({
      matches: query.includes('max-width'), addEventListener: jest.fn(), removeEventListener: jest.fn()
    }));
    openDesktop();
    const lock = screen.getByRole('region', { name: 'Phone locked' });
    // Inspect the animation layers while the preview is deliberately inaccessible.
    /* eslint-disable testing-library/no-node-access */
    const device = lock.parentElement;
    const preview = device.querySelector('.device-screen__session');
    /* eslint-enable testing-library/no-node-access */
    Object.defineProperty(lock, 'clientHeight', { value: 600 });
    lock.setPointerCapture = jest.fn();
    const pointer = (type, y) => fireEvent(lock, Object.assign(new Event(type, { bubbles: true }), {
      pointerId: 1, isPrimary: true, button: 0, clientX: 100, clientY: y
    }));
    pointer('pointerdown', 600);
    pointer('pointermove', 300);
    act(() => jest.advanceTimersByTime(20));
    expect(device.style.getPropertyValue('--unlock-progress')).toBe('0.5');
    expect(preview).toHaveTextContent('Home screen');
    expect(preview).toHaveAttribute('inert');
    expect(preview).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('navigation', { name: 'App dock' })).not.toBeInTheDocument();

    pointer('pointermove', 540);
    act(() => jest.advanceTimersByTime(20));
    expect(device.style.getPropertyValue('--unlock-progress')).toBe('0.1');
    pointer('pointerup', 540);
    expect(device.style.getPropertyValue('--unlock-progress')).toBe('0');
    expect(lock).toBeInTheDocument();
    expect(preview).toHaveAttribute('inert');
  } finally {
    jest.useRealTimers();
  }
});

test('requires verified AJ Thompson login, opens Mission Control, and clears access on logout', async () => {
  openDesktop('/admin');
  fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
  expect(screen.getByRole('radio', { name: 'Guest Visitor' })).toBeChecked();
  expect(screen.getByRole('radio', { name: 'AJ Thompson Administrator' })).not.toBeChecked();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'App dock' })).not.toBeInTheDocument();
  enterAdminPassword('wrong-password');
  expect(await screen.findByRole('alert')).toHaveTextContent('That password was not accepted');
  expect(screen.queryByRole('heading', { name: 'Welcome back.' })).not.toBeInTheDocument();
  enterAdminPassword('test-password');
  await screen.findByRole('navigation', { name: 'App dock' });
  expect(screen.getByText('AJ Thompson')).toBeInTheDocument();
  expect(window.sessionStorage.getItem('ajt3_admin_secret')).toBeNull();
  openMissionControl();
  await screen.findByRole('heading', { name: 'Recent posts' });
  fireEvent.click(within(screen.getByRole('navigation', { name: 'App dock' })).getByRole('link', { name: 'Open Settings' }));
  fireEvent.click(screen.getByRole('button', { name: 'General' }));
  fireEvent.click(screen.getByRole('button', { name: /Log out Close the current session/ }));
  expect(screen.getByLabelText('Admin password')).toHaveValue('');
  expect(screen.queryByRole('heading', { name: 'Welcome back.' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('radio', { name: 'Guest Visitor' }));
  fireEvent.click(screen.getByRole('button', { name: 'Log in as Guest' }));
  openMissionControl();
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
});

test('allows logging out from Settings and returning as Guest without a password', () => {
  openDesktop('/settings');
  expect(screen.getByText('Signed in as Guest')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'General' }));
  fireEvent.click(screen.getByRole('button', { name: /Log out Close the current session/ }));
  expect(screen.queryByLabelText('Admin password')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Log in as Guest' }));
  expect(screen.getByText('Guest')).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});

test('switches between mobile and desktop views from Settings and saves the choice', () => {
  openDesktop('/settings');
  fireEvent.click(screen.getByRole('button', { name: 'General' }));
  fireEvent.click(screen.getByRole('button', { name: 'Mobile' }));
  expect(screen.getByTestId('device-scene')).toHaveClass('device-scene--phone');
  expect(window.localStorage.getItem('ajt3-device-view')).toBe('mobile');

  fireEvent.click(screen.getByRole('button', { name: 'General' }));
  fireEvent.click(screen.getByRole('button', { name: 'Desktop' }));
  expect(screen.getByTestId('device-scene')).toHaveClass('device-scene--desktop');
  expect(window.localStorage.getItem('ajt3-device-view')).toBe('desktop');
});

test('hides the device view setting and enforces mobile on a mobile viewport', () => {
  window.localStorage.setItem('ajt3-device-view', 'desktop');
  window.matchMedia.mockImplementation((query) => ({
    matches: query.includes('max-width'),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }));

  openDesktop('/settings');
  expect(screen.getByTestId('device-scene')).toHaveClass('device-scene--phone');
  fireEvent.click(screen.getByRole('button', { name: 'Unlock as Guest' }));
  fireEvent.click(screen.getByRole('button', { name: 'General' }));
  expect(screen.queryByRole('group', { name: 'Device view' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Desktop' })).not.toBeInTheDocument();
});

test('updates the admin profile photo in Mission Control, Settings, and the sign-in screen', async () => {
  const oldCreateURL = URL.createObjectURL;
  const oldRevokeURL = URL.revokeObjectURL;
  URL.createObjectURL = jest.fn(() => 'blob:profile');
  URL.revokeObjectURL = jest.fn();
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: { image_url: 'https://example.test/old.jpg' } }) };
  supabase.from.mockReturnValue(query);
  const fetchImplementation = global.fetch.getMockImplementation();
  global.fetch.mockImplementation(async (url, options) => options.body instanceof FormData
    ? response(200, { profile: { id: 'admin', image_url: 'https://example.test/new.jpg' } })
    : fetchImplementation(url, options));
  try {
    openDesktop('/admin');
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    enterAdminPassword('test-password');
    await screen.findByRole('navigation', { name: 'App dock' });
    openMissionControl();
    expect(await screen.findByAltText('Administrator')).toHaveAttribute('src', 'https://example.test/old.jpg');
    fireEvent.change(screen.getByLabelText('Choose admin profile photo'), { target: { files: [new File(['photo'], 'profile.jpg', { type: 'image/jpeg' })] } });
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));
    expect(screen.getByRole('button', { name: '02 Blog posts' })).toBeDisabled();
    await screen.findByText('Profile photo updated.');
    expect(screen.getByAltText('Administrator')).toHaveAttribute('src', 'https://example.test/new.jpg');
    fireEvent.click(within(screen.getByRole('navigation', { name: 'App dock' })).getByRole('link', { name: 'Open Settings' }));
    expect(within(screen.getByRole('main', { name: 'Settings' })).getByAltText('')).toHaveAttribute('src', 'https://example.test/new.jpg');
    fireEvent.click(screen.getByRole('button', { name: 'General' }));
    fireEvent.click(screen.getByRole('button', { name: /Log out Close the current session/ }));
    const profileImages = within(screen.getByRole('group', { name: 'Choose your profile' })).getAllByAltText('');
    expect(profileImages).toHaveLength(1);
    expect(profileImages[0]).toHaveAttribute('src', 'https://example.test/new.jpg');
    expect(screen.getByRole('radio', { name: 'AJ Thompson Administrator' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Guest Visitor' })).toBeInTheDocument();
  } finally {
    URL.createObjectURL = oldCreateURL;
    URL.revokeObjectURL = oldRevokeURL;
  }
});

test('explains a network failure and clears credentials when selecting Guest', async () => {
  global.fetch.mockRejectedValueOnce(new TypeError('Load failed'));
  openDesktop('/admin');
  fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
  enterAdminPassword('test-password');
  expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the sign-in service');
  expect(screen.getByRole('alert')).toHaveTextContent(window.location.origin);
  expect(screen.queryByRole('heading', { name: 'Welcome back.' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('radio', { name: 'Guest Visitor' }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Admin password')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('radio', { name: 'AJ Thompson Administrator' }));
  expect(screen.getByLabelText('Admin password')).toHaveValue('');
});
