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
  '/images/other.jpg',
  'https://example.test/photo.jpg',
  'https://another-project.supabase.co/storage/v1/object/public/photos/image.jpg',
  `${projectUrl}/storage/v1/object/sign/photos/private.jpg?token=example`,
  `${projectUrl}/other/photo.jpg`
])('preserves unsupported image URL %s', (src) => {
  expect(getPhotoImageUrl(src, 320)).toBe(src);
});

test.each([
  ['/images/dogs/drake.jpg', 96, '/images/photos/drake-320.jpg'],
  ['/images/dogs/josh.jpg', 320, '/images/photos/josh-320.jpg'],
  ['/images/IMG_4870.JPG', 640, '/images/photos/graduation-640.jpg'],
  ['/images/tech-week-24.jpg', 320, '/images/photos/tech-week-320.jpg'],
  ['/images/drone.jpeg', 640, '/images/photos/drone-640.jpg']
])('uses a bounded local variant for %s at %s pixels', (src, size, expected) => {
  expect(getPhotoImageUrl(src, size)).toBe(expected);
});

test.each([
  ['/images/tech-week-24.jpg', 1600],
  ['/images/drone.jpeg', 2400]
])('does not upscale a smaller bundled photo %s', (src, size) => {
  expect(getPhotoImageUrl(src, size)).toBe(src);
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
