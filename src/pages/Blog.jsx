import React, { useEffect, useId, useRef, useState } from 'react';
import BlogPostArticle from '../components/BlogPostArticle';
import { getBlogPosts } from '../data/blogPosts';
import './Blog.css';

function Blog() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState('');
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [readerOpen, setReaderOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarId = useId();
  const readerRef = useRef(null);
  const noteButtons = useRef({});
  const returnFocus = useRef(false);

  useEffect(() => {
    let isMounted = true;
    let request = 0;
    const refresh = () => {
      const current = ++request;
      getBlogPosts()
      .then((nextPosts) => {
        if (!isMounted || current !== request) {
          return;
        }

        setPosts(nextPosts);
        setError('');
        setStatus('ready');
      })
      .catch((nextError) => {
        if (!isMounted || current !== request) {
          return;
        }

        setError(nextError.message || 'Unable to load blog posts.');
        setStatus('error');
      });
    };
    refresh();
    window.addEventListener('ajt3-posts-updated', refresh);

    return () => {
      isMounted = false;
      window.removeEventListener('ajt3-posts-updated', refresh);
    };
  }, []);

  const folders = [...new Set(posts.flatMap((post) => post.tags))].sort();
  const activeFolder = folders.includes(folder) ? folder : '';
  const matchingPosts = posts.filter((post) =>
    (!activeFolder || post.tags.includes(activeFolder)) &&
    [post.title, post.excerpt, ...post.tags].join(' ').toLowerCase().includes(query.trim().toLowerCase())
  );
  const selectedPost = matchingPosts.find((post) => post.slug === selectedSlug) || matchingPosts[0];
  const selectedPostSlug = selectedPost?.slug;

  useEffect(() => {
    if (readerOpen && selectedPostSlug) {
      readerRef.current?.querySelector('h1')?.focus({ preventScroll: true });
    } else if (returnFocus.current) {
      noteButtons.current[selectedPostSlug]?.focus({ preventScroll: true });
      returnFocus.current = false;
    }
  }, [readerOpen, selectedPostSlug]);

  const selectFolder = (value) => {
    setFolder(value);
    setSelectedSlug(null);
    setReaderOpen(false);
  };

  return (
    <main className={`blog-page app-view${readerOpen && selectedPost ? ' blog-page--reading' : ''}${sidebarCollapsed ? ' blog-page--sidebar-collapsed' : ''}`} aria-label="Blogs">
      <div className="blog-page__workspace">
        <aside className="blog-page__folders" id={`${sidebarId}-folders`} aria-label="Blog folders">
          <div className="blog-page__brand"><NoteIcon /> <strong>Blogs</strong></div>
          <p className="blog-page__account">On AJT3</p>
          <button type="button" className={`blog-page__folder${!activeFolder ? ' is-selected' : ''}`}
            aria-pressed={!activeFolder} onClick={() => selectFolder('')}>
            <NoteIcon /><span>All blogs</span><small>{posts.length}</small>
          </button>
          {folders.map((tag) => (
            <button type="button" key={tag} className={`blog-page__folder${activeFolder === tag ? ' is-selected' : ''}`}
              aria-pressed={activeFolder === tag} onClick={() => selectFolder(tag)}>
              <NoteIcon folder /><span>{tag}</span><small>{posts.filter((post) => post.tags.includes(tag)).length}</small>
            </button>
          ))}
          <p className="blog-page__signature">{'// blogs from the build'}</p>
        </aside>

        <section className="blog-page__list" aria-label="Blogs list" aria-busy={status === 'loading'}>
          <header className="blog-page__list-header">
            <div className="blog-page__list-title">
              <h2>{activeFolder || 'All blogs'}</h2>
              <button type="button" className="blog-page__sidebar-toggle"
                aria-label={sidebarCollapsed ? 'Expand side panel' : 'Collapse side panel'}
                title={sidebarCollapsed ? 'Expand side panel' : 'Collapse side panel'}
                aria-expanded={!sidebarCollapsed}
                aria-controls={`${sidebarId}-folders ${sidebarId}-entries`}
                onClick={() => setSidebarCollapsed((current) => !current)}>
                <NoteIcon />
              </button>
            </div>
            <label className="blog-page__search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
              <span className="sr-only">Search blogs</span>
              <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setReaderOpen(false); }} placeholder="Search blogs" />
            </label>
            <div className="blog-page__folder-filters" role="group" aria-label="Filter by blog folder">
              <button type="button" aria-pressed={!activeFolder} onClick={() => selectFolder('')}>All blogs</button>
              {folders.map((tag) => (
                <button type="button" key={tag} title={tag} aria-pressed={activeFolder === tag} onClick={() => selectFolder(tag)}>
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </header>
          <div className="blog-page__entries" id={`${sidebarId}-entries`}>
            {status === 'error' ? <p className="app-empty" role="alert">{error}</p> : null}
            {status === 'loading' ? <p className="app-empty">Loading blogs...</p> : null}
            {status === 'ready' && matchingPosts.length === 0 ? <p className="app-empty">{query ? 'No matching blogs.' : 'No blogs yet.'}</p> : null}
            {matchingPosts.map((post) => (
              <button type="button" key={post.slug}
                ref={(node) => { noteButtons.current[post.slug] = node; }}
                className={`blog-page__note${selectedPost?.slug === post.slug ? ' is-selected' : ''}`}
                aria-current={selectedPost?.slug === post.slug ? 'true' : undefined}
                onClick={() => { setSelectedSlug(post.slug); setReaderOpen(true); }}>
                <strong>{post.title}</strong>
                <span className="blog-page__note-preview"><time>{post.date}</time> {post.excerpt}</span>
                <span className="blog-page__note-folder"><NoteIcon folder />{post.eyebrow || 'Blog'}</span>
              </button>
            ))}
          </div>
          <footer className="blog-page__count" role="status">
            {status === 'loading' ? 'Loading...' : status === 'error' ? 'Unavailable' : `${matchingPosts.length} ${matchingPosts.length === 1 ? 'blog' : 'blogs'}`}
          </footer>
        </section>

        <div className="blog-page__reader" ref={readerRef}>
          {selectedPost ? <BlogPostArticle key={selectedPost.slug} post={selectedPost} embedded onBack={() => {
            returnFocus.current = true;
            setReaderOpen(false);
          }} /> : <div className="blog-page__blank"><NoteIcon /><p>{status === 'loading' ? 'Opening your blogs...' : 'Select a blog to read'}</p></div>}
        </div>
      </div>
    </main>
  );
}

function NoteIcon({ folder = false }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {folder ? <path d="M3 7V5h6l2 2h10v12H3V7Z" /> : <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M4 8h16M8 12h8M8 16h6" /></>}
  </svg>;
}

export default Blog;
