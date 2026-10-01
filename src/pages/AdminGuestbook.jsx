import React, { useEffect, useRef, useState } from 'react';
import { guestbookRequest, notifyGuestbookChanged } from '../lib/guestbook';
import './Guestbook.css';

const PRIMARY_CONVERSATION_ID = '00000000-0000-4000-8000-000000000001';

export default function AdminGuestbook({ secret, onBusy }) {
  const [entries, setEntries] = useState([]);
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [reload, setReload] = useState(0);
  const [offset, setOffset] = useState(0);
  const [mode, setMode] = useState('messages');
  const [editing, setEditing] = useState(null);
  const mutation = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setEditing(null);
    guestbookRequest({ action: mode === 'conversations' ? 'list_conversations' : 'list', offset }, secret, controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      if (!Array.isArray(result.entries) || typeof result.submissionsOpen !== 'boolean') throw new Error('Invalid guestbook response.');
      setEntries(result.entries); setOpen(result.submissionsOpen); setHasMore(result.entries.length === 50);
    }).catch((failure) => { if (!controller.signal.aborted) setError(failure.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [secret, reload, offset, mode]);
  useEffect(() => () => mutation.current?.abort(), []);

  async function change(payload) {
    if (saving) return;
    if (payload.action === 'delete' && !window.confirm('Permanently delete this guestbook message? This cannot be undone.')) return;
    if (payload.action === 'delete_conversation' && !window.confirm('Permanently delete this conversation and all of its messages? This cannot be undone.')) return;
    const controller = new AbortController();
    mutation.current = controller;
    setSaving(true); onBusy(true); setError(''); setNotice('');
    try {
      const result = await guestbookRequest(payload, secret, controller.signal);
      if (controller.signal.aborted) return;
      if (payload.action === 'pause') {
        if (typeof result.submissionsOpen !== 'boolean') throw new Error('The setting could not be confirmed. Refresh and check it.');
        setOpen(result.submissionsOpen);
      } else {
        if (!result.ok) throw new Error('The change could not be confirmed. Refresh and check it.');
        setEntries((current) => {
          if (payload.action === 'delete' || payload.action === 'delete_conversation') return current.filter((entry) => entry.id !== payload.id);
          return current.map((entry) => {
            if (entry.id !== payload.id) return entry;
            if (payload.action === 'update_message') return { ...entry, message: result.message };
            if (payload.action === 'update_conversation') return { ...entry, title: result.title };
            return { ...entry, is_hidden: payload.hidden };
          });
        });
        setEditing(null);
      }
      setNotice('Guestbook updated.'); notifyGuestbookChanged();
    } catch (failure) { if (!controller.signal.aborted) setError(failure.message); }
    finally { if (!controller.signal.aborted) { setSaving(false); onBusy(false); } }
  }

  return <section className="guestbook admin-guestbook" aria-label="Manage guestbook">
    <header className="guestbook__header"><span>COMMUNITY</span><h1>Guestbook</h1><p>Each conversation is a public message board. Messages publish after spam checks and profanity masking, without approvals.</p></header>
    <div className="guestbook__actions admin-guestbook__tabs" role="group" aria-label="Guestbook management views">{['messages', 'conversations'].map((view) => <button type="button" key={view} aria-pressed={mode === view} disabled={saving} onClick={() => { setMode(view); setOffset(0); setEntries([]); setNotice(''); }}>{view === 'messages' ? 'Messages' : 'Conversations'}</button>)}</div>
    <div className="admin-guestbook__toolbar">
      {open !== null && <p className="admin-guestbook__status">Submissions are {open ? 'open' : 'paused'}.</p>}
      <div className="guestbook__actions">
        <button type="button" disabled={loading || saving} onClick={() => setReload((value) => value + 1)}>Refresh messages</button>
        <button type="button" disabled={open === null || loading || saving} onClick={() => change({ action: 'pause', open: !open })}>{open === false ? 'Resume submissions' : 'Pause submissions'}</button>
      </div>
    </div>
    {loading && <p role="status">Loading guestbook...</p>}{error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    {!loading && !error && !entries.length && <p className="admin-guestbook__empty">No {mode} on this page.</p>}
    {entries.map((entry) => <article className="guestbook__entry" key={entry.id}>
      <header><strong>{mode === 'conversations' ? entry.title : entry.display_name}</strong><span>{entry.is_hidden || entry.conversation?.is_hidden ? 'Hidden' : 'Public'} / {new Date(entry.created_at).toLocaleDateString()}</span></header>
      {editing?.id === entry.id ? <form className="admin-guestbook__edit" onSubmit={(event) => {
        event.preventDefault();
        const value = editing.value.trim();
        if (!value) return;
        change({ action: mode === 'conversations' ? 'update_conversation' : 'update_message', id: entry.id, [mode === 'conversations' ? 'title' : 'message']: value });
      }}>
        {mode === 'conversations'
          ? <label>Conversation name<input aria-label="Conversation name" value={editing.value} maxLength={80} onChange={(event) => setEditing({ ...editing, value: event.target.value })} /></label>
          : <label>Message<textarea aria-label="Message text" value={editing.value} maxLength={500} rows={3} onChange={(event) => setEditing({ ...editing, value: event.target.value })} /></label>}
        <div className="guestbook__actions"><button type="submit" disabled={saving || !editing.value.trim()}>Save</button><button type="button" disabled={saving} onClick={() => setEditing(null)}>Cancel</button></div>
      </form> : <>
        {mode === 'messages' && <><p>{entry.message}</p><small>Conversation: {entry.conversation?.title || 'The Guestbook'}{entry.conversation?.is_hidden ? ' (hidden)' : ''}</small></>}
        <div className="guestbook__actions">
          <button type="button" disabled={saving || loading} onClick={() => setEditing({ id: entry.id, value: mode === 'conversations' ? entry.title : entry.message })}>Edit {mode === 'conversations' ? 'name' : 'message'}</button>
          <button type="button" disabled={saving || loading} onClick={() => change({ action: mode === 'conversations' ? 'conversation_visibility' : 'visibility', id: entry.id, hidden: !entry.is_hidden })}>{entry.is_hidden ? 'Show' : 'Hide'} {mode === 'conversations' ? 'conversation' : 'message'}</button>
          {mode === 'messages' && <button className="admin-guestbook__delete" type="button" disabled={saving || loading} onClick={() => change({ action: 'delete', id: entry.id })}>Delete message</button>}
          {mode === 'conversations' && entry.id !== PRIMARY_CONVERSATION_ID && <button className="admin-guestbook__delete" type="button" disabled={saving || loading} onClick={() => change({ action: 'delete_conversation', id: entry.id })}>Delete conversation</button>}
        </div>
      </>}
    </article>)}
    <nav className="guestbook__actions" aria-label="Guestbook pages"><button type="button" disabled={!offset || loading || saving} onClick={() => setOffset((value) => Math.max(0, value - 50))}>Newer messages</button><button type="button" disabled={!hasMore || loading || saving} onClick={() => setOffset((value) => value + 50)}>Older messages</button></nav>
  </section>;
}
