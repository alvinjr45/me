import React, { useEffect, useRef, useState } from 'react';
import BlogPostArticle from '../components/BlogPostArticle';
import {
  formatIncidentCount,
  formatIncidentDate,
  getDaysSinceIncident,
  getLatestDogIncident
} from '../data/dogIncident';
import { getBlogPostsByTag } from '../data/blogPosts';
import './Dogs.css';

const dogs = [
  { name: 'Drake', role: 'Head of security', image: '/images/dogs/drake.jpg' },
  { name: 'Josh', role: 'Chaos operations', image: '/images/dogs/josh.jpg' }
];

function DogIcon({ name }) {
  const paths = {
    paw: <><ellipse cx="6" cy="8" rx="2" ry="3" transform="rotate(-25 6 8)" /><ellipse cx="11" cy="5" rx="2" ry="3" /><ellipse cx="17" cy="7" rx="2" ry="3" transform="rotate(25 17 7)" /><ellipse cx="21" cy="12" rx="1.5" ry="2.5" transform="rotate(35 21 12)" /><path d="M5 18c0-3 4-7 7-7s7 4 7 7c0 4-4 2-7 2s-7 2-7-2Z" /></>,
    notes: <><rect x="5" y="3" width="15" height="18" rx="2" /><path d="M3 7h4M3 12h4M3 17h4M11 8h5M11 12h5M11 16h3" /></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Dogs() {
  const [dogPosts, setDogPosts] = useState([]);
  const [incident, setIncident] = useState(null);
  const [postsStatus, setPostsStatus] = useState('loading');
  const [incidentStatus, setIncidentStatus] = useState('loading');
  const [reload, setReload] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedSlug, setSelectedSlug] = useState(null);
  const readerRef = useRef(null);
  const scrollRef = useRef(null);
  const noteButtons = useRef({});
  const returnNote = useRef(null);
  const scrollPosition = useRef(0);

  useEffect(() => {
    let isMounted = true;
    let request = 0;
    const refresh = () => {
      const current = ++request;
      setPostsStatus('loading');
      setIncidentStatus('loading');

      getBlogPostsByTag('dogs').then((posts) => {
        if (!isMounted || current !== request) return;
        setDogPosts(posts);
        setPostsStatus('ready');
        setSelectedSlug((slug) => posts.some((post) => post.slug === slug) ? slug : null);
      }).catch(() => {
        if (isMounted && current === request) setPostsStatus('error');
      });

      getLatestDogIncident().then((nextIncident) => {
        if (!isMounted || current !== request) return;
        setIncident(nextIncident);
        setIncidentStatus('ready');
      }).catch(() => {
        if (isMounted && current === request) setIncidentStatus('error');
      });
    };
    const onStorage = (event) => {
      if (event.key === 'ajt3_dog_incident_updated_at') refresh();
    };
    refresh();
    window.addEventListener('ajt3-posts-updated', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', onStorage);

    return () => {
      isMounted = false;
      window.removeEventListener('ajt3-posts-updated', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, [reload]);

  useEffect(() => {
    if (selectedSlug) {
      readerRef.current?.querySelector('h1')?.focus({ preventScroll: true });
    } else if (returnNote.current) {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollPosition.current;
      (noteButtons.current[returnNote.current] || scrollRef.current)?.focus({ preventScroll: true });
      returnNote.current = null;
    }
  }, [selectedSlug]);

  const incidentDays = incidentStatus === 'ready' && incident ? getDaysSinceIncident(incident.incidentAt) : null;
  const incidentCount = incident ? formatIncidentCount(incident.incidentCount) : '';
  const selectedPost = dogPosts.find((post) => post.slug === selectedSlug);
  const matchingPosts = dogPosts.filter((post) => `${post.title} ${post.excerpt}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <main className="dogs-app app-view" aria-label="Dogs">
      <header className="dogs-app__toolbar">
        <div className="dogs-app__brand"><DogIcon name="paw" /><strong>Dog HQ</strong></div>
      </header>

      {selectedPost ? (
        <div className="dogs-app__reader" ref={readerRef}>
          <BlogPostArticle key={selectedPost.slug} post={selectedPost} embedded backLabel="Dog HQ" onBack={() => setSelectedSlug(null)} />
        </div>
      ) : (
        <div className="dogs-app__scroll app-scroll" ref={scrollRef} tabIndex={-1}>
          <header className="dogs-app__heading">
            <p className="dogs-app__eyebrow">{'// life with Drake & Josh'}</p>
            <h1>Great dogs. Plenty of chaos.</h1>
          </header>

          <div className="dogs-app__dashboard">
            <section className="dogs-app__pack" aria-label="Drake and Josh">
              {dogs.map((dog) => (
                <figure key={dog.name} className="dogs-app__dog">
                  <div className="dogs-app__portrait"><img src={dog.image} alt={`${dog.name} portrait`} /></div>
                  <figcaption><h2>{dog.name}</h2><p>{dog.role}</p></figcaption>
                </figure>
              ))}
            </section>

            <section className="dogs-app__watch" aria-labelledby="dogs-incident-title" aria-busy={incidentStatus === 'loading'}>
              <div className="dogs-app__streak">
                <p className="dogs-app__eyebrow">The good behavior department</p>
                <strong className="dogs-app__counter">{incidentDays === null ? '--' : String(incidentDays).padStart(2, '0')}</strong>
                <h2 id="dogs-incident-title">Days since last incident</h2>
                <span className="dogs-app__counter-caption">{incidentDays === null ? 'Awaiting a report' : incidentDays === 0 ? 'A fresh start. Again.' : 'And counting. Paws crossed.'}</span>
              </div>
              <div className="dogs-app__report">
                {incidentStatus === 'loading' ? <p role="status">Checking the incident log...</p> : incidentStatus === 'error' ? (
                  <div role="alert"><h3>Report unavailable</h3><p>We couldn't load the latest incident.</p><button type="button" className="dogs-app__text-button" onClick={() => setReload((value) => value + 1)}>Try again <DogIcon name="arrow" /></button></div>
                ) : incident ? <>
                  <div className="dogs-app__report-label"><DogIcon name="notes" /><span className="dogs-app__eyebrow">Latest incident</span></div>
                  <div className="dogs-app__report-meta">
                    <h3>{incident.culprit}</h3>
                    <time dateTime={incident.incidentAt}>{formatIncidentDate(incident.incidentAt)}</time>
                  </div>
                  <p>{incident.incident}</p>
                  {incidentCount && <small>{incident.culprit ? `${incident.culprit}'s ${incidentCount}` : incidentCount}</small>}
                </> : <><h3>No incidents on file</h3><p>A clean record. Suspicious, but we'll take it.</p></>}
              </div>
            </section>
          </div>

          <section className="dogs-app__notes" aria-labelledby="dogs-notes-title" aria-busy={postsStatus === 'loading'}>
            <div className="dogs-app__section-heading">
              <h2 id="dogs-notes-title"><DogIcon name="notes" />Field notes</h2>
              <span>{postsStatus === 'ready' ? `${matchingPosts.length} ${matchingPosts.length === 1 ? 'entry' : 'entries'}` : '--'}</span>
            </div>
            <label className="dogs-app__search"><span className="sr-only">Search field notes</span><input type="search" placeholder="Search stories, names, or mischief..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
            {postsStatus === 'loading' ? <p className="dogs-app__message" role="status">Fetching field notes...</p> : postsStatus === 'error' ? (
              <div className="dogs-app__message" role="alert"><p>Field notes couldn't be loaded.</p><button type="button" className="dogs-app__text-button" onClick={() => setReload((value) => value + 1)}>Try again <DogIcon name="arrow" /></button></div>
            ) : matchingPosts.length ? (
              <div className="dogs-app__entries">{matchingPosts.map((post) => (
                <button type="button" key={post.slug} className="dogs-app__entry" ref={(node) => { noteButtons.current[post.slug] = node; }} onClick={() => {
                  returnNote.current = post.slug;
                  scrollPosition.current = scrollRef.current?.scrollTop || 0;
                  setSelectedSlug(post.slug);
                }}>
                  {post.image ? <img src={post.image} alt="" loading="lazy" /> : <span className="dogs-app__note-icon"><DogIcon name="notes" /></span>}
                  <span className="dogs-app__entry-copy"><time>{post.date}</time><strong>{post.title}</strong><span>{post.excerpt}</span></span>
                  <DogIcon name="arrow" />
                </button>
              ))}</div>
            ) : <div className="dogs-app__message"><h3>{query ? 'No matching field notes' : 'The story starts here.'}</h3><p>{query ? 'Try another name or a different word.' : 'New stories will appear here when they are published.'}</p></div>}
          </section>
          <footer className="dogs-app__footer"><DogIcon name="paw" /><span>Drake &amp; Josh / A very good team.</span></footer>
        </div>
      )}
    </main>
  );
}

export default Dogs;
