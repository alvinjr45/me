import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDogIncidentDraft, formatIncidentCount } from '../data/dogIncident';
import { getSupabaseFunctionHeaders, toInputDate } from '../lib/adminPostEditor';
import './Admin.css';

function Admin() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const navigate = useNavigate();
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
  const [posts, setPosts] = useState([]);
  const [incident, setIncident] = useState(() => createDogIncidentDraft(today));
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [incidentStatus, setIncidentStatus] = useState('idle');
  const [incidentMessage, setIncidentMessage] = useState('');

  const publishUrl = process.env.REACT_APP_SUPABASE_URL
    ? `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/admin-blog-post`
    : '';
  const incidentUrl = process.env.REACT_APP_SUPABASE_URL
    ? `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/admin-dog-incident`
    : '';

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function updateIncidentField(name, value) {
    setIncident((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function readResponsePayload(response) {
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

  function formatBackendError(result, fallback) {
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

  function getIncidentCountValue(result, fallback) {
    const primary = Number(result?.incident?.incidentCount);
    const secondary = Number(result?.incident?.incident_count);

    if (Number.isFinite(primary)) {
      return primary;
    }

    if (Number.isFinite(secondary)) {
      return secondary;
    }

    return fallback;
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
        headers: getSupabaseFunctionHeaders({ json: true }),
        body: JSON.stringify({
          action: 'list',
          adminSecret
        })
      });
      const payload = await readResponsePayload(response);
      const result = payload.data || {};

      if (!response.ok) {
        console.error('Post list failed', { status: response.status, payload: payload.raw });
        throw new Error(`Post list failed (${response.status}): ${result.error || payload.raw || 'Unable to load posts.'}`);
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

  async function loadIncident({ silent = false, adminSecret = form.adminSecret } = {}) {
    if (!incidentUrl) {
      setIncidentStatus('error');
      setIncidentMessage('Supabase URL is not configured.');
      return false;
    }

    if (!adminSecret) {
      setIncidentStatus('error');
      setIncidentMessage('Enter the admin secret before loading the incident.');
      return false;
    }

    if (!silent) {
      setIncidentStatus('loading');
      setIncidentMessage('');
    }

    try {
      const response = await fetch(incidentUrl, {
        method: 'GET',
        headers: {
          ...getSupabaseFunctionHeaders(),
          'x-admin-secret': adminSecret
        }
      });
      const payload = await readResponsePayload(response);
      const result = payload.data || {};

      if (!response.ok) {
        console.error('Incident load failed', { status: response.status, payload: payload.raw });
        throw new Error(
          formatBackendError(
            result,
            `Incident load failed (${response.status}): ${result.error || payload.raw || 'Unable to load the incident.'}`
          )
        );
      }

      setIncident({
        culprit: result.incident?.culprit || '',
        incident: result.incident?.incident || '',
        incidentAt: result.incident?.incidentAt || result.incident?.incident_at || today,
        incidentCount: getIncidentCountValue(result, null)
      });

      if (!silent) {
        setIncidentStatus('idle');
        const incidentCount = getIncidentCountValue(result, null);
        const countLabel = formatIncidentCount(incidentCount);
        setIncidentMessage(
          result.incident ? `Latest incident loaded.${countLabel ? ` ${countLabel}` : ''}` : 'No incident data seeded yet.'
        );
      }

      return true;
    } catch (error) {
      setIncidentStatus('error');
      setIncidentMessage(error.message);
      return false;
    }
  }

  async function handleUnlock(event) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    const didLoad = await loadPosts({ adminSecret: form.adminSecret });
    await loadIncident({ silent: true, adminSecret: form.adminSecret });

    if (didLoad) {
      sessionStorage.setItem('ajt3_admin_secret', form.adminSecret);
      setIsUnlocked(true);
      setStatus('idle');
      setMessage('');
    }
  }

  function handleLock() {
    setIsUnlocked(false);
    setPosts([]);
    setIncident(createDogIncidentDraft(today));
    setForm((current) => ({
      ...current,
      adminSecret: ''
    }));
    sessionStorage.removeItem('ajt3_admin_secret');
    setIncidentStatus('idle');
    setIncidentMessage('');
  }

  async function handleIncidentSubmit(event) {
    event.preventDefault();

    if (!incident.culprit) {
      setIncidentStatus('error');
      setIncidentMessage('Select a culprit before saving.');
      return;
    }

    if (!incident.incident.trim()) {
      setIncidentStatus('error');
      setIncidentMessage('Incident details are required.');
      return;
    }

    try {
      setIncidentStatus('saving');
      setIncidentMessage('');

      const body = new FormData();
      body.append('culprit', incident.culprit);
      body.append('incident', incident.incident);
      body.append('incidentAt', incident.incidentAt);

      const response = await fetch(incidentUrl, {
        method: 'POST',
        headers: {
          ...getSupabaseFunctionHeaders(),
          'x-admin-secret': form.adminSecret
        },
        body
      });
      const payload = await readResponsePayload(response);
      const result = payload.data || {};

      if (!response.ok) {
        console.error('Incident save failed', { status: response.status, payload: payload.raw });
        throw new Error(
          formatBackendError(
            result,
            `Incident save failed (${response.status}): ${result.error || payload.raw || 'Unable to save the latest incident.'}`
          )
        );
      }

      setIncidentStatus('saved');
      setIncident({
        culprit: result.incident?.culprit || incident.culprit,
        incident: result.incident?.incident || incident.incident,
        incidentAt: result.incident?.incidentAt || result.incident?.incident_at || incident.incidentAt,
        incidentCount: getIncidentCountValue(result, incident.incidentCount)
      });
      const incidentCount = getIncidentCountValue(result, incident.incidentCount);
      const countLabel = formatIncidentCount(incidentCount);
      setIncidentMessage(`Latest incident saved.${countLabel ? ` ${countLabel}` : ''}`);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('ajt3_dog_incident_updated_at', String(Date.now()));
      }
    } catch (error) {
      setIncidentStatus('error');
      setIncidentMessage(error.message);
    }
  }

  return (
    <main className="admin-page">
      {!isUnlocked ? (
        <form className="admin-page__form admin-page__form--gate" onSubmit={handleUnlock}>
          <header className="admin-page__header">
            <p>AJT3 Admin</p>
            <h1>Blog Manager</h1>
          </header>

          <section className="admin-page__panel admin-page__gate">
            <label>
              Password
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
        <div className="admin-page__dashboard">
          <header className="admin-page__header">
            <p>AJT3 Admin</p>
            <h1>Blog Manager</h1>
          </header>

          <section className="admin-page__panel">
            <div className="admin-page__panel-title">
              <h2>Posts</h2>
              <div className="admin-page__button-group">
                <button type="button" onClick={() => navigate('/admin/new')}>
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
                    className="admin-page__post-button"
                    onClick={() => navigate(`/admin/new?slug=${encodeURIComponent(post.slug)}`)}
                  >
                    <span>{post.title}</span>
                    <small>{post.is_published ? 'Published' : 'Draft'}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <section className="admin-page__panel">
            <div className="admin-page__panel-title">
              <h2>Dog incident</h2>
              <div className="admin-page__button-group">
                <button type="button" onClick={handleIncidentSubmit} disabled={incidentStatus === 'saving' || !incidentUrl}>
                  {incidentStatus === 'saving' ? 'Saving...' : 'Save incident'}
                </button>
              </div>
            </div>
            <div className="admin-page__row">
              <label>
                Culprit
                <select value={incident.culprit} onChange={(event) => updateIncidentField('culprit', event.target.value)}>
                  <option value="" disabled>
                    Select a culprit
                  </option>
                  <option value="Drake">Drake</option>
                  <option value="Josh">Josh</option>
                </select>
              </label>
              <label>
                Incident date
                <input
                  type="date"
                  value={toInputDate(incident.incidentAt, today)}
                  onChange={(event) => updateIncidentField('incidentAt', event.target.value)}
                />
              </label>
            </div>
            <label>
              What happened
              <textarea value={incident.incident} onChange={(event) => updateIncidentField('incident', event.target.value)} />
            </label>
            {incidentMessage ? <p className={`admin-page__message admin-page__message--${incidentStatus}`}>{incidentMessage}</p> : null}
          </section>

          {message ? <p className={`admin-page__message admin-page__message--${status}`}>{message}</p> : null}
        </div>
      )}
    </main>
  );
}

export default Admin;
