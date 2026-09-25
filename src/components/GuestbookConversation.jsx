import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { canParticipate } from './GuestbookParticipation';
import { getGuestbook, guestbookRequest, notifyGuestbookChanged } from '../lib/guestbook';

export default function GuestbookConversation({ conversation, focusChat, draft, onDraft, participant, onParticipant, onJoin, session, onSessionExpired, ownIds, onSent, onCreated, onBack, onBusy }) {
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState(conversation?.title || 'New conversation');
  const [loading, setLoading] = useState(Boolean(conversation));
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [reload, setReload] = useState(0);
  const [website, setWebsite] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [feedback, setFeedback] = useState('');
  const request = useRef(0);
  const controller = useRef(null);
  const feed = useRef(null);
  const followBottom = useRef(true);
  const previousScroll = useRef(null);
  const heading = useRef(null);
  const composerInput = useRef(null);
  const conversationId = conversation?.id;
  const configured = Boolean(process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY);
  const sessionReady = Boolean(session?.token && session.expiresAt > Date.now());
  const participationReady = canParticipate(participant);

  useEffect(() => { if (focusChat) heading.current?.focus({ preventScroll: true }); }, [focusChat]);
  useEffect(() => { if (participationReady) composerInput.current?.focus({ preventScroll: true }); }, [participationReady]);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!conversationId) return undefined;
    let mounted = true;
    async function refresh() {
      const current = ++request.current;
      try {
        const result = await getGuestbook(conversationId);
        if (!mounted || current !== request.current) return;
        setEntries([...result.entries].reverse()); setHasMore(result.entries.length === 50);
        setUnavailable(!result.conversation);
        if (result.conversation) setTitle(result.conversation.title);
        setError('');
      } catch (failure) { if (mounted && current === request.current) setError(failure.message); }
      finally { if (mounted && current === request.current) setLoading(false); }
    }
    refresh();
    const poll = setInterval(() => { if (document.visibilityState === 'visible' && followBottom.current) refresh(); }, 15000);
    window.addEventListener('ajt3-guestbook-updated', refresh);
    window.addEventListener('focus', refresh);
    return () => { mounted = false; request.current += 1; clearInterval(poll); window.removeEventListener('ajt3-guestbook-updated', refresh); window.removeEventListener('focus', refresh); };
  }, [conversationId, reload]);

  useLayoutEffect(() => {
    if (!feed.current) return;
    if (previousScroll.current) {
      feed.current.scrollTop = previousScroll.current.top + feed.current.scrollHeight - previousScroll.current.height;
      previousScroll.current = null;
    } else if (followBottom.current) feed.current.scrollTop = feed.current.scrollHeight;
  }, [entries]);

  async function loadOlder() {
    const current = ++request.current;
    setLoading(true);
    try {
      const result = await getGuestbook(conversationId, entries[0]);
      if (current !== request.current) return;
      previousScroll.current = { top: feed.current.scrollTop, height: feed.current.scrollHeight };
      if (!result.conversation) { setEntries([]); setUnavailable(true); }
      else setEntries((previous) => [...[...result.entries].reverse().filter((row) => !previous.some((item) => item.id === row.id)), ...previous]);
      setHasMore(result.entries.length === 50); setError('');
    } catch (failure) { if (current === request.current) setError(failure.message); }
    finally { if (current === request.current) setLoading(false); }
  }

  async function submit(event) {
    event.preventDefault();
    if (posting || !configured || !sessionReady || unavailable || !participationReady) return;
    const pending = new AbortController();
    controller.current = pending;
    setPosting(true); onBusy(true); setPostError(''); setFeedback('');
    try {
      const result = await guestbookRequest({
        action: 'submit', name: participant.name, ageConfirmed: participant.ageConfirmed,
        termsAccepted: participant.termsAccepted, termsVersion: participant.termsVersion,
        message: draft.message, website, session: session.token, ...(conversationId ? { conversationId } : { title: draft.title })
      }, null, pending.signal);
      if (pending.signal.aborted) return;
      if (!result.entry?.id || !result.entry.conversation_id) throw new Error('Your message could not be confirmed. Refresh before retrying.');
      onSent(result.entry); onDraft({ title: '', message: '' }); setWebsite('');
      followBottom.current = true;
      setFeedback(result.scrubbed ? 'Sent. Filtered words were replaced with ***.' : 'Sent to the conversation.');
      onBusy(false);
      if (!conversationId) onCreated(result.entry);
      notifyGuestbookChanged();
    } catch (failure) {
      if (!pending.signal.aborted) {
        setPostError(failure.message);
        if (failure.code === 'verification_required') onSessionExpired();
        if (['participation_required', 'terms_changed', 'terms_unavailable'].includes(failure.code)) {
          onBusy(false);
          onParticipant({ name: participant.name }, failure.code === 'participation_required' ? '' : failure.message);
        }
      }
    }
    finally { if (!pending.signal.aborted) { setPosting(false); onBusy(false); } }
  }

  return <section className="guestbook-messages__chat" aria-label={conversationId ? 'Conversation' : 'New conversation'}>
    <header className="guestbook-messages__chat-header"><button type="button" className="guestbook-messages__back" disabled={posting} onClick={onBack} aria-label="Back to conversations">&#8249; <span>Messages</span></button><span className="guestbook-messages__group-avatar" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="12" cy="10" r="4" /><circle cx="23" cy="12" r="3" /><path d="M3 26v-3a9 9 0 0 1 18 0v3ZM22 19a6 6 0 0 1 7 6v1h-5v-3Z" /></svg></span><div className="guestbook-messages__chat-title"><h2 ref={heading} tabIndex={-1}>{title}</h2><p>Public group chat <span aria-hidden="true">&middot;</span> Unverified names</p></div>{conversationId && <button type="button" disabled={loading} className="guestbook-messages__refresh" onClick={() => setReload((value) => value + 1)}>Refresh</button>}</header>
    <div className="guestbook-messages__feed" ref={feed} onScroll={() => { const node = feed.current; followBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80; }} role="log" aria-label="Conversation messages" aria-live="polite" aria-busy={loading}>
      <p className="guestbook-messages__public-note">This is a public message board, not a private chat.</p>
      {error && <p role="alert" className="guestbook-messages__notice">{error} <button type="button" onClick={() => setReload((value) => value + 1)}>Retry messages</button></p>}
      {hasMore && !unavailable && <button className="guestbook-messages__more" type="button" disabled={loading} onClick={loadOlder}>Load older messages</button>}
      {loading && <p role="status" className="guestbook-messages__notice">Loading messages...</p>}
      {unavailable ? <p className="guestbook-messages__notice" role="status">This conversation is no longer available.</p> : !loading && !error && !entries.length && <div className="guestbook-messages__welcome"><span aria-hidden="true">Say hello.</span><p>{conversationId ? 'Be the first to join the conversation.' : 'Pick a topic and send the first message.'}</p></div>}
      {entries.map((entry, index) => {
        const own = ownIds.has(entry.id);
        const previous = entries[index - 1];
        const newDay = !previous || new Date(previous.created_at).toDateString() !== new Date(entry.created_at).toDateString();
        return <React.Fragment key={entry.id}>{newDay && <p className="guestbook-messages__date">{new Date(entry.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>}<article className={`guestbook-messages__message${own ? ' guestbook-messages__message--own' : ''}`} aria-label={`${own ? 'You' : entry.display_name}: ${entry.message}`}><span className="guestbook-messages__sender">{own ? `${entry.display_name} (you)` : entry.display_name}</span><p className="guestbook-messages__bubble">{entry.message}</p><time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</time></article></React.Fragment>;
      })}
    </div>
    {!participationReady ? <div className="guestbook-messages__join-prompt"><p>Complete the entry requirements to join the conversation.</p><button type="button" className="guestbook-messages__join-button" onClick={onJoin}>Join conversation</button></div> : <form className="guestbook-messages__composer" onSubmit={submit}>
      <fieldset disabled={posting || !configured || unavailable}>
        {!conversationId && <label className="guestbook-messages__identity">Topic<input ref={composerInput} aria-label="Conversation title" value={draft.title} onChange={(event) => onDraft({ ...draft, title: event.target.value })} maxLength={80} required placeholder="Give this conversation a name" /></label>}
        <div className="guestbook-messages__identity"><span>Sending as <strong>{participant.name}</strong></span><button type="button" disabled={posting} onClick={() => onParticipant({ name: participant.name })}>Change details</button></div>
        <div className="guestbook-messages__input-row"><label className="sr-only" htmlFor="guestbook-message">Message</label><textarea ref={conversationId ? composerInput : null} id="guestbook-message" value={draft.message} onChange={(event) => onDraft({ ...draft, message: event.target.value })} maxLength={500} required rows={2} placeholder={conversationId ? 'Message this conversation' : 'Start the conversation'} /><button type="submit" className="guestbook-messages__send" aria-label={posting ? 'Sending message' : conversationId ? 'Send message' : 'Create conversation'} disabled={posting || !configured || !sessionReady || unavailable}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 11 6-6 6 6M12 5v15" /></svg></button></div>
        <div className="guestbook__trap" aria-hidden="true"><label htmlFor="guestbook-website">Leave empty</label><input id="guestbook-website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" /></div>
      </fieldset>
      <div className="guestbook-messages__composer-note"><span>{configured ? sessionReady ? 'Ready to send. Profanity filtered.' : 'Your verification expired. Your draft is saved.' : 'Posting is unavailable until the guestbook is connected.'}</span><span>{draft.message.length}/500</span></div>
      {postError && <p role="alert">{postError}</p>}{feedback && <p role="status">{feedback}</p>}
    </form>}
  </section>;
}
