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

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MAX_TOTAL_UPLOAD_BYTES = 40 * 1024 * 1024;

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

export async function readResponsePayload(response) {
  const raw = await response.text();

  if (!raw) {
    return { raw: '', data: null };
  }

  try {
    return { raw, data: JSON.parse(raw) };
  } catch {
    return { raw, data: null };
  }
}

export function formatBackendError(result, fallback) {
  const details = result?.details;

  if (details && typeof details === 'object') {
    const parts = [];
    if (details.code) parts.push(`code=${details.code}`);
    if (details.message) parts.push(`message=${details.message}`);
    if (details.hint) parts.push(`hint=${details.hint}`);
    if (details.details) parts.push(`details=${details.details}`);

    if (parts.length) {
      return `${fallback} (${parts.join(', ')})`;
    }
  }

  return fallback;
}

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) {
    return '0 MB';
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function validateUploadFile(file) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `${file.name} is ${formatFileSize(file.size)}. Keep each upload under ${formatFileSize(MAX_UPLOAD_BYTES)}.`
    );
  }
}

export function validateTotalUploadSize(files) {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  if (totalSize > MAX_TOTAL_UPLOAD_BYTES) {
    throw new Error(
      `Selected uploads total ${formatFileSize(totalSize)}. Keep each save under ${formatFileSize(MAX_TOTAL_UPLOAD_BYTES)}.`
    );
  }
}

export function isHeicFile(file) {
  const fileName = file.name.toLowerCase();
  return file.type === 'image/heic' || file.type === 'image/heif' || fileName.endsWith('.heic') || fileName.endsWith('.heif');
}

export async function normalizeUploadFile(file) {
  validateUploadFile(file);

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
    throw new Error(
      `HEIC file ${file.name} is ${formatFileSize(blob.size)} after conversion. Keep uploads under ${formatFileSize(
        MAX_UPLOAD_BYTES
      )} or resize it first.`
    );
  }

  return new File([blob], `${baseName || 'upload'}.jpg`, {
    type: 'image/jpeg',
    lastModified: file.lastModified
  });
}
