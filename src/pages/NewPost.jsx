import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLogin from '../components/AdminLogin';
import {
  createEmptyPostForm,
  emptyMediaUrl,
  emptySection,
  formatBackendError,
  getSupabaseFunctionHeaders,
  normalizeUploadFile,
  readResponsePayload,
  slugify,
  toInputDate,
  toLines,
  toTextList,
  validateTotalUploadSize
} from '../lib/adminPostEditor';
import './Admin.css';

function NewPost({ slug = null, access, onBusy }) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const navigate = useNavigate();
  const [form, setForm] = useState(() => createEmptyPostForm(today));
  const [coverFile, setCoverFile] = useState(null);
  const [sections, setSections] = useState([{ ...emptySection }]);
  const [mediaUrls, setMediaUrls] = useState([{ ...emptyMediaUrl }]);
  const [mediaFiles, setMediaFiles] = useState([]);
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
    setForm(createEmptyPostForm(today));
    setCoverFile(null);
    setSections([{ ...emptySection }]);
    setMediaUrls([{ ...emptyMediaUrl }]);
    setMediaFiles([]);
    setStatus('idle');
    setMessage('');
    navigate('/admin/new');
  }

  function handleEditPost(post) {
    setForm({
      title: post.title || '',
      originalSlug: post.slug || '',
      eyebrow: post.eyebrow || 'Journal',
      excerpt: post.excerpt || '',
      publishedAt: toInputDate(post.published_at, today),
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
      coverImageUrl: post.cover_image_url || '',
      coverImageAlt: post.cover_image_alt || '',
      isPublished: Boolean(post.is_published)
    });
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

  useEffect(() => {
    if (access.session && slug) {
      const post = access.session.posts.find((item) => item.slug === slug);
      if (post) {
        handleEditPost(post);
      } else {
        setStatus('error');
        setMessage(`No post found for /blog/${slug}.`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access.session?.secret, slug]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!access.session) return;
    try {
      onBusy(true);
      setStatus('saving');
      setMessage('');

      const body = new FormData();
      body.append('action', 'save');
      body.append('adminSecret', access.session.secret);
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

      validateTotalUploadSize([coverFile, ...mediaFiles.map(({ file }) => file)].filter(Boolean));

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
        headers: getSupabaseFunctionHeaders(),
        body
      });
      const payload = await readResponsePayload(response);
      const result = payload.data || {};

      if (!response.ok) {
        console.error('Post save failed', { status: response.status, payload: payload.raw });
        const fallback =
          response.status === 546
            ? 'Publish failed (546): Supabase Edge Function hit a resource limit. Resize uploads or use media URLs for larger videos.'
            : `Publish failed (${response.status}): ${result.error || payload.raw || 'Unable to publish post.'}`;

        throw new Error(formatBackendError(result, fallback));
      }

      setStatus('saved');
      setForm((current) => ({
        ...current,
        originalSlug: result.post.slug
      }));
      setMessage(`Saved /blog/${result.post.slug}`);
      window.dispatchEvent(new Event('ajt3-posts-updated'));
      try { await access.refreshPosts(); } catch { setMessage(`Saved /blog/${result.post.slug}. Refresh the posts list to see the latest changes.`); }
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    } finally {
      onBusy(false);
    }
  }

  return (
    <main className="admin-page admin-page--mission-control">
      {!access.session ? (
        <AdminLogin access={access} />
      ) : (
        <form className="admin-page__form" onSubmit={handleSubmit}>
          <header className="admin-page__header">
            <p>Mission Control / Publishing</p>
            <h1>Post Editor</h1>
          </header>

          <section className="admin-page__panel">
            <div className="admin-page__panel-title">
              <h2>Post</h2>
              <div className="admin-page__button-group">
                <button type="button" onClick={handleNewPost} disabled={status === 'saving'}>
                  New blank post
                </button>
                <button type="button" disabled={status === 'saving'} onClick={() => navigate('/admin/posts')}>
                  Back to dashboard
                </button>
              </div>
            </div>
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
              <input
                type="file"
                accept="image/*,.heic,.heif"
                onChange={(event) => setCoverFile(event.target.files[0] || null)}
              />
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
              <input
                type="file"
                accept="image/*,video/*,.heic,.heif"
                multiple
                onChange={(event) => handleMediaFiles(event.target.files)}
              />
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

export default NewPost;
