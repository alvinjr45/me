import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import AdminPhotoUpload from './AdminPhotoUpload';
import { normalizeUploadFile } from '../lib/adminPostEditor';
import { notifyPhotoLibraryChanged, requestPhotoLibrary } from '../lib/adminPhotoLibrary';

jest.mock('../lib/adminPostEditor', () => ({ normalizeUploadFile: jest.fn() }));
jest.mock('../lib/adminPhotoLibrary', () => ({ requestPhotoLibrary: jest.fn(), notifyPhotoLibraryChanged: jest.fn() }));

const originalCrypto = global.crypto;
const originalConfirm = window.confirm;
let sequence = 0;

beforeEach(() => {
  sequence = 0;
  global.crypto = { randomUUID: jest.fn(() => `photo-${++sequence}`) };
  window.confirm = jest.fn(() => true);
  normalizeUploadFile.mockReset().mockImplementation(async (file) => file);
  requestPhotoLibrary.mockReset().mockImplementation(async (_, body) => ({ photo: { ...Object.fromEntries(body), image_url: '/images/saved.jpg' } }));
  notifyPhotoLibraryChanged.mockClear();
});

afterEach(() => {
  global.crypto = originalCrypto;
  window.confirm = originalConfirm;
});

function openUpload(overrides = {}) {
  const props = {
    secret: 'test-secret',
    library: { albums: [{ id: 'dogs', title: 'Dogs' }, { id: 'trips', title: 'Trips' }], photos: [{ sort_order: 4 }] },
    onChange: jest.fn(), onBusy: jest.fn(), onClose: jest.fn(), ...overrides
  };
  render(<AdminPhotoUpload {...props} />);
  return props;
}

function choosePhotos(files = [new File(['one'], 'first-photo.jpg', { type: 'image/jpeg' }), new File(['two'], 'second_photo.png', { type: 'image/png' })]) {
  fireEvent.change(screen.getByLabelText('Choose photos'), { target: { files } });
  for (const file of files) fireEvent.change(screen.getByLabelText(`Alt text for ${file.name}`), { target: { value: `Description of ${file.name}` } });
}

test('uploads every selected photo with shared settings and individual metadata', async () => {
  const props = openUpload();
  expect(screen.getByLabelText('Choose photos')).toHaveAttribute('multiple');
  choosePhotos();
  fireEvent.change(screen.getByLabelText('Upload to album'), { target: { value: 'trips' } });
  fireEvent.click(screen.getByLabelText('Publish uploaded photos'));
  fireEvent.change(screen.getByLabelText('Title for first-photo.jpg'), { target: { value: 'A weekend away' } });
  fireEvent.click(screen.getByRole('button', { name: 'Upload 2 photos' }));
  await screen.findByText('2 photos uploaded. All selected photos are saved.');
  expect(requestPhotoLibrary).toHaveBeenCalledTimes(2);
  const [first, second] = requestPhotoLibrary.mock.calls.map(([secret, body]) => {
    expect(secret).toBe('test-secret');
    expect(body.get('album_id')).toBe('trips');
    expect(body.get('is_published')).toBe('false');
    expect(body.get('action')).toBe('save_photo');
    return Object.fromEntries(body);
  });
  expect(first).toMatchObject({ id: 'photo-1', title: 'A weekend away', alt_text: 'Description of first-photo.jpg', sort_order: '5' });
  expect(second).toMatchObject({ id: 'photo-2', title: 'second photo', sort_order: '6' });
  expect(first.file.name).toBe('first-photo.jpg');
  expect(second.file.name).toBe('second_photo.png');
  expect(props.onChange).toHaveBeenCalledTimes(2);
  expect(notifyPhotoLibraryChanged).toHaveBeenCalledTimes(1);
  expect(props.onBusy.mock.calls).toEqual([[true], [false]]);
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  expect(props.onClose).toHaveBeenCalledTimes(1);
  expect(window.confirm).not.toHaveBeenCalled();
});

test('continues after a failed upload and retries only failed photos with the same identity and order', async () => {
  openUpload();
  choosePhotos();
  requestPhotoLibrary.mockRejectedValueOnce(new Error('Upload failed'));
  fireEvent.click(screen.getByRole('button', { name: 'Upload 2 photos' }));
  await screen.findByText('1 photo uploaded. 1 failed. Review the errors and retry the remaining photos.');
  expect(screen.getByRole('alert')).toHaveTextContent('Upload failed');
  expect(requestPhotoLibrary).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole('button', { name: 'Retry remaining photos' }));
  await screen.findByText('1 photo uploaded. All selected photos are saved.');
  expect(requestPhotoLibrary).toHaveBeenCalledTimes(3);
  const retry = requestPhotoLibrary.mock.calls[2][1];
  expect(retry.get('id')).toBe('photo-1');
  expect(retry.get('sort_order')).toBe('5');
  expect(retry.get('file').name).toBe('first-photo.jpg');
});

test('reports conversion and invalid-file errors without preventing other uploads', async () => {
  openUpload();
  choosePhotos([
    new File(['bad'], 'broken.heic', { type: 'image/heic' }),
    new File(['svg'], 'vector.svg', { type: 'image/svg+xml' }),
    new File(['good'], 'good.heic', { type: 'image/heic' })
  ]);
  normalizeUploadFile.mockRejectedValueOnce(new Error('HEIC conversion failed'))
    .mockImplementationOnce(async (file) => file)
    .mockResolvedValueOnce(new File(['converted'], 'good.jpg', { type: 'image/jpeg' }));
  fireEvent.click(screen.getByRole('button', { name: 'Upload 3 photos' }));
  await screen.findByText('1 photo uploaded. 2 failed. Review the errors and retry the remaining photos.');
  expect(screen.getAllByRole('alert')).toHaveLength(2);
  expect(requestPhotoLibrary).toHaveBeenCalledTimes(1);
  expect(requestPhotoLibrary.mock.calls[0][1].get('file').name).toBe('good.jpg');
});

test('locks the queue during uploads and prevents duplicate submissions', async () => {
  openUpload();
  choosePhotos();
  let complete;
  normalizeUploadFile.mockImplementationOnce((file) => new Promise((resolve) => { complete = () => resolve(file); }));
  fireEvent.click(screen.getByRole('button', { name: 'Upload 2 photos' }));
  expect(screen.getByRole('status')).toHaveTextContent('Uploading 1 of 2');
  expect(screen.getByLabelText('Choose photos')).toBeDisabled();
  expect(screen.getByLabelText('Upload to album')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  fireEvent.submit(screen.getByRole('form', { name: 'Upload multiple photos' }));
  await act(async () => complete());
  await screen.findByText('2 photos uploaded. All selected photos are saved.');
  expect(requestPhotoLibrary).toHaveBeenCalledTimes(2);
});

test('requires photo titles and allows removing or discarding queued files', () => {
  const props = openUpload();
  choosePhotos();
  fireEvent.change(screen.getByLabelText('Title for first-photo.jpg'), { target: { value: ' ' } });
  fireEvent.submit(screen.getByRole('form', { name: 'Upload multiple photos' }));
  expect(screen.getByRole('status')).toHaveTextContent('Add a title');
  expect(requestPhotoLibrary).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Remove first-photo.jpg' }));
  expect(screen.queryByLabelText('Title for first-photo.jpg')).not.toBeInTheDocument();
  window.confirm.mockReturnValueOnce(false);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(props.onClose).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(props.onClose).toHaveBeenCalledTimes(1);
});

test('uploads photos with empty or whitespace-only alt text', async () => {
  openUpload();
  choosePhotos();
  const firstAlt = screen.getByLabelText('Alt text for first-photo.jpg');
  const secondAlt = screen.getByLabelText('Alt text for second_photo.png');
  expect(firstAlt).not.toBeRequired();
  expect(secondAlt).not.toBeRequired();
  fireEvent.change(firstAlt, { target: { value: '' } });
  fireEvent.change(secondAlt, { target: { value: ' ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Upload 2 photos' }));
  await screen.findByText('2 photos uploaded. All selected photos are saved.');
  expect(requestPhotoLibrary).toHaveBeenCalledTimes(2);
  for (const [, body] of requestPhotoLibrary.mock.calls) expect(body.get('alt_text')).toBe('');
});

test('requires an existing album before uploading', () => {
  openUpload({ library: { albums: [], photos: [] } });
  choosePhotos();
  expect(screen.getByRole('button', { name: 'Upload 2 photos' })).toBeDisabled();
  fireEvent.submit(screen.getByRole('form', { name: 'Upload multiple photos' }));
  expect(screen.getByRole('status')).toHaveTextContent('Choose an album');
  expect(requestPhotoLibrary).not.toHaveBeenCalled();
});
