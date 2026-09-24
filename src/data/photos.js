import { supabase } from '../lib/supabaseClient';

export const photoAlbums = [
  { id: 'dogs', title: 'Drake & Josh', description: 'The usual suspects.' },
  { id: 'life', title: 'Life lately', description: 'The moments worth keeping.' },
  { id: 'tech', title: 'Out of office', description: 'Curiosity, out in the world.' }
];

export const photos = [
  { id: 'drake', src: '/images/dogs/drake.jpg', title: 'Drake', album: 'dogs', alt: 'Portrait of Drake', width: 3024, height: 4032 },
  { id: 'josh', src: '/images/dogs/josh.jpg', title: 'Josh', album: 'dogs', alt: 'Portrait of Josh', width: 4284, height: 5712 },
  { id: 'graduation', src: '/images/IMG_4870.JPG', title: 'A chapter complete', album: 'life', alt: 'AJ in graduation attire, sitting outside on campus', width: 5184, height: 3456 },
  { id: 'tech-week', src: '/images/tech-week-24.jpg', title: 'IBM Tech 2024', album: 'tech', alt: 'Illuminated IBM Tech 2024 sign at an event', width: 1290, height: 1233 },
  { id: 'drone', src: '/images/drone.jpeg', title: 'Ready for takeoff', album: 'tech', alt: 'A drone hovering above a driveway', width: 1290, height: 1665 }
];

export function normalizePhoto(photo) {
  return {
    id: photo.id, src: photo.image_url, title: photo.title, album: photo.album_id,
    alt: photo.alt_text || photo.title, caption: photo.caption || '',
    width: photo.width, height: photo.height, sortOrder: photo.sort_order,
    isPublished: photo.is_published
  };
}

export async function getPhotoLibrary() {
  if (!supabase) return { photos, albums: photoAlbums };
  const [photoResult, albumResult] = await Promise.all([
    supabase.from('ajt3_photos').select('*').eq('is_published', true).order('sort_order').order('created_at').order('id'),
    supabase.from('ajt3_photo_albums').select('*').order('sort_order').order('title').order('id')
  ]);
  if (photoResult.error || albumResult.error) throw new Error('The photo library is unavailable. Please try again.');
  return { photos: (photoResult.data || []).map(normalizePhoto), albums: albumResult.data || [] };
}
