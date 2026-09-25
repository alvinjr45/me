import React, { useEffect, useRef, useState } from 'react';
import GuestbookConversation from '../components/GuestbookConversation';
import GuestbookParticipation, { canParticipate } from '../components/GuestbookParticipation';
import PolicyLinks from '../components/PolicyLinks';
import { getConversations } from '../lib/guestbook';
import './Guestbook.css';

function ConversationAvatar({ title }) {
  const initials = title.trim().split(/\s+/).slice(0, 2).map((word) => [...word][0]).join('').toUpperCase();
  const color = [...title].reduce((sum, character) => sum + character.codePointAt(0), 0) % 5;
  return <span className={`guestbook-messages__avatar guestbook-messages__avatar--${color}`} aria-hidden="true">{initials || '#'}</span>;
}

export default function Guestbook() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [participant, setParticipant] = useState(null);
  const [joining, setJoining] = useState(true);
  const [participationError, setParticipationError] = useState('');
  const [drafts, setDrafts] = useState({});
  const [ownIds, setOwnIds] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const request = useRef(0);
  const selectedButton = useRef(null);
  const newButton = useRef(null);
  const draftKey = creating ? 'new' : selected?.id;

  useEffect(() => {
    if (joining) return undefined;
    let mounted = true;
    async function refresh() {
      const current = ++request.current;
      setLoading(true);
      try {
        const rows = await getConversations(0, search);
        if (!mounted || current !== request.current) return;
        setConversations(rows); setHasMore(rows.length === 50); setError('');
        setSelected((previous) => previous || rows[0] || null);
      } catch (failure) { if (mounted && current === request.current) { setConversations([]); setError(failure.message); } }
      finally { if (mounted && current === request.current) setLoading(false); }
    }
    setLoading(true);
    const timeout = setTimeout(refresh, search ? 250 : 0);
    const poll = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 15000);
    window.addEventListener('ajt3-guestbook-updated', refresh);
    window.addEventListener('focus', refresh);
    return () => { mounted = false; request.current += 1; clearTimeout(timeout); clearInterval(poll); window.removeEventListener('ajt3-guestbook-updated', refresh); window.removeEventListener('focus', refresh); };
  }, [search, reload, joining]);

  function updateParticipant(next, blockedMessage = '') {
    setParticipant(next);
    setParticipationError(blockedMessage);
    setJoining(!canParticipate(next) || Boolean(blockedMessage));
    if (canParticipate(next) && !blockedMessage && !chatOpen) {
      requestAnimationFrame(() => newButton.current?.focus({ preventScroll: true }));
    }
  }

  function openParticipation() {
    setJoining(true);
  }

  function browseConversations() {
    setParticipant((current) => current ? { name: current.name } : null);
    setJoining(false);
    setChatOpen(false);
    requestAnimationFrame(() => newButton.current?.focus({ preventScroll: true }));
  }

  async function loadMore() {
    const current = ++request.current;
    setLoading(true);
    try {
      const rows = await getConversations(conversations.length, search);
      if (current === request.current) {
        setConversations((previous) => [...previous, ...rows.filter((row) => !previous.some((item) => item.id === row.id))]);
        setHasMore(rows.length === 50); setError('');
      }
    } catch (failure) { if (current === request.current) setError(failure.message); }
    finally { if (current === request.current) setLoading(false); }
  }

  function goBack() {
    setChatOpen(false);
    requestAnimationFrame(() => (creating ? newButton.current : selectedButton.current)?.focus());
  }

  if (joining) return <main className="guestbook-messages guestbook-messages--welcome">
    <header className="guestbook-messages__welcome-header"><span>GUESTBOOK</span><h1>Messages</h1><p>A little corner of the internet for public conversations.</p></header>
    <GuestbookParticipation participant={participant} onContinue={updateParticipant} onBrowse={browseConversations} blockedMessage={participationError} />
  </main>;

  return <main className={`guestbook-messages${chatOpen ? ' guestbook-messages--chat-open' : ''}`}>
    <aside className="guestbook-messages__sidebar" aria-label="Conversation browser">
      <header className="guestbook-messages__sidebar-header"><div><span>GUESTBOOK</span><h1>Messages</h1></div><button ref={newButton} className="guestbook-messages__compose-button" type="button" aria-label="New conversation" disabled={busy} onClick={() => { setCreating(true); setChatOpen(true); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5H5v15h15v-9M11 13l1-4 8-8 3 3-8 8-4 1Z" /></svg></button></header>
      <label className="guestbook-messages__search"><span className="sr-only">Search conversations</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></svg><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" /></label>
      <div className="guestbook-messages__list-heading"><span>Public conversations</span><button type="button" disabled={loading} onClick={() => setReload((value) => value + 1)} aria-label="Refresh conversations">Refresh</button></div>
      <nav className="guestbook-messages__list" aria-label="Conversations" aria-busy={loading}>
        {error && <p className="guestbook-messages__notice" role="alert">{error} <button type="button" onClick={() => setReload((value) => value + 1)}>Retry conversations</button></p>}
        {loading && !conversations.length && <p className="guestbook-messages__notice" role="status">Loading conversations...</p>}
        {!loading && !error && !conversations.length && <p className="guestbook-messages__notice">{search ? 'No conversations match your search.' : 'Start the first conversation.'}</p>}
        {conversations.map((conversation) => <button key={conversation.id} type="button" disabled={busy} ref={selected?.id === conversation.id ? selectedButton : null} className="guestbook-messages__conversation" aria-current={!creating && selected?.id === conversation.id ? 'page' : undefined} onClick={() => { setSelected(conversation); setCreating(false); setChatOpen(true); }}>
          <ConversationAvatar title={conversation.title} /><span className="guestbook-messages__summary"><span className="guestbook-messages__summary-heading"><strong>{conversation.title}</strong><time dateTime={conversation.last_message_at}>{new Date(conversation.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time></span><span className="guestbook-messages__preview">{conversation.last_message ? `${conversation.last_author}: ${conversation.last_message}` : 'Be the first to say hello.'}</span></span><span className="guestbook-messages__chevron" aria-hidden="true">&#8250;</span>
        </button>)}
        {hasMore && !error && <button className="guestbook-messages__more" disabled={loading} type="button" onClick={loadMore}>More conversations</button>}
      </nav>
      <footer className="guestbook-messages__sidebar-footer">A little corner of the internet.<br />Read freely. Posting is for ages 18+.<button className="guestbook-messages__join-button" type="button" disabled={busy} onClick={openParticipation}>{canParticipate(participant) ? 'Your details and policies' : 'Join the guestbook'}</button><PolicyLinks /></footer>
    </aside>
    {creating || selected ? (
      <GuestbookConversation
        key={draftKey}
        conversation={creating ? null : selected}
        focusChat={chatOpen}
        draft={drafts[draftKey] || { title: '', message: '' }}
        onDraft={(draft) => setDrafts((current) => ({ ...current, [draftKey]: draft }))}
        participant={participant}
        onParticipant={updateParticipant}
        onJoin={openParticipation}
        ownIds={ownIds}
        onSent={(entry) => setOwnIds((current) => new Set([...current, entry.id]))}
        onCreated={(entry) => {
          setSelected({ id: entry.conversation_id, title: 'Conversation' });
          setCreating(false); setSearch(''); setChatOpen(true);
        }}
        onBack={goBack}
        onBusy={setBusy}
      />
    ) : (
      <section className="guestbook-messages__empty"><span aria-hidden="true">#</span><h2>Your next conversation starts here.</h2><p>Choose a public board or start a new one.</p><button type="button" onClick={() => { setCreating(true); setChatOpen(true); }}>Start a conversation</button></section>
    )}
  </main>;
}
