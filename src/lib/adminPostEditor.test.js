import heic2any from 'heic2any';
import { isHeicFile, normalizeUploadFile } from './adminPostEditor';

jest.mock('heic2any', () => jest.fn());

beforeEach(() => {
  heic2any.mockReset();
});

test.each([
  ['photo.HEIC', ''],
  ['photo.heif', 'application/octet-stream'],
  ['photo', 'image/heic-sequence'],
  ['photo', 'image/heif-sequence']
])('recognizes %s with MIME type %s as HEIC', (name, type) => {
  expect(isHeicFile(new File(['photo'], name, { type }))).toBe(true);
});

test('converts a HEIC upload to a JPEG file', async () => {
  const source = new File(['heic-photo'], 'vacation.HEIC', { type: 'image/heic' });
  heic2any.mockResolvedValue(new Blob(['jpeg-photo'], { type: 'image/jpeg' }));

  const converted = await normalizeUploadFile(source);

  expect(heic2any).toHaveBeenCalledWith({ blob: source, toType: 'image/jpeg', quality: 0.92 });
  expect(converted).toBeInstanceOf(File);
  expect(converted.name).toBe('vacation.jpg');
  expect(converted.type).toBe('image/jpeg');
});

test('leaves non-HEIC uploads unchanged', async () => {
  const source = new File(['jpeg-photo'], 'vacation.jpg', { type: 'image/jpeg' });

  await expect(normalizeUploadFile(source)).resolves.toBe(source);
  expect(heic2any).not.toHaveBeenCalled();
});
