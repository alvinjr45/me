import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Photos from './Photos';
import { DeviceSettingsContext } from '../components/deviceSettings';
import { getPhotoLibrary } from '../data/photos';

jest.mock('../data/photos', () => ({ getPhotoLibrary: jest.fn() }));

const photo = { id: 'uploaded-photo', src: 'https://example.test/photo.jpg', title: 'New memory', album: 'weekends', alt: 'A day outside', caption: 'A good afternoon.', width: 800, height: 600 };
const album = { id: 'weekends', title: 'Weekends', description: 'Days outside.' };

beforeEach(() => {
  window.localStorage.clear();
  getPhotoLibrary.mockReset().mockResolvedValue({ photos: [photo], albums: [album] });
});

test('loads managed photos, captions and albums and favorites new photo IDs', async () => {
  render(<Photos />);
  fireEvent.click(await screen.findByRole('button', { name: 'Open New memory' }));
  expect(screen.getByText('A good afternoon.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Add to favorites' }));
  expect(JSON.parse(window.localStorage.getItem('ajt3-photo-favorites'))).toEqual(['uploaded-photo']);
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  fireEvent.click(screen.getByRole('button', { name: 'Albums' }));
  expect(screen.getByRole('button', { name: 'Weekends 1 photo' })).toBeInTheDocument();
});

test.each([false, true])('restores library scroll and photo focus after closing the viewer (phone: %s)', async (isPhone) => {
  const { container } = render(<DeviceSettingsContext.Provider value={{ isPhone }}><Photos /></DeviceSettingsContext.Provider>);
  const photoButton = await screen.findByRole('button', { name: 'Open New memory' });
  const scrollSelector = isPhone ? '.photos-app__browser' : '.photos-app__scroll';
  container.querySelector(scrollSelector).scrollTop = 240;
  fireEvent.click(photoButton);
  expect(screen.getByRole('region', { name: 'Photo viewer' })).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
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
    const { container, unmount } = render(<Photos />);
    const openButton = await screen.findByRole('button', { name: 'Open New memory' });
    if (view === 'albums') fireEvent.click(screen.getByRole('button', { name: 'Albums' }));
    if (view === 'viewer') fireEvent.click(openButton);
    const selector = view === 'viewer' ? '.photos-viewer__filmstrip img' : view === 'albums' ? '.photos-app__album img' : '.photos-app__tile img';
    const preview = container.querySelector(selector);
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
    const { container } = render(<Photos />);
    const buttons = await screen.findAllByRole('button', { name: /^Open Memory / });
    const firstTitle = buttons[0].getAttribute('aria-label').replace('Open ', '');
    fireEvent.click(buttons[0]);

    expect(container.querySelectorAll('.photos-viewer__filmstrip button')).toHaveLength(100);
    expect(container.querySelectorAll('img[src]')).toHaveLength(1);
    expect(container.querySelector('.photos-viewer__stage img')).toHaveAttribute('src', collection.find((item) => item.title === firstTitle).src);
    expect(screen.getByRole('button', { name: 'Previous photo' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(screen.getByText('2 of 100')).toBeInTheDocument();
    expect(container.querySelectorAll('img[src]')).toHaveLength(1);

    fireEvent.keyDown(screen.getByRole('region', { name: 'Photo viewer' }), { key: 'Escape' });
    expect(screen.getByRole('button', { name: `Open ${firstTitle}` })).toHaveFocus();
  });
});
