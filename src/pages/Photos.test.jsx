import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Photos from './Photos';
import { DeviceSettingsContext } from '../components/deviceSettings';
import { getPhotoLibrary } from '../data/photos';
import { notifyPhotoLibraryChanged, requestPhotoLibrary } from '../lib/adminPhotoLibrary';

jest.mock('../data/photos', () => ({ getPhotoLibrary: jest.fn() }));
jest.mock('../lib/adminPhotoLibrary', () => ({ notifyPhotoLibraryChanged: jest.fn(), requestPhotoLibrary: jest.fn() }));

const photo = { id: 'uploaded-photo', src: 'https://example.test/photo.jpg', title: 'New memory', album: 'weekends', alt: 'A day outside', caption: 'A good afternoon.', width: 800, height: 600, isFavorite: false };
const album = { id: 'weekends', title: 'Weekends', description: 'Days outside.' };
const originalProjectUrl = process.env.REACT_APP_SUPABASE_URL;

afterEach(() => {
  if (originalProjectUrl === undefined) delete process.env.REACT_APP_SUPABASE_URL;
  else process.env.REACT_APP_SUPABASE_URL = originalProjectUrl;
});

beforeEach(() => {
  window.localStorage.clear();
  getPhotoLibrary.mockReset().mockResolvedValue({ photos: [photo], albums: [album] });
  requestPhotoLibrary.mockReset().mockImplementation(async () => {
    getPhotoLibrary.mockResolvedValue({ photos: [{ ...photo, isFavorite: true }], albums: [album] });
    return { photo: { id: photo.id, is_favorite: true } };
  });
  notifyPhotoLibraryChanged.mockReset();
});

test('loads photo data before rendering the library', async () => {
  let resolveLibrary;
  getPhotoLibrary.mockImplementation(() => new Promise((resolve) => { resolveLibrary = resolve; }));

  render(<Photos />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading Photos...');
  expect(screen.queryByRole('heading', { name: 'Library' })).not.toBeInTheDocument();

  await act(async () => {
    resolveLibrary({ photos: [photo], albums: [album] });
  });

  expect(await screen.findByRole('heading', { name: 'Library' })).toBeInTheDocument();
  expect(screen.queryByText('Loading Photos...')).not.toBeInTheDocument();
});

test('loads managed photos, captions and albums without giving guests a favorite control', async () => {
  render(<Photos />);
  fireEvent.click(await screen.findByRole('button', { name: 'Open New memory' }));
  expect(screen.getByText('A good afternoon.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Add to favorites' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  fireEvent.click(screen.getByRole('button', { name: 'Albums' }));
  expect(screen.getByRole('button', { name: 'Weekends 1 photo' })).toBeInTheDocument();
});

test('lets the signed-in admin favorite a photo on the server', async () => {
  render(<DeviceSettingsContext.Provider value={{ adminAccess: { session: { secret: 'admin-test' } } }}><Photos /></DeviceSettingsContext.Provider>);
  fireEvent.click(await screen.findByRole('button', { name: 'Open New memory' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));
  await waitFor(() => expect(requestPhotoLibrary).toHaveBeenCalledWith('admin-test', {
    action: 'set_favorite', id: photo.id, is_favorite: true
  }));
  expect(await screen.findByRole('button', { name: 'Remove from favorites' })).toBeInTheDocument();
  expect(notifyPhotoLibraryChanged).toHaveBeenCalledTimes(1);
  expect(window.localStorage.getItem('ajt3-photo-favorites')).toBeNull();
});

test('shows server favorites to guests', async () => {
  getPhotoLibrary.mockResolvedValue({ photos: [{ ...photo, isFavorite: true }], albums: [album] });
  render(<Photos />);
  expect(await screen.findByRole('button', { name: 'Open New memory, favorite' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Favorites 1' }));
  expect(screen.getByRole('button', { name: 'Open New memory, favorite' })).toBeInTheDocument();
});

test('replaces the phone collection scroller with a Favorites album', async () => {
  getPhotoLibrary.mockResolvedValue({ photos: [{ ...photo, isFavorite: true }], albums: [album] });
  render(<DeviceSettingsContext.Provider value={{ isPhone: true }}><Photos /></DeviceSettingsContext.Provider>);

  expect(await screen.findByRole('heading', { name: 'Library' })).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Photo collections' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Albums' }));
  fireEvent.click(screen.getByRole('button', { name: 'Favorites 1 photo' }));

  expect(screen.getByRole('heading', { name: 'Favorites' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Open New memory, favorite' })).toBeInTheDocument();
});

test.each([false, true])('restores library scroll and photo focus after closing the viewer (phone: %s)', async (isPhone) => {
  const { container } = render(<DeviceSettingsContext.Provider value={{ isPhone }}><Photos /></DeviceSettingsContext.Provider>);
  const photoButton = await screen.findByRole('button', { name: 'Open New memory' });
  const scrollSelector = isPhone ? '.photos-app__browser' : '.photos-app__scroll';
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- Check the actual scroll container, which has no accessible role.
  container.querySelector(scrollSelector).scrollTop = 240;
  fireEvent.click(photoButton);
  expect(screen.getByRole('region', { name: 'Photo viewer' })).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- Verify the restored scroll offset on the same container.
  expect(container.querySelector(scrollSelector).scrollTop).toBe(240);
  expect(screen.getByRole('button', { name: 'Open New memory' })).toHaveFocus();
});

test('refreshes after an admin change and closes a viewer for a hidden photo', async () => {
  render(<Photos />);
  fireEvent.click(await screen.findByRole('button', { name: 'Open New memory' }));
  getPhotoLibrary.mockResolvedValue({ photos: [], albums: [] });
  fireEvent(window, new Event('ajt3-photos-updated'));
  await screen.findByRole('heading', { name: 'No photos yet' });
  expect(screen.queryByRole('region', { name: 'Photo viewer' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Open New memory' })).not.toBeInTheDocument();
});

test('refreshes album membership while keeping an unassigned photo in All Photos', async () => {
  const other = { ...photo, id: 'other-photo', title: 'Another memory' };
  getPhotoLibrary.mockResolvedValue({ photos: [photo, other], albums: [album] });
  render(<Photos />);
  fireEvent.click(await screen.findByRole('button', { name: 'Weekends' }));
  expect(screen.getByRole('button', { name: 'Open New memory' })).toBeInTheDocument();
  getPhotoLibrary.mockResolvedValue({ photos: [{ ...photo, album: null }, other], albums: [album] });
  fireEvent(window, new Event('ajt3-photos-updated'));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Open New memory' })).not.toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Open Another memory' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'All Photos 2' }));
  expect(screen.getByRole('button', { name: 'Open New memory' })).toBeInTheDocument();
});

test('shows a retryable error without repopulating hidden photos from static data', async () => {
  getPhotoLibrary.mockRejectedValue(new Error('Library unavailable'));
  render(<Photos />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Library unavailable');
  expect(screen.queryAllByRole('button', { name: /^Open / })).toHaveLength(0);
  getPhotoLibrary.mockResolvedValue({ photos: [], albums: [] });
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  expect(screen.getByRole('heading', { name: 'No photos yet' })).toBeInTheDocument();
});

test.each([false, true])('uses resized images throughout the library without requesting the uploaded original (phone: %s)', async (isPhone) => {
  process.env.REACT_APP_SUPABASE_URL = 'https://photos-test.supabase.co';
  const original = 'https://photos-test.supabase.co/storage/v1/object/public/blog-media/photo.jpg';
  getPhotoLibrary.mockResolvedValue({ photos: [{ ...photo, src: original }], albums: [album] });
  render(<DeviceSettingsContext.Provider value={{ isPhone }}><Photos /></DeviceSettingsContext.Provider>);
  const open = await screen.findByRole('button', { name: 'Open New memory' });
  const expectSize = (image, size) => {
    const url = new URL(image.getAttribute('src'));
    expect(url.pathname).toBe('/storage/v1/render/image/public/blog-media/photo.jpg');
    expect(url.searchParams.get('width')).toBe(String(size));
    expect(url.searchParams.get('height')).toBe(String(size));
    expect(screen.getAllByAltText('').some((item) => item.getAttribute('src') === original)).toBe(false);
  };
  expectSize(within(open).getByAltText(''), 320);
  fireEvent.click(open);
  expectSize(within(screen.getByRole('region', { name: 'Photo viewer' })).getAllByAltText('')[0], isPhone ? 1600 : 2400);
  const filmstripImage = within(screen.getByRole('button', { name: 'View New memory' })).getByAltText('');
  expectSize(filmstripImage, 96);
  // A resize failure must not silently reload a full-resolution original.
  fireEvent.error(filmstripImage);
  expectSize(filmstripImage, 96);
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  fireEvent.click(screen.getByRole('button', { name: 'Albums' }));
  expectSize(within(screen.getByRole('button', { name: 'Weekends 1 photo' })).getByAltText(''), 640);
});

describe('preview image memory use', () => {
  const originalObserver = window.IntersectionObserver;
  let observers;

  beforeEach(() => {
    observers = [];
    window.IntersectionObserver = jest.fn().mockImplementation((callback) => {
      const observer = { callback, observe: jest.fn(), disconnect: jest.fn() };
      observers.push(observer);
      return observer;
    });
  });

  afterEach(() => {
    if (originalObserver === undefined) delete window.IntersectionObserver;
    else window.IntersectionObserver = originalObserver;
  });

  test.each(['library', 'albums', 'viewer'])('loads only visible %s previews and releases offscreen sources', async (view) => {
    const { unmount } = render(<Photos />);
    const openButton = await screen.findByRole('button', { name: 'Open New memory' });
    if (view === 'albums') fireEvent.click(screen.getByRole('button', { name: 'Albums' }));
    if (view === 'viewer') fireEvent.click(openButton);
    const name = view === 'viewer' ? 'View New memory' : view === 'albums' ? 'Weekends 1 photo' : 'Open New memory';
    const preview = within(screen.getByRole('button', { name })).getByAltText('');
    const observer = observers.find((item) => item.observe.mock.calls.some(([target]) => target === preview));

    expect(preview).not.toHaveAttribute('src');
    act(() => observer.callback([{ isIntersecting: true }]));
    expect(preview).toHaveAttribute('src', photo.src);
    act(() => observer.callback([{ isIntersecting: false }]));
    expect(preview).not.toHaveAttribute('src');
    act(() => observer.callback([{ isIntersecting: true }]));
    expect(preview).toHaveAttribute('src', photo.src);

    unmount();
    expect(observers.every((item) => item.disconnect.mock.calls.length === 1)).toBe(true);
  });

  test('opening a large collection does not request every original and keeps navigation available', async () => {
    const collection = Array.from({ length: 100 }, (_, index) => ({
      ...photo, id: `photo-${index}`, title: `Memory ${index}`, src: `https://example.test/${index}.jpg`
    }));
    getPhotoLibrary.mockResolvedValue({ photos: collection, albums: [album] });
    render(<Photos />);
    const buttons = await screen.findAllByRole('button', { name: /^Open Memory / });
    const firstTitle = buttons[0].getAttribute('aria-label').replace('Open ', '');
    fireEvent.click(buttons[0]);

    expect(screen.getAllByRole('button', { name: /^View Memory / })).toHaveLength(100);
    const loadedImages = () => screen.getAllByAltText('').filter((image) => image.hasAttribute('src'));
    expect(loadedImages()).toHaveLength(1);
    expect(loadedImages()[0]).toHaveAttribute('src', collection.find((item) => item.title === firstTitle).src);
    expect(screen.getByRole('button', { name: 'Previous photo' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(screen.getByText('2 of 100')).toBeInTheDocument();
    expect(loadedImages()).toHaveLength(1);

    fireEvent.keyDown(screen.getByRole('region', { name: 'Photo viewer' }), { key: 'Escape' });
    expect(screen.getByRole('button', { name: `Open ${firstTitle}` })).toHaveFocus();
  });
});
