import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DeviceShell from './DeviceShell';
import MissionControl from '../pages/MissionControl';
import Settings from '../pages/Settings';

jest.mock('heic2any', () => jest.fn());
jest.mock('./SceneBackground', () => ({ __esModule: true, default: () => null, SceneLandscape: () => null }));
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
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
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
