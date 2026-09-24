import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDogIncidentDraft, formatIncidentCount } from '../data/dogIncident';
import { formatBackendError, getSupabaseFunctionHeaders, readResponsePayload, toInputDate } from '../lib/adminPostEditor';
import './Admin.css';

function Admin({ access, section = 'posts', onBusy }) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [postMessage, setPostMessage] = useState('');
  const posts = access.session?.posts || [];
  const adminSecret = access.session?.secret || '';
  const [incident, setIncident] = useState(() => createDogIncidentDraft(today));
  const [incidentStatus, setIncidentStatus] = useState('idle');
  const [incidentMessage, setIncidentMessage] = useState('');

  const incidentUrl = process.env.REACT_APP_SUPABASE_URL
    ? `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/admin-dog-incident`
    : '';

  function updateIncidentField(name, value) {
    setIncident((current) => ({
      ...current,
      [name]: value
    }));
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

  async function loadIncident({ silent = false, signal } = {}) {
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
        signal,
        headers: {
          ...getSupabaseFunctionHeaders(),
          'x-admin-secret': adminSecret
        }
      });
      const payload = await readResponsePayload(response);
      const result = payload.data || {};
      if (signal?.aborted) return false;

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
      if (signal?.aborted) return false;
      setIncidentStatus('error');
      setIncidentMessage(error.message);
      return false;
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    if (adminSecret && section === 'dogs') loadIncident({ signal: controller.signal });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminSecret, section]);

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
      onBusy(true);
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
          'x-admin-secret': adminSecret
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
    } finally {
      onBusy(false);
    }
  }

  const matchingPosts = posts.filter((post) =>
    `${post.title} ${post.excerpt || ''}`.toLowerCase().includes(query.toLowerCase()) &&
    (filter === 'all' || (filter === 'published' ? post.is_published : !post.is_published))
  );

  return (
    <main className="admin-page admin-page--mission-control">
        <div className="admin-page__dashboard">
          {section === 'posts' && <>
          <dl className="admin-page__overview">
            <div><dt>Total posts</dt><dd>{posts.length}</dd></div>
            <div><dt>Published</dt><dd>{posts.filter((post) => post.is_published).length}</dd></div>
            <div><dt>Drafts</dt><dd>{posts.filter((post) => !post.is_published).length}</dd></div>
          </dl>

          <section className="admin-page__panel">
            <div className="admin-page__panel-title">
              <h2>Posts</h2>
              <div className="admin-page__button-group">
                <button type="button" onClick={async () => { try { await access.refreshPosts(); setPostMessage('Posts refreshed.'); } catch (error) { setPostMessage(error.message); } }}>Refresh</button>
                <button type="button" onClick={() => navigate('/admin/new')}>
                  New post
                </button>
              </div>
            </div>
            <div className="admin-page__row"><label>Search posts<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title or excerpt" /></label><label>Status<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All posts</option><option value="published">Published</option><option value="drafts">Drafts</option></select></label></div>
            {postMessage && <p role="status">{postMessage}</p>}
            {matchingPosts.length ? (
              <div className="admin-page__post-list">
                {matchingPosts.map((post) => (
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
            ) : <p className="admin-page__hint">{posts.length ? 'No posts match these filters.' : 'No posts yet. Start with your first dispatch.'}</p>}
          </section>
          </>}

          {section === 'dogs' && <section className="admin-page__panel">
            <div className="admin-page__panel-title">
              <h2>Dog incident</h2>
              <div className="admin-page__button-group">
                <button type="button" onClick={handleIncidentSubmit} disabled={incidentStatus === 'saving' || incidentStatus === 'loading' || !incidentUrl}>
                  {incidentStatus === 'saving' ? 'Saving...' : 'Save incident'}
                </button>
              </div>
            </div>
            <div className="admin-page__row">
              <label>
                Culprit
                <select disabled={incidentStatus === 'loading'} value={incident.culprit} onChange={(event) => updateIncidentField('culprit', event.target.value)}>
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
                  disabled={incidentStatus === 'loading'}
                  value={toInputDate(incident.incidentAt, today)}
                  onChange={(event) => updateIncidentField('incidentAt', event.target.value)}
                />
              </label>
            </div>
            <label>
              What happened
              <textarea disabled={incidentStatus === 'loading'} value={incident.incident} onChange={(event) => updateIncidentField('incident', event.target.value)} />
            </label>
            {incidentMessage ? <p className={`admin-page__message admin-page__message--${incidentStatus}`}>{incidentMessage}</p> : null}
          </section>}

        </div>
    </main>
  );
}

export default Admin;
