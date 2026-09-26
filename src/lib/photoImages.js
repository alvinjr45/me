export function getPhotoImageUrl(src, size) {
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
