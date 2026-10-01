import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLogin from '../components/AdminLogin';
import {
  createEmptyPostForm,
  emptySection,
  formatBackendError,
  getSupabaseFunctionHeaders,
  HEIC_ACCEPT,
  normalizeUploadFile,
  readResponsePayload,
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
  const [existingMedia, setExistingMedia] = useState([]);
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

  function handleMediaFiles(files) {
    setMediaFiles(
      Array.from(files).map((file) => ({
        file,
        type: file.type.startsWith('video/') ? 'video' : 'image'
      }))
    );
  }

  function handleNewPost() {
    setForm(createEmptyPostForm(today));
    setCoverFile(null);
    setSections([{ ...emptySection }]);
    setExistingMedia([]);
    setMediaFiles([]);
    setStatus('idle');
    setMessage('');
    navigate('/admin/new');
  }

  function handleEditPost(post) {
    const primaryCategory = Array.isArray(post.tags) && post.tags.length ? post.tags[0] : post.eyebrow;
    setForm({
      title: post.title || '',
      originalSlug: post.slug || '',
      category: primaryCategory
        ? `${primaryCategory.charAt(0).toUpperCase()}${primaryCategory.slice(1)}`
        : 'Journal',
      excerpt: post.excerpt || '',
      publishedAt: toInputDate(post.published_at, today),
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
    setExistingMedia(Array.isArray(post.media) ? post.media : []);
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
      const category = form.category.trim() || 'Journal';
      body.append('category', category);
      body.append('eyebrow', category);
      body.append('excerpt', form.excerpt);
      body.append('publishedAt', form.publishedAt);
      body.append('tags', JSON.stringify([category.toLowerCase()]));
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
      body.append('mediaUrls', JSON.stringify(existingMedia.filter((item) => item.src?.trim())));
      body.append(
        'uploadedMediaMeta',
        JSON.stringify(mediaFiles.map(({ type }) => ({ type })))
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
            ? 'Publish failed (546): Supabase Edge Function hit a resource limit. Resize large uploads and try again.'
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
            <div className="admin-page__row">
              <label>
                Category
                <input
                  required
                  placeholder="Dogs"
                  value={form.category}
                  onChange={(event) => updateField('category', event.target.value)}
                />
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
          </section>

          <section className="admin-page__panel">
            <h2>Cover</h2>
            <label>
              Upload cover
              <input
                type="file"
                accept={`image/*,${HEIC_ACCEPT}`}
                onChange={(event) => setCoverFile(event.target.files[0] || null)}
              />
            </label>
            <p className="admin-page__hint">JPG, PNG, WebP, GIF, or HEIC. HEIC files are converted to JPG when saved. Covers display at 16:9; upload 1600 x 900 or larger for the cleanest crop.</p>
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
                accept={`image/*,video/*,${HEIC_ACCEPT}`}
                multiple
                onChange={(event) => handleMediaFiles(event.target.files)}
              />
            </label>
            <p className="admin-page__hint">HEIC photos are converted to JPG when the post is saved.</p>
            {mediaFiles.length ? (
              <ul className="admin-page__media-list" aria-label="New media">
                {mediaFiles.map((item, index) => (
                  <li key={`${item.file.name}-${item.file.lastModified}-${index}`}>
                    <span>{item.file.name}</span>
                    <button
                      type="button"
                      disabled={status === 'saving'}
                      aria-label={`Remove ${item.file.name}`}
                      onClick={() => setMediaFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {existingMedia.length ? (
              <>
                <h3>Existing media</h3>
                <ul className="admin-page__media-list">
                  {existingMedia.map((item, index) => {
                    const label = item.caption || item.alt || `${item.type === 'video' ? 'Video' : 'Photo'} ${index + 1}`;
                    return (
                      <li key={`${item.src}-${index}`}>
                        <span>{label}</span>
                        <button
                          type="button"
                          disabled={status === 'saving'}
                          aria-label={`Remove ${label}`}
                          onClick={() => setExistingMedia((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                        >
                          Remove
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : null}
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
