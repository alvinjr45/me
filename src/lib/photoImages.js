const localPhotoVariants = {
  '/images/dogs/drake.jpg': { name: 'drake', maxSize: 2400 },
  '/images/dogs/josh.jpg': { name: 'josh', maxSize: 2400 },
  '/images/IMG_4870.JPG': { name: 'graduation', maxSize: 2400 },
  '/images/tech-week-24.jpg': { name: 'tech-week', maxSize: 640 },
  '/images/drone.jpeg': { name: 'drone', maxSize: 640 }
};

const localPhotoSizes = [320, 640, 1600, 2400];

export function getPhotoImageUrl(src, size) {
  const localPhoto = localPhotoVariants[src];
  if (localPhoto) {
    const variantSize = localPhotoSizes.find((candidate) => candidate >= size && candidate <= localPhoto.maxSize);
    return variantSize ? `/images/photos/${localPhoto.name}-${variantSize}.jpg` : src;
  }

  try {
    const url = new URL(src);
    const project = new URL(process.env.REACT_APP_SUPABASE_URL);
    const publicPath = '/storage/v1/object/public/';
    if (url.origin !== project.origin || !url.pathname.startsWith(publicPath)) return src;

    url.pathname = url.pathname.replace(publicPath, '/storage/v1/render/image/public/');
    url.searchParams.set('width', String(size));
    url.searchParams.set('height', String(size));
    url.searchParams.set('resize', 'contain');
    url.searchParams.set('quality', size > 640 ? '85' : '75');
    return url.toString();
  } catch {
    // Local assets and external image hosts retain their existing URLs.
    return src;
  }
}
