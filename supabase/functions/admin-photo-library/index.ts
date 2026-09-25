import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function headers(request: Request) {
  const origins = (Deno.env.get('ADMIN_CORS_ORIGINS') || Deno.env.get('ADMIN_CORS_ORIGIN') || '*').split(',').map((item) => item.trim());
  const origin = request.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': origins.includes('*') ? '*' : origins.includes(origin) ? origin : origins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    Vary: 'Origin'
  };
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function integer(value: unknown, fallback: number | null = 0) {
  if (value === '' || value === null || value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 1000000) throw new Error('Order and dimensions must be whole numbers between 0 and 1000000.');
  return number;
}

function text(value: unknown, max: number, required = false) {
  const result = String(value || '').trim();
  if ((required && !result) || result.length > max) throw new Error(`Enter ${required ? '1' : '0'} to ${max} characters for each text field.`);
  return result;
}

function imageUrl(value: unknown) {
  const url = text(value, 2048, true);
  if (/^\/images\/[A-Za-z0-9_ /().%-]+$/.test(url) && !url.includes('..')) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' && !parsed.username && !parsed.password) return url;
  } catch { /* Report the same validation error for every invalid URL. */ }
  throw new Error('Use an HTTPS image URL or an existing /images/ path.');
}

Deno.serve(async (request) => {
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: headers(request) });
  if (request.method === 'OPTIONS') return respond({});
  if (request.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);

  try {
    const secret = request.headers.get('x-admin-secret');
    if (!secret || secret !== requiredEnv('ADMIN_POST_SECRET')) return respond({ error: 'Unauthorized' }, 401);
    const client = createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'));
    const isJson = request.headers.get('content-type')?.includes('application/json');
    const json = isJson ? await request.json() : null;
    const form = isJson ? null : await request.formData();
    const value = (key: string) => json ? json[key] : form?.get(key);
    const action = value('action');

    if (action === 'save_profile') {
      const file = form?.get('file');
      const types: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
      if (!(file instanceof File) || !types[file.type] || file.size === 0 || file.size > 20 * 1024 * 1024) {
        return respond({ error: 'Upload a JPG, PNG, WebP, or GIF under 20 MB.' }, 400);
      }
      const bucket = Deno.env.get('BLOG_MEDIA_BUCKET') || 'blog-media';
      const path = `ajt3/me/profile/${crypto.randomUUID()}.${types[file.type]}`;
      const { error: uploadError } = await client.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) return respond({ error: 'Profile photo upload failed. Please retry.' }, 500);
      const image_url = client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      const { data, error } = await client.from('ajt3_admin_profile').upsert({ id: 'admin', image_url, updated_at: new Date().toISOString() }).select('*').single();
      if (error) {
        await client.storage.from(bucket).remove([path]);
        return respond({ error: 'Unable to save your profile photo. Check that the admin-profile migration is applied and retry.' }, 500);
      }
      return respond({ profile: data });
    }

    if (action === 'list') {
      const [photos, albums] = await Promise.all([
        client.from('ajt3_photos').select('*').order('sort_order').order('created_at').order('id'),
        client.from('ajt3_photo_albums').select('*').order('sort_order').order('title').order('id')
      ]);
      if (photos.error || albums.error) return respond({ error: 'Photo library is unavailable. Apply the photo-library migration and retry.' }, 503);
      return respond({ photos: photos.data, albums: albums.data });
    }

    if (action !== 'save_photo' && action !== 'save_album') return respond({ error: 'Unknown action' }, 400);

    let record;
    try {
      const id = text(value('id'), 100) || crypto.randomUUID();
      const sort_order = integer(value('sort_order'));
      if (action === 'save_album') {
        record = { id, title: text(value('title'), 120, true), description: text(value('description'), 1000), sort_order };
      } else {
        const visibility = value('is_published');
        if (![true, false, 'true', 'false'].includes(visibility)) throw new Error('Choose whether the photo is published.');
        record = {
          id, title: text(value('title'), 160, true), album_id: text(value('album_id'), 100, true),
          alt_text: text(value('alt_text'), 500), caption: text(value('caption'), 2000),
          sort_order, is_published: visibility === true || visibility === 'true',
          width: integer(value('width'), null), height: integer(value('height'), null), image_url: ''
        };
        if (record.width === 0 || record.height === 0) throw new Error('Photo dimensions must be greater than zero, or left blank.');
        if (!(form?.get('file') instanceof File)) record.image_url = imageUrl(value('image_url'));
      }
    } catch (error) {
      return respond({ error: error instanceof Error ? error.message : 'Invalid photo details' }, 400);
    }

    if (action === 'save_album') {
      const { data, error } = await client.from('ajt3_photo_albums').upsert(record).select('*').single();
      if (error) return respond({ error: 'Unable to save the album. Please retry.' }, 500);
      return respond({ album: data });
    }

    const photo = record as { id: string; album_id: string; image_url: string } & Record<string, unknown>;
    const { data: album, error: albumError } = await client.from('ajt3_photo_albums').select('id').eq('id', photo.album_id).maybeSingle();
    if (albumError) return respond({ error: 'Unable to check the album. Please retry.' }, 500);
    if (!album) return respond({ error: 'Choose an existing album.' }, 400);

    const file = form?.get('file');
    const bucket = Deno.env.get('BLOG_MEDIA_BUCKET') || 'blog-media';
    let uploadedPath = '';
    if (file instanceof File) {
      const types: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
      if (!types[file.type] || file.size === 0 || file.size > 20 * 1024 * 1024) return respond({ error: 'Upload a JPG, PNG, WebP, or GIF under 20 MB.' }, 400);
      uploadedPath = `ajt3/me/photos/${crypto.randomUUID()}.${types[file.type]}`;
      const { error } = await client.storage.from(bucket).upload(uploadedPath, file, { contentType: file.type, upsert: false });
      if (error) return respond({ error: 'Image upload failed. Check the media bucket and retry.' }, 500);
      photo.image_url = client.storage.from(bucket).getPublicUrl(uploadedPath).data.publicUrl;
    }

    const { data, error } = await client.from('ajt3_photos').upsert(photo).select('*').single();
    if (error) {
      if (uploadedPath) await client.storage.from(bucket).remove([uploadedPath]);
      return respond({ error: 'Unable to save this photo. Your previous photo is unchanged.' }, 500);
    }
    return respond({ photo: data });
  } catch {
    return respond({ error: 'Photo service is unavailable. Check its configuration and retry.' }, 500);
  }
});
