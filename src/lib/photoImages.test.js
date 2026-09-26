import { getPhotoImageUrl } from './photoImages';

const projectUrl = 'https://photos-test.supabase.co';
const originalProjectUrl = process.env.REACT_APP_SUPABASE_URL;

beforeEach(() => { process.env.REACT_APP_SUPABASE_URL = projectUrl; });
afterEach(() => {
  if (originalProjectUrl === undefined) delete process.env.REACT_APP_SUPABASE_URL;
  else process.env.REACT_APP_SUPABASE_URL = originalProjectUrl;
});

test.each([96, 320, 640, 1600, 2400])('requests an actual resized image bounded to %s pixels on both axes', (size) => {
  const url = new URL(getPhotoImageUrl(`${projectUrl}/storage/v1/object/public/blog-media/ajt3/me/photos/portrait%20photo.jpg`, size));
  expect(url.origin).toBe(projectUrl);
  expect(url.pathname).toBe('/storage/v1/render/image/public/blog-media/ajt3/me/photos/portrait%20photo.jpg');
  expect(url.searchParams.get('width')).toBe(String(size));
  expect(url.searchParams.get('height')).toBe(String(size));
  expect(url.searchParams.get('resize')).toBe('contain');
  expect(url.searchParams.get('quality')).toBe(size > 640 ? '85' : '75');
});

test.each([
  '/images/dogs/drake.jpg',
  'https://example.test/photo.jpg',
  'https://another-project.supabase.co/storage/v1/object/public/photos/image.jpg',
  `${projectUrl}/storage/v1/object/sign/photos/private.jpg?token=example`,
  `${projectUrl}/other/photo.jpg`
])('preserves unsupported image URL %s', (src) => {
  expect(getPhotoImageUrl(src, 320)).toBe(src);
});

test('preserves public object query parameters without double-encoding the path', () => {
  const url = new URL(getPhotoImageUrl(`${projectUrl}/storage/v1/object/public/photos/a%20b.jpg?v=2`, 320));
  expect(url.pathname).toContain('a%20b.jpg');
  expect(url.searchParams.get('v')).toBe('2');
});

test('keeps photos usable without Supabase configuration', () => {
  delete process.env.REACT_APP_SUPABASE_URL;
  const src = `${projectUrl}/storage/v1/object/public/photos/image.jpg`;
  expect(getPhotoImageUrl(src, 320)).toBe(src);
});
