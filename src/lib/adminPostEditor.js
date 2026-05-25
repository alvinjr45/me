import heic2any from 'heic2any';

export const emptySection = {
  heading: '',
  paragraphs: '',
  bullets: ''
};

export const emptyMediaUrl = {
  type: 'image',
  src: '',
  alt: '',
  caption: '',
  poster: ''
};

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export function createEmptyPostForm(today) {
  return {
    adminSecret: '',
    title: '',
    originalSlug: '',
    eyebrow: 'Journal',
    excerpt: '',
    publishedAt: today,
    tags: '',
    coverImageUrl: '',
    coverImageAlt: '',
    isPublished: true
  };
}

export function getSupabaseFunctionHeaders({ json = false } = {}) {
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
  const headers = {};

  if (json) {
    headers['Content-Type'] = 'application/json';
  }

  if (anonKey) {
    headers.Authorization = `Bearer ${anonKey}`;
    headers.apikey = anonKey;
  }

  return headers;
}

export function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function toTextList(value) {
  return Array.isArray(value) ? value.join('\n\n') : '';
}

export function toInputDate(value, fallback) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toISOString().slice(0, 10);
}

export function toLines(value) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function isHeicFile(file) {
  const fileName = file.name.toLowerCase();
  return file.type === 'image/heic' || file.type === 'image/heif' || fileName.endsWith('.heic') || fileName.endsWith('.heif');
}

export async function normalizeUploadFile(file) {
  if (!isHeicFile(file)) {
    return file;
  }

  let converted;

  try {
    converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92
    });
  } catch {
    throw new Error(`HEIC conversion failed for ${file.name}. Export it as JPG or try a different browser.`);
  }

  const blob = Array.isArray(converted) ? converted[0] : converted;
  const baseName = file.name.replace(/\.(heic|heif)$/i, '');

  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error(`HEIC file ${file.name} is too large after conversion. Keep uploads under 50 MB or resize it first.`);
  }

  return new File([blob], `${baseName || 'upload'}.jpg`, {
    type: 'image/jpeg',
    lastModified: file.lastModified
  });
}
