import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DeviceShell, { desktopApps } from './DeviceShell';
import Home from '../pages/Home';
import MissionControl from '../pages/MissionControl';
import Settings from '../pages/Settings';

jest.mock('heic2any', () => jest.fn());
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
    expect(within(dock).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['/tech', '/music', '/dogs', '/blog']);
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
  pointer('pointerdown', 100, 300);
  pointer('pointermove', 100, 180);
  pointer('pointercancel', 100, 180);
  pointer('pointerup', 100, 180);
  expect(lock).toBeInTheDocument();
  pointer('pointerdown', 100, 300);
  pointer('pointermove', 105, 200);
  pointer('pointerup', 105, 200);
  expect(screen.queryByRole('region', { name: 'Phone locked' })).not.toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'App dock' })).toBeInTheDocument();
  expect(screen.getByText('Guest')).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});

test('phone keeps administrator sign-in available through Switch user', async () => {
  window.matchMedia.mockImplementation((query) => ({ matches: query.includes('max-width'), addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  openDesktop();
  fireEvent.click(screen.getByRole('button', { name: 'Switch user' }));
  enterAdminPassword('test-password');
  await screen.findByRole('navigation', { name: 'App dock' });
  expect(screen.getByText('AJ Thompson')).toBeInTheDocument();
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
  await screen.findByRole('heading', { name: 'Welcome back.' });
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
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
