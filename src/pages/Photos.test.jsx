import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Photos from './Photos';
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
