import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminProfile from './AdminProfile';
import { normalizeUploadFile } from '../lib/adminPostEditor';
import { requestPhotoLibrary } from '../lib/adminPhotoLibrary';

jest.mock('../lib/adminPostEditor', () => ({ normalizeUploadFile: jest.fn() }));
jest.mock('../lib/adminPhotoLibrary', () => ({ requestPhotoLibrary: jest.fn() }));

const originalCreateURL = URL.createObjectURL;
const originalRevokeURL = URL.revokeObjectURL;

beforeEach(() => {
  URL.createObjectURL = jest.fn(() => 'blob:profile-preview');
  URL.revokeObjectURL = jest.fn();
  normalizeUploadFile.mockReset().mockImplementation(async (file) => file);
  requestPhotoLibrary.mockReset().mockResolvedValue({ profile: { id: 'admin', image_url: 'https://example.test/profile.jpg' } });
});

afterEach(() => {
  URL.createObjectURL = originalCreateURL;
  URL.revokeObjectURL = originalRevokeURL;
});

function openProfile() {
  const props = { secret: 'test-secret', imageUrl: 'https://example.test/old.jpg', onChange: jest.fn(), onBusy: jest.fn() };
  const view = render(<AdminProfile {...props} />);
  return { ...view, props };
}

async function choosePhoto() {
  const file = new File(['image'], 'portrait.heic', { type: 'image/heic' });
  normalizeUploadFile.mockResolvedValueOnce(new File(['converted'], 'portrait.jpg', { type: 'image/jpeg' }));
  fireEvent.change(screen.getByLabelText('Choose admin profile photo'), { target: { files: [file] } });
  await screen.findByRole('button', { name: 'Save' });
}

test('previews a photo and saves it only after confirmation', async () => {
  const { props, rerender } = openProfile();
  await choosePhoto();
  expect(screen.getByAltText('Administrator')).toHaveAttribute('src', 'blob:profile-preview');
  expect(requestPhotoLibrary).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByRole('button', { name: 'Change photo' })).toBeDisabled();
  await screen.findByText('Profile photo updated.');
  const [secret, body] = requestPhotoLibrary.mock.calls[0];
  expect(secret).toBe('test-secret');
  expect(body.get('action')).toBe('save_profile');
  expect(body.get('file').name).toBe('portrait.jpg');
  expect(props.onChange).toHaveBeenCalledWith('https://example.test/profile.jpg');
  expect(props.onBusy.mock.calls).toEqual([[true], [false], [true], [false]]);
  rerender(<AdminProfile {...props} imageUrl="https://example.test/profile.jpg" />);
  expect(screen.getByAltText('Administrator')).toHaveAttribute('src', 'https://example.test/profile.jpg');
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:profile-preview');
});

test('cancel restores the current image without uploading', async () => {
  const { props } = openProfile();
  await choosePhoto();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.getByAltText('Administrator')).toHaveAttribute('src', props.imageUrl);
  expect(requestPhotoLibrary).not.toHaveBeenCalled();
  expect(props.onChange).not.toHaveBeenCalled();
});

test('retains the selection and saved profile when an upload fails, allowing retry', async () => {
  const { props } = openProfile();
  await choosePhoto();
  requestPhotoLibrary.mockRejectedValueOnce(new Error('Upload failed'));
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Upload failed');
  expect(props.onChange).not.toHaveBeenCalled();
  expect(screen.getByAltText('Administrator')).toHaveAttribute('src', 'blob:profile-preview');
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await screen.findByText('Profile photo updated.');
  expect(requestPhotoLibrary).toHaveBeenCalledTimes(2);
});

test('rejects invalid files and releases a preview on unmount', async () => {
  const { unmount } = openProfile();
  fireEvent.change(screen.getByLabelText('Choose admin profile photo'), { target: { files: [new File(['svg'], 'bad.svg', { type: 'image/svg+xml' })] } });
  expect(await screen.findByRole('alert')).toHaveTextContent('Choose a JPG');
  expect(requestPhotoLibrary).not.toHaveBeenCalled();
  await choosePhoto();
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:profile-preview');
});
