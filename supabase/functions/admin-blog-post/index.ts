import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function getAllowedOrigin(request: Request) {
  const requestOrigin = request.headers.get('origin') || '';
  const configuredOrigins = Deno.env.get('ADMIN_CORS_ORIGINS') || Deno.env.get('ADMIN_CORS_ORIGIN') || '*';
  const allowedOrigins = configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.includes('*')) {
    return '*';
  }

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  return allowedOrigins[0] || '*';
}

function corsHeaders(request: Request) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(request),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
}

function jsonResponse(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      'Content-Type': 'application/json'
    }
  });
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseJsonArray(value: FormDataEntryValue | null) {
  if (!value || typeof value !== 'string') {
    return [];
  }

  const parsed = JSON.parse(value);
  return Array.isArray(parsed) ? parsed : [];
}

function requireFormData(formData: FormData | null) {
  if (!formData) {
    throw new Error('Form data is required for this action');
  }

  return formData;
}

function extensionForFile(file: File) {
  const existing = file.name.split('.').pop();

  if (existing && existing !== file.name) {
    return existing.toLowerCase();
  }

  if (file.type === 'image/jpeg') {
    return 'jpg';
  }

  if (file.type === 'image/png') {
    return 'png';
  }

  if (file.type === 'image/webp') {
    return 'webp';
  }

  if (file.type === 'video/mp4') {
    return 'mp4';
  }

  if (file.type === 'video/quicktime') {
    return 'mov';
  }

  return 'bin';
}

function normalizePublishedAt(value: FormDataEntryValue | null) {
  const rawValue = String(value || '').trim();

  if (!rawValue) {
    return new Date().toISOString();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return `${rawValue}T12:00:00.000Z`;
  }

  return rawValue;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(request) });
  }

  if (request.method !== 'POST') {
    return jsonResponse(request, { error: 'Method not allowed' }, 405);
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const jsonBody = isJson ? await request.json() : null;
    const formData = isJson ? null : await request.formData();
    const action = String(jsonBody?.action || formData?.get('action') || 'save');
    const adminSecret = String(jsonBody?.adminSecret || formData?.get('adminSecret') || '');
    const expectedSecret = requiredEnv('ADMIN_POST_SECRET');

    if (!adminSecret || adminSecret !== expectedSecret) {
      return jsonResponse(request, { error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'));

    if (action === 'list') {
      const { data, error } = await supabase
        .from('ajt3_blog_posts')
        .select(
          'slug,title,eyebrow,excerpt,published_at,cover_image_url,cover_image_alt,tags,sections,media,is_published,updated_at'
        )
        .order('published_at', { ascending: false });

      if (error) {
        throw error;
      }

      return jsonResponse(request, { posts: data });
    }

    if (action !== 'save') {
      return jsonResponse(request, { error: 'Unknown action' }, 400);
    }

    const saveFormData = requireFormData(formData);
    const bucket = Deno.env.get('BLOG_MEDIA_BUCKET') || 'blog-media';
    const mediaPrefix = (Deno.env.get('BLOG_MEDIA_PREFIX') || 'ajt3/me/blog').replace(/^\/+|\/+$/g, '');
    const title = String(saveFormData.get('title') || '').trim();
    const slug = slugify(title);
    const originalSlug = String(saveFormData.get('originalSlug') || '').trim();

    if (!title || !slug) {
      return jsonResponse(request, { error: 'Title is required' }, 400);
    }

    if (originalSlug && originalSlug !== slug) {
      const { data: existingPost, error: existingError } = await supabase
        .from('ajt3_blog_posts')
        .select('slug')
        .eq('slug', slug)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingPost) {
        return jsonResponse(request, { error: 'A post with this title URL already exists' }, 409);
      }
    }

    async function uploadFile(file: File, folder: string) {
      const path = [mediaPrefix, slug, folder, `${crypto.randomUUID()}.${extensionForFile(file)}`].filter(Boolean).join('/');
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false
      });

      if (error) {
        throw error;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    }

    let coverImageUrl = String(saveFormData.get('coverImageUrl') || '').trim();
    const coverFile = saveFormData.get('coverFile');

    if (coverFile instanceof File && coverFile.size > 0) {
      coverImageUrl = await uploadFile(coverFile, 'cover');
    }

    const mediaUrls = parseJsonArray(saveFormData.get('mediaUrls'));
    const uploadedMediaMeta = parseJsonArray(saveFormData.get('uploadedMediaMeta'));
    const uploadedFiles = saveFormData.getAll('mediaFiles').filter((item): item is File => item instanceof File && item.size > 0);
    const uploadedMedia = [];

    for (const [index, file] of uploadedFiles.entries()) {
      const meta = uploadedMediaMeta[index] || {};
      const publicUrl = await uploadFile(file, 'media');
      uploadedMedia.push({
        type: meta.type || (file.type.startsWith('video/') ? 'video' : 'image'),
        src: publicUrl,
        alt: meta.alt || '',
        caption: meta.caption || ''
      });
    }

    const post = {
      slug,
      title,
      eyebrow: String(saveFormData.get('eyebrow') || 'Journal').trim(),
      excerpt: String(saveFormData.get('excerpt') || '').trim(),
      published_at: normalizePublishedAt(saveFormData.get('publishedAt')),
      cover_image_url: coverImageUrl,
      cover_image_alt: String(saveFormData.get('coverImageAlt') || title).trim(),
      tags: parseJsonArray(saveFormData.get('tags')),
      sections: parseJsonArray(saveFormData.get('sections')),
      media: [...mediaUrls, ...uploadedMedia],
      is_published: String(saveFormData.get('isPublished') || 'true') === 'true'
    };

    const { data, error } = await supabase.from('ajt3_blog_posts').upsert(post, { onConflict: 'slug' }).select('slug').single();

    if (error) {
      throw error;
    }

    if (originalSlug && originalSlug !== slug) {
      const { error: deleteError } = await supabase.from('ajt3_blog_posts').delete().eq('slug', originalSlug);

      if (deleteError) {
        throw deleteError;
      }
    }

    return jsonResponse(request, { post: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save post';
    return jsonResponse(request, { error: message }, 500);
  }
});
