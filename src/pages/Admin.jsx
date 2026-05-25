import React, { useMemo, useState } from 'react';
import heic2any from 'heic2any';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import './Admin.css';

const emptySection = {
  heading: '',
  paragraphs: '',
  bullets: ''
};

const emptyMediaUrl = {
  type: 'image',
  src: '',
  alt: '',
  caption: '',
  poster: ''
};

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toTextList(value) {
  return Array.isArray(value) ? value.join('\n\n') : '';
}

function toInputDate(value, fallback) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toISOString().slice(0, 10);
}

function toLines(value) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function isHeicFile(file) {
  const fileName = file.name.toLowerCase();
  return file.type === 'image/heic' || file.type === 'image/heif' || fileName.endsWith('.heic') || fileName.endsWith('.heif');
}

async function normalizeUploadFile(file) {
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

function Admin() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [form, setForm] = useState({
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
  });
  const [coverFile, setCoverFile] = useState(null);
  const [sections, setSections] = useState([{ ...emptySection }]);
  const [mediaUrls, setMediaUrls] = useState([{ ...emptyMediaUrl }]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const publishUrl = process.env.REACT_APP_SUPABASE_URL
    ? `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/admin-blog-post`
    : '';

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function updateSection(index, name, value) {
    setSections((current) =>
      current.map((section, sectionIndex) => (sectionIndex === index ? { ...section, [name]: value } : section))
    );
  }

  function updateMediaUrl(index, name, value) {
    setMediaUrls((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [name]: value } : item)));
  }

  function updateMediaFile(index, name, value) {
    setMediaFiles((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [name]: value } : item)));
  }

  function handleMediaFiles(files) {
    setMediaFiles(
      Array.from(files).map((file) => ({
        file,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        alt: '',
        caption: ''
      }))
    );
  }

  function handleNewPost() {
    setForm((current) => ({
      adminSecret: current.adminSecret,
      title: '',
      originalSlug: '',
      eyebrow: 'Journal',
      excerpt: '',
      publishedAt: today,
      tags: '',
      coverImageUrl: '',
      coverImageAlt: '',
      isPublished: true
    }));
    setCoverFile(null);
    setSections([{ ...emptySection }]);
    setMediaUrls([{ ...emptyMediaUrl }]);
    setMediaFiles([]);
    setMessage('');
    setStatus('idle');
  }

  function handleEditPost(post) {
    setForm((current) => ({
      adminSecret: current.adminSecret,
      title: post.title || '',
      originalSlug: post.slug || '',
      eyebrow: post.eyebrow || 'Journal',
      excerpt: post.excerpt || '',
      publishedAt: toInputDate(post.published_at, today),
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
      coverImageUrl: post.cover_image_url || '',
      coverImageAlt: post.cover_image_alt || '',
      isPublished: Boolean(post.is_published)
    }));
    setCoverFile(null);
    setSections(
      post.sections?.length
        ? post.sections.map((section) => ({
            heading: section.heading || '',
            paragraphs: toTextList(section.paragraphs),
            bullets: Array.isArray(section.bullets) ? section.bullets.join('\n') : ''
          }))
        : [{ ...emptySection }]
    );
    setMediaUrls(
      post.media?.length
        ? post.media.map((item) => ({
            type: item.type || 'image',
            src: item.src || '',
            alt: item.alt || '',
            caption: item.caption || '',
            poster: item.poster || ''
          }))
        : [{ ...emptyMediaUrl }]
    );
    setMediaFiles([]);
    setStatus('idle');
    setMessage(`Editing /blog/${post.slug}`);
  }

  async function loadPosts({ silent = false, adminSecret = form.adminSecret } = {}) {
    if (!publishUrl) {
      setStatus('error');
      setMessage('Supabase URL is not configured.');
      return false;
    }

    if (!adminSecret) {
      setStatus('error');
      setMessage('Enter the admin secret before loading posts.');
      return false;
    }

    if (!silent) {
      setStatus('loading');
      setMessage('');
    }

    try {
      const response = await fetch(publishUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'list',
          adminSecret
        })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to load posts.');
      }

      setPosts(result.posts || []);

      if (!silent) {
        setStatus('idle');
        setMessage(`Loaded ${result.posts?.length || 0} posts.`);
      }

      return true;
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
      return false;
    }
  }

  async function handleUnlock(event) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    const didLoad = await loadPosts({ adminSecret: form.adminSecret });

    if (didLoad) {
      setIsUnlocked(true);
      setStatus('idle');
      setMessage('');
    }
  }

  function handleLock() {
    setIsUnlocked(false);
    setPosts([]);
    handleNewPost();
    setForm((current) => ({
      ...current,
      adminSecret: ''
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setStatus('saving');
      setMessage('');

      const body = new FormData();
      body.append('action', 'save');
      body.append('adminSecret', form.adminSecret);
      body.append('originalSlug', form.originalSlug);
      body.append('title', form.title);
      body.append('eyebrow', form.eyebrow);
      body.append('excerpt', form.excerpt);
      body.append('publishedAt', form.publishedAt);
      body.append('tags', JSON.stringify(toLines(form.tags.replaceAll(',', '\n'))));
      body.append('coverImageUrl', form.coverImageUrl);
      body.append('coverImageAlt', form.coverImageAlt);
      body.append('isPublished', String(form.isPublished));
      body.append(
        'sections',
        JSON.stringify(
          sections
            .map((section) => ({
              heading: section.heading.trim(),
              paragraphs: toLines(section.paragraphs),
              bullets: toLines(section.bullets)
            }))
            .filter((section) => section.heading || section.paragraphs.length || section.bullets.length)
        )
      );
      body.append('mediaUrls', JSON.stringify(mediaUrls.filter((item) => item.src.trim())));
      body.append(
        'uploadedMediaMeta',
        JSON.stringify(mediaFiles.map(({ type, alt, caption }) => ({ type, alt, caption })))
      );

      if (coverFile) {
        const uploadCoverFile = await normalizeUploadFile(coverFile);
        body.append('coverFile', uploadCoverFile);
      }

      for (const { file } of mediaFiles) {
        const uploadFile = await normalizeUploadFile(file);
        body.append('mediaFiles', uploadFile);
      }

      const response = await fetch(publishUrl, {
        method: 'POST',
        body
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to publish post.');
      }

      setStatus('saved');
      setForm((current) => ({
        ...current,
        originalSlug: result.post.slug
      }));
      await loadPosts({ silent: true });
      setMessage(`Saved /blog/${result.post.slug}`);
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    }
  }

  return (
    <main className="admin-page">
      {!isUnlocked ? (
        <form className="admin-page__form admin-page__form--gate" onSubmit={handleUnlock}>
          <header className="admin-page__header">
            <p>AJT3 Admin</p>
            <h1>Blog Manager</h1>
            <span>{isSupabaseConfigured ? 'Supabase connected' : 'Supabase env vars missing'}</span>
          </header>

          <section className="admin-page__panel admin-page__gate">
            <label>
              Admin secret
              <input
                required
                type="password"
                value={form.adminSecret}
                onChange={(event) => updateField('adminSecret', event.target.value)}
                autoComplete="current-password"
                autoFocus
              />
            </label>
            <button type="submit" disabled={status === 'loading' || !publishUrl}>
              {status === 'loading' ? 'Checking...' : 'Continue'}
            </button>
          </section>

          {message ? <p className={`admin-page__message admin-page__message--${status}`}>{message}</p> : null}
        </form>
      ) : (
      <form className="admin-page__form" onSubmit={handleSubmit}>
        <header className="admin-page__header">
          <p>AJT3 Admin</p>
          <h1>Blog Manager</h1>
          <span>{isSupabaseConfigured ? 'Supabase connected' : 'Supabase env vars missing'}</span>
        </header>

        <section className="admin-page__panel">
          <div className="admin-page__panel-title">
            <h2>Posts</h2>
            <div className="admin-page__button-group">
              <button type="button" onClick={() => loadPosts()} disabled={status === 'loading' || !publishUrl}>
                {status === 'loading' ? 'Loading...' : 'Refresh'}
              </button>
              <button type="button" onClick={handleNewPost}>
                New post
              </button>
              <button type="button" onClick={handleLock}>
                Lock
              </button>
            </div>
          </div>
          {posts.length ? (
            <div className="admin-page__post-list">
              {posts.map((post) => (
                <button
                  key={post.slug}
                  type="button"
                  className={post.slug === form.originalSlug ? 'admin-page__post-button admin-page__post-button--active' : 'admin-page__post-button'}
                  onClick={() => handleEditPost(post)}
                >
                  <span>{post.title}</span>
                  <small>{post.is_published ? 'Published' : 'Draft'}</small>
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="admin-page__panel">
          <label>
            Title
            <input required value={form.title} onChange={(event) => updateField('title', event.target.value)} />
          </label>
          {form.title ? <p className="admin-page__url-preview">URL: /blog/{slugify(form.title)}</p> : null}
          <div className="admin-page__row">
            <label>
              Eyebrow
              <input value={form.eyebrow} onChange={(event) => updateField('eyebrow', event.target.value)} />
            </label>
            <label>
              Publish date
              <input
                type="date"
                value={form.publishedAt}
                onChange={(event) => updateField('publishedAt', event.target.value)}
              />
            </label>
          </div>
          <label>
            Excerpt
            <textarea required value={form.excerpt} onChange={(event) => updateField('excerpt', event.target.value)} />
          </label>
          <label>
            Tags
            <input
              placeholder="dogs, music, site"
              value={form.tags}
              onChange={(event) => updateField('tags', event.target.value)}
            />
          </label>
        </section>

        <section className="admin-page__panel">
          <h2>Cover</h2>
          <label>
            Upload cover
            <input type="file" accept="image/*,.heic,.heif" onChange={(event) => setCoverFile(event.target.files[0] || null)} />
          </label>
          <p className="admin-page__hint">Covers display at 16:9. Upload 1600 x 900 or larger for the cleanest crop.</p>
          <label>
            Or cover URL
            <input value={form.coverImageUrl} onChange={(event) => updateField('coverImageUrl', event.target.value)} />
          </label>
          <label>
            Cover alt text
            <input value={form.coverImageAlt} onChange={(event) => updateField('coverImageAlt', event.target.value)} />
          </label>
        </section>

        <section className="admin-page__panel">
          <div className="admin-page__panel-title">
            <h2>Sections</h2>
            <button type="button" onClick={() => setSections((current) => [...current, { ...emptySection }])}>
              Add section
            </button>
          </div>
          {sections.map((section, index) => (
            <fieldset key={index}>
              <label>
                Heading
                <input value={section.heading} onChange={(event) => updateSection(index, 'heading', event.target.value)} />
              </label>
              <label>
                Paragraphs
                <textarea
                  value={section.paragraphs}
                  onChange={(event) => updateSection(index, 'paragraphs', event.target.value)}
                />
              </label>
              <label>
                Bullets
                <textarea value={section.bullets} onChange={(event) => updateSection(index, 'bullets', event.target.value)} />
              </label>
            </fieldset>
          ))}
        </section>

        <section className="admin-page__panel">
          <h2>Media</h2>
          <label>
            Upload photos or videos
            <input type="file" accept="image/*,video/*,.heic,.heif" multiple onChange={(event) => handleMediaFiles(event.target.files)} />
          </label>
          {mediaFiles.map((item, index) => (
            <fieldset key={item.file.name}>
              <legend>{item.file.name}</legend>
              <div className="admin-page__row">
                <label>
                  Alt text
                  <input value={item.alt} onChange={(event) => updateMediaFile(index, 'alt', event.target.value)} />
                </label>
                <label>
                  Caption
                  <input value={item.caption} onChange={(event) => updateMediaFile(index, 'caption', event.target.value)} />
                </label>
              </div>
            </fieldset>
          ))}

          <div className="admin-page__panel-title">
            <h3>Media URLs</h3>
            <button type="button" onClick={() => setMediaUrls((current) => [...current, { ...emptyMediaUrl }])}>
              Add URL
            </button>
          </div>
          {mediaUrls.map((item, index) => (
            <fieldset key={index}>
              <div className="admin-page__row">
                <label>
                  Type
                  <select value={item.type} onChange={(event) => updateMediaUrl(index, 'type', event.target.value)}>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </label>
                <label>
                  URL
                  <input value={item.src} onChange={(event) => updateMediaUrl(index, 'src', event.target.value)} />
                </label>
              </div>
              <div className="admin-page__row">
                <label>
                  Alt text
                  <input value={item.alt} onChange={(event) => updateMediaUrl(index, 'alt', event.target.value)} />
                </label>
                <label>
                  Caption
                  <input value={item.caption} onChange={(event) => updateMediaUrl(index, 'caption', event.target.value)} />
                </label>
              </div>
              {item.type === 'video' ? (
                <label>
                  Poster URL
                  <input value={item.poster} onChange={(event) => updateMediaUrl(index, 'poster', event.target.value)} />
                </label>
              ) : null}
            </fieldset>
          ))}
        </section>

        <div className="admin-page__actions">
          <label className="admin-page__toggle">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(event) => updateField('isPublished', event.target.checked)}
            />
            Published
          </label>
          <button type="submit" disabled={status === 'saving' || !publishUrl}>
            {status === 'saving' ? 'Publishing...' : 'Publish post'}
          </button>
        </div>

        {message ? <p className={`admin-page__message admin-page__message--${status}`}>{message}</p> : null}
      </form>
      )}
    </main>
  );
}

export default Admin;
