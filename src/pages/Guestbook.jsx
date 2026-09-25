import React, { useEffect, useRef, useState } from 'react';
import GuestbookChallenge from '../components/GuestbookChallenge';
import { getGuestbook, guestbookRequest, notifyGuestbookChanged } from '../lib/guestbook';
import './Guestbook.css';

export default function Guestbook() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [token, setToken] = useState('');
  const [challengeKey, setChallengeKey] = useState(0);
  const [posting, setPosting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [postError, setPostError] = useState('');
  const request = useRef(0);
  const postController = useRef(null);
  const sitekey = process.env.REACT_APP_TURNSTILE_SITE_KEY;
  const configured = Boolean(sitekey && process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY);

  useEffect(() => {
    let mounted = true;
    async function refresh() {
      const current = ++request.current;
      setLoading(true);
      setLoadError('');
      try {
        const rows = await getGuestbook();
        if (mounted && current === request.current) { setEntries(rows); setHasMore(rows.length === 50); }
      } catch (error) { if (mounted && current === request.current) { setEntries([]); setLoadError(error.message); } }
      finally { if (mounted && current === request.current) setLoading(false); }
    }
    refresh();
    window.addEventListener('ajt3-guestbook-updated', refresh);
    window.addEventListener('focus', refresh);
    return () => { mounted = false; request.current += 1; window.removeEventListener('ajt3-guestbook-updated', refresh); window.removeEventListener('focus', refresh); };
  }, [reload]);
  useEffect(() => () => postController.current?.abort(), []);

  async function loadMore() {
    const current = ++request.current;
    setLoading(true);
    setLoadError('');
    try {
      const rows = await getGuestbook(entries.length);
      if (current === request.current) {
        setEntries((previous) => [...previous, ...rows.filter((row) => !previous.some((item) => item.id === row.id))]);
        setHasMore(rows.length === 50);
      }
    } catch (error) { if (current === request.current) setLoadError(error.message); }
    finally { if (current === request.current) setLoading(false); }
  }

  async function submit(event) {
    event.preventDefault();
    if (posting || !configured || !token) return;
    const controller = new AbortController();
    postController.current = controller;
    setPosting(true); setFeedback(''); setPostError('');
    try {
      const result = await guestbookRequest({ action: 'submit', name, message, website, token }, null, controller.signal);
      if (controller.signal.aborted) return;
      if (!result.entry?.id) throw new Error('Your message could not be confirmed. Refresh the board before retrying.');
      setName(''); setMessage(''); setWebsite('');
      setFeedback(result.scrubbed ? 'Posted! Filtered words were replaced with ***.' : 'Posted! Thanks for stopping by.');
      notifyGuestbookChanged();
    } catch (error) { if (!controller.signal.aborted) setPostError(error.message); }
    finally {
      if (!controller.signal.aborted) { setPosting(false); setToken(''); setChallengeKey((value) => value + 1); }
    }
  }

  return <main className="guestbook">
    <header className="guestbook__header"><span>YOU WERE HERE</span><h1>Guestbook</h1><p>Leave a little note. Make yourself at home.</p></header>
    <form className="guestbook__form" onSubmit={submit}>
      <h2>Leave a message</h2>
      <p>Messages appear immediately. Profanity is masked automatically. No links or personal contact information, please.</p>
      <fieldset disabled={posting || !configured}>
        <label htmlFor="guestbook-name">Display name</label>
        <input id="guestbook-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={40} required autoComplete="nickname" />
        <label htmlFor="guestbook-message">Message <span>{message.length}/500</span></label>
        <textarea id="guestbook-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} required rows={3} />
        <div className="guestbook__trap" aria-hidden="true"><label htmlFor="guestbook-website">Leave empty</label><input id="guestbook-website" name="website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" /></div>
      </fieldset>
      {configured ? <GuestbookChallenge sitekey={sitekey} onToken={setToken} resetKey={challengeKey} /> : <p role="status">Posting is not available until spam protection is configured.</p>}
      <button className="guestbook__submit" disabled={posting || !configured || !token} type="submit">{posting ? 'Posting...' : 'Post message'}</button>
      <p className="guestbook__privacy">Your name and message will be public. Bot checks use Cloudflare Turnstile; network hashes help limit spam. Names are unverified.</p>
      {feedback && <p role="status">{feedback}</p>}{postError && <p role="alert">{postError}</p>}
    </form>
    <section className="guestbook__board" aria-label="Guestbook messages" aria-busy={loading}>
      <header><h2>Notes from visitors</h2><button type="button" disabled={loading} onClick={() => setReload((value) => value + 1)}>Refresh</button></header>
      {loadError && <p role="alert">{loadError} <button type="button" onClick={() => setReload((value) => value + 1)}>Retry messages</button></p>}
      {loading && <p role="status">Loading messages...</p>}
      {!loading && !loadError && !entries.length && <p>No notes yet. Be the first to say hello.</p>}
      {entries.map((entry) => <article className="guestbook__entry" key={entry.id}><header><strong>{entry.display_name}</strong><time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleDateString()}</time></header><p>{entry.message}</p><small>Visitor</small></article>)}
      {hasMore && !loadError && <button type="button" disabled={loading} onClick={loadMore}>Load older messages</button>}
    </section>
  </main>;
}
