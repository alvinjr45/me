import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import CommandTerminal from './CommandTerminal';
import { DeviceSettingsContext } from './deviceSettings';
import { getBlogPosts } from '../data/blogPosts';
import { getCalendarEvents } from '../data/calendar';
import { getPhotoLibrary } from '../data/photos';

jest.mock('../data/blogPosts', () => ({ getBlogPosts: jest.fn() }));
jest.mock('../data/photos', () => ({ getPhotoLibrary: jest.fn() }));
jest.mock('../data/calendar', () => ({
  ...jest.requireActual('../data/calendar'),
  getCalendarEvents: jest.fn()
}));

function CurrentPath() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

function renderTerminal(settings = null) {
  return render(
    <MemoryRouter initialEntries={['/terminal']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <DeviceSettingsContext.Provider value={settings}>
        <CommandTerminal showIntro={false} />
        <CurrentPath />
      </DeviceSettingsContext.Provider>
    </MemoryRouter>
  );
}

function run(command) {
  const input = screen.getByRole('textbox', { name: 'Enter a site command' });
  fireEvent.change(input, { target: { value: command } });
  fireEvent.submit(screen.getByRole('form', { name: 'Site command' }));
  return input;
}

beforeEach(() => jest.clearAllMocks());

test('shows a placeholder, grouped help, and contextual help without running a command', () => {
  const shutdown = jest.fn();
  renderTerminal({ runSystemAction: shutdown });
  expect(screen.getByPlaceholderText('--help for help')).toHaveValue('');
  run('--help');
  expect(screen.getByText('Explore')).toBeInTheDocument();
  expect(screen.getByText('Customize')).toBeInTheDocument();
  expect(screen.getByText(/Start here: ls lists pages/)).toBeInTheDocument();
  run('set --help');
  expect(screen.getByText(/theme: system \| dark \| light/)).toBeInTheDocument();
  run('shutdown --help');
  expect(shutdown).not.toHaveBeenCalled();
});

test.each([
  ['open guestbook', '/guestbook'], ['store', '/app-store'], ['open /privacy/', '/privacy'],
  ['terms', '/terms'], ['tech', '/tech'], ['cd /', '/']
])('opens public destinations: %s', (command, path) => {
  renderTerminal();
  run(command);
  expect(screen.getByTestId('current-path')).toHaveTextContent(path);
});

test('lists public features, rejects admin and arbitrary URLs, and reports the router path', () => {
  renderTerminal();
  run('ls');
  expect(screen.getByText(/app-store - Explore the demo catalog/)).toHaveTextContent('instagram');
  expect(screen.queryByText(/admin/)).not.toBeInTheDocument();
  run('open admin');
  expect(screen.getByText(/No public page named "admin"/)).toBeInTheDocument();
  run('open https://example.com');
  expect(screen.getByTestId('current-path')).toHaveTextContent('/terminal');
  run('pwd');
  expect(screen.getByText('/terminal', { selector: '.command-terminal__line' })).toBeInTheDocument();
});

test('opens known external destinations and playlists in a protected new tab', () => {
  const open = jest.spyOn(window, 'open').mockImplementation(() => null);
  renderTerminal();
  run('build');
  expect(open).toHaveBeenCalledWith('https://ajt3.website', '_blank', 'noopener,noreferrer');
  run('listen Michael');
  expect(open).toHaveBeenLastCalledWith(expect.stringContaining('https://music.apple.com/'), '_blank', 'noopener,noreferrer');
  open.mockRestore();
});

test('updates preferences through existing controls and rejects invalid values', () => {
  const settings = {
    appearance: 'dark', setAppearance: jest.fn(), setWallpaperDim: jest.fn(),
    setMotion: jest.fn(), setClock24: jest.fn()
  };
  renderTerminal(settings);
  run('get theme');
  expect(screen.getByText('theme: dark')).toBeInTheDocument();
  run('set theme light');
  run('set brightness 75');
  run('set motion off');
  run('set clock 24');
  expect(settings.setAppearance).toHaveBeenCalledWith('light');
  expect(settings.setWallpaperDim).toHaveBeenCalledWith(25);
  expect(settings.setMotion).toHaveBeenCalledWith(false);
  expect(settings.setClock24).toHaveBeenCalledWith(true);
  run('set theme neon');
  run('set brightness 101');
  run('set brightness 40oops');
  run('set');
  expect(settings.setAppearance).toHaveBeenCalledTimes(1);
  expect(settings.setWallpaperDim).toHaveBeenCalledTimes(1);
});

test('recalls commands, restores unfinished input, and completes setting values', () => {
  renderTerminal();
  const input = run('date');
  run('pwd');
  fireEvent.change(input, { target: { value: 'unfinished' } });
  fireEvent.keyDown(input, { key: 'ArrowUp' });
  expect(input).toHaveValue('pwd');
  fireEvent.keyDown(input, { key: 'ArrowUp' });
  expect(input).toHaveValue('date');
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  expect(input).toHaveValue('unfinished');
  fireEvent.change(input, { target: { value: 'open gue' } });
  fireEvent.keyDown(input, { key: 'Tab' });
  expect(input).toHaveValue('open guestbook');
  fireEvent.change(input, { target: { value: 'set theme d' } });
  fireEvent.keyDown(input, { key: 'Tab' });
  expect(input).toHaveValue('set theme dark');
  fireEvent.keyDown(input, { key: 'Tab', shiftKey: true });
  expect(input).toHaveValue('set theme dark');
});

test('searches published posts and opens a selected post', async () => {
  getBlogPosts.mockResolvedValue([
    { slug: 'dog-notes', title: 'Dog notes', date: 'Today', excerpt: 'Drake and Josh', tags: ['dogs'] },
    { slug: 'build-notes', title: 'Build notes', date: 'Yesterday', excerpt: 'Projects', tags: ['tech'] }
  ]);
  renderTerminal();
  run('posts dogs');
  expect(await screen.findByText(/Dog notes - Today/)).toHaveTextContent('read dog-notes');
  expect(screen.queryByText(/Build notes - Yesterday/)).not.toBeInTheDocument();
  run('read dog-notes');
  await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent('/blog/dog-notes'));
  run('read missing');
  expect(await screen.findByText(/Post not found/)).toBeInTheDocument();
});

test('lists photo albums and handles unavailable public content', async () => {
  getPhotoLibrary.mockResolvedValue({ albums: [{ id: 'dogs', title: 'Drake & Josh' }], photos: [{ album: 'dogs' }] });
  getBlogPosts.mockRejectedValue(new Error('Offline'));
  renderTerminal();
  run('albums');
  expect(await screen.findByText('Drake & Josh (dogs) - 1 photo')).toBeInTheDocument();
  run('posts');
  expect(await screen.findByText(/Could not load this content/)).toBeInTheDocument();
});

test('includes ongoing and future calendar events but excludes past events', async () => {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  getCalendarEvents.mockResolvedValue([
    { title: 'Ongoing event', start_at: new Date(now - hour).toISOString(), end_at: new Date(now + hour).toISOString() },
    { title: 'Future event', start_at: new Date(now + hour).toISOString(), end_at: new Date(now + 2 * hour).toISOString() },
    { title: 'Past event', start_at: new Date(now - 2 * hour).toISOString(), end_at: new Date(now - hour).toISOString() }
  ]);
  renderTerminal();
  run('events upcoming');
  expect(await screen.findByText(/Ongoing event/)).toHaveTextContent('Future event');
  expect(screen.queryByText(/Past event/)).not.toBeInTheDocument();
});

test('clear discards pending content output while preserving command recall', async () => {
  let resolve;
  getBlogPosts.mockImplementation(() => new Promise((done) => { resolve = done; }));
  renderTerminal();
  run('posts');
  const input = run('clear');
  await act(async () => resolve([{ title: 'Stale result', excerpt: '', tags: [], slug: 'stale' }]));
  expect(screen.queryByText(/Stale result/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
  fireEvent.keyDown(input, { key: 'ArrowUp' });
  expect(input).toHaveValue('clear');
});

test('system commands use existing device actions and reject extra arguments', () => {
  const runSystemAction = jest.fn();
  renderTerminal({ runSystemAction });
  run('restart later');
  expect(runSystemAction).not.toHaveBeenCalled();
  run('restart');
  expect(runSystemAction).toHaveBeenCalledWith('restart');
});
